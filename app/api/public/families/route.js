import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon"
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

// GET /api/public/families  →  [{family, species_count}, ...]
export async function GET() {
  const { data, error } = await supabase.rpc("get_atlas_family_counts");
  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
  return Response.json({ families: data || [] }, { headers: CORS });
}
