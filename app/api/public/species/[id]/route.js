import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

// Public read-only species endpoint:
//   GET /api/public/species/:id  →  sanitized species row + atlas links
// Returns JSON. No auth required. CORS open so partners can embed cards.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon"
);

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control":                "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}

export async function GET(_req, { params }) {
  const id = params?.id;
  if (!id) {
    return Response.json({ error: "missing id" }, { status: 400, headers: CORS });
  }

  const { data, error } = await supabase
    .from("species")
    .select("id, accepted_name, common_name, family, genus, iucn_status, country_focus, native_countries, thumbnail_url, composite_score, geocon_module, geophyte_type, region")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return Response.json({ error: "not found" }, { status: 404, headers: CORS });
  }

  return Response.json(
    {
      species: data,
      _links: {
        atlas: `https://geocon-atlas.vercel.app/geocon/species/${id}`,
        embed: `https://geocon-atlas.vercel.app/embed/species/${id}`,
      },
    },
    { headers: CORS }
  );
}
