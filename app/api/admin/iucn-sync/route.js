import { createClient } from "@supabase/supabase-js";

// IUCN status sync via Wikidata SPARQL.
// POST body: { batch_size?: int (max 200), offset?: int }
// Returns counters so an admin UI can drive successive batches.
//
// Strategy: read N species that still lack an IUCN status, build a
// VALUES clause with their accepted_name, ask Wikidata which ones have
// an IUCN conservation status (P141) and what tier, then bulk-update
// via the bulk_set_iucn RPC.

const ANON_URL  = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid");
const ANON_KEY  = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "service");

const ENDPOINT = "https://query.wikidata.org/sparql";

// Label-based mapping — more stable than QID matching because Wikidata
// sometimes uses several QIDs for the same conservation status. We
// normalize the English rdfs:label of the status entity.
const LABEL_TO_TIER = {
  "least concern":            "LC",
  "near threatened":          "NT",
  "vulnerable":               "VU",
  "vulnerable species":       "VU",
  "endangered":               "EN",
  "endangered species":       "EN",
  "critically endangered":    "CR",
  "data deficient":           "DD",
  "not evaluated":            "NE",
  "extinct in the wild":      "EW",
  "extinct":                  "EX",
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

  // Build SPARQL VALUES from accepted_name. P225 (taxon name) values
  // are plain literals — NO language tag, no datatype. Quotes inside
  // names are escaped per SPARQL string rules.
  const valuesList = batch
    .map((r) => `"${String(r.accepted_name).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
    .join(" ");

  // Ask Wikidata for each binomial that has BOTH a taxon-name match (P225)
  // AND an IUCN conservation status (P141). We pull the English rdfs:label
  // of the status entity so we can map "Critically Endangered" → "CR" etc.
  const sparql = `
    SELECT ?name ?statusLabel WHERE {
      VALUES ?name { ${valuesList} }
      ?taxon wdt:P225 ?name ;
             wdt:P141 ?status .
      ?status rdfs:label ?statusLabel .
      FILTER(LANG(?statusLabel) = "en")
    }
  `;

  // Wikidata SPARQL occasionally returns 502/503 under load. One retry
  // with a short backoff is usually enough.
  let queryRes;
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`${ENDPOINT}?query=${encodeURIComponent(sparql)}`, {
        headers: {
          Accept: "application/sparql-results+json",
          "User-Agent": "GEOCON Atlas IUCN sync (mailto:alpaslansevket@gmail.com)",
        },
      });
      if (!r.ok) throw new Error(`Wikidata SPARQL ${r.status}`);
      queryRes = await r.json();
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      if (attempt === 0) await new Promise((res) => setTimeout(res, 800));
    }
  }
  if (lastErr) {
    return Response.json({ error: `Wikidata: ${lastErr.message}` }, { status: 502 });
  }

  // Index Wikidata results by accepted_name → tier (via English status label).
  const nameToTier = new Map();
  for (const b of (queryRes?.results?.bindings || [])) {
    const name = b?.name?.value;
    const label = b?.statusLabel?.value?.toLowerCase()?.trim();
    const tier = label && LABEL_TO_TIER[label];
    if (name && tier) {
      // Some species carry multiple historical status entries on Wikidata.
      // First match wins — they're typically listed newest-first by P141.
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
