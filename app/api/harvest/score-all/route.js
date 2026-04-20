import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH = 25;

// ── SCORING FUNCTIONS ──────────────────────────────────────────

function calcConservationScore(sp, occSummary) {
  let score = 0;

  // IUCN status (0-40 pts)
  const iucnPts = { CR: 40, EN: 35, VU: 28, NT: 18, LC: 8, DD: 15, "—": 10, "": 10 };
  score += iucnPts[sp.iucn_status || ""] || 10;

  // Endemicity (0-25 pts)
  if (sp.endemicity_flag) score += 25;
  else score += 5;

  // Occurrence records — fewer = more threatened (0-20 pts)
  const recCount = occSummary?.record_count || 0;
  if (recCount === 0) score += 15;
  else if (recCount < 50) score += 20;
  else if (recCount < 200) score += 12;
  else if (recCount < 1000) score += 6;
  else score += 2;

  // Countries count — fewer = more vulnerable (0-15 pts)
  const countries = occSummary?.countries_count || 0;
  if (countries <= 1) score += 15;
  else if (countries <= 3) score += 10;
  else if (countries <= 5) score += 5;
  else score += 2;

  return Math.min(Math.round(score), 100);
}

function calcScienceScore(pubCount, metCount) {
  let score = 0;

  // Publication depth (0-55 pts)
  if (pubCount >= 100) score += 55;
  else if (pubCount >= 50) score += 45;
  else if (pubCount >= 20) score += 35;
  else if (pubCount >= 10) score += 25;
  else if (pubCount >= 5) score += 15;
  else if (pubCount >= 1) score += 8;
  else score += 0;

  // Metabolite richness (0-45 pts)
  if (metCount >= 10) score += 45;
  else if (metCount >= 5) score += 35;
  else if (metCount >= 3) score += 25;
  else if (metCount >= 1) score += 15;
  else score += 5; // candidate — some potential assumed

  return Math.min(Math.round(score), 100);
}

function calcProductionScore(sp, occSummary) {
  let score = 20; // baseline

  // Geophyte type fit (0-30 pts)
  const bulbousFit = ["Bulbous", "Cormous", "Rhizomatous", "Tuberous"];
  if (bulbousFit.some(t => (sp.geophyte_type || "").includes(t))) score += 30;
  else score += 10;

  // Geographic reach — more countries = better farm network potential (0-25 pts)
  const countries = occSummary?.countries_count || 0;
  if (countries >= 5) score += 25;
  else if (countries >= 3) score += 18;
  else if (countries >= 1) score += 10;

  // TC status (0-25 pts)
  const tcPts = { "Advanced — well documented": 25, "Established": 22, "Partial": 15, "Candidate": 8, "Unknown": 5 };
  score += tcPts[sp.tc_status || "Unknown"] || 5;

  return Math.min(Math.round(score), 100);
}

function calcGovernanceScore(sp) {
  let score = 30; // baseline

  // IUCN status — stricter = harder governance (inverse)
  const iucnGov = { CR: 10, EN: 20, VU: 35, NT: 50, LC: 60, DD: 25, "—": 30, "": 30 };
  score = iucnGov[sp.iucn_status || ""] || 30;

  // Country — Turkey has clearer biotech regulations vs. Chile for new ventures
  if (sp.country_focus === "TR") score += 15;
  else if (sp.country_focus === "CL") score += 10;

  // Endemicity — endemic = more complex access rules
  if (sp.endemicity_flag) score -= 10;

  return Math.min(Math.max(Math.round(score), 5), 100);
}

function calcVentureScore(sp, pubCount, metCount, occSummary) {
  let score = 0;

  // Market area signal (0-30 pts)
  const marketPts = {
    "Cosmetics": 28, "Pharma": 30, "Ornamentals": 22,
    "Spice / Pharma": 30, "Food": 20, "Nutraceuticals": 25,
  };
  const marketKey = Object.keys(marketPts).find(k => (sp.market_area || "").includes(k));
  score += marketKey ? marketPts[marketKey] : 10;

  // Science backing (0-25 pts)
  if (pubCount >= 50) score += 25;
  else if (pubCount >= 20) score += 20;
  else if (pubCount >= 5) score += 12;
  else score += 5;

  // Metabolite evidence (0-25 pts)
  if (metCount >= 5) score += 25;
  else if (metCount >= 1) score += 15;
  else score += 5;

  // Geographic reach — market access (0-20 pts)
  const countries = occSummary?.countries_count || 0;
  if (countries >= 5) score += 20;
  else if (countries >= 2) score += 12;
  else score += 5;

  return Math.min(Math.round(score), 100);
}

function calcCompositeScore(conservation, science, production, governance, venture) {
  // Weights from scoring_model table: 0.25, 0.20, 0.20, 0.15, 0.20
  return Math.round(
    conservation * 0.25 +
    science * 0.20 +
    production * 0.20 +
    governance * 0.15 +
    venture * 0.20
  );
}

function calcDecision(composite, conservation, venture) {
  if (conservation >= 70 && venture >= 60) return "Accelerate";
  if (conservation >= 80) return "Urgent Conserve";
  if (composite >= 65) return "Develop";
  if (composite >= 45) return "Scale";
  return "Monitor";
}

// ── MAIN HANDLER ──────────────────────────────────────────────

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batch = parseInt(url.searchParams.get("batch") || "0");
  const force = url.searchParams.get("force") === "true";
  const log = { batch, processed: 0, scored: 0, skipped: 0, errors: [] };

  // Fetch species batch
  const { data: species, error: spErr } = await sb
    .from("species")
    .select("id, accepted_name, iucn_status, endemicity_flag, country_focus, geophyte_type, tc_status, market_area, composite_score")
    .order("id")
    .range(batch * BATCH, (batch + 1) * BATCH - 1);

  if (spErr) return Response.json({ ...log, fatal: spErr.message }, { status: 500 });
  if (!species?.length) return Response.json({ ...log, message: "empty batch" });

  for (const sp of species) {
    try {
      // Skip if already scored (unless force=true)
      if (!force && sp.composite_score && sp.composite_score > 0) {
        log.skipped++;
        log.processed++;
        continue;
      }

      // Get publication count for this species
      const { count: pubCount } = await sb
        .from("publications")
        .select("id", { count: "exact", head: true })
        .eq("species_id", sp.id);

      // Get metabolite count
      const { count: metCount } = await sb
        .from("metabolites")
        .select("id", { count: "exact", head: true })
        .eq("species_id", sp.id);

      // Get occurrence summary
      const { data: occSummary } = await sb
        .from("occurrence_summary")
        .select("record_count, countries_count")
        .eq("species_id", sp.id)
        .maybeSingle();

      // Calculate scores
      const conservation = calcConservationScore(sp, occSummary);
      const science = calcScienceScore(pubCount || 0, metCount || 0);
      const production = calcProductionScore(sp, occSummary);
      const governance = calcGovernanceScore(sp);
      const venture = calcVentureScore(sp, pubCount || 0, metCount || 0, occSummary);
      const composite = calcCompositeScore(conservation, science, production, governance, venture);
      const decision = calcDecision(composite, conservation, venture);

      // Update species
      const { error: updateErr } = await sb
        .from("species")
        .update({
          score_conservation: conservation,
          score_science: science,
          score_production: production,
          score_governance: governance,
          score_venture: venture,
          composite_score: composite,
          decision: decision,
          confidence: 65, // baseline confidence for auto-scored
          last_verified: new Date().toISOString().split("T")[0],
        })
        .eq("id", sp.id);

      if (updateErr) {
        log.errors.push(`${sp.accepted_name}: ${updateErr.message}`);
      } else {
        log.scored++;
      }

      log.processed++;
      await new Promise(r => setTimeout(r, 100));

    } catch (e) {
      log.errors.push(`${sp.accepted_name}: ${e.message}`);
      log.processed++;
    }
  }

  return Response.json(log);
}
