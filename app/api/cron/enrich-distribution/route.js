// DI-5 — native_countries enrichment (GBIF, STRICT-NATIVE only).
//
// IMPORTANT FINDING (2026-06): a proof batch over 25 high-value
// geophytes showed GBIF's species/distributions endpoint is BOTH sparse
// AND noisy for this corpus — e.g. a Greek Crocus came back as "NO"
// (Norway), a Mediterranean Pancratium included "US". Most species
// returned nothing. So GBIF distributions is NOT a reliable native-
// range source here.
//
// THE CORRECT AUTHORITY for plant native distribution is POWO/WCVP
// (Kew World Checklist of Vascular Plants) — curated native/introduced
// per TDWG region. native_countries should ultimately be filled from a
// WCVP bulk import / POWO API. See docs/CRON-MIGRATION + a WCVP task.
//
// Until then this endpoint runs in STRICT mode: it only accepts a
// country when GBIF EXPLICITLY labels the record establishmentMeans=
// NATIVE. Low yield, but zero garbage. We never inject a guessed range.
//
// Auth: Bearer CRON_SECRET. source=gbif_distribution.

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || "service";
const CRON_SECRET  = process.env.CRON_SECRET;

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const tok = h.startsWith("Bearer ") ? h.slice(7) : null;
  return !!(CRON_SECRET && tok === CRON_SECRET);
}

// STRICT: only a country GBIF explicitly tags NATIVE is accepted.
// Empty / introduced / vagrant establishmentMeans are all dropped, so
// we never inject a guessed or non-native range.

async function gbifMatch(name) {
  const r = await fetch(`https://api.gbif.org/v1/species/match?kingdom=Plantae&name=${encodeURIComponent(name)}`,
    { headers: { Accept: "application/json", "User-Agent": "GEOCON-Atlas/1.0" } });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.usageKey || null;
}

async function gbifNativeCountries(usageKey) {
  const r = await fetch(`https://api.gbif.org/v1/species/${usageKey}/distributions?limit=300`,
    { headers: { Accept: "application/json", "User-Agent": "GEOCON-Atlas/1.0" } });
  if (!r.ok) return [];
  const j = await r.json();
  const out = new Set();
  for (const d of (j?.results || [])) {
    const cc = d.country; // ISO2
    const em = (d.establishmentMeans || "").toUpperCase();
    if (!cc || cc.length !== 2) continue;
    if (em !== "NATIVE") continue;          // STRICT: explicit native only
    out.add(cc);
  }
  return Array.from(out);
}

export async function GET(req) {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const url = new URL(req.url);
  const limit = Math.min(60, parseInt(url.searchParams.get("limit") || "30", 10) || 30);

  const { data: targets, error } = await admin.rpc("species_needing_distribution", { p_limit: limit });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!Array.isArray(targets) || targets.length === 0) {
    return Response.json({ processed: 0, message: "none need distribution" });
  }

  let filled = 0, empty = 0, failed = 0;
  const sample = [];
  for (const sp of targets) {
    try {
      const key = await gbifMatch(sp.accepted_name);
      if (!key) { empty++; continue; }
      const countries = await gbifNativeCountries(key);
      if (countries.length === 0) { empty++; continue; }
      await admin.rpc("set_native_countries", {
        p_species_id: sp.id, p_countries: countries, p_source: "gbif_distribution",
      });
      filled++;
      if (sample.length < 5) sample.push({ species: sp.accepted_name, countries });
      await new Promise((r) => setTimeout(r, 120)); // gentle pacing
    } catch {
      failed++;
    }
  }
  return Response.json({ processed: targets.length, filled, empty, failed, sample });
}

export const POST = GET;
