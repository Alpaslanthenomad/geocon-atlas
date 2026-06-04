// v4.2-c — GBIF specimen ingest cron.
//
// Calls GBIF occurrence search for a small batch of target species
// (priority: threatened tiers with no specimens yet), filters to
// PRESERVED_SPECIMEN basisOfRecord (i.e. herbarium accessions), and
// upserts each into herbarium_specimens. Idempotent via the
// (institution_code, barcode) unique index.
//
// Cron runs daily; on each run it processes ~25 species so a full
// 47k catalogue spreads over ~5 years — fine for v4 because we already
// have some specimens harvested manually, and ramping is intentional
// (we don't want to overwhelm GBIF or our table).
//
// Auth: Bearer CRON_SECRET (Vercel cron) or admin JWT.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "service";
const CRON_SECRET = process.env.CRON_SECRET;

const GBIF_API = "https://api.gbif.org/v1/occurrence/search";

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : null;
  return !!(CRON_SECRET && tok === CRON_SECRET);
}

async function searchGbif(scientificName) {
  // basisOfRecord PRESERVED_SPECIMEN → herbarium accession
  const params = new URLSearchParams({
    scientificName,
    basisOfRecord: "PRESERVED_SPECIMEN",
    limit: "10",
  });
  const r = await fetch(`${GBIF_API}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!r.ok) return [];
  const j = await r.json();
  return Array.isArray(j?.results) ? j.results : [];
}

function normalize(rec) {
  return {
    institution_code: rec.institutionCode || rec.publishingOrgKey || null,
    institution_name: rec.institutionID || rec.datasetName || rec.publishingOrgKey || null,
    barcode:          rec.catalogNumber || rec.occurrenceID || null,
    collected_lat:    typeof rec.decimalLatitude === "number" ? rec.decimalLatitude : null,
    collected_lng:    typeof rec.decimalLongitude === "number" ? rec.decimalLongitude : null,
    collected_at:     rec.eventDate ? rec.eventDate.slice(0, 10) : null,
    collector:        rec.recordedBy || null,
    country:          rec.countryCode || null,
    source:           "gbif",
    source_url:       rec.gbifID ? `https://www.gbif.org/occurrence/${rec.gbifID}` : null,
  };
}

export async function GET(req) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "25", 10) || 25);

  const { data: targets, error: terr } = await admin.rpc("ingest_target_species", { p_limit: limit });
  if (terr) {
    return Response.json({ error: terr.message }, { status: 500 });
  }
  if (!Array.isArray(targets) || targets.length === 0) {
    return Response.json({ processed: 0, inserted: 0, message: "no target species" });
  }

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const sample = [];

  for (const sp of targets) {
    try {
      const occs = await searchGbif(sp.accepted_name);
      for (const occ of occs) {
        const n = normalize(occ);
        if (!n.institution_code || !n.barcode) { skipped++; continue; }
        const { error: uerr } = await admin.rpc("upsert_herbarium_specimen", {
          p_species_id:       sp.id,
          p_institution_code: n.institution_code,
          p_institution_name: n.institution_name,
          p_barcode:          n.barcode,
          p_collected_lat:    n.collected_lat,
          p_collected_lng:    n.collected_lng,
          p_collected_at:     n.collected_at,
          p_collector:        n.collector,
          p_country:          n.country,
          p_source:           n.source,
          p_source_url:       n.source_url,
        });
        if (uerr) { errors++; continue; }
        inserted++;
        if (sample.length < 3) sample.push({ species: sp.accepted_name, institution: n.institution_code, barcode: n.barcode });
      }
    } catch (e) {
      errors++;
    }
  }

  return Response.json({
    processed_species: targets.length,
    inserted,
    skipped,
    errors,
    sample,
  });
}

export const POST = GET;
