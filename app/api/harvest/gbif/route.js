// app/api/harvest/gbif/route.js
// Harvests GBIF occurrence data for geophyte species
// Populates: locations, occurrence_summary tables
// Schedule: weekly, 7 batches of 25 species each

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH_SIZE = 25;
const GBIF_BASE = "https://api.gbif.org/v1";

// Sensitivity rules — blur coordinates for sensitive species
function sensitivityLevel(iucnStatus) {
  if (["CR", "EN"].includes(iucnStatus)) return "restricted";
  if (iucnStatus === "VU") return "blurred";
  return "public";
}

function blurCoordinate(coord, level) {
  if (level === "restricted") return null; // don't store exact coords
  if (level === "blurred") return Math.round(coord * 10) / 10; // ~11km precision
  return Math.round(coord * 1000) / 1000; // ~100m precision
}

async function getGBIFTaxonKey(speciesName) {
  try {
    const res = await fetch(
      `${GBIF_BASE}/species/match?name=${encodeURIComponent(speciesName)}&kingdom=Plantae`
    );
    const data = await res.json();
    if (data.matchType !== "NONE" && data.usageKey) return data.usageKey;
    return null;
  } catch {
    return null;
  }
}

async function getOccurrences(taxonKey, limit = 100) {
  try {
    const res = await fetch(
      `${GBIF_BASE}/occurrence/search?taxonKey=${taxonKey}&hasCoordinate=true&limit=${limit}&fields=decimalLatitude,decimalLongitude,countryCode,stateProvince,locality,habitat,elevation,year&basisOfRecord=HUMAN_OBSERVATION,PRESERVED_SPECIMEN,LITERATURE`
    );
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

async function getOccurrenceCount(taxonKey) {
  try {
    const res = await fetch(
      `${GBIF_BASE}/occurrence/search?taxonKey=${taxonKey}&hasCoordinate=true&limit=0`
    );
    const data = await res.json();
    return {
      count: data.count || 0,
      // Get year range from facet
    };
  } catch {
    return { count: 0 };
  }
}

export async function GET(request) {
  const secret = request.headers.get("x-cron-secret") || 
                 new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batch = parseInt(new URL(request.url).searchParams.get("batch") || "0");
  const log = { batch, processed: 0, locations_added: 0, summaries_added: 0, errors: [] };

  try {
    // Fetch species for this batch
    const { data: species, error: spErr } = await supabase
      .from("species")
      .select("id, accepted_name, iucn_status, country_focus")
      .order("id")
      .range(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE - 1);

    if (spErr) throw spErr;
    if (!species?.length) return Response.json({ ...log, message: "No species in batch" });

    for (const sp of species) {
      try {
        // Check if already have recent data
        const { data: existing } = await supabase
          .from("occurrence_summary")
          .select("id, created_at")
          .eq("species_id", sp.id)
          .single();

        // Skip if updated within last 30 days
        if (existing?.created_at) {
          const age = Date.now() - new Date(existing.created_at).getTime();
          if (age < 30 * 24 * 60 * 60 * 1000) {
            log.processed++;
            continue;
          }
        }

        // Get GBIF taxon key
        const taxonKey = await getGBIFTaxonKey(sp.accepted_name);
        if (!taxonKey) {
          log.errors.push(`${sp.accepted_name}: taxon not found in GBIF`);
          log.processed++;
          continue;
        }

        // Get occurrence count + year range
        const { count } = await getOccurrenceCount(taxonKey);

        // Get top occurrences for location data
        const occurrences = await getOccurrences(taxonKey, 50);
        const sensitivity = sensitivityLevel(sp.iucn_status);

        // Build unique locations (deduplicate by ~1 degree grid)
        const seen = new Set();
        const uniqueLocs = [];

        for (const occ of occurrences) {
          if (!occ.decimalLatitude || !occ.decimalLongitude) continue;
          const gridKey = `${Math.round(occ.decimalLatitude)}_${Math.round(occ.decimalLongitude)}`;
          if (seen.has(gridKey)) continue;
          seen.add(gridKey);

          const lat = blurCoordinate(occ.decimalLatitude, sensitivity);
          const lng = blurCoordinate(occ.decimalLongitude, sensitivity);

          uniqueLocs.push({
            location_id: `LOC-${sp.id}-${uniqueLocs.length + 1}`,
            species_id: sp.id,
            atlas_id: sp.atlas_id || null,
            country: occ.countryCode || sp.country_focus || null,
            region: occ.stateProvince || null,
            protected_area: null,
            latitude: lat,
            longitude: lng,
            coordinate_precision: sensitivity === "restricted" ? "country_only" : 
                                   sensitivity === "blurred" ? "10km" : "1km",
            sensitivity_level: sensitivity,
            habitat: occ.habitat || null,
            elevation_m: occ.elevation ? Math.round(occ.elevation) : null,
            occurrence_source: "GBIF",
            last_verified: new Date().toISOString().split("T")[0],
          });

          if (uniqueLocs.length >= 10) break; // max 10 locations per species
        }

        // Upsert locations
        if (uniqueLocs.length > 0) {
          // Delete old locations for this species first
          await supabase.from("locations").delete().eq("species_id", sp.id);

          const { error: locErr } = await supabase
            .from("locations")
            .insert(uniqueLocs);

          if (!locErr) log.locations_added += uniqueLocs.length;
          else log.errors.push(`${sp.accepted_name} locations: ${locErr.message}`);
        }

        // Get year range from occurrences
        const years = occurrences.map(o => o.year).filter(Boolean);
        const firstYear = years.length ? Math.min(...years) : null;
        const lastYear = years.length ? Math.max(...years) : null;

        // Get country count
        const countries = new Set(occurrences.map(o => o.countryCode).filter(Boolean));

        // Upsert occurrence_summary
        const summaryData = {
          summary_id: `OCC-${sp.id}`,
          species_id: sp.id,
          atlas_id: sp.atlas_id || null,
          record_count: count,
          countries_count: countries.size || null,
          first_record_year: firstYear,
          last_record_year: lastYear,
          data_quality_note: count > 100 ? "Good coverage" : count > 10 ? "Moderate coverage" : "Sparse data",
          source: "GBIF",
        };

        const { error: sumErr } = await supabase
          .from("occurrence_summary")
          .upsert(summaryData, { onConflict: "summary_id" });

        if (!sumErr) log.summaries_added++;
        else log.errors.push(`${sp.accepted_name} summary: ${sumErr.message}`);

        log.processed++;

        // Rate limit — GBIF allows ~1 req/sec without auth
        await new Promise(r => setTimeout(r, 300));

      } catch (e) {
        log.errors.push(`${sp.accepted_name}: ${e.message}`);
        log.processed++;
      }
    }

    // Log to harvest_log
    await supabase.from("harvest_log").insert({
      harvester: "gbif",
      batch,
      records_processed: log.processed,
      records_added: log.locations_added + log.summaries_added,
      errors: log.errors.length,
      details: JSON.stringify(log),
    }).catch(() => {});

    return Response.json(log);

  } catch (e) {
    return Response.json({ ...log, fatal: e.message }, { status: 500 });
  }
}
