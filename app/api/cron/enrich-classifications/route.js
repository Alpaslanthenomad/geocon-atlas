// Scheduled data-enrichment sweep — runs in two phases per invocation:
//   1. publications.category backfill (primary_topic → s2 fields → title)
//   2. metabolites.compound_class backfill (regex on compound_name, plus
//      "Flavanoid" → "Flavonoid" typo normalization)
//
// Both phases are SECURITY DEFINER RPCs that chunk by p_limit. The cron
// runs N batches of each per invocation so it makes steady progress
// without holding a request open too long.
//
// Auth: Authorization: Bearer <CRON_SECRET> (Vercel auto-attaches when
// scheduled), or ?secret=<CRON_SECRET> for manual testing.
//
// Both RPCs are idempotent: pubs only fill NULL, metabolites only act on
// weak labels (NULL/Unidentified/Other secondary metabolite). Once a row
// has a real label this skips it on subsequent runs.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ANON_URL    = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "service");
const CRON_SECRET = process.env.CRON_SECRET;

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const fromHeader = h.startsWith("Bearer ") ? h.slice(7) : null;
  const fromQuery  = new URL(req.url).searchParams.get("secret");
  return !!CRON_SECRET && (fromHeader === CRON_SECRET || fromQuery === CRON_SECRET);
}

async function runPhase(admin, rpcName, batchSize, maxBatches) {
  const phase = { batches: 0, processed: 0, classified: 0, normalized: 0, set_topic: 0, set_s2: 0, set_title: 0, set_other: 0, error: null };
  for (let i = 0; i < maxBatches; i++) {
    const { data, error } = await admin.rpc(rpcName, { p_limit: batchSize });
    if (error) { phase.error = error.message; break; }
    if (!data || typeof data !== "object") break;
    phase.batches++;
    // accumulate every numeric counter the RPC returns
    for (const k of Object.keys(data)) {
      if (typeof data[k] === "number" && k in phase) phase[k] += data[k];
      else if (typeof data[k] === "number") phase[k] = (phase[k] || 0) + data[k];
    }
    // Stop early if the RPC processed less than a full batch — nothing
    // left to do.
    if ((data.processed || 0) < batchSize) break;
  }
  return phase;
}

export async function GET(req) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!ANON_URL || !SERVICE_KEY) {
    return Response.json({ error: "supabase env missing" }, { status: 503 });
  }

  const url = new URL(req.url);
  const batchSize  = Math.min(500, Math.max(50, Number(url.searchParams.get("batch_size")) || 200));
  const maxBatches = Math.min(8,   Math.max(1,  Number(url.searchParams.get("max_batches")) || 4));

  const admin = createClient(ANON_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const publications = await runPhase(admin, "enrich_publications_categorize_batch", batchSize, maxBatches);
  const metabolites  = await runPhase(admin, "enrich_metabolites_classify_batch",   batchSize, maxBatches);

  return Response.json({
    ok: !publications.error && !metabolites.error,
    publications,
    metabolites,
    timestamp: new Date().toISOString(),
  });
}

export const POST = GET;
