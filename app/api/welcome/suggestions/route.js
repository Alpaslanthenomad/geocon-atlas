// K10 — AI mediated welcome suggestions.
//
// POST /api/welcome/suggestions
//   Body: { researcher_id: string }   (the imported ORCID researcher)
//
// Authenticated. Pulls:
//   - the researcher's expertise/keywords/top topics
//   - up to ~25 active programs (id, name, species, module)
//   - up to ~25 open briefs (id, title, kind, required_capabilities)
//
// Then asks Claude (Haiku 4.5) to pick the 3 best matches and write a
// 1–2 sentence personalized rationale for each. Falls back gracefully
// when Claude isn't configured: returns three generic suggestions so
// the welcome screen always renders.

import { createClient } from "@supabase/supabase-js";
import { askJSON, isEnabled as claudeEnabled, logUsage } from "../../../../lib/ai/claude";

export const dynamic = "force-dynamic";

const FALLBACK_SUGGESTIONS = [
  {
    kind: "profile",
    id: null,
    title: "Profilime git",
    rationale: "Importer arka planda çalıştı; uzmanlık alanın ve katkın profilin üzerinde görünmeye başladı.",
    icon: "🔬",
  },
  {
    kind: "brief",
    id: null,
    title: "Senin için Open Brief'lere bak",
    rationale: "Yayın geçmişine yakın açık çağrıları gör. Bir tanesine yanıt vermek K2 etkin başlatır.",
    icon: "🗂",
  },
  {
    kind: "program",
    id: null,
    title: "Bir Program'a katıl veya başlat",
    rationale: "Programlar, bir veya birden fazla türü çok yıllık iş paketine dönüştürür. K3 etkin orada birikiyor.",
    icon: "🌐",
  },
];

export async function POST(req) {
  // ---- Authn ----
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid"),
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "service"),
    { auth: { persistSession: false } }
  );
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const user = userData.user;

  // ---- Input ----
  let body;
  try { body = await req.json(); } catch { body = {}; }
  const researcherId = (body?.researcher_id || "").trim();

  // ---- Researcher context ----
  let researcher = null;
  if (researcherId) {
    const { data } = await admin
      .from("researchers")
      .select("id, name, country, institution, expertise_area, species_links")
      .eq("id", researcherId)
      .maybeSingle();
    researcher = data || null;
  }

  // Pull top species touched (from publications imported via ORCID)
  let topSpecies = [];
  if (researcherId) {
    const { data } = await admin
      .from("contribution_events")
      .select("publication_id")
      .eq("contributor_id", researcherId)
      .eq("contributor_kind", "researcher")
      .eq("source_kind", "orcid_import")
      .limit(50);
    const pubIds = (data || []).map((r) => r.publication_id).filter(Boolean);
    if (pubIds.length > 0) {
      const { data: pubs } = await admin
        .from("publications")
        .select("species_id, primary_topic")
        .in("id", pubIds);
      const speciesCounts = new Map();
      for (const p of pubs || []) {
        if (p.species_id) speciesCounts.set(p.species_id, (speciesCounts.get(p.species_id) || 0) + 1);
      }
      topSpecies = Array.from(speciesCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, count]) => ({ id, count }));
    }
  }

  // Hydrate species names
  let speciesContext = [];
  if (topSpecies.length > 0) {
    const { data } = await admin
      .from("species")
      .select("id, accepted_name, family, genus")
      .in("id", topSpecies.map((s) => s.id));
    speciesContext = (data || []).map((s) => ({
      ...s,
      publication_count: topSpecies.find((t) => t.id === s.id)?.count || 0,
    }));
  }

  // ---- Candidate programs ----
  const { data: programsRaw } = await admin
    .from("programs")
    .select("id, program_name, status, current_module, current_gate, next_action, species_id, species:species_id(accepted_name, family, genus)")
    .in("status", ["active", "designing", "scoping"])
    .order("priority_score", { ascending: false })
    .limit(25);
  const programs = programsRaw || [];

  // ---- Candidate briefs ----
  const { data: briefsRaw } = await admin
    .rpc("list_open_briefs", { p_kinds: null, p_urgencies: null, p_capability: null, p_limit: 25 });
  const briefs = Array.isArray(briefsRaw) ? briefsRaw : [];

  // ---- Build prompt context ----
  const context = {
    researcher: researcher ? {
      name: researcher.name,
      country: researcher.country,
      institution: researcher.institution,
      expertise: researcher.expertise_area,
    } : null,
    top_species: speciesContext.map((s) => ({
      id: s.id,
      name: s.accepted_name,
      family: s.family,
      genus: s.genus,
      publications: s.publication_count,
    })),
    programs: programs.map((p) => ({
      id: p.id,
      title: p.program_name,
      status: p.status,
      module: p.current_module,
      species: p.species?.accepted_name || null,
      family: p.species?.family || null,
    })),
    briefs: briefs.map((b) => ({
      id: b.id,
      kind: b.brief_kind,
      title: b.title,
      urgency: b.urgency,
      capabilities: b.required_capabilities || [],
    })),
  };

  // ---- Bail to fallback if Claude isn't configured ----
  if (!claudeEnabled()) {
    return Response.json({
      suggestions: FALLBACK_SUGGESTIONS.map((s) => ({
        ...s,
        href: hrefFor(s.kind, s.id),
      })),
      ai: false,
    });
  }

  // ---- Ask Claude ----
  const system = [
    "You are GEOCON's welcome assistant. You see a researcher's atlas history",
    "(species they've worked on, their expertise) and the network's currently",
    "open programs + briefs. Pick 3 items from those lists that best fit the",
    "researcher and write a 1-sentence rationale (under 25 words) per item",
    "explaining why they specifically are a fit. Mention overlap with their",
    "species/family/expertise. Use a warm, professional tone, in TURKISH (the",
    "GEOCON UI language). Never invent IDs. If the lists are short, pick",
    "what's there.",
    "",
    "Return JSON ONLY, no prose, no markdown. Shape:",
    `{ "suggestions": [`,
    `  { "kind": "program"|"brief"|"profile", "id": "<uuid or null>", "title": "<short>", "rationale": "<Turkish, 1 sentence, no more than 25 words>" }`,
    `] }`,
    "",
    "If neither programs nor briefs are listed at all, return one 'profile'",
    "suggestion with id=null and a rationale about their imported history.",
  ].join("\n");

  const userMsg = [
    "RESEARCHER CONTEXT:",
    JSON.stringify(context.researcher || {}, null, 2),
    "",
    "TOP SPECIES (by imported publication count):",
    JSON.stringify(context.top_species, null, 2),
    "",
    "OPEN PROGRAMS (id required):",
    JSON.stringify(context.programs.slice(0, 25), null, 2),
    "",
    "OPEN BRIEFS (id required):",
    JSON.stringify(context.briefs.slice(0, 25), null, 2),
    "",
    "Now pick the 3 best matches. JSON only.",
  ].join("\n");

  const started = Date.now();
  let parsed = null;
  let model = null;
  let tokensIn = 0;
  let tokensOut = 0;
  let aiError = null;
  try {
    const res = await askJSON({ system, user: userMsg, maxTokens: 800 });
    parsed = res.parsed;
    model = res.model;
    tokensIn = res.usage?.input_tokens || 0;
    tokensOut = res.usage?.output_tokens || 0;
  } catch (e) {
    aiError = String(e?.message || e).slice(0, 120);
  }

  await logUsage({
    route: "/api/welcome/suggestions",
    userId: user.id,
    model: model || "claude-haiku-4-5",
    tokensIn,
    tokensOut,
    latencyMs: Date.now() - started,
    ok: !aiError,
    errorText: aiError,
  });

  if (!parsed?.suggestions || !Array.isArray(parsed.suggestions)) {
    return Response.json({
      suggestions: FALLBACK_SUGGESTIONS.map((s) => ({ ...s, href: hrefFor(s.kind, s.id) })),
      ai: false,
      ai_error: aiError || "parse_failed",
    });
  }

  // Normalize + attach hrefs + icons
  const suggestions = parsed.suggestions.slice(0, 3).map((s) => ({
    kind: s.kind || "profile",
    id: s.id || null,
    title: String(s.title || "").slice(0, 120),
    rationale: String(s.rationale || "").slice(0, 240),
    href: hrefFor(s.kind, s.id),
    icon: iconFor(s.kind),
  }));

  return Response.json({ suggestions, ai: true });
}

function hrefFor(kind, id) {
  switch (kind) {
    case "program": return id ? `/geocon/programs/${id}` : "/geocon/programs";
    case "brief":   return id ? `/geocon/proposals/${id}` : "/geocon/briefs";
    case "profile":
    default:        return "/geocon/profile";
  }
}

function iconFor(kind) {
  switch (kind) {
    case "program": return "🌐";
    case "brief":   return "🗂";
    case "profile": return "🔬";
    default:        return "✦";
  }
}
