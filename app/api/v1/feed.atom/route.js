// D2 — Discovery Feed Atom 1.0 endpoint.
//
// GET /api/v1/feed.atom
//
// Emits an Atom feed of the latest discovery items. Same source as the
// RSS endpoint (get_discovery_feed RPC) — different envelope so Atom
// readers / podcasts / IndieWeb tools can subscribe natively. Cached 5 min.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon";
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://atlas.vennbioventures.com";

function xmlEscape(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function itemGuid(row) {
  const ts = row.ts ? new Date(row.ts).toISOString() : "";
  return `tag:atlas.vennbioventures.com,2026:${row.kind || "item"}:${row.url || ""}:${ts}`;
}

function toAtomDate(ts) {
  try { return new Date(ts).toISOString(); } catch { return new Date().toISOString(); }
}

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("get_discovery_feed", { p_limit: 50 });
  if (error) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><error>${xmlEscape(error.message)}</error>`, {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
  const rows = Array.isArray(data) ? data : [];
  const updated = rows.length ? toAtomDate(rows[0].ts) : new Date().toISOString();

  const entries = rows.map((r) => {
    const link = `${SITE_ORIGIN}${r.url || "/geocon/feed"}`;
    return [
      "  <entry>",
      `    <id>${xmlEscape(itemGuid(r))}</id>`,
      `    <title>${xmlEscape(r.title)}</title>`,
      `    <link href="${xmlEscape(link)}" />`,
      `    <updated>${toAtomDate(r.ts)}</updated>`,
      `    <category term="${xmlEscape(r.kind)}" />`,
      `    <summary>${xmlEscape(r.summary || "")}</summary>`,
      "  </entry>",
    ].join("\n");
  }).join("\n");

  const body =
`<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>GEOCON Atlas — Discovery Feed</title>
  <link href="${xmlEscape(SITE_ORIGIN)}/geocon/feed" />
  <link href="${xmlEscape(SITE_ORIGIN)}/api/v1/feed.atom" rel="self" type="application/atom+xml" />
  <id>tag:atlas.vennbioventures.com,2026:discovery-feed</id>
  <updated>${updated}</updated>
  <subtitle>IUCN status changes, peer-endorsed outcomes, high-citation publications, and active programs across GEOCON.</subtitle>
${entries}
</feed>`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
