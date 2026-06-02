// Scheduled IUCN status sync — pulls a batch of unassigned species,
// asks Wikidata for their conservation status, writes back via the
// bulk_set_iucn_service RPC (service-role variant of the admin
// bulk_set_iucn).
//
// Called by Vercel Cron (vercel.json `crons` entry). Auth via:
//   Authorization: Bearer <CRON_SECRET>
// Vercel automatically attaches this header to scheduled invocations
// when CRON_SECRET is set in the project's env vars.
//
// Returns { batches_processed, total_matched, total_updated } so the
// admin/health page can show the latest run.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ANON_URL   = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "service");
const CRON_SECRET = process.env.CRON_SECRET;
const ENDPOINT    = "https://query.wikidata.org/sparql";

const LABEL_TO_TIER = {
  "least concern": "LC", "near threatened": "NT",
  "vulnerable": "VU", "vulnerable species": "VU",
  "endangered": "EN", "endangered species": "EN",
  "critically endangered": "CR",
  "data deficient": "DD", "not evaluated": "NE",
  "extinct in the wild": "EW", "extinct": "EX",
};

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const fromHeader = h.startsWith("Bearer ") ? h.slice(7) : null;
  const fromQuery  = new URL(req.url).searchParams.get("secret");
  return !!CRON_SECRET && (fromHeader === CRON_SECRET || fromQuery === CRON_SECRET);
}

async function runBatch(admin, batchSize, offset) {
  const { data: batch, error: batchErr } = await admin.rpc("iucn_sync_next_batch", {
    p_limit: batchSize, p_offset: offset,
  });
  if (batchErr) throw new Error(`iucn_sync_next_batch: ${batchErr.message}`);
  if (!Array.isArray(batch) || batch.length === 0) return { done: true, matched: 0, updated: 0 };

  const valuesList = batch
    .map((r) => `"${String(r.accepted_name).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
    .join(" ");
  const sparql = `
    SELECT ?name ?statusLabel WHERE {
      VALUES ?name { ${valuesList} }
      ?taxon wdt:P225 ?name ; wdt:P141 ?status .
      ?status rdfs:label ?statusLabel .
      FILTER(LANG(?statusLabel) = "en")
    }
  `;

  // One retry on Wikidata 5xx.
  let queryRes;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`${ENDPOINT}?query=${encodeURIComponent(sparql)}`, {
        headers: {
          Accept: "application/sparql-results+json",
          "User-Agent": "GEOCON Atlas cron IUCN sync (mailto:alpaslansevket@gmail.com)",
        },
      });
      if (!r.ok) throw new Error(`Wikidata SPARQL ${r.status}`);
      queryRes = await r.json();
      break;
    } catch (e) {
      if (attempt === 1) throw e;
      await new Promise((res) => setTimeout(res, 1200));
    }
  }

  const nameToTier = new Map();
  for (const b of (queryRes?.results?.bindings || [])) {
    const name = b?.name?.value;
    const label = b?.statusLabel?.value?.toLowerCase()?.trim();
    const tier = label && LABEL_TO_TIER[label];
    if (name && tier && !nameToTier.has(name)) nameToTier.set(name, tier);
  }

  const updates = batch
    .map((row) => {
      const tier = nameToTier.get(row.accepted_name);
      return tier ? { id: row.id, iucn_status: tier } : null;
    })
    .filter(Boolean);

  if (updates.length === 0) return { done: false, matched: 0, updated: 0 };

  const { data: setRes, error: setErr } = await admin.rpc("bulk_set_iucn_service", {
    p_updates: updates,
  });
  if (setErr) throw new Error(`bulk_set_iucn_service: ${setErr.message}`);

  return {
    done: false,
    matched: updates.length,
    updated: setRes?.updated || 0,
  };
}

export async function GET(req) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!ANON_URL || !SERVICE_KEY) {
    return Response.json({ error: "supabase env missing" }, { status: 503 });
  }

  // Run up to 4 sequential 100-row batches per invocation (~400 species
  // / day at the default daily schedule). Stops early if Wikidata
  // returns done. Cron budget is generous on Vercel hobby (~10s) so we
  // keep the inner Wikidata sleep modest.
  const url = new URL(req.url);
  const batchSize  = Math.min(200, Math.max(20, Number(url.searchParams.get("batch_size")) || 100));
  const maxBatches = Math.min(8,   Math.max(1,  Number(url.searchParams.get("max_batches")) || 4));

  const admin = createClient(ANON_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  let totalMatched = 0;
  let totalUpdated = 0;
  let batchesProcessed = 0;
  let lastError = null;

  for (let i = 0; i < maxBatches; i++) {
    try {
      // `iucn_sync_next_batch` always pulls from the top of the unset
      // queue ordered by composite_score; once we update them they fall
      // out of the queue, so subsequent calls naturally page forward.
      const r = await runBatch(admin, batchSize, 0);
      batchesProcessed++;
      totalMatched += r.matched;
      totalUpdated += r.updated;
      if (r.done) break;
    } catch (e) {
      lastError = String(e?.message || e);
      break;
    }
  }

  return Response.json({
    ok: !lastError,
    batches_processed: batchesProcessed,
    total_matched: totalMatched,
    total_updated: totalUpdated,
    error: lastError,
    timestamp: new Date().toISOString(),
  });
}

// POST mirrors GET so the cron config can use either verb.
export const POST = GET;
