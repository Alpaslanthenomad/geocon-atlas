// D2 — Discovery Feed RSS 2.0 endpoint.
//
// GET /api/v1/feed.rss
//
// Emits RSS 2.0 XML of the latest discovery feed items. Items link
// back to atlas.vennbioventures.com canonical URLs. Cached 5 min.

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
  // Stable per-row id for RSS readers' dedup.
  const ts = row.ts ? new Date(row.ts).toISOString() : "";
  return `${row.kind || "item"}:${row.url || ""}:${ts}`;
}

function toRssDate(ts) {
  try { return new Date(ts).toUTCString(); } catch { return new Date().toUTCString(); }
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
  const lastBuild = rows.length ? toRssDate(rows[0].ts) : new Date().toUTCString();

  const items = rows.map((r) => {
    const link = `${SITE_ORIGIN}${r.url || "/geocon/feed"}`;
    return [
      "    <item>",
      `      <title>${xmlEscape(r.title)}</title>`,
      `      <link>${xmlEscape(link)}</link>`,
      `      <guid isPermaLink="false">${xmlEscape(itemGuid(r))}</guid>`,
      `      <pubDate>${toRssDate(r.ts)}</pubDate>`,
      `      <category>${xmlEscape(r.kind)}</category>`,
      `      <description>${xmlEscape(r.summary || "")}</description>`,
      "    </item>",
    ].join("\n");
  }).join("\n");

  const body =
`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>GEOCON Atlas — Discovery Feed</title>
    <link>${xmlEscape(SITE_ORIGIN)}/geocon/feed</link>
    <atom:link href="${xmlEscape(SITE_ORIGIN)}/api/v1/feed.rss" rel="self" type="application/rss+xml" />
    <description>IUCN status changes, peer-endorsed outcomes, high-citation publications, and active programs across GEOCON.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
