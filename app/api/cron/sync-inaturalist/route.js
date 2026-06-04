// v4.2-d — iNaturalist read-only sync.
//
// Pulls Research-Grade observations from iNaturalist's public API for
// a small batch of species (same priority logic as ingest-specimens:
// threatened tiers first, then long-tail). Upserts into the
// inat_observations table, idempotent on inat_id.
//
// No OAuth needed for read-only public observations. v4.3 will add
// bi-directional push (post our field_observations back to iNat).
//
// Auth: Bearer CRON_SECRET.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || "service";
const CRON_SECRET  = process.env.CRON_SECRET;

const INAT_API = "https://api.inaturalist.org/v1/observations";

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : null;
  return !!(CRON_SECRET && tok === CRON_SECRET);
}

async function searchInat(name) {
  const params = new URLSearchParams({
    taxon_name: name,
    quality_grade: "research",
    per_page: "10",
    order_by: "observed_on",
    order: "desc",
  });
  const r = await fetch(`${INAT_API}?${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": "GEOCON-Atlas/1.0" },
  });
  if (!r.ok) return [];
  const j = await r.json();
  return Array.isArray(j?.results) ? j.results : [];
}

function normalize(obs) {
  const photo = obs.photos?.[0]?.url?.replace(/square/, "medium") || null;
  const coord = obs.geojson?.coordinates || null; // [lng, lat]
  return {
    inat_id:      typeof obs.id === "number" ? obs.id : null,
    taxon_name:   obs.taxon?.name || null,
    observer:     obs.user?.login || obs.user?.name || null,
    observed_at:  obs.observed_on || null,
    lat:          Array.isArray(coord) ? coord[1] : (typeof obs.latitude === "number" ? obs.latitude : null),
    lng:          Array.isArray(coord) ? coord[0] : (typeof obs.longitude === "number" ? obs.longitude : null),
    place_guess:  obs.place_guess || null,
    quality_grade: obs.quality_grade || null,
    photo_url:    photo,
    observation_url: obs.id ? `https://www.inaturalist.org/observations/${obs.id}` : null,
  };
}

export async function GET(req) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20", 10) || 20);

  const { data: targets, error } = await admin.rpc("ingest_target_species", { p_limit: limit });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!Array.isArray(targets) || targets.length === 0) {
    return Response.json({ processed: 0, message: "no targets" });
  }

  let inserted = 0, skipped = 0, failed = 0;
  for (const sp of targets) {
    try {
      const obs = await searchInat(sp.accepted_name);
      for (const o of obs) {
        const n = normalize(o);
        if (!n.inat_id) { skipped++; continue; }
        const { error: uerr } = await admin.rpc("upsert_inat_observation", {
          p_inat_id:        n.inat_id,
          p_species_id:     sp.id,
          p_taxon_name:     n.taxon_name,
          p_observer:       n.observer,
          p_observed_at:    n.observed_at,
          p_lat:            n.lat,
          p_lng:            n.lng,
          p_place_guess:    n.place_guess,
          p_quality_grade:  n.quality_grade,
          p_photo_url:      n.photo_url,
          p_observation_url: n.observation_url,
        });
        if (uerr) { failed++; continue; }
        inserted++;
      }
      // Gentle pacing to avoid hammering iNat's API
      await new Promise((r) => setTimeout(r, 250));
    } catch {
      failed++;
    }
  }

  return Response.json({ processed: targets.length, inserted, skipped, failed });
}

export const POST = GET;
