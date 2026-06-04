// v4.3-a — Wikidata IUCN historical harvest.
//
// Wikidata stores P141 (IUCN conservation status) statements; many of
// them carry a P585 (point-in-time) qualifier indicating which Red List
// edition / assessment year the statement is for. We harvest these per
// species and write to species_iucn_history.
//
// SPARQL pattern: ?taxon wdt:P225 "<accepted_name>" ; p:P141 ?stmt .
//                  ?stmt ps:P141 ?status ; pq:P585 ?when .
//
// Auth: Bearer CRON_SECRET. Monthly cadence (full pass ≈ 5–10
// minutes for 30 species). The cron processes a small batch each run
// to spread Wikidata load gently.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || "service";
const CRON_SECRET  = process.env.CRON_SECRET;

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

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
  const tok = h.startsWith("Bearer ") ? h.slice(7) : null;
  return !!(CRON_SECRET && tok === CRON_SECRET);
}

async function queryWikidata(scientificName) {
  // Look up taxon by scientific name, return all P141 statements with
  // their P585 qualifier (point in time).
  const sparql = `
    SELECT ?taxon ?statusLabel ?when WHERE {
      ?taxon wdt:P225 "${scientificName.replace(/"/g, "")}" .
      ?taxon p:P141 ?stmt .
      ?stmt ps:P141 ?status .
      OPTIONAL { ?stmt pq:P585 ?when . }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 30
  `.trim();
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(sparql)}&format=json`;
  const r = await fetch(url, {
    headers: { Accept: "application/sparql-results+json", "User-Agent": "GEOCON-Atlas/1.0" },
  });
  if (!r.ok) return [];
  const j = await r.json();
  return Array.isArray(j?.results?.bindings) ? j.results.bindings : [];
}

function extractYear(bindWhen) {
  if (!bindWhen?.value) return null;
  const m = /^(\d{4})/.exec(bindWhen.value);
  return m ? parseInt(m[1], 10) : null;
}

function labelToTier(label) {
  return LABEL_TO_TIER[(label || "").toLowerCase().trim()] || null;
}

export async function GET(req) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const limit = Math.min(60, parseInt(url.searchParams.get("limit") || "20", 10) || 20);

  const { data: targets, error } = await admin.rpc("species_without_iucn_history", { p_limit: limit });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!Array.isArray(targets) || targets.length === 0) {
    return Response.json({ processed: 0, message: "no targets" });
  }

  let totalRows = 0, processed = 0, failed = 0;
  for (const sp of targets) {
    try {
      const bindings = await queryWikidata(sp.accepted_name);
      for (const b of bindings) {
        const year = extractYear(b.when);
        const status = labelToTier(b.statusLabel?.value);
        if (!year || !status) continue;
        const ref = b.taxon?.value || null;
        const { error: uerr } = await admin.rpc("upsert_iucn_history", {
          p_species_id: sp.id,
          p_year:       year,
          p_status:     status,
          p_source:     "wikidata",
          p_source_ref: ref,
        });
        if (!uerr) totalRows++;
      }
      processed++;
      // Pace
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      failed++;
    }
  }
  return Response.json({ processed, totalRows, failed });
}

export const POST = GET;
