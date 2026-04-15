import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const SPECIES_QUERIES = [
  { species_id: "GEO-0001", queries: ["Fritillaria imperialis", "Fritillaria tissue culture", "Fritillaria alkaloid"] },
  { species_id: "GEO-0002", queries: ["Lilium candidum", "Lilium tissue culture cosmetic"] },
  { species_id: "GEO-0003", queries: ["Orchis salep", "orchid tuber glucomannan", "salep orchid conservation"] },
  { species_id: "GEO-0004", queries: ["Tecophilaea cyanocrocus", "Chilean blue crocus conservation"] },
  { species_id: "GEO-0005", queries: ["Alstroemeria ligtu", "Alstroemeria Chilean endemic"] },
  { species_id: "GEO-0006", queries: ["Cyclamen coum", "Cyclamen micropropagation somatic embryogenesis"] },
  { species_id: "GEO-0007", queries: ["Crocus sativus tissue culture", "saffron crocin pharmacology"] },
  { species_id: "GEO-0008", queries: ["Leucocoryne purpurea", "Leucocoryne Chile ornamental"] },
];

async function searchOpenAlex(query, perPage = 5) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&sort=cited_by_count:desc&per_page=${perPage}&mailto=atlas@geocon.bio`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

async function harvestPublications(db, speciesId, queries) {
  let totalNew = 0;
  let totalFetched = 0;

  for (const query of queries) {
    const works = await searchOpenAlex(query, 10);
    totalFetched += works.length;

    for (const work of works) {
      if (!work.title || !work.id) continue;
      const paperId = `PAP-${work.id.split("/").pop().slice(0, 8)}`;
      const authors = (work.authorships || []).map((a) => a.author?.display_name).filter(Boolean).slice(0, 5).join(", ");

      const { data: existing } = await db.from("publications").select("id").eq("openalex_id", work.id).single();
      if (existing) continue;

      const { error } = await db.from("publications").upsert({
        id: paperId,
        species_id: speciesId,
        title: work.title,
        authors: authors,
        doi: work.doi,
        year: work.publication_year,
        journal: work.primary_location?.source?.display_name || null,
        open_access: work.open_access?.is_oa || false,
        primary_topic: work.topics?.[0]?.display_name || null,
        relevance_score: Math.min((work.cited_by_count || 0) / 100, 1.0),
        openalex_id: work.id,
        source: "OpenAlex",
        last_verified: new Date().toISOString().split("T")[0],
      }, { onConflict: "id" });

      if (!error) totalNew++;
    }
  }
  return { totalFetched, totalNew };
}

async function harvestResearchers(db, speciesId, queries) {
  let totalNew = 0;

  for (const query of queries) {
    const works = await searchOpenAlex(query, 5);
    for (const work of works) {
      for (const authorship of (work.authorships || []).slice(0, 3)) {
        const author = authorship.author;
        if (!author?.display_name || !author?.id) continue;
        const resId = `RES-OA-${author.id.split("/").pop().slice(0, 8)}`;
        const inst = authorship.institutions?.[0];

        const { data: existing } = await db.from("researchers").select("id").eq("openalex_id", author.id).single();
        if (existing) continue;

        let authorData = {};
        try {
          const aRes = await fetch(`https://api.openalex.org/authors/${author.id.split("/").pop()}?mailto=atlas@geocon.bio`);
          if (aRes.ok) authorData = await aRes.json();
        } catch (e) {}

        const { error } = await db.from("researchers").upsert({
          id: resId,
          name: author.display_name,
          openalex_id: author.id,
          country: inst?.country_code || null,
          expertise_area: work.topics?.[0]?.display_name || query,
          h_index: authorData.summary_stats?.h_index || null,
          publications_count: authorData.works_count || null,
          recent_activity_year: work.publication_year,
          collaboration_fit: "candidate — auto-harvested",
          consortium_potential: "Under review",
          priority: "candidate",
          species_links: [speciesId],
          last_verified: new Date().toISOString().split("T")[0],
          notes: `Auto-harvested from OpenAlex. Institution: ${inst?.display_name || "unknown"}`,
        }, { onConflict: "id" });

        if (!error) totalNew++;
      }
    }
  }
  return totalNew;
}

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getSupabase();
  const startTime = Date.now();
  let totalPubs = 0;
  let totalNewPubs = 0;
  let totalNewResearchers = 0;
  let errors = 0;

  for (const spec of SPECIES_QUERIES) {
    try {
      const pubResult = await harvestPublications(db, spec.species_id, spec.queries);
      totalPubs += pubResult.totalFetched;
      totalNewPubs += pubResult.totalNew;
      const resNew = await harvestResearchers(db, spec.species_id, spec.queries);
      totalNewResearchers += resNew;
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      errors++;
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  await db.from("harvest_log").insert({
    source_id: "SRC-005",
    harvest_type: "OpenAlex full harvest",
    query_params: JSON.stringify(SPECIES_QUERIES.map((s) => s.species_id)),
    records_fetched: totalPubs,
    records_new: totalNewPubs,
    errors: errors,
    freshness_score: 1.0,
    status: errors === 0 ? "success" : "partial",
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: duration,
    next_scheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await db.from("data_sources").update({
    last_successful_harvest: new Date().toISOString(),
    freshness_score: 1.0,
  }).eq("id", "SRC-005");

  return Response.json({ success: true, duration_seconds: duration, publications: { fetched: totalPubs, new: totalNewPubs }, researchers: { new: totalNewResearchers }, errors });
}
