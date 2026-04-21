import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GEOCON SPECIES SCORING FRAMEWORK v3
 * ─────────────────────────────────────────────────────
 * Temel vizyon: Önce kurtarmak → Üretmek → Değer kazandırmak
 *
 * 4 Boyut:
 *   CS  (0.35) — Conservation Score        "Ne kadar kurtarılmalı?"
 *   FS  (0.25) — Feasibility Score         "Gerçekten çalışabilir miyiz?"
 *   EVS (0.25) — Economic Value Score      "Değere dönüşebilir mi?"
 *   SVS (0.15) — Scientific Value Score    "Bilimsel fırsat ne kadar büyük?"
 *
 * GPS = 0.35×CS + 0.25×FS + 0.25×EVS + 0.15×SVS
 * + Urgency Multiplier (×1.0–1.3)
 *
 * SVS Felsefesi:
 *   "Az çalışılmış + tehlike altında" → yüksek (keşfedilmemiş değer)
 *   "Çok çalışılmış + tehlikede değil" → düşük (iyi bilinen, acil değil)
 *   "Az çalışılmış + tehlikede değil" → orta (gelecek fırsat)
 *   "Çok çalışılmış + tehlikede" → orta (bilinen ama hala önemli)
 *
 * EVS Sektörel Sırası (kolaydan zora):
 *   Ornamental > Cosmetic > Nutraceutical > Pharmacological
 *   Her aşama kümülatif — bir tür hem ornamental hem cosmetic olabilir
 *
 * Program Pathway:
 *   Rescue Now      → CS > 75 (acil koruma)
 *   Hybrid Program  → CS > 55 AND EVS > 55 (GEOCON'un en güçlü modeli)
 *   Conservation    → CS > 60 (üretim öncesi koruma)
 *   Propagation     → FS > 55 AND CS > 40 (üretim odaklı)
 *   Commercial      → EVS > 65 AND FS > 55 (değer üretimi)
 *   Discovery       → SVS > 65 (keşif pipeline)
 *   Monitor         → GPS < 35 (sadece atlas kaydı)
 */

// ── 1. CONSERVATION SCORE (CS) ── ağırlık: 0.35
// "Ne kadar korunmalı?"
function calcCS(sp, consData) {
  let s = 0;

  // IUCN Status — temel kriter, max 45
  const iucnBase = { CR: 45, EN: 36, VU: 27, NT: 16, LC: 8, DD: 20, "": 10 };
  s += iucnBase[sp.iucn_status || ""] ?? 10;

  // Endemiklik — dar yayılım = daha kırılgan, max 20
  s += sp.endemicity_flag ? 20 : 5;

  // Habitat Threat — piyasa baskısından tahmin, max 20
  const highPressureMarkets = ["pharma", "spice", "cosmetic", "salep", "perfume", "food", "dye"];
  const hasMarketPressure = highPressureMarkets.some(m =>
    (sp.market_area || "").toLowerCase().includes(m)
  );
  if (hasMarketPressure && (sp.iucn_status === "CR" || sp.iucn_status === "EN")) s += 20;
  else if (hasMarketPressure) s += 12;
  else if (sp.iucn_status === "CR" || sp.iucn_status === "EN") s += 10;
  else s += 3;

  // Population Trend — gerçek conservation verisinden, max 15
  const trend = (consData?.trend || "").toLowerCase();
  if (trend.includes("declin") || trend.includes("düş")) s += 15;
  else if (trend.includes("stable") || trend.includes("stabil")) s += 5;
  else if (trend.includes("increas") || trend.includes("art")) s += 0;
  else {
    // Tahmin: CR/EN için declining varsay
    s += (sp.iucn_status === "CR" || sp.iucn_status === "EN") ? 12 : 5;
  }

  return Math.min(Math.round(s), 100);
}

// ── 2. FEASIBILITY SCORE (FS) ── ağırlık: 0.25
// "Gerçekten çalışabilir miyiz?"
function calcFS(sp, hasPropagation, hasGovernance, govData, pubCount) {
  let s = 0;

  // TC Feasibility — en kritik, max 30
  const tcStatus = (sp.tc_status || "").toLowerCase();
  if (tcStatus.includes("established") || tcStatus.includes("protocol")) s += 30;
  else if (tcStatus.includes("initiated") || tcStatus.includes("progress")) s += 20;
  else if (tcStatus.includes("feasible") || tcStatus.includes("candidate")) s += 12;
  else if (tcStatus.includes("not") || tcStatus.includes("difficult")) s += 3;
  else s += 8; // bilinmiyor — geofitler için orta varsay

  // Propagasyon protokolü var mı?, max 20
  s += hasPropagation ? 20 : 5;

  // Veri mevcudiyeti, max 15
  if (pubCount >= 15) s += 15;
  else if (pubCount >= 5) s += 10;
  else if (pubCount >= 1) s += 6;
  else s += 2;

  // Regulatory Risk — ABS/Nagoya + governance, max 20
  // Governance tablosundaki gerçek veriyi kullan
  const absRisk = (govData?.abs_nagoya_risk || "").toLowerCase();
  const collSens = (govData?.collection_sensitivity || "").toLowerCase();
  if (absRisk.includes("high") || collSens.includes("high")) s += 5;      // yüksek risk = düşük puan
  else if (absRisk.includes("medium") || collSens.includes("medium")) s += 12;
  else if (absRisk.includes("low") || collSens.includes("low")) s += 20;
  else s += hasGovernance ? 12 : 8; // veri yoksa varsayılan

  // Infrastructure Match — geofitler için doğal uyum, max 15
  const geophyteTypes = ["bulbous", "cormous", "rhizomatous", "tuberous"];
  const isGeophyte = geophyteTypes.some(g =>
    (sp.geophyte_type || "").toLowerCase().includes(g)
  );
  s += isGeophyte ? 15 : 8;

  return Math.min(Math.round(s), 100);
}

// ── 3. ECONOMIC VALUE SCORE (EVS) ── ağırlık: 0.25
// "Değere dönüşebilir mi?" — sektörel sıra: Ornamental > Cosmetic > Nutraceutical > Pharma
function calcEVS(sp, metCount, hasCommercial) {
  let s = 0;
  const market = (sp.market_area || "").toLowerCase();

  // Tier 1: Ornamental — en kolay, hızlı kazanım, max 25
  const isOrnamental = market.includes("ornamental") || market.includes("bulb") ||
    market.includes("flower") || market.includes("garden") || market.includes("cut");
  s += isOrnamental ? 25 : 5;

  // Tier 2: Cosmetic — orta zorluk, max 20
  const isCosmetic = market.includes("cosmetic") || market.includes("perfume") ||
    market.includes("aroma") || market.includes("extract") || market.includes("essential");
  s += isCosmetic ? 20 : 3;

  // Tier 3: Nutraceutical/Food — orta-uzun vadeli, max 15
  const isNutra = market.includes("nutraceutical") || market.includes("food") ||
    market.includes("spice") || market.includes("supplement") || market.includes("functional");
  s += isNutra ? 15 : 2;

  // Tier 4: Pharmacological — uzun vadeli, yüksek değer, max 25
  const isPharma = market.includes("pharma") || market.includes("medicinal") ||
    market.includes("therapeutic") || market.includes("drug") || market.includes("clinical");
  s += isPharma ? 25 : 3;

  // Metabolit zenginliği bonus — kalite sinyali olarak sayı + commercial hipotez, max 15
  if (metCount >= 10 && hasCommercial) s += 15;
  else if (metCount >= 5) s += 10;
  else if (metCount >= 1) s += 5;

  // Not: Bir tür hem ornamental hem cosmetic olabilir → kümülatif
  // Ama max 100 cap var

  return Math.min(Math.round(s), 100);
}

// ── 4. SCIENTIFIC VALUE SCORE (SVS) ── ağırlık: 0.15
// "Bilimsel fırsat ne kadar büyük?"
// SVS = f(knowledge_gap × conservation_pressure)
// Az çalışılmış + tehlikede → yüksek (keşfedilmemiş değer, acil)
// Çok çalışılmış + tehlikede → orta (bilinen ama hala önemli)
// Az çalışılmış + tehlikede değil → orta (gelecek fırsat)
// Çok çalışılmış + tehlikede değil → düşük
function calcSVS(sp, pubCount, metCount) {
  const threatened = ["CR", "EN", "VU"].includes(sp.iucn_status);
  const highlyThreatened = ["CR", "EN"].includes(sp.iucn_status);

  // Knowledge Gap × Conservation Pressure matrisi
  let knowledgeGap = 0;
  if (pubCount === 0) knowledgeGap = "very_high";
  else if (pubCount < 5) knowledgeGap = "high";
  else if (pubCount < 15) knowledgeGap = "medium";
  else knowledgeGap = "low";

  // Gap × Threat matris skoru, max 50
  const gapThreatScore = {
    "very_high": { true: 50, false: 30 },  // az çalışılmış
    "high":      { true: 42, false: 25 },
    "medium":    { true: 30, false: 18 },
    "low":       { true: 20, false: 10 },  // çok çalışılmış
  };
  let s = gapThreatScore[knowledgeGap][threatened];

  // Unique Traits — özel metabolit kombinasyonu, max 25
  if (metCount >= 8) s += 25;
  else if (metCount >= 4) s += 18;
  else if (metCount >= 1) s += 10;
  else if (highlyThreatened) s += 8; // tehlikeli ama veri yok = keşif fırsatı

  // Model/Research Potential — TC uygunluğu + yayın kalitesi, max 25
  const tcStatus = (sp.tc_status || "").toLowerCase();
  if (tcStatus.includes("established")) s += 15;
  else if (tcStatus.includes("initiated")) s += 10;
  else s += 5;

  // Cross-domain relevance — birden fazla sektör = daha geniş araştırma değeri
  const marketCount = (sp.market_area || "").split(/[,;\/]/).filter(Boolean).length;
  s += marketCount >= 3 ? 10 : (marketCount >= 2 ? 6 : 2);

  return Math.min(Math.round(s), 100);
}

// ── URGENCY MULTIPLIER ───────────────────────────────
// Zaman faktörü — yok oluş hızı
function calcUrgencyMultiplier(sp, consData) {
  const trend = (consData?.trend || "").toLowerCase();
  const isRapidlyDeclining = trend.includes("declin") || trend.includes("düş");

  if (sp.iucn_status === "CR") return isRapidlyDeclining ? 1.3 : 1.2;
  if (sp.iucn_status === "EN") return isRapidlyDeclining ? 1.15 : 1.1;
  if (sp.iucn_status === "VU") return 1.05;
  return 1.0;
}

// ── PROGRAM PATHWAY ENGINE ───────────────────────────
function determinePathway(cs, fs, evs, svs, gps) {
  // Rescue Now — en acil
  if (cs > 75) return "Rescue Now";
  // Hybrid — GEOCON'un en güçlü modeli (koruma + ticari birlikte)
  if (cs > 55 && evs > 55) return "Hybrid Program";
  // Conservation only
  if (cs > 60) return "Conservation Program";
  // Propagation — üretim odaklı
  if (fs > 55 && cs > 40) return "Propagation Program";
  // Commercial — değer üretimi
  if (evs > 65 && fs > 55) return "Commercial Program";
  // Discovery — keşif
  if (svs > 65) return "Discovery Program";
  // Monitor — sadece atlas
  return "Monitor";
}

// ── DECISION (UI label) ──────────────────────────────
function determineDecision(cs, fs, evs, svs, gps) {
  if (cs > 80) return "Rescue Now";
  if (cs > 55 && evs > 55) return "Accelerate";
  if (evs > 60 && fs > 55) return "Develop";
  if (gps > 55) return "Scale";
  if (gps > 30) return "Monitor";
  return "Data Needed";
}

// ── NEXT BEST ACTION ─────────────────────────────────
function determineNextAction(pathway, cs, fs, evs) {
  switch (pathway) {
    case "Rescue Now":
      return "Initiate emergency ex situ collection and TC protocol immediately";
    case "Hybrid Program":
      return "Launch Origin module — parallel conservation + market validation study";
    case "Conservation Program":
      return "Begin ex situ conservation — establish seed bank and TC protocol";
    case "Propagation Program":
      return "Start TC feasibility study — corm/explant trial on MS basal medium";
    case "Commercial Program":
      return "Commission market analysis and metabolite extraction pilot";
    case "Discovery Program":
      return "Initiate phytochemical screening — metabolite profiling + literature review";
    default:
      return "Monitor wild populations — collect baseline occurrence and habitat data";
  }
}

// ── MAIN HANDLER ────────────────────────────────────
export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const speciesId = url.searchParams.get("species_id");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  // Fetch species
  let q = sb.from("species").select("*").order("id").range(offset, offset + limit - 1);
  if (speciesId) q = sb.from("species").select("*").eq("id", speciesId);

  const { data: allSpecies, error: spErr } = await q;
  if (spErr) return Response.json({ error: spErr.message }, { status: 500 });
  if (!allSpecies?.length) return Response.json({ message: "No species found" });

  const ids = allSpecies.map(s => s.id);

  // Supporting data
  const [pubRes, metRes, propRes, commRes, consRes, govRes] = await Promise.all([
    sb.from("publications").select("species_id").in("species_id", ids),
    sb.from("metabolites").select("species_id").in("species_id", ids),
    sb.from("propagation").select("species_id").in("species_id", ids),
    sb.from("commercial").select("species_id").in("species_id", ids),
    sb.from("conservation").select("species_id, trend").in("species_id", ids),
    sb.from("governance").select("species_id, abs_nagoya_risk, collection_sensitivity").in("species_id", ids),
  ]);

  // Maps
  const pubMap = {}, metMap = {};
  for (const p of pubRes.data || []) pubMap[p.species_id] = (pubMap[p.species_id] || 0) + 1;
  for (const m of metRes.data || []) metMap[m.species_id] = (metMap[m.species_id] || 0) + 1;
  const propSet  = new Set((propRes.data || []).map(p => p.species_id));
  const commSet  = new Set((commRes.data || []).map(c => c.species_id));
  const consMap  = {};
  for (const c of consRes.data || []) consMap[c.species_id] = c;
  const govMap   = {};
  for (const g of govRes.data || []) govMap[g.species_id] = g;

  let updated = 0;
  const errors = [];
  const log = [];

  for (const sp of allSpecies) {
    try {
      const pubCount = pubMap[sp.id] || 0;
      const metCount = metMap[sp.id] || 0;
      const hasProp  = propSet.has(sp.id);
      const hasComm  = commSet.has(sp.id);
      const consData = consMap[sp.id] || null;
      const govData  = govMap[sp.id] || null;
      const hasGov   = !!govData;

      // 4 boyutlu skorlar
      const cs  = calcCS(sp, consData);
      const fs  = calcFS(sp, hasProp, hasGov, govData, pubCount);
      const evs = calcEVS(sp, metCount, hasComm);
      const svs = calcSVS(sp, pubCount, metCount);

      // GPS + urgency multiplier
      const urgencyMult = calcUrgencyMultiplier(sp, consData);
      const gpsRaw = 0.35 * cs + 0.25 * fs + 0.25 * evs + 0.15 * svs;
      const gps = Math.min(Math.round(gpsRaw * urgencyMult), 100);

      // Pathway, decision, next action
      const pathway    = determinePathway(cs, fs, evs, svs, gps);
      const decision   = determineDecision(cs, fs, evs, svs, gps);
      const nextAction = determineNextAction(pathway, cs, fs, evs);

      // GEOCON module
      const geoconModule =
        gps >= 70 ? "Forge" :
        gps >= 50 ? "Origin" :
        "Origin";

      const { error: upErr } = await sb.from("species").update({
        score_conservation:  cs,
        score_scientific:    svs,
        score_venture:       evs,
        score_feasibility:   fs,
        composite_score:     gps,
        current_decision:    decision,
        recommended_pathway: pathway,
        next_action:         nextAction,
        geocon_module:       geoconModule,
      }).eq("id", sp.id);

      if (upErr) {
        errors.push(`${sp.accepted_name}: ${upErr.message}`);
      } else {
        updated++;
        log.push({ name: sp.accepted_name, cs, fs, evs, svs, gps, pathway });
      }
    } catch (e) {
      errors.push(`${sp.accepted_name}: ${e.message}`);
    }
  }

  return Response.json({
    total: allSpecies.length,
    updated,
    framework: "GEOCON v3 — CS×0.35 + FS×0.25 + EVS×0.25 + SVS×0.15",
    weights: "Conservation first → Feasibility → Economic → Scientific",
    sample: log.slice(0, 5),
    errors: errors.slice(0, 10),
  });
}
