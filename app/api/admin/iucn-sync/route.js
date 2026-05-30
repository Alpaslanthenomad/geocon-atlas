import { createClient } from "@supabase/supabase-js";

// IUCN status sync via Wikidata SPARQL.
// POST body: { batch_size?: int (max 200), offset?: int }
// Returns counters so an admin UI can drive successive batches.
//
// Strategy: read N species that still lack an IUCN status, build a
// VALUES clause with their accepted_name, ask Wikidata which ones have
// an IUCN conservation status (P141) and what tier, then bulk-update
// via the bulk_set_iucn RPC.

const ANON_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ENDPOINT = "https://query.wikidata.org/sparql";

// Wikidata QIDs for IUCN tiers. (P141 points to one of these.)
const QID_TO_TIER = {
  Q211005: "LC",   // Least Concern
  Q278113: "NT",   // Near Threatened
  Q278114: "VU",   // Vulnerable (older)
  Q278115: "EN",   // Endangered (older)
  Q11394:  "EN",   // Endangered
  Q239509: "VU",   // Vulnerable
  Q219127: "CR",   // Critically Endangered
  Q237350: "EX",   // Extinct
  Q331213: "EW",   // Extinct in the Wild
  Q237943: "DD",   // Data Deficient
  Q3245245: "NE",  // Not Evaluated
  Q1438986: "NE",  // Not Evaluated (alt)
};

export async function POST(req) {
  let payload = {};
  try { payload = await req.json(); } catch {}

  const batchSize = Math.min(200, Math.max(10, Number(payload.batch_size) || 100));
  const offset    = Math.max(0, Number(payload.offset) || 0);

  // We need the admin's auth so the RPC's `auth.uid()` check works.
  // The route is gated by RLS on bulk_set_iucn — only admins succeed.
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Response.json({ error: "missing bearer token" }, { status: 401 });
  }

  // Service client (server) for reading the batch list — bypasses RLS
  // so we can see every species row, but the write goes through the
  // admin's session via bulk_set_iucn.
  const admin = createClient(ANON_URL, SERVICE_KEY || ANON_KEY);

  const { data: batch, error: batchErr } = await admin.rpc("iucn_sync_next_batch", {
    p_limit: batchSize, p_offset: offset,
  });
  if (batchErr) return Response.json({ error: batchErr.message }, { status: 500 });
  if (!Array.isArray(batch) || batch.length === 0) {
    return Response.json({ done: true, processed: 0, matched: 0, updated: 0, skipped: 0 });
  }

  // Build SPARQL VALUES from accepted_name. Single quotes inside names
  // are escaped per SPARQL rules.
  const valuesList = batch
    .map((r) => `"${String(r.accepted_name).replace(/"/g, '\\"')}"@en`)
    .join(" ");

  const sparql = `
    SELECT ?name ?status WHERE {
      VALUES ?name { ${valuesList} }
      ?taxon wdt:P225 ?name ;
             wdt:P141 ?status .
    }
  `;

  let queryRes;
  try {
    const r = await fetch(`${ENDPOINT}?query=${encodeURIComponent(sparql)}`, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "GEOCON Atlas IUCN sync (mailto:alpaslansevket@gmail.com)",
      },
    });
    if (!r.ok) throw new Error(`Wikidata SPARQL ${r.status}`);
    queryRes = await r.json();
  } catch (e) {
    return Response.json({ error: `Wikidata: ${e.message}` }, { status: 502 });
  }

  // Index Wikidata results by accepted_name → tier
  const nameToTier = new Map();
  for (const b of (queryRes?.results?.bindings || [])) {
    const name = b?.name?.value;
    const statusUri = b?.status?.value;          // e.g. http://www.wikidata.org/entity/Q239509
    const qid = statusUri?.split("/").pop();
    const tier = QID_TO_TIER[qid];
    if (name && tier) {
      // First win wins — Wikidata sometimes lists multiple historical statuses.
      if (!nameToTier.has(name)) nameToTier.set(name, tier);
    }
  }

  // Build the bulk_set_iucn payload
  const updates = [];
  for (const row of batch) {
    const tier = nameToTier.get(row.accepted_name);
    if (tier) updates.push({ id: row.id, iucn_status: tier });
  }

  if (updates.length === 0) {
    return Response.json({
      done: false,
      processed: batch.length,
      matched: 0,
      updated: 0,
      skipped: 0,
      next_offset: offset + batch.length,
    });
  }

  // Admin client tied to the caller's session (so SECURITY DEFINER's
  // auth.uid() check passes).
  const caller = createClient(ANON_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: setRes, error: setErr } = await caller.rpc("bulk_set_iucn", {
    p_updates: updates,
  });
  if (setErr) return Response.json({ error: setErr.message }, { status: 500 });

  return Response.json({
    done: false,
    processed: batch.length,
    matched: updates.length,
    updated: setRes?.updated || 0,
    skipped: setRes?.skipped || 0,
    next_offset: offset + batch.length,
  });
}
