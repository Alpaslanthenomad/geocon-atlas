// THE BENCH — the co-investigator. Drafts ONE "Move" (a contribution advancing
// a species' chain link) grounded in the species + its genus congeners' REAL
// data, so the text is a usable skeleton, not invention. Returned for the
// researcher to fill from their bench log — never auto-saved, never fabricated.
// Forked from app/api/grant/draft-section (same proven grounded-draft contract).

import { createClient } from "@supabase/supabase-js";
import { askText, isEnabled, logUsage, DEFAULT_MODEL } from "../../../../lib/ai/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon";

const LINK_INTENT = {
  taxonomy:    "an identity / classification note — what distinguishes this species, its diagnostic characters, type and nomenclature gaps",
  propagation: "a propagation protocol skeleton — seed (dormancy class, stratification, germination triggers) and/or vegetative / in-vitro micropropagation steps",
  cultivation: "a cultivation / husbandry plan — substrate, water, light, dormancy cycle, pests, bulking",
  extraction:  "an extraction & sample-prep plan — tissue/organ, solvent, method to liberate compounds",
  chemistry:   "a phytochemical analysis plan — what to profile (HPLC/GC-MS/NMR), target compound classes",
  metabolites: "a metabolite-profile outline — the compounds to expect and characterise, by analogy to congeners",
};

export async function POST(req) {
  if (!isEnabled()) return Response.json({ error: "AI not configured" }, { status: 503 });

  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return Response.json({ error: "auth required" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad body" }, { status: 400 }); }
  const { speciesId, linkKind, lang: reqLang } = body || {};
  if (!speciesId || !linkKind) return Response.json({ error: "speciesId + linkKind required" }, { status: 400 });

  const sb = createClient(URL, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: ctx, error } = await sb.rpc("get_bench_draft_context", { p_species_id: speciesId, p_link_kind: linkKind });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!ctx) return Response.json({ error: "not found or not on your bench" }, { status: 403 });

  const lang = reqLang === "en" ? "English" : "Turkish";
  const sp = ctx.species || {};
  const congeners = Array.isArray(ctx.congeners) ? ctx.congeners : [];
  const ownC = Array.isArray(ctx.own_compounds) ? ctx.own_compounds : [];
  const congC = Array.isArray(ctx.congener_compounds) ? ctx.congener_compounds : [];
  const intent = LINK_INTENT[linkKind] || `a contribution advancing the "${ctx.link_label || linkKind}" knowledge of this species`;

  const facts = [
    `Species: ${sp.name || "—"}${sp.authority ? ` ${sp.authority}` : ""}${sp.family ? `, family ${sp.family}` : ""}${sp.genus ? `, genus ${sp.genus}` : ""}.`,
    sp.geophyte_type ? `Storage organ / geophyte type: ${sp.geophyte_type}.` : "",
    sp.iucn && sp.iucn !== "NE" ? `IUCN status: ${sp.iucn}.` : "",
    sp.habitat ? `Habitat: ${sp.habitat}.` : "",
    Array.isArray(sp.native_countries) && sp.native_countries.length ? `Native to: ${sp.native_countries.join(", ")}.` : "",
    congeners.length ? `Genus congeners (use their published biology by analogy): ${congeners.join(", ")}.` : "No congeners recorded — be explicit that protocols are inferred from the family.",
    ownC.length ? `Compounds already recorded in this species: ${ownC.slice(0, 20).join(", ")}.` : "",
    congC.length ? `Compounds recorded in congeners: ${congC.slice(0, 20).join(", ")}.` : "",
  ].filter(Boolean).join("\n");

  const system =
    `You are a research co-investigator on a geophyte (bulb/corm/tuber/rhizome) conservation atlas. ` +
    `Draft ONE concise, practical contribution — ${intent} — for the named species, in ${lang}. ` +
    `Geophyte propagation, cultivation and phytochemistry generalise within a genus, so you MAY synthesise a skeleton from the congeners and family in the FACTS. ` +
    `But ground strictly in those FACTS: do NOT invent measured numbers (germination %, temperatures, yields, concentrations), partner names, dates, or citations. ` +
    `Wherever a measured specific is needed, insert a clearly-marked placeholder [EKLE: …] (Turkish) or [ADD: …] (English) for the researcher to fill from their own bench data. ` +
    `Keep it to a tight, numbered, actionable skeleton (~180-260 words). Return the draft body only — no headings, no preamble.`;

  const user =
    `Target link to advance: ${ctx.link_label || linkKind}\n\n` +
    `FACTS (use only these):\n${facts}`;

  try {
    const r = await askText({ system, user, model: DEFAULT_MODEL, maxTokens: 1100 });
    await logUsage({ route: "bench/draft-move", model: r.model, tokensIn: r.usage?.input_tokens, tokensOut: r.usage?.output_tokens, latencyMs: r.latencyMs, ok: true });
    return Response.json({ draft: (r.text || "").trim(), model: r.model });
  } catch (e) {
    const msg = String(e?.message || e);
    await logUsage({ route: "bench/draft-move", model: DEFAULT_MODEL, ok: false, errorText: msg });
    let friendly = "AI taslak üretilemedi";
    if (/credit balance|billing|insufficient|too low/i.test(msg)) friendly = "Anthropic kredi bakiyesi yetersiz — console.anthropic.com → Plans & Billing'den kredi ekleyin.";
    else if (/rate.?limit|429/i.test(msg)) friendly = "Anthropic rate limit — birkaç dakika sonra tekrar dene.";
    else if (/401|authentication|invalid.*api.?key|x-api-key/i.test(msg)) friendly = "Anthropic API anahtarı geçersiz.";
    else if (/404|not.?found|model/i.test(msg)) friendly = "Model bulunamadı.";
    return Response.json({ error: friendly, detail: msg.slice(0, 300) }, { status: 502 });
  }
}
