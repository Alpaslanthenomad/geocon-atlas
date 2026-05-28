#!/usr/bin/env node
/**
 * scripts/ingest/wcvp.mjs
 *
 * Phase 2a — bulk-ingest the world's accepted geophyte species from POWO
 * (Kew Plants of the World Online, which serves WCVP data).
 *
 * What this script does on each run:
 *   1. Fetches every accepted species in the target geophyte families
 *      from POWO's search API, paginating with the cursor it returns.
 *   2. Caches the set of accepted_name values already in the DB so the
 *      existing manually-curated rows are never touched.
 *   3. Inserts only the species whose accepted name is new to the DB,
 *      tagged with source='wcvp' and external_ids = { wcvp, ipni }.
 *
 * Existing manual rows are left intact — Phase 2b will cross-link them
 * to their wcvp/ipni IDs by name matching, without overwriting curation.
 *
 * Usage:
 *   node scripts/ingest/wcvp.mjs                       # all families
 *   node scripts/ingest/wcvp.mjs --family=Iridaceae    # one family
 *   node scripts/ingest/wcvp.mjs --dry-run             # report only, no writes
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Geophyte families. Hyacinthaceae and Themidaceae are intentionally absent —
// APG IV folds both into Asparagaceae, and POWO follows APG.
const TARGET_FAMILIES = [
  "Amaryllidaceae",
  "Araceae",
  "Asparagaceae",
  "Alstroemeriaceae",
  "Colchicaceae",
  "Iridaceae",
  "Liliaceae",
  "Orchidaceae",
  "Tecophilaeaceae",
];

const POWO_SEARCH = "https://powo.science.kew.org/api/2/search";
const PER_PAGE = 500;
const PAGE_DELAY_MS = 250; // be courteous to a free service

// ── env loader ─────────────────────────────────────────────────────────────
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
// Writes go through a SECURITY DEFINER RPC (bulk_insert_wcvp_species), so the
// anon key is sufficient — no service-role secret needed in scripts.
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[wcvp] missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── CLI args ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const familyArg = argv.find((a) => a.startsWith("--family="));
const targetFamilies = familyArg ? [familyArg.split("=")[1]] : TARGET_FAMILIES;
const dryRun = argv.includes("--dry-run");

console.log(`[wcvp] families: ${targetFamilies.join(", ")}`);
console.log(`[wcvp] dry-run:  ${dryRun}`);
console.log();

// ── POWO fetching ──────────────────────────────────────────────────────────
async function fetchFamily(family) {
  const all = [];
  let cursor = null;
  let pageCount = 0;

  while (true) {
    const params = new URLSearchParams({
      q: `family:${family}`,
      f: "accepted_names,species_f",
      perPage: String(PER_PAGE),
    });
    if (cursor) params.set("cursor", cursor);

    const url = `${POWO_SEARCH}?${params.toString()}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`POWO returned ${res.status} for ${family} (page ${pageCount + 1})`);
    }
    const json = await res.json();
    const results = json.results || [];
    all.push(...results);
    pageCount++;

    if (!json.cursor || results.length === 0) break;
    if (json.cursor === cursor) break; // safety against API bug
    cursor = json.cursor;

    await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
  }

  console.log(`[wcvp] ${family.padEnd(16)} ${all.length.toString().padStart(5)} species  (${pageCount} pages)`);
  return all;
}

// ── row shaping ────────────────────────────────────────────────────────────
function ipniFromFqId(fqId) {
  if (!fqId) return null;
  const m = fqId.match(/names:([^:]+)$/);
  return m ? m[1] : null;
}

function normaliseThumb(raw) {
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  return `https://${raw}`;
}

function buildRow(record) {
  const name = (record.name || "").trim();
  if (!name) return null;
  const ipni = ipniFromFqId(record.fqId);
  if (!ipni) return null;

  return {
    accepted_name: name,
    family: record.family || null,
    accepted_name_authority: record.author || null,
    thumbnail_url: normaliseThumb(record.images?.[0]?.thumbnail),
    source: "wcvp",
    external_ids: { wcvp: ipni, ipni },
    last_synced_at: new Date().toISOString(),
  };
}

// ── main pipeline ──────────────────────────────────────────────────────────
async function fetchExistingNames() {
  const names = new Set();
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("species")
      .select("accepted_name")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`DB read: ${error.message}`);
    for (const row of data) {
      if (row.accepted_name) names.add(row.accepted_name.trim().toLowerCase());
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return names;
}

async function batchInsert(rows) {
  // Route through SECURITY DEFINER RPC so we don't need the service-role key
  // and so RLS on species stays intact for everything else.
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { data, error } = await supabase.rpc("bulk_insert_wcvp_species", {
      p_rows: batch,
    });
    if (error) {
      throw new Error(`insert batch ${i / BATCH}: ${error.message}`);
    }
    inserted += data ?? 0;
    process.stdout.write(`\r[wcvp] inserted ${inserted}/${rows.length}    `);
  }
  process.stdout.write("\n");
  return inserted;
}

async function main() {
  console.log("[wcvp] fetching existing accepted names from DB…");
  const existing = await fetchExistingNames();
  console.log(`[wcvp] ${existing.size} existing names cached`);
  console.log();

  console.log("[wcvp] querying POWO per family…");
  const allRecords = [];
  for (const family of targetFamilies) {
    const records = await fetchFamily(family);
    allRecords.push(...records);
  }
  console.log(`[wcvp] total fetched from POWO: ${allRecords.length}`);
  console.log();

  console.log("[wcvp] shaping rows + deduping…");
  const seenIpni = new Set();
  const toInsert = [];
  let dropNoIpni = 0;
  let dropDupRun = 0;
  let dropExisting = 0;

  for (const r of allRecords) {
    const row = buildRow(r);
    if (!row) { dropNoIpni++; continue; }
    if (seenIpni.has(row.external_ids.wcvp)) { dropDupRun++; continue; }
    seenIpni.add(row.external_ids.wcvp);
    if (existing.has(row.accepted_name.toLowerCase())) { dropExisting++; continue; }
    toInsert.push(row);
  }

  console.log(`[wcvp] new to insert: ${toInsert.length}`);
  console.log(`[wcvp] skipped (already in DB):       ${dropExisting}`);
  console.log(`[wcvp] skipped (duplicate IPNI):       ${dropDupRun}`);
  console.log(`[wcvp] skipped (no IPNI id):           ${dropNoIpni}`);
  console.log();

  if (dryRun) {
    console.log("[wcvp] dry-run — no writes performed");
    if (toInsert.length > 0) {
      console.log("[wcvp] sample row:");
      console.log(JSON.stringify(toInsert[0], null, 2));
    }
    return;
  }

  if (toInsert.length === 0) {
    console.log("[wcvp] nothing to insert, done");
    return;
  }

  console.log(`[wcvp] inserting ${toInsert.length} rows…`);
  const inserted = await batchInsert(toInsert);
  console.log(`[wcvp] DONE — ${inserted} new species ingested`);
}

main().catch((err) => {
  console.error("\n[wcvp] FATAL:", err.message || err);
  process.exit(1);
});
