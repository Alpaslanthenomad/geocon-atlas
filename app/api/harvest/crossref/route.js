import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CROSSREF_API = "https://api.crossref.org/works";
const MAILTO = "geocon@vennbioventures.com"; // polite pool

const QUERIES = [
  "Fritillaria micropropagation",
  "Crocus sativus tissue culture",
  "Tulipa conservation bulb",
  "Galanthus alkaloid galanthamine",
  "Cyclamen persicum in vitro",
  "Colchicum colchicine extraction",
  "Leucocoryne Chile ornamental",
  "Orchis terrestrial conservation",
  "geophyte bulbous phytochemistry",
  "endemic bulb plant conservation Turkey",
  "Allium secondary metabolites",
  "Iris rhizome propagation",
  "Narcissus alkaloid lycorine",
  "Zantedeschia tissue culture",
  "Sternbergia Mediterranean endemic",
];

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queryIndex = parseInt(url.searchParams.get("query_index") || "0");
  const rows = parseInt(url.searchParams.get("rows") || "40");

  if (queryIndex >= QUERIES.length) {
    return Response.json({ message: "All CrossRef queries completed" });
  }

  const query = QUERIES[queryIndex];

  // Fetch existing DOIs
  const { data: existing } = await sb.from("publications").select("doi").not("doi", "is", null);
  const existingDOIs = new Set((existing || []).map(p => p.doi?.toLowerCase()));

  // CrossRef API call
  const params = new URLSearchParams({
    query,
    rows: rows.toString(),
    select: "title,author,published,container-title,DOI,abstract,is-referenced-by-count,license",
    "mailto": MAILTO,
    filter: "from-pub-date:2000",
    sort: "relevance",
  });

  const res = await fetch(`${CROSSREF_API}?${params}`, {
    headers: { "User-Agent": `GEOCON-Atlas/1.0 (${MAILTO})` }
  });

  if (!res.ok) {
    return Response.json({ error: `CrossRef error: ${res.status}` }, { status: 500 });
  }

  const data = await res.json();
  const items = data.message?.items || [];

  // Match to species
  const { data: species } = await sb.from("species").select("id, accepted_name, genus");
  const speciesMap = {};
  for (const sp of species || []) {
    speciesMap[sp.accepted_name.toLowerCase()] = sp.id;
    if (sp.genus) speciesMap[sp.genus.toLowerCase()] = sp.id;
  }

  let inserted = 0, skipped = 0;
  const errors = [];

  for (const item of items) {
    try {
      const doi = item.DOI ? `https://doi.org/${item.DOI}` : null;
      if (doi && existingDOIs.has(doi.toLowerCase())) { skipped++; continue; }

      const title = (item.title?.[0] || "").trim();
      if (!title) { skipped++; continue; }

      const titleLow = title.toLowerCase();
      const abstractText = item.abstract || "";
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

      const authors = (item.author || [])
        .map(a => `${a.given || ""} ${a.family || ""}`.trim())
        .join(", ");

      const year = item.published?.["date-parts"]?.[0]?.[0] || null;
      const journal = item["container-title"]?.[0] || null;
      const openAccess = (item.license || []).some(l =>
        l.URL?.includes("creativecommons") || l.URL?.includes("open-access")
      );

      const { error } = await sb.from("publications").insert({
        id: randomUUID(),
        species_id: speciesId,
        title: title.slice(0, 500),
        authors: authors.slice(0, 500),
        year,
        journal: journal?.slice(0, 200),
        doi,
        abstract: abstractText.replace(/<[^>]+>/g, "").slice(0, 2000),
        open_access: openAccess,
        source: "CrossRef",
        cited_by_count: item["is-referenced-by-count"] || 0,
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
    total_found: items.length,
    inserted,
    skipped,
    errors: errors.slice(0, 5),
  });
}
