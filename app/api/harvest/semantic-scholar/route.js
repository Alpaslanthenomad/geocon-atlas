import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SEMANTIC_SCHOLAR_API = "https://api.semanticscholar.org/graph/v1";
const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;

const GEOPHYTE_QUERIES = [
  "Fritillaria conservation tissue culture",
  "Crocus bulb micropropagation",
  "Tulipa in vitro propagation",
  "Allium endemic species conservation",
  "Galanthus threatened bulbous plants",
  "Cyclamen ex situ conservation",
  "Orchidaceae terrestrial geophyte",
  "Leucocoryne Chile endemic",
  "Rhodophiala conservation Chile",
  "Colchicum alkaloid phytochemistry",
  "Sternbergia bulb propagation",
  "Iris endemic Turkey conservation",
  "geophyte secondary metabolites",
  "bulbous plant phytochemistry alkaloid",
  "cormous plant tissue culture protocol",
];

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queryIndex = parseInt(url.searchParams.get("query_index") || "0");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  if (queryIndex >= GEOPHYTE_QUERIES.length) {
    return Response.json({ message: "All queries completed", query_index: queryIndex });
  }

  const query = GEOPHYTE_QUERIES[queryIndex];

  // Fetch existing DOIs to avoid duplicates
  const { data: existing } = await sb
    .from("publications")
    .select("doi")
    .not("doi", "is", null);
  const existingDOIs = new Set((existing || []).map(p => p.doi?.toLowerCase()));

  // Fetch from Semantic Scholar
  const headers = { "Content-Type": "application/json" };
  if (API_KEY) headers["x-api-key"] = API_KEY;

  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
    fields: "title,authors,year,externalIds,journal,abstract,publicationTypes,citationCount,openAccessPdf",
    offset: "0",
  });

  const res = await fetch(`${SEMANTIC_SCHOLAR_API}/paper/search?${params}`, { headers });

  if (!res.ok) {
    return Response.json({ error: `Semantic Scholar API error: ${res.status}`, query }, { status: 500 });
  }

  const data = await res.json();
  const papers = data.data || [];

  // Match papers to species
  const { data: species } = await sb.from("species").select("id, accepted_name, genus");
  const speciesMap = {};
  for (const sp of species || []) {
    const key = sp.accepted_name.toLowerCase();
    speciesMap[key] = sp.id;
    if (sp.genus) {
      const genusKey = sp.genus.toLowerCase();
      if (!speciesMap[genusKey]) speciesMap[genusKey] = sp.id;
    }
  }

  let inserted = 0;
  let skipped = 0;
  const errors = [];

  for (const paper of papers) {
    try {
      const doi = paper.externalIds?.DOI
        ? `https://doi.org/${paper.externalIds.DOI}`
        : null;

      // Skip if already exists
      if (doi && existingDOIs.has(doi.toLowerCase())) { skipped++; continue; }

      // Match to species
      const title = (paper.title || "").toLowerCase();
      const abstract = (paper.abstract || "").toLowerCase();
      let speciesId = null;

      for (const [name, id] of Object.entries(speciesMap)) {
        if (title.includes(name) || abstract.includes(name)) {
          speciesId = id;
          break;
        }
      }

      if (!speciesId) { skipped++; continue; }

      const authors = (paper.authors || []).map(a => a.name).join(", ");
      const journal = paper.journal?.name || null;
      const openAccess = !!paper.openAccessPdf;

      const { error } = await sb.from("publications").insert({
        species_id: speciesId,
        title: paper.title,
        authors: authors.slice(0, 500),
        year: paper.year,
        journal: journal?.slice(0, 200),
        doi,
        abstract: paper.abstract?.slice(0, 2000),
        open_access: openAccess,
        source: "Semantic Scholar",
        cited_by_count: paper.citationCount || 0,
      });

      if (error) {
        if (error.code === "23505") skipped++; // duplicate
        else errors.push(`${paper.title?.slice(0, 40)}: ${error.message}`);
      } else {
        inserted++;
        if (doi) existingDOIs.add(doi.toLowerCase());
      }
    } catch (e) {
      errors.push(`Error: ${e.message}`);
    }
  }

  return Response.json({
    query,
    query_index: queryIndex,
    next_query_index: queryIndex + 1,
    next_query: GEOPHYTE_QUERIES[queryIndex + 1] || "done",
    total_found: papers.length,
    inserted,
    skipped,
    errors: errors.slice(0, 5),
  });
}
