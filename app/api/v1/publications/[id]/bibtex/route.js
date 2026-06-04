// T2.a — BibTeX export for a publication.
// Citation-engine entry point. Authenticated readers + anon both
// allowed (publications are public). Returns text/plain BibTeX so
// a researcher can pipe directly into Zotero / Mendeley / pandoc.
//
// GET /api/v1/publications/<id>/bibtex
//
// Pattern intentionally lives under /api/v1/ to make a clean public
// API surface (T4 lands the OpenAPI spec).

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid");
const ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon");

function bibKey(row) {
  const lastName = (row.authors || "")
    .split(/[,;]/)[0]
    .trim()
    .split(/\s+/)
    .pop() || "anon";
  return `geocon_${lastName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${row.year || "nd"}`;
}

function quoteBib(s) {
  if (!s) return "";
  return String(s).replace(/[{}]/g, "").replace(/&/g, "\\&");
}

function toBibTeX(row) {
  const key = bibKey(row);
  const lines = [`@article{${key},`];
  if (row.title)         lines.push(`  title = {${quoteBib(row.title)}},`);
  if (row.authors)       lines.push(`  author = {${quoteBib(row.authors)}},`);
  if (row.journal)       lines.push(`  journal = {${quoteBib(row.journal)}},`);
  if (row.year)          lines.push(`  year = {${row.year}},`);
  if (row.doi)           lines.push(`  doi = {${row.doi}},`);
  if (row.primary_topic) lines.push(`  keywords = {${quoteBib(row.primary_topic)}},`);
  lines.push(`  note = {Retrieved via GEOCON Atlas, ${new Date().toISOString().slice(0, 10)}},`);
  lines.push(`}`);
  return lines.join("\n");
}

export async function GET(_req, { params }) {
  const id = params?.id;
  if (!id) return new Response("id required", { status: 400 });
  const supabase = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("get_publication_for_citation", { p_id: id });
  if (error || !data) return new Response("not found", { status: 404 });
  const bib = toBibTeX(data);
  return new Response(bib, {
    status: 200,
    headers: {
      "Content-Type": "application/x-bibtex; charset=utf-8",
      "Content-Disposition": `attachment; filename="${bibKey(data)}.bib"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
