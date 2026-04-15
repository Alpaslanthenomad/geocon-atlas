import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const SPECIES_TAXA = [
  { species_id: "GEO-0001", name: "Fritillaria imperialis", gbif_key: "2878688" },
  { species_id: "GEO-0002", name: "Lilium candidum", gbif_key: "2879051" },
  { species_id: "GEO-0003", name: "Orchis italica", gbif_key: "5302598" },
  { species_id: "GEO-0004", name: "Tecophilaea cyanocrocus", gbif_key: "2856604" },
  { species_id: "GEO-0005", name: "Alstroemeria ligtu", gbif_key: "2757289" },
  { species_id: "GEO-0006", name: "Cyclamen coum", gbif_key: "5546798" },
  { species_id: "GEO-0007", name: "Crocus sativus", gbif_key: "7291972" },
  { species_id: "GEO-0008", name: "Leucocoryne purpurea", gbif_key: "2856196" },
];

async function fetchGBIF(taxonKey) {
  const url = `https://api.gbif.org/v1/occurrence/search?taxonKey=${taxonKey}&limit=300&hasCoordinate=true&hasGeospatialIssue=false`;
  const res = await fetch(url);
  if (!res.ok) return { results: [], count: 0 };
  return await res.json();
}

function summarizeOccurrences(data) {
  const records = data.results || [];
  const countries = [...new Set(records.map((r) => r.country).filter(Boolean))];
  const years = records.map((r) => r.year).filter(Boolean);
  return {
    total_records: data.count || records.length,
    countries_count: countries.length,
    countries_list: countries.join(", "),
    first_record_year: years.length ? Math.min(...years) : null,
    last_record_year: years.length ? Math.max(...years) : null,
    herbarium_specimens: records.filter((r) => r.basisOfRecord === "PRESERVED_SPECIMEN").length,
    observation_records: records.filter((r) => r.basisOfRecord === "HUMAN_OBSERVATION").length,
  };
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();
  const startTime = Date.now();
  let totalFetched = 0;
  let speciesUpdated = 0;
  let errors = 0;

  for (const taxon of SPECIES_TAXA) {
    try {
      const data = await fetchGBIF(taxon.gbif_key);
      const s = summarizeOccurrences(data);
      totalFetched += s.total_records;

      await db.from("species").update({
        notes: `GBIF: ${s.total_records} records, ${s.countries_count} countries (${s.countries_list}). Years: ${s.first_record_year}-${s.last_record_year}. Herbarium: ${s.herbarium_specimens}, Obs: ${s.observation_records}. Harvest: ${new Date().toISOString().split("T")[0]}`,
        updated_at: new Date().toISOString(),
      }).eq("id", taxon.species_id);

      speciesUpdated++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      errors++;
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  await db.from("harvest_log").insert({
    source_id: "SRC-002",
    harvest_type: "GBIF occurrence harvest",
    query_params: JSON.stringify(SPECIES_TAXA.map((t) => t.name)),
    records_fetched: totalFetched,
    records_new: 0,
    records_updated: speciesUpdated,
    errors: errors,
    freshness_score: 1.0,
    status: errors === 0 ? "success" : "partial",
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: duration,
    next_scheduled: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await db.from("data_sources").update({
    last_successful_harvest: new Date().toISOString(),
    freshness_score: 1.0,
  }).eq("id", "SRC-002");

  return Response.json({ success: true, duration_seconds: duration, total_occurrences: totalFetched, species_updated: speciesUpdated, errors });
}
