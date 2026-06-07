// DI-6 — POWO/Kew native distribution harvest (authoritative).
//
// For each species lacking native distribution:
//   1. POWO search (name → fqId)
//   2. POWO taxon distribution (fields=distribution)
//   3. store every native region (name + WGSRPD tdwg code) via
//      add_native_region (source=powo)
//
// Stores authoritative TDWG botanical regions exactly as Kew asserts —
// NO ISO mapping (that's a later gated step, see STAGE-GATES.md). A
// proof batch over 52 high-value geophytes yielded native regions for
// 44 (85%) with correct data, vs GBIF distributions which were sparse +
// noisy. POWO is the right authority.
//
// Long-running: a batch per call. Run repeatedly (admin / pg_cron) to
// cover the corpus. Auth: Bearer CRON_SECRET.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || "service";
const CRON_SECRET  = process.env.CRON_SECRET;
const UA = { "User-Agent": "GEOCON-Atlas/1.0 (conservation)", Accept: "application/json" };

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : null;
  return !!(CRON_SECRET && tok === CRON_SECRET);
}

async function powoSearch(name) {
  const r = await fetch(`https://powo.science.kew.org/api/2/search?q=${encodeURIComponent(name)}`, { headers: UA });
  if (!r.ok) return null;
  const j = await r.json();
  return (j?.results || [])[0]?.fqId || null;
}
async function powoNatives(fqId) {
  const r = await fetch(`https://powo.science.kew.org/api/2/taxon/${fqId}?fields=distribution`, { headers: UA });
  if (!r.ok) return [];
  const j = await r.json();
  return (j?.distribution?.natives || []).map((x) => ({
    name: x.name, code: x.tdwgCode || x.featureId || null,
  })).filter((x) => x.name);
}

export async function GET(req) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "30", 10) || 30);

  const { data: targets, error } = await admin.rpc("species_needing_distribution", { p_limit: limit });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!Array.isArray(targets) || targets.length === 0) {
    return Response.json({ processed: 0, message: "none need distribution" });
  }

  let filled = 0, empty = 0, regions = 0, failed = 0;
  for (const sp of targets) {
    try {
      const fqId = await powoSearch(sp.accepted_name);
      if (!fqId) { empty++; continue; }
      const natives = await powoNatives(fqId);
      if (natives.length === 0) { empty++; continue; }
      for (const reg of natives) {
        await admin.rpc("add_native_region", {
          p_species_id: sp.id, p_region_name: reg.name, p_tdwg_code: reg.code, p_source_ref: fqId,
        });
        regions++;
      }
      filled++;
      await new Promise((r) => setTimeout(r, 140));
    } catch { failed++; }
  }
  // refresh completeness for the batch
  await admin.rpc("recompute_all_completeness");
  return Response.json({ processed: targets.length, filled, empty, regions, failed });
}

export const POST = GET;
