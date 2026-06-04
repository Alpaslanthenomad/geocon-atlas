// v4.1-c — IUCN SIS-compatible JSON export.
//
// GET /api/v1/iucn/<assessment_id>
//
// Returns one published IUCN assessment + species commons join in a
// JSON shape that mirrors the IUCN SIS export schema. Anonymous +
// authenticated both allowed for status='published'; draft/peer_review
// rows are gated behind the author or admin.
//
// Cache: 1 hour public, 12 hours stale-while-revalidate. The
// underlying assessment is stable once published; admins force a
// fresh fetch via cache-buster on the SIS push tool.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon";

export async function GET(req, { params }) {
  const id = params?.id;
  if (!id) {
    return Response.json({ error: "assessment_id required" }, { status: 400 });
  }
  // Forward caller's Authorization header if present, so author/admin
  // can fetch their own draft. Otherwise the RPC's gating returns null.
  const auth = req.headers.get("authorization") || `Bearer ${ANON}`;
  const supabase = createClient(URL, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: auth } },
  });
  const { data, error } = await supabase.rpc("get_iucn_assessment_public", { p_id: id });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "not found or not public" }, { status: 404 });
  }
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `inline; filename="iucn-${data.species_id || id}.json"`,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=43200",
      "Access-Control-Allow-Origin": "*",
      "X-Sis-Compatible-Version": "1.0",
    },
  });
}
