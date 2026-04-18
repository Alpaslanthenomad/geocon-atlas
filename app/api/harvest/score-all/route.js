import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GEOCON SCORING SYSTEM v2
 * ─────────────────────────────────────────────────────
 * 
 * Üç bağımsız skor:
 *
 * 1. URGENCY SCORE (0-100)
 *    "Bu tür ne kadar acil kurtarılmalı?"
 *    → IUCN statüsü, endemiklik, lokasyon darlığı, toplanma baskısı sinyali
 *
 * 2. GEOCON MATURITY SCORE (0-100)
 *    "Bu tür GEOCON yolculuğunda nerede?"
 *    → TC durumu, propagasyon protokolü, yayın yoğunluğu, ticari hipotez, governance
 *
 * 3. VALUE POTENTIAL SCORE (0-100)
 *    "Bu türün ticari ve bilimsel değer üretme kapasitesi ne kadar?"
 *    → Metabolit profili, pazar alanı, market büyüklüğü, yayın kalitesi
 *
 * COMPOSITE = Urgency×0.40 + Maturity×0.25 + Value×0.35
 * (Aciliyet ağırlıklı — GEOCON felsefesi: önce kurtar)
 *
 * GEOCON DECISION — 6 kategori (eski 5'ten genişletildi):
 *   Rescue Now     → Urgency ≥ 80
 *   Accelerate     → Urgency ≥ 60 AND Value ≥ 50
 *   Develop        → Maturity ≥ 50 AND Value ≥ 40
 *   Scale          → Composite ≥ 55
 *   Monitor        → Composite ≥ 35
 *   Data Needed    → Urgency < 20 AND Maturity < 20 (veri yetersiz)
 */

// ── 1. URGENCY SCORE ──────────────────────────────────
function calcUrgencyScore(sp, occ) {
  let s = 0;

  // IUCN statüsü (max 40 puan) — ana kriter
  const iucnPts = {
    CR: 40, EN: 34, VU: 26, NT: 14, LC: 5, DD: 18, "": 10
  };
  s += iucnPts[sp.iucn_status || ""] ?? 10;

  // Endemiklik (max 20 puan) — endemik = daha fazla risk
  s += sp.endemicity_flag ? 20 : 4;

  // Coğrafi kısıtlılık — az ülkede bulunmak = daha kırılgan (max 18 puan)
  const cc = occ?.countries_count || 0;
  if (cc === 0) s += 18;        // bilinmiyor = muhtemelen dar yayılış
  else if (cc === 1) s += 18;   // tek ülke
  else if (cc <= 2) s += 14;
  else if (cc <= 4) s += 9;
  else if (cc <= 8) s += 4;
  else s += 1;

  // Kayıt sayısı — az kayıt = az çalışılmış veya gerçekten az (max 12 puan)
  const rc = occ?.record_count || 0;
  if (rc === 0) s += 12;
  else if (rc < 50) s += 10;
  else if (rc < 200) s += 7;
  else if (rc < 500) s += 4;
  else s += 1;

  // Toplanma baskısı sinyali — piyasa değeri yüksek türler toplanıyor (max 10 puan)
  const collectionPressureMarkets = ["Pharma", "Spice", "Cosmetic", "Perfume", "Nutraceutical", "Salep", "Food"];
  const hasCollectionPressure = collectionPressureMarkets.some(m =>
    (sp.market_area || "").toLowerCase().includes(m.toLowerCase())
  );
  s += hasCollectionPressure ? 10 : 0;

  return Math.min(Math.round(s), 100);
}

// ── 2. GEOCON MATURITY SCORE ──────────────────────────
function calcMaturityScore(sp, pubs, mets, hasPropagation, hasCommercial, hasConservation, hasGovernance) {
  let s = 0;

  // TC / Propagasyon durumu (max 30 puan) — en kritik operasyonel gösterge
  const tcPts = {
    "Advanced — well documented": 30,
    "Established": 24,
    "Partial": 15,
    "Candidate": 8,
    "": 0
  };
  s += tcPts[sp.tc_status || ""] ?? 0;

  // Propagasyon protokolü varlığı (max 10 bonus)
  s += hasPropagation ? 10 : 0;

  // Yayın yoğunluğu — bilimsel birikim (max 20 puan)
  if (pubs >= 100) s += 20;
  else if (pubs >= 50) s += 16;
  else if (pubs >= 20) s += 12;
  else if (pubs >= 10) s += 8;
  else if (pubs >= 5) s += 5;
  else if (pubs >= 1) s += 2;

  // Metabolit profili — kimya bilgisi (max 15 puan)
  if (mets >= 20) s += 15;
  else if (mets >= 10) s += 12;
  else if (mets >= 5) s += 8;
  else if (mets >= 1) s += 4;

  // Ticari hipotez tanımlanmış mı? (max 10 puan)
  s += hasCommercial ? 10 : 0;

  // Koruma değerlendirmesi var mı? (max 8 puan)
  s += hasConservation ? 8 : 0;

  // Governance kaydı var mı? (max 7 puan)
  s += hasGovernance ? 7 : 0;

  return Math.min(Math.round(s), 100);
}

// ── 3. VALUE POTENTIAL SCORE ─────────────────────────
function calcValueScore(sp, pubs, mets) {
  let s = 0;

  // Pazar alanı kalitesi (max 35 puan)
  const marketPts = {
    "Pharma": 35,
    "Spice / Pharma": 33,
    "Nutraceuticals": 30,
    "Cosmetics": 28,
    "Nutraceutical": 28,
    "Ornamentals": 22,
    "Food": 20,
    "Perfume": 18,
    "Industrial": 12,
  };
  const mk = Object.keys(marketPts).find(k =>
    (sp.market_area || "").includes(k)
  );
  s += mk ? marketPts[mk] : 5;

  // Metabolit zenginliği (max 30 puan) — değer üretmenin ham maddesi
  if (mets >= 30) s += 30;
  else if (mets >= 20) s += 25;
  else if (mets >= 10) s += 20;
  else if (mets >= 5) s += 14;
  else if (mets >= 1) s += 7;

  // Bilimsel kanıt tabanı (max 20 puan)
  if (pubs >= 100) s += 20;
  else if (pubs >= 50) s += 16;
  else if (pubs >= 20) s += 12;
  else if (pubs >= 10) s += 8;
  else if (pubs >= 5) s += 5;
  else if (pubs >= 1) s += 2;

  // Geophyte tipi — bazı tipler daha üretilebilir (max 15 puan)
  const typePts = {
    "Bulbous": 15, "Cormous": 13, "Tuberous": 11,
    "Rhizomatous": 9, "Other": 5
  };
  const gt = Object.keys(typePts).find(k => (sp.geophyte_type || "").includes(k));
  s += gt ? typePts[gt] : 5;

  return Math.min(Math.round(s), 100);
}

// ── GEOCON DECISION ───────────────────────────────────
function calcGeoconDecision(urgency, maturity, value, composite) {
  if (urgency >= 80) return "Rescue Now";
  if (urgency >= 60 && value >= 50) return "Accelerate";
  if (maturity >= 50 && value >= 40) return "Develop";
  if (composite >= 55) return "Scale";
  if (composite >= 35) return "Monitor";
  return "Data Needed";
}

// ── GEOCON MODULE (yolculuk aşaması) ─────────────────
function calcGeoconModule(maturity, hasPropagation, hasCommercial) {
  if (maturity >= 75 && hasPropagation && hasCommercial) return "Exchange";
  if (maturity >= 55 && hasPropagation) return "Mesh";
  if (maturity >= 30 || hasPropagation) return "Forge";
  return "Origin";
}

// ── TRL LEVEL ─────────────────────────────────────────
function calcTRL(sp, hasPropagation, pubs, mets) {
  if ((sp.tc_status || "").includes("Advanced")) return hasPropagation ? 7 : 6;
  if ((sp.tc_status || "").includes("Established")) return 5;
  if ((sp.tc_status || "").includes("Partial")) return 4;
  if ((sp.tc_status || "").includes("Candidate")) return 3;
  if (pubs >= 10 || mets >= 5) return 2;
  return 1;
}

// ── MAIN HANDLER ──────────────────────────────────────
export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = url.searchParams.get("force") === "true";
  const log = {
    total_processed: 0, total_scored: 0, total_skipped: 0,
    decisions: {}, modules: {}, errors: []
  };

  // Fetch all species
  const { data: allSpecies, error: spErr } = await sb
    .from("species")
    .select("id, accepted_name, iucn_status, endemicity_flag, country_focus, geophyte_type, tc_status, market_area, market_size, composite_score")
    .order("id");

  if (spErr) return Response.json({ fatal: spErr.message }, { status: 500 });
  if (!allSpecies?.length) return Response.json({ message: "no species" });

  // Fetch supporting data in parallel
  const [occRes, pubRes, metRes, propRes, commRes, consRes, govRes] = await Promise.all([
    sb.from("occurrence_summary").select("species_id, record_count, countries_count"),
    sb.from("publications").select("species_id"),
    sb.from("metabolites").select("species_id"),
    sb.from("propagation").select("species_id"),
    sb.from("commercial").select("species_id"),
    sb.from("conservation").select("species_id"),
    sb.from("governance").select("species_id"),
  ]);

  // Build lookup maps
  const occMap = Object.fromEntries((occRes.data || []).map(o => [o.species_id, o]));

  const pubMap = {};
  for (const p of pubRes.data || []) pubMap[p.species_id] = (pubMap[p.species_id] || 0) + 1;

  const metMap = {};
  for (const m of metRes.data || []) metMap[m.species_id] = (metMap[m.species_id] || 0) + 1;

  const propSet = new Set((propRes.data || []).map(p => p.species_id));
  const commSet = new Set((commRes.data || []).map(c => c.species_id));
  const consSet = new Set((consRes.data || []).map(c => c.species_id));
  const govSet = new Set((govRes.data || []).map(g => g.species_id));

  // Score all species
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
    const hasPropagation = propSet.has(sp.id);
    const hasCommercial = commSet.has(sp.id);
    const hasConservation = consSet.has(sp.id);
    const hasGovernance = govSet.has(sp.id);

    // Calculate three scores
    const urgency = calcUrgencyScore(sp, occ);
    const maturity = calcMaturityScore(sp, pubs, mets, hasPropagation, hasCommercial, hasConservation, hasGovernance);
    const value = calcValueScore(sp, pubs, mets);

    // Composite — urgency weighted (GEOCON: rescue first)
    const composite = Math.round(urgency * 0.40 + maturity * 0.25 + value * 0.35);

    // Derived fields
    const decision = calcGeoconDecision(urgency, maturity, value, composite);
    const geoconModule = calcGeoconModule(maturity, hasPropagation, hasCommercial);
    const trl = calcTRL(sp, hasPropagation, pubs, mets);

    // Confidence — how much data do we have?
    let confidence = 40;
    if (pubs > 0) confidence += 15;
    if (pubs >= 10) confidence += 10;
    if (mets > 0) confidence += 10;
    if (occ?.record_count > 0) confidence += 10;
    if (hasPropagation) confidence += 10;
    if (hasConservation) confidence += 5;
    confidence = Math.min(confidence, 95);

    updates.push({
      id: sp.id,
      // New GEOCON scores
      score_conservation: urgency,       // repurposed: urgency
      score_science: maturity,           // repurposed: maturity
      score_production: value,           // repurposed: value potential
      score_governance: Math.round((urgency + maturity) / 2), // combined signal
      score_venture: value,              // venture = value potential
      composite_score: composite,
      decision,
      geocon_module: geoconModule,       // new field (may not exist yet — handled gracefully)
      trl_level: trl,
      confidence,
      last_verified: new Date().toISOString().split("T")[0],
    });

    // Log distribution
    log.decisions[decision] = (log.decisions[decision] || 0) + 1;
    log.modules[geoconModule] = (log.modules[geoconModule] || 0) + 1;
    log.total_processed++;
  }

  // Update species — skip geocon_module if column doesn't exist
  for (const upd of updates) {
    const { id, geocon_module, ...scores } = upd;
    const { error } = await sb.from("species").update(scores).eq("id", id);
    if (error) {
      log.errors.push(`${id}: ${error.message}`);
    } else {
      log.total_scored++;
      // Try to update geocon_module separately (column may not exist)
      await sb.from("species").update({ geocon_module }).eq("id", id).then(() => {});
    }
  }

  return Response.json(log);
}
