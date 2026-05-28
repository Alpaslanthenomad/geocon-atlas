#!/usr/bin/env node
/**
 * scripts/ingest/gbif.mjs
 *
 * Phase 3 — enrich every species row with GBIF data:
 *   • external_ids.gbif         — GBIF taxon usageKey (from /species/match)
 *   • native_countries[]        — ISO-2 codes from occurrence facet (count ≥ MIN_COUNT)
 *   • country_focus             — top occurrence country, filled only if blank
 *                                 (never overwrites a manual value)
 *
 * Two GBIF endpoints per species:
 *   1. https://api.gbif.org/v1/species/match?name=...&kingdom=Plantae
 *   2. https://api.gbif.org/v1/occurrence/search?taxonKey=K&facet=country&limit=0
 *
 * Calls are run in concurrent batches (CONCURRENCY) and database updates are
 * batched into a single bulk_update_species_gbif RPC call per batch, so for
 * 47k rows the wall time is bounded by GBIF latency × batches, not species.
 *
 * Idempotent: a row that already has external_ids->>'gbif' is skipped, so
 * re-running only fills the gap for newly added species (e.g. after IUCN
 * brings in DD/NE flags or after a fresh WCVP sync).
 *
 * Usage:
 *   node scripts/ingest/gbif.mjs                       # full sweep
 *   node scripts/ingest/gbif.mjs --limit=200           # first 200 unmatched
 *   node scripts/ingest/gbif.mjs --dry-run             # report only
 *   node scripts/ingest/gbif.mjs --concurrency=8       # tune throughput
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── tunables ───────────────────────────────────────────────────────────────
const GBIF_MATCH = "https://api.gbif.org/v1/species/match";
const GBIF_OCC   = "https://api.gbif.org/v1/occurrence/search";
const CONCURRENCY_DEFAULT = 6;       // GBIF tolerates this; bump cautiously
const BATCH_SIZE = 60;               // species per Supabase round-trip
const FETCH_PAGE = 1000;             // species fetched per Supabase select
const MIN_COUNTRY_COUNT = 2;         // ignore single-occurrence countries (likely casuals)
const FETCH_TIMEOUT_MS = 30000;

// ── env ────────────────────────────────────────────────────────────────────
function loadEnv() {
  const text = readFileSync(resolve(".env.local"), "utf-8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[m[1]] = v;
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[gbif] missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── CLI ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const limit = parseInt(argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "0", 10);
const concurrency = parseInt(
  argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? `${CONCURRENCY_DEFAULT}`,
  10
);

console.log(`[gbif] dry-run:     ${dryRun}`);
console.log(`[gbif] limit:       ${limit || "all"}`);
console.log(`[gbif] concurrency: ${concurrency}`);
console.log();

// ── helpers ────────────────────────────────────────────────────────────────
async function fetchJson(url, attempt = 1) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (res.status === 429 && attempt < 4) {
      // GBIF rate limit — back off + retry
      await sleep(1000 * attempt);
      return fetchJson(url, attempt + 1);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(tid);
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function pool(items, fn, n) {
  // Lightweight concurrency pool — n workers consume from items in order.
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try { results[i] = await fn(items[i], i); }
      catch (e) { results[i] = { __error: e.message }; }
    }
  }
  await Promise.all(Array.from({ length: n }, worker));
  return results;
}

// Strip hybrid markers, infraspecific epithets, authors etc. for a clean match.
function cleanName(name) {
  if (!name) return null;
  return name
    .replace(/\s*[×x]\s+/gi, " ")          // × hybrid marker
    .replace(/\bsubsp\..*$/i, "")
    .replace(/\bvar\..*$/i, "")
    .replace(/\bf\..*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function matchSpecies(sp) {
  const name = cleanName(sp.accepted_name);
  if (!name) return null;
  const params = new URLSearchParams({
    name,
    kingdom: "Plantae",
    strict: "false",
  });
  if (sp.family) params.set("family", sp.family);
  try {
    const json = await fetchJson(`${GBIF_MATCH}?${params}`);
    if (!json.usageKey) return null;
    // Only trust EXACT / FUZZY / HIGHERRANK matches with reasonable confidence
    if (json.matchType === "NONE") return null;
    return String(json.usageKey);
  } catch {
    return null;
  }
}

async function fetchDistribution(taxonKey) {
  const url = `${GBIF_OCC}?taxonKey=${taxonKey}&facet=country&facetLimit=300&limit=0`;
  try {
    const json = await fetchJson(url);
    const countryFacet = (json.facets || []).find((f) => f.field === "COUNTRY");
    if (!countryFacet) return { countries: [], primary: null };
    const counts = (countryFacet.counts || [])
      .filter((c) => c.name && c.name !== "ZZ" && c.count >= MIN_COUNTRY_COUNT);
    const countries = counts.map((c) => c.name);
    const primary = countries[0] || null; // facet is already sorted by count desc
    return { countries, primary };
  } catch {
    return { countries: [], primary: null };
  }
}

// ── main ───────────────────────────────────────────────────────────────────
async function fetchSpeciesToProcess() {
  // Pull species that don't yet have a gbif key recorded.
  const out = [];
  let from = 0;
  while (true) {
    const q = supabase
      .from("species")
      .select("id, accepted_name, family, country_focus, external_ids")
      .order("id", { ascending: true })
      .range(from, from + FETCH_PAGE - 1);

    const { data, error } = await q;
    if (error) throw new Error(`select: ${error.message}`);
    for (const row of data) {
      const hasGbif = row.external_ids && row.external_ids.gbif;
      if (hasGbif) continue;
      out.push(row);
      if (limit && out.length >= limit) return out;
    }
    if (data.length < FETCH_PAGE) break;
    from += FETCH_PAGE;
  }
  return out;
}

async function processBatch(batch) {
  // Two parallel waves so we don't stall on slow individual requests.
  const matches = await pool(batch, matchSpecies, concurrency);
  const updates = [];
  let matched = 0;
  let noMatch = 0;

  // Build a sub-list of species with usable usageKeys, then fetch their facets
  const matchedSpecies = batch
    .map((sp, i) => ({ sp, key: matches[i] }))
    .filter(({ key }) => key);

  const dists = await pool(matchedSpecies, ({ key }) => fetchDistribution(key), concurrency);

  for (let i = 0; i < batch.length; i++) {
    const sp = batch[i];
    const key = matches[i];
    if (!key) { noMatch++; continue; }
    matched++;
    const idxInMatched = matchedSpecies.findIndex((m) => m.sp.id === sp.id);
    const dist = idxInMatched >= 0 ? dists[idxInMatched] : { countries: [], primary: null };
    updates.push({
      id: sp.id,
      gbif_key: key,
      native_countries: dist.countries,
      country_focus: dist.primary,
    });
  }

  if (!dryRun && updates.length > 0) {
    const { error } = await supabase.rpc("bulk_update_species_gbif", { p_rows: updates });
    if (error) throw new Error(`rpc: ${error.message}`);
  }

  return { matched, noMatch, withCountries: updates.filter((u) => u.native_countries.length > 0).length };
}

async function main() {
  const t0 = Date.now();
  console.log("[gbif] selecting species without gbif key…");
  const todo = await fetchSpeciesToProcess();
  console.log(`[gbif] to process: ${todo.length}`);
  if (todo.length === 0) return;

  let matched = 0;
  let noMatch = 0;
  let withCountries = 0;
  let done = 0;

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    const r = await processBatch(batch);
    matched += r.matched;
    noMatch += r.noMatch;
    withCountries += r.withCountries;
    done += batch.length;

    const pct = ((done / todo.length) * 100).toFixed(1);
    const rate = done / ((Date.now() - t0) / 1000);
    const etaSec = Math.round((todo.length - done) / rate);
    process.stdout.write(
      `\r[gbif] ${done}/${todo.length} (${pct}%) · matched ${matched} · no-match ${noMatch} · with-countries ${withCountries} · ${rate.toFixed(1)}/s · ETA ${Math.floor(etaSec/60)}m${etaSec%60}s    `
    );
  }
  process.stdout.write("\n");
  console.log(`[gbif] DONE in ${Math.round((Date.now() - t0) / 1000)}s`);
}

main().catch((err) => {
  console.error("\n[gbif] FATAL:", err.message || err);
  process.exit(1);
});
