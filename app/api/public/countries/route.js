import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control":                "public, max-age=600, s-maxage=1800, stale-while-revalidate=86400",
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}

// GET /api/public/countries  →  full country summary at the threat tier.
// Mirrors what the globe consumes so partners get the same shape.
export async function GET() {
  const { data, error } = await supabase.rpc("get_explore_country_summary", {
    p_tiers: ["CR", "EN", "VU"],
    p_include_null: false,
    p_families: null,
  });
  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
  return Response.json({ countries: data || [] }, { headers: CORS });
}
