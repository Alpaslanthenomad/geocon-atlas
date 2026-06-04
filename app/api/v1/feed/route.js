// D2 — Discovery Feed JSON endpoint.
//
// GET /api/v1/feed?limit=50
//
// Returns the latest 30 days of platform activity (IUCN status changes,
// peer-endorsed+ outcomes, high-citation publications, programs entering
// Develop/Steward, published IUCN assessments) as a JSON array. Cached
// 5 min via Cache-Control. Backed by RPC get_discovery_feed.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon";

export async function GET(req) {
  const u = new URL(req.url);
  const limit = Math.max(1, Math.min(100, Number(u.searchParams.get("limit")) || 50));
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("get_discovery_feed", { p_limit: limit });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data || [], {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
