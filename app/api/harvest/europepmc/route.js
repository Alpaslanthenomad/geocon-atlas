import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EUROPE_PMC_API = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

const QUERIES = [
  "Fritillaria micropropagation conservation",
  "Crocus tissue culture bulb",
  "Tulipa in vitro propagation",
  "Galanthus galanthamine alkaloid",
  "Cyclamen persicum somatic embryogenesis",
  "Colchicum colchicine phytochemistry",
  "Leucocoryne ornamental Chile",
  "Orchis terrestrial mycorrhiza",
  "geophyte bulbous secondary metabolite",
  "endemic bulb Turkey conservation threatened",
  "Allium phytochemical antimicrobial",
  "Iris flavonoid rhizome",
  "Narcissus lycorine alkaloid",
  "Zantedeschia aethiopica tissue culture",
  "Sternbergia lutea Mediterranean",
  "Bellevalia conservation threatened",
  "Muscari anthocyanin ornamental",
  "Anemone coronaria phytochemistry",
  "Paeonia peregrina medicinal plant",
  "Rhodophiala Chile endemic geophyte",
];

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queryIndex = parseInt(url.searchParams.get("query_index") || "0");
  const pageSize = parseInt(url.searchParams.get("page_size") || "50");

  if (queryIndex >= QUERIES.length) {
    return Response.json({ message: "All Europe PMC queries completed" });
  }

  const query = QUERIES[queryIndex];

  // Fetch existing DOIs
  const { data: existing } = await sb.from("publications").select("doi").not("doi", "is", null);
  const existingDOIs = new Set((existing || []).map(p => p.doi?.toLowerCase()));

  // Europe PMC API
  const params = new URLSearchParams({
    query: `"${query}" AND (SRC:MED OR SRC:PPR OR SRC:AGR)`,
    resultType: "core",
    pageSize: pageSize.toString(),
    format: "json",
    cursorMark: "*",
  });

  const res = await fetch(`${EUROPE_PMC_API}?${params}`);
  if (!res.ok) {
    return Response.json({ error: `Europe PMC error: ${res.status}` }, { status: 500 });
  }

  const data = await res.json();
  const results = data.resultList?.result || [];

  // Match to species
  const { data: species } = await sb.from("species").select("id, accepted_name, genus");
  const speciesMap = {};
  for (const sp of species || []) {
    speciesMap[sp.accepted_name.toLowerCase()] = sp.id;
    if (sp.genus) speciesMap[sp.genus.toLowerCase()] = sp.id;
  }

  let inserted = 0, skipped = 0;
  const errors = [];

  for (const item of results) {
    try {
      const doi = item.doi ? `https://doi.org/${item.doi}` : null;
      if (doi && existingDOIs.has(doi.toLowerCase())) { skipped++; continue; }

      // Also check by PMID
      if (item.pmid) {
        const { data: existing } = await sb.from("publications")
          .select("id").eq("pubmed_id", item.pmid).maybeSingle();
        if (existing) { skipped++; continue; }
      }

      const title = item.title?.replace(/<[^>]+>/g, "").trim() || "";
      if (!title) { skipped++; continue; }

      const titleLow = title.toLowerCase();
      const abstractText = (item.abstractText || "").replace(/<[^>]+>/g, "");
      const abstractLow = abstractText.toLowerCase();

      // Match to species
      let speciesId = null;
      for (const [name, id] of Object.entries(speciesMap)) {
        if (titleLow.includes(name) || abstractLow.includes(name)) {
          speciesId = id;
          break;
        }
      }
      if (!speciesId) { skipped++; continue; }

      const authors = (item.authorString || "").slice(0, 500);
      const year = item.pubYear ? parseInt(item.pubYear) : null;
      const journal = (item.journalTitle || item.bookOrReportDetails?.publisher || "").slice(0, 200);
      const openAccess = item.isOpenAccess === "Y";

      const { error } = await sb.from("publications").insert({
        id: randomUUID(),
        species_id: speciesId,
        title: title.slice(0, 500),
        authors,
        year,
        journal,
        doi,
        pubmed_id: item.pmid || null,
        abstract: abstractText.slice(0, 2000),
        open_access: openAccess,
        source: "Europe PMC",
        cited_by_count: item.citedByCount || 0,
      });

      if (error) {
        if (error.code === "23505") skipped++;
        else errors.push(`${title.slice(0, 40)}: ${error.message}`);
      } else {
        inserted++;
        if (doi) existingDOIs.add(doi.toLowerCase());
      }
    } catch (e) {
      errors.push(e.message);
    }
  }

  return Response.json({
    query,
    query_index: queryIndex,
    next_query_index: queryIndex + 1,
    next_query: QUERIES[queryIndex + 1] || "done",
    total_found: results.length,
    inserted,
    skipped,
    errors: errors.slice(0, 5),
  });
}
