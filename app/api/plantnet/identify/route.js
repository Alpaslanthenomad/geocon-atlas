// V4.2-a — Pl@ntNet identify proxy.
//
// POST /api/plantnet/identify
//   body: multipart/form-data with one or more "images" file fields
//
// Forwards to Pl@ntNet's identify endpoint and returns the top
// candidate species list, with a follow-up join against our species
// table so the UI can render direct links to species pages where the
// scientific name matches.
//
// Env-gated: requires PLANTNET_API_KEY. If unset, returns 503 with a
// helpful message so the FieldRoute can render a disabled affordance.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PLANTNET_KEY = process.env.PLANTNET_API_KEY || "";
const PLANTNET_URL = "https://my-api.plantnet.org/v2/identify/all";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon";

export async function POST(req) {
  if (!PLANTNET_KEY) {
    return Response.json({
      error: "Pl@ntNet API key not configured",
      hint: "Admin must set PLANTNET_API_KEY env var on Vercel.",
    }, { status: 503 });
  }

  let form;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "multipart/form-data required" }, { status: 400 });
  }

  const images = form.getAll("images");
  if (!images.length || !(images[0] instanceof File)) {
    return Response.json({ error: "at least one 'images' file field required" }, { status: 400 });
  }
  if (images.length > 5) {
    return Response.json({ error: "max 5 images per request" }, { status: 400 });
  }

  // Build upstream multipart
  const upstream = new FormData();
  for (const img of images) {
    upstream.append("images", img, img.name || "photo.jpg");
    // Default organ guess; Pl@ntNet accepts per-image organ override
    upstream.append("organs", "leaf");
  }

  let pnRes;
  try {
    pnRes = await fetch(`${PLANTNET_URL}?api-key=${PLANTNET_KEY}&include-related-images=false`, {
      method: "POST",
      body: upstream,
    });
  } catch (e) {
    return Response.json({ error: "Pl@ntNet upstream unreachable", detail: String(e) }, { status: 502 });
  }

  if (!pnRes.ok) {
    const text = await pnRes.text();
    return Response.json({
      error: `Pl@ntNet returned ${pnRes.status}`,
      detail: text.slice(0, 500),
    }, { status: 502 });
  }

  const pnJson = await pnRes.json();
  const top = Array.isArray(pnJson.results) ? pnJson.results.slice(0, 5) : [];

  // Pl@ntNet returns species names + per-result score (0..1) + family +
  // common names. We normalise to a smaller shape and try to match the
  // scientific name against the GEOCON species table.
  const candidates = top.map((r) => {
    const sci = r?.species?.scientificNameWithoutAuthor || r?.species?.scientificName || "";
    return {
      scientific_name: sci,
      authority: r?.species?.scientificNameAuthorship || "",
      family: r?.species?.family?.scientificNameWithoutAuthor || "",
      genus:  r?.species?.genus?.scientificNameWithoutAuthor  || "",
      common_names: Array.isArray(r?.species?.commonNames) ? r.species.commonNames.slice(0, 3) : [],
      score: typeof r?.score === "number" ? r.score : null,
    };
  });

  // Optional commons join — find which candidates we already track.
  let speciesMap = {};
  try {
    const names = candidates.map((c) => c.scientific_name).filter(Boolean);
    if (names.length) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
      const { data } = await supabase
        .from("species")
        .select("id, accepted_name, iucn_status")
        .in("accepted_name", names);
      for (const row of (data || [])) {
        speciesMap[row.accepted_name] = { id: row.id, iucn: row.iucn_status };
      }
    }
  } catch {/* commons join is best-effort */}

  const enriched = candidates.map((c) => ({
    ...c,
    geocon_id:   speciesMap[c.scientific_name]?.id || null,
    geocon_iucn: speciesMap[c.scientific_name]?.iucn || null,
  }));

  return Response.json({
    query: { remaining_identifications: pnJson?.remainingIdentificationRequests ?? null },
    candidates: enriched,
  }, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
