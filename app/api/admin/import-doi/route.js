import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon"
);

// Admin DOI importer. Takes { doi, species_id? } and uses CrossRef
// to resolve metadata into a publications row. No API key needed —
// CrossRef's polite endpoint is free.

const CROSSREF = "https://api.crossref.org/works/";

export async function POST(req) {
  let payload;
  try { payload = await req.json(); } catch { payload = null; }
  if (!payload?.doi) {
    return Response.json({ error: "doi required" }, { status: 400 });
  }
  const doi = String(payload.doi).trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");

  // Already in db?
  const { data: existing } = await supabase
    .from("publications")
    .select("id")
    .eq("doi", doi)
    .maybeSingle();

  if (existing?.id) {
    return Response.json({ ok: true, status: "already_present", id: existing.id });
  }

  // Fetch CrossRef metadata
  let cr;
  try {
    const r = await fetch(CROSSREF + encodeURIComponent(doi), {
      headers: { "User-Agent": "GEOCON Atlas (mailto:alpaslansevket@gmail.com)" },
    });
    if (!r.ok) throw new Error(`crossref ${r.status}`);
    cr = await r.json();
  } catch (e) {
    return Response.json({ error: `CrossRef lookup failed: ${e.message}` }, { status: 502 });
  }

  const m = cr?.message || {};
  const issued = m.issued?.["date-parts"]?.[0]?.[0] ?? m.published?.["date-parts"]?.[0]?.[0];
  const authors = (m.author || [])
    .map((a) => [a.given, a.family].filter(Boolean).join(" "))
    .filter(Boolean)
    .join("; ");

  const row = {
    title:         (m.title?.[0] || "").trim() || null,
    authors:       authors || null,
    doi,
    year:          typeof issued === "number" ? issued : null,
    journal:       m["container-title"]?.[0] || null,
    open_access:   !!(m.license?.length || m["assertion"]?.some?.((a) => /openaccess/i.test(a?.label || a?.name || ""))),
    abstract_text: stripJats(m.abstract),
    primary_topic: m.subject?.[0] || null,
    cited_by_count: typeof m["is-referenced-by-count"] === "number" ? m["is-referenced-by-count"] : null,
    source:        "crossref",
    species_id:    payload.species_id || null,
    last_verified: new Date().toISOString(),
    last_updated:  new Date().toISOString(),
    created_at:    new Date().toISOString(),
  };

  if (!row.title) {
    return Response.json({ error: "CrossRef returned no title" }, { status: 422 });
  }

  const { data: ins, error } = await supabase
    .from("publications")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, status: "imported", id: ins.id, row });
}

function stripJats(s) {
  if (!s) return null;
  return s
    .replace(/<jats:[^>]+>/g, "")
    .replace(/<\/jats:[^>]+>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}
