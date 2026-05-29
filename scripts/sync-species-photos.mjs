#!/usr/bin/env node
// scripts/sync-species-photos.mjs
//
// Background photo backfill for the species table.
// Strategy (tiered, first hit wins):
//   1. iNaturalist taxon autocomplete  → default_photo (best — wild photo)
//   2. GBIF occurrence search          → first StillImage (occurrences pool iNat
//                                         + other publishers)
//   3. Wikipedia REST API              → page summary thumbnail
//   4. iNaturalist genus level         → at least the genus has a photo
//   5. Wikipedia genus level           → ditto
//
// Selection: species rows where thumbnail_url is NULL or points to the Kew
// CloudFront herbarium CDN (d2seqvvyy3b8p2.cloudfront.net). Already-good
// photos (iNat, Wikimedia, GBIF, Google storage) are skipped.
//
// Writes via the bulk_update_species_photos RPC in batches of 30.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY required.

import { createClient } from "@supabase/supabase-js";
import { setTimeout as sleep } from "node:timers/promises";
import fs from "node:fs";
import path from "node:path";

// .env.local'i manuel yükle (Node script'i Next.js bypass eder)
const ENV_PATH = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=("?)(.*?)\2\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[3];
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BATCH = 30;                // species per fetch loop
const INAT_DELAY_MS = 600;       // ~100 req/min to stay polite
const GBIF_DELAY_MS = 200;       // GBIF is more permissive
const MAX_BATCHES = parseInt(process.env.MAX_BATCHES || "2000", 10);
const RUN_TAG = new Date().toISOString().slice(0, 19).replace("T", " ");

let totalProcessed = 0;
let totalUpdated   = 0;
let totalSkipped   = 0;
const sourceCounts = { inaturalist: 0, gbif: 0, wikipedia: 0, inaturalist_genus: 0, wikipedia_genus: 0, none: 0 };

async function fetchJson(url, opts = {}) {
  try {
    const r = await fetch(url, { ...opts, headers: { "User-Agent": "GEOCON-Atlas/1.0 atlas@geocon.bio", ...(opts.headers || {}) } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function tryInat(name) {
  const data = await fetchJson(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(name)}&rank=species&per_page=3`);
  const hit = data?.results?.find((t) => t?.default_photo?.medium_url
                                          && (t.name?.toLowerCase() === name.toLowerCase() || t.matched_term?.toLowerCase() === name.toLowerCase()));
  if (hit) {
    return {
      thumbnail_url: hit.default_photo.medium_url,
      photo_url:     hit.default_photo.medium_url.replace("medium", "large"),
      photo_credit:  `© ${hit.default_photo.attribution || "iNaturalist"}`,
      photo_source:  "iNaturalist",
    };
  }
  return null;
}

async function tryGbif(taxonKey) {
  if (!taxonKey) return null;
  const data = await fetchJson(`https://api.gbif.org/v1/occurrence/search?taxonKey=${encodeURIComponent(taxonKey)}&mediaType=StillImage&limit=5`);
  for (const r of (data?.results || [])) {
    for (const m of (r?.media || [])) {
      const url = m.identifier || m.url;
      if (url && /^https?:\/\//.test(url)) {
        return {
          thumbnail_url: url,
          photo_url:     url,
          photo_credit:  `© ${m.rightsHolder || m.creator || "GBIF contributor"}`,
          photo_source:  "GBIF",
        };
      }
    }
  }
  return null;
}

async function tryWiki(name) {
  const data = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/\s+/g, "_"))}`);
  if (data?.thumbnail?.source) {
    return {
      thumbnail_url: data.thumbnail.source,
      photo_url:     data.originalimage?.source || data.thumbnail.source,
      photo_credit:  "© Wikimedia Commons",
      photo_source:  "Wikipedia",
    };
  }
  return null;
}

async function tryInatGenus(genus) {
  const data = await fetchJson(`https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(genus)}&rank=genus&per_page=1`);
  const hit = data?.results?.[0];
  if (hit?.default_photo?.medium_url) {
    return {
      thumbnail_url: hit.default_photo.medium_url,
      photo_url:     hit.default_photo.medium_url.replace("medium", "large"),
      photo_credit:  `© ${hit.default_photo.attribution || "iNaturalist"} (genus)`,
      photo_source:  "iNaturalist_genus",
    };
  }
  return null;
}

async function tryWikiGenus(genus) {
  const data = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(genus)}`);
  if (data?.thumbnail?.source) {
    return {
      thumbnail_url: data.thumbnail.source,
      photo_url:     data.originalimage?.source || data.thumbnail.source,
      photo_credit:  "© Wikimedia Commons (genus)",
      photo_source:  "Wikipedia_genus",
    };
  }
  return null;
}

async function resolvePhoto(name, gbifKey) {
  let out = await tryInat(name); if (out) return out;
  await sleep(GBIF_DELAY_MS);
  out = await tryGbif(gbifKey); if (out) return out;
  out = await tryWiki(name); if (out) return out;
  const genus = (name || "").split(" ")[0];
  if (genus) {
    out = await tryInatGenus(genus); if (out) return out;
    out = await tryWikiGenus(genus); if (out) return out;
  }
  return null;
}

async function fetchNextBatch() {
  // OR is messy in supabase-js, run a raw RPC-style query for "needs photo":
  //   thumbnail_url IS NULL OR thumbnail_url ILIKE '%cloudfront%' OR photo_source IS NULL AND thumbnail_url ILIKE '%kew%'
  // For simplicity use two consecutive .or() conditions.
  const { data, error } = await sb
    .from("species")
    .select("id, accepted_name, external_ids, thumbnail_url, photo_source")
    .or("thumbnail_url.is.null,thumbnail_url.ilike.%cloudfront%,thumbnail_url.ilike.%kew.org%")
    .is("photo_source", null)
    .order("id")
    .limit(BATCH);
  if (error) {
    console.error("fetch error:", error.message);
    return [];
  }
  return data || [];
}

async function flush(rows) {
  if (rows.length === 0) return 0;
  const { data, error } = await sb.rpc("bulk_update_species_photos", { p_rows: rows });
  if (error) {
    console.error("bulk update error:", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}

function logTick(batchN, batchSize, found, started) {
  const elapsedSec = Math.round((Date.now() - started) / 1000);
  const eta = totalUpdated > 0
    ? `${Math.round((elapsedSec / Math.max(totalUpdated, 1)) * 46000 / 60)} min remaining @ current rate`
    : "—";
  console.log(`[${RUN_TAG}] batch=${batchN.toString().padStart(4)} size=${batchSize} hits=${found} ` +
              `| run total: updated=${totalUpdated} processed=${totalProcessed} skipped=${totalSkipped} | ${eta}`);
  console.log("   sources so far:", Object.entries(sourceCounts).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(" "));
}

async function main() {
  const started = Date.now();
  console.log(`[${RUN_TAG}] Photo sync starting. SUPABASE_URL=${SUPABASE_URL}`);

  for (let b = 0; b < MAX_BATCHES; b++) {
    const batch = await fetchNextBatch();
    if (batch.length === 0) {
      console.log(`[${RUN_TAG}] No more species without photo_source. Done.`);
      break;
    }
    const pendingUpdates = [];
    let batchHits = 0;

    for (const sp of batch) {
      try {
        const gbifKey = sp.external_ids?.gbif ?? sp.external_ids?.gbif_taxon_key ?? null;
        const photo = await resolvePhoto(sp.accepted_name, gbifKey);
        totalProcessed++;
        if (photo) {
          pendingUpdates.push({ id: sp.id, ...photo });
          sourceCounts[photo.photo_source.toLowerCase().replace("_genus", "_genus")] =
            (sourceCounts[photo.photo_source.toLowerCase()] || 0) + 1;
          batchHits++;
        } else {
          // Mark as 'none' so we don't retry forever
          pendingUpdates.push({ id: sp.id, photo_source: "none" });
          sourceCounts.none++;
        }
        await sleep(INAT_DELAY_MS);
      } catch (e) {
        console.warn(`error on ${sp.accepted_name}:`, e.message);
        totalSkipped++;
      }
    }

    const n = await flush(pendingUpdates);
    totalUpdated += batchHits;
    logTick(b, batch.length, batchHits, started);
  }

  console.log(`[${RUN_TAG}] FINISHED. processed=${totalProcessed} updated=${totalUpdated} skipped=${totalSkipped}`);
  console.log("Source breakdown:", sourceCounts);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
