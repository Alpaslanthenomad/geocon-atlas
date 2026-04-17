import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH_SIZE = 25;

function calcConservationScore(sp, occ) {
  let s = 0;
  const iucnPts = { CR: 40, EN: 35, VU: 28, NT: 18, LC: 8, DD: 15, "—": 10, "": 10 };
  s += iucnPts[sp.iucn_status || ""] || 10;
  s += sp.endemicity_flag ? 25 : 5;
  const rc = occ?.record_count || 0;
  s += rc === 0 ? 15 : rc < 50 ? 20 : rc < 200 ? 12 : rc < 1000 ? 6 : 2;
  const cc = occ?.countries_count || 0;
  s += cc <= 1 ? 15 : cc <= 3 ? 10 : cc <= 5 ? 5 : 2;
  return Math.min(Math.round(s), 100);
}

function calcScienceScore(pubs, mets) {
  let s = 0;
  s += pubs >= 100 ? 55 : pubs >= 50 ? 45 : pubs >= 20 ? 35 : pubs >= 10 ? 25 : pubs >= 5 ? 15 : pubs >= 1 ? 8 : 0;
  s += mets >= 10 ? 45 : mets >= 5 ? 35 : mets >= 3 ? 25 : mets >= 1 ? 15 : 5;
  return Math.min(Math.round(s), 100);
}

function calcProductionScore(sp, occ) {
  let s = 20;
  const bulbous = ["Bulbous", "Cormous", "Rhizomatous", "Tuberous"];
  s += bulbous.some(t => (sp.geophyte_type || "").includes(t)) ? 30 : 10;
  const cc = occ?.countries_count || 0;
  s += cc >= 5 ? 25 : cc >= 3 ? 18 : cc >= 1 ? 10 : 0;
  const tcPts = { "Advanced — well documented": 25, "Established": 22, "Partial": 15, "Candidate": 8 };
  s += tcPts[sp.tc_status || ""] || 5;
  return Math.min(Math.round(s), 100);
}

function calcGovernanceScore(sp) {
  const iucnGov = { CR: 10, EN: 20, VU: 35, NT: 50, LC: 60, DD: 25, "—": 30, "": 30 };
  let s = iucnGov[sp.iucn_status || ""] || 30;
  s += sp.country_focus === "TR" ? 15 : sp.country_focus === "CL" ? 10 : 0;
  if (sp.endemicity_flag) s -= 10;
  return Math.min(Math.max(Math.round(s), 5), 100);
}

function calcVentureScore(sp, pubs, mets, occ) {
  let s = 0;
  const mktPts = { "Cosmetics": 28, "Pharma": 30, "Ornamentals": 22, "Spice / Pharma": 30, "Food": 20, "Nutraceuticals": 25 };
  const mk = Object.keys(mktPts).find(k => (sp.market_area || "").includes(k));
  s += mk ? mktPts[mk] : 10;
  s += pubs >= 50 ? 25 : pubs >= 20 ? 20 : pubs >= 5 ? 12 : 5;
  s += mets >= 5 ? 25 : mets >= 1 ? 15 : 5;
  const cc = occ?.countries_count || 0;
  s += cc >= 5 ? 20 : cc >= 2 ? 12 : 5;
  return Math.min(Math.round(s), 100);
}

function calcDecision(comp, cons, vent) {
  if (cons >= 70 && vent >= 60) return "Accelerate";
  if (cons >= 80) return "Urgent Conserve";
  if (comp >= 65) return "Develop";
  if (comp >= 45) return "Scale";
  return "Monitor";
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = url.searchParams.get("force") === "true";
  const log = { total_processed: 0, total_scored: 0, total_skipped: 0, errors: [] };

  // Fetch ALL species at once
  const { data: allSpecies, error: spErr } = await sb
    .from("species")
    .select("id, accepted_name, iucn_status, endemicity_flag, country_focus, geophyte_type, tc_status, market_area, composite_score")
    .order("id");

  if (spErr) return Response.json({ fatal: spErr.message }, { status: 500 });
  if (!allSpecies?.length) return Response.json({ message: "no species" });

  // Fetch ALL occurrence summaries at once
  const { data: allOcc } = await sb.from("occurrence_summary").select("species_id, record_count, countries_count");
  const occMap = Object.fromEntries((allOcc || []).map(o => [o.species_id, o]));

  // Fetch ALL pub counts at once using a count per species
  const { data: pubCounts } = await sb.from("publications").select("species_id");
  const pubMap = {};
  for (const p of pubCounts || []) {
    pubMap[p.species_id] = (pubMap[p.species_id] || 0) + 1;
  }

  // Fetch ALL metabolite counts
  const { data: metCounts } = await sb.from("metabolites").select("species_id");
  const metMap = {};
  for (const m of metCounts || []) {
    metMap[m.species_id] = (metMap[m.species_id] || 0) + 1;
  }

  // Score all species in batches of 25 for upsert
  const updates = [];

  for (const sp of allSpecies) {
    if (!force && sp.composite_score && sp.composite_score > 0) {
      log.total_skipped++;
      log.total_processed++;
      continue;
    }

    const occ = occMap[sp.id] || null;
    const pubs = pubMap[sp.id] || 0;
    const mets = metMap[sp.id] || 0;

    const conservation = calcConservationScore(sp, occ);
    const science = calcScienceScore(pubs, mets);
    const production = calcProductionScore(sp, occ);
    const governance = calcGovernanceScore(sp);
    const venture = calcVentureScore(sp, pubs, mets, occ);
    const composite = Math.round(conservation * 0.25 + science * 0.20 + production * 0.20 + governance * 0.15 + venture * 0.20);
    const decision = calcDecision(composite, conservation, venture);

    updates.push({
      id: sp.id,
      score_conservation: conservation,
      score_science: science,
      score_production: production,
      score_governance: governance,
      score_venture: venture,
      composite_score: composite,
      decision,
      confidence: 65,
      last_verified: new Date().toISOString().split("T")[0],
    });

    log.total_processed++;
  }

  // Update each species individually (update not upsert - don't overwrite other columns)
  for (const upd of updates) {
    const { id, ...scores } = upd;
    const { error } = await sb.from("species").update(scores).eq("id", id);
    if (error) log.errors.push(`${id}: ${error.message}`);
    else log.total_scored++;
  }

  return Response.json(log);
}
