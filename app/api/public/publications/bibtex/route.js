import { createClient } from "@supabase/supabase-js";

// Bulk BibTeX export. Filters:
//   ?species_id=ID
//   ?ids=p1,p2,p3
//   ?family=Iridaceae
// Returns a single BibTeX text body, downloadable.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=600, s-maxage=1800",
  "Content-Type": "application/x-bibtex; charset=utf-8",
};

export async function OPTIONS() {
  return new Response(null, { headers: { ...CORS, "Content-Type": "text/plain" } });
}

export async function GET(req) {
  const url = new URL(req.url);
  const speciesId = url.searchParams.get("species_id");
  const idsParam  = url.searchParams.get("ids");
  const family    = url.searchParams.get("family");

  let q = supabase
    .from("publications")
    .select("id, title, authors, year, journal, doi, abstract_text, abstract, species_id");

  if (idsParam) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 500);
    q = q.in("id", ids);
  } else if (speciesId) {
    q = q.eq("species_id", speciesId);
  } else if (family) {
    // join via species → publications: shallow filter on a denormalized species
    const { data: sp } = await supabase.from("species").select("id").eq("family", family).limit(1000);
    const ids = (sp || []).map((s) => s.id);
    if (ids.length === 0) {
      return new Response("% no publications for family\n", { headers: CORS });
    }
    q = q.in("species_id", ids);
  } else {
    // sensible default: don't dump everything
    q = q.order("year", { ascending: false, nullsFirst: false }).limit(50);
  }

  const { data, error } = await q;
  if (error) {
    return new Response(`% error: ${error.message}\n`, { status: 500, headers: CORS });
  }

  const bibs = (data || []).map(toBibTeX).join("\n\n");
  return new Response(bibs + "\n", {
    headers: {
      ...CORS,
      "Content-Disposition": `attachment; filename="geocon-publications.bib"`,
    },
  });
}

function toBibTeX(p) {
  const key = bibKey(p);
  const fields = [];
  if (p.title)   fields.push(`  title   = {${escape(p.title)}}`);
  if (p.authors) fields.push(`  author  = {${escape(p.authors)}}`);
  if (p.year)    fields.push(`  year    = {${p.year}}`);
  if (p.journal) fields.push(`  journal = {${escape(p.journal)}}`);
  if (p.doi)     fields.push(`  doi     = {${escape(p.doi)}}`);
  fields.push(`  url     = {https://geocon-atlas.vercel.app/geocon/publications/${p.id}}`);
  const note = p.abstract_text || p.abstract;
  if (note) fields.push(`  abstract = {${escape(String(note).slice(0, 800))}}`);
  return `@article{${key},\n${fields.join(",\n")}\n}`;
}

function bibKey(p) {
  const first = (p.authors || "").split(/[,;]/)[0]?.trim().split(/\s+/).slice(-1)[0] || "anon";
  const year = p.year || "nd";
  const slug = (p.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || "ref";
  return `${first}${year}${slug}`.replace(/[^A-Za-z0-9]/g, "");
}

function escape(s) {
  return String(s).replace(/[{}\\]/g, "");
}
