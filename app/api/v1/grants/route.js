// T4.a — Public grants endpoint.
// GET /api/v1/grants?limit=50

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid");
const ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon");

export async function GET(req) {
  const u = new URL(req.url);
  const limit = Math.max(1, Math.min(200, Number(u.searchParams.get("limit")) || 50));
  const supabase = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("list_open_grants", { p_limit: limit });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data || [], {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
