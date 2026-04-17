import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH = 25;

async function getTaxonKey(name) {
  try {
    const r = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}&kingdom=Plantae`);
    const d = await r.json();
    return d.matchType !== "NONE" ? d.usageKey : null;
  } catch { return null; }
}

async function getOccurrences(taxonKey) {
  try {
    const r = await fetch(`https://api.gbif.org/v1/occurrence/search?taxonKey=${taxonKey}&hasCoordinate=true&limit=50`);
    const d = await r.json();
    return { results: d.results || [], count: d.count || 0 };
  } catch { return { results: [], count: 0 }; }
}

function blur(coord, status) {
  if (["CR","EN"].includes(status)) return Math.round(coord);
  if (status === "VU") return Math.round(coord * 10) / 10;
  return Math.round(coord * 1000) / 1000;
}

function precision(status) {
  if (["CR","EN"].includes(status)) return "100km";
  if (status === "VU") return "10km";
  return "1km";
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batch = parseInt(url.searchParams.get("batch") || "0");
  const log = { batch, processed: 0, locations_added: 0, summaries_upserted: 0, errors: [] };

  const { data: species } = await sb
    .from("species")
    .select("id, accepted_name, iucn_status")
    .order("id")
    .range(batch * BATCH, (batch + 1) * BATCH - 1);

  if (!species?.length) return Response.json({ ...log, message: "empty batch" });

  for (const sp of species) {
    try {
      const taxonKey = await getTaxonKey(sp.accepted_name);
      if (!taxonKey) {
        log.errors.push(`${sp.accepted_name}: not in GBIF`);
        log.processed++;
        continue;
      }

      const { results, count } = await getOccurrences(taxonKey);
      const status = sp.iucn_status || "";

      // --- LOCATIONS ---
      // Delete old locations for this species
      await sb.from("locations").delete().eq("species_id", sp.id);

      const seen = new Set();
      const locs = [];

      for (const occ of results) {
        if (!occ.decimalLatitude || !occ.decimalLongitude) continue;
        const gridKey = `${Math.round(occ.decimalLatitude)}_${Math.round(occ.decimalLongitude)}`;
        if (seen.has(gridKey)) continue;
        seen.add(gridKey);

        locs.push({
          location_id: `LOC-${sp.id}-${locs.length + 1}`,
          species_id: sp.id,
          country: occ.countryCode || null,
          region: occ.stateProvince || null,
          latitude: blur(occ.decimalLatitude, status),
          longitude: blur(occ.decimalLongitude, status),
          coordinate_precision: precision(status),
          sensitivity_level: ["CR","EN"].includes(status) ? "restricted" : status === "VU" ? "blurred" : "public",
          habitat: (occ.habitat && occ.habitat !== "unknown") ? occ.habitat : null,
          elevation_m: occ.elevation ? Math.round(occ.elevation) : null,
          occurrence_source: "GBIF",
          last_verified: new Date().toISOString().split("T")[0],
        });

        if (locs.length >= 10) break;
      }

      if (locs.length > 0) {
        const { error: locErr } = await sb.from("locations").insert(locs);
        if (locErr) log.errors.push(`${sp.accepted_name} locs: ${locErr.message}`);
        else log.locations_added += locs.length;
      }

      // --- OCCURRENCE SUMMARY ---
      const years = results.map(o => o.year).filter(Boolean);
      const countries = [...new Set(results.map(o => o.countryCode).filter(Boolean))];

      const { error: sumErr } = await sb.from("occurrence_summary").upsert({
        summary_id: `OCC-${sp.id}`,
        species_id: sp.id,
        record_count: count,
        countries_count: countries.length || null,
        first_record_year: years.length ? Math.min(...years) : null,
        last_record_year: years.length ? Math.max(...years) : null,
        data_quality_note: count > 100 ? "Good" : count > 10 ? "Moderate" : "Sparse",
        source: "GBIF",
      }, { onConflict: "summary_id" });

      if (sumErr) log.errors.push(`${sp.accepted_name} summary: ${sumErr.message}`);
      else log.summaries_upserted++;

      log.processed++;
      await new Promise(r => setTimeout(r, 300));

    } catch (e) {
      log.errors.push(`${sp.accepted_name}: ${e.message}`);
      log.processed++;
    }
  }

  return Response.json(log);
}
