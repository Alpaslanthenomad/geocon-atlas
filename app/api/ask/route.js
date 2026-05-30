// POST /api/ask
// body: { query: "Show me CR Crocus in Iran with open calls" }
//
// Strategy: Claude Haiku translates the user's natural-language sentence
// into a structured filter spec (JSON), the server runs that spec against
// Supabase, then Claude writes a one-sentence reply. Falls back to the
// rule-based parser shipped earlier when ANTHROPIC_API_KEY is missing.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askJSON, askText, DEFAULT_MODEL, isEnabled, logUsage } from "../../../lib/ai/claude";
import { parseAsk } from "../../../lib/ask/parser";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const ASK_SYSTEM = `You are GEOCON's atlas query translator. The user writes a question
about endemic geophyte plants in English or Turkish. Convert it to a
strict JSON filter object.

Output schema (return ONLY this JSON, no prose, no markdown):
{
  "intent": "species" | "open_calls" | "programs" | "publications" | "metabolites" | "organizations",
  "filters": {
    "tiers":     string[],   // IUCN: subset of ["CR","EN","VU","NT","LC","DD","NE"]
    "families":  string[],   // plant family names, Latin, title-case, e.g. "Iridaceae"
    "genera":    string[],   // plant genus names, Latin, title-case, e.g. "Crocus"
    "countries": string[],   // ISO-3166 2-letter uppercase codes, e.g. "IR", "TR"
    "free_text": string      // any leftover keywords to fulltext-search
  },
  "explanation": string      // one short sentence in the same language the user used
}

Rules:
- If a country isn't in your knowledge, leave it out (don't guess).
- If the user mentions IUCN words like "threatened", expand to ["CR","EN","VU"].
- "endangered" alone → ["EN"]. "critically endangered" → ["CR"].
- Turkish: "tehlikede"→EN, "kritik tehlikede"→CR, "hassas"→VU, "az tehdit altinda"→NT.
- For intent, prefer "species" unless the user explicitly mentions open calls,
  programs, publications, metabolites, or organizations.`;

export async function POST(req) {
  let payload;
  try { payload = await req.json(); } catch { payload = null; }
  const query = (payload?.query || "").trim();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });
  if (query.length > 500) return NextResponse.json({ error: "query too long" }, { status: 400 });

  // Fallback path — rule-based parser when no key configured
  if (!isEnabled()) {
    const parsed = parseAsk(query, {});
    const rows = await runQuery(parsed.intent, {
      tiers: parsed.tiers, families: parsed.families,
      genera: parsed.genera, countries: parsed.countries,
      free_text: query,
    });
    return NextResponse.json({
      ai: false,
      explanation: "Showing matches (rule-based; add ANTHROPIC_API_KEY for AI mode).",
      query: { intent: parsed.intent, filters: parsed },
      rows,
    });
  }

  // AI path
  let claudeOut;
  try {
    claudeOut = await askJSON({
      system: ASK_SYSTEM,
      user: `User question: ${query}`,
      maxTokens: 500,
    });
  } catch (e) {
    return NextResponse.json({ error: `Claude error: ${e.message}` }, { status: 502 });
  }

  const spec = claudeOut.parsed;
  if (!spec || !spec.intent) {
    await logUsage({
      route: "ask",
      model: claudeOut.model,
      tokensIn: claudeOut.usage?.input_tokens,
      tokensOut: claudeOut.usage?.output_tokens,
      latencyMs: claudeOut.latencyMs,
      ok: false,
      errorText: "couldn't parse spec",
    });
    return NextResponse.json({ error: "Couldn't parse the question into a query." }, { status: 422 });
  }

  const rows = await runQuery(spec.intent, spec.filters || {});

  await logUsage({
    route: "ask",
    model: claudeOut.model,
    tokensIn: claudeOut.usage?.input_tokens,
    tokensOut: claudeOut.usage?.output_tokens,
    latencyMs: claudeOut.latencyMs,
    ok: true,
  });

  return NextResponse.json({
    ai: true,
    model: claudeOut.model,
    explanation: spec.explanation || "",
    query: { intent: spec.intent, filters: spec.filters },
    rows,
    usage: { input: claudeOut.usage?.input_tokens, output: claudeOut.usage?.output_tokens, latency_ms: claudeOut.latencyMs },
  });
}

async function runQuery(intent, f) {
  const tiers     = Array.isArray(f.tiers)     ? f.tiers.filter(Boolean) : [];
  const families  = Array.isArray(f.families)  ? f.families.filter(Boolean) : [];
  const genera    = Array.isArray(f.genera)    ? f.genera.filter(Boolean) : [];
  const countries = Array.isArray(f.countries) ? f.countries.filter(Boolean).map((c) => c.toUpperCase()) : [];
  const freeText  = (f.free_text || "").trim();

  if (intent === "open_calls") {
    const { data } = await supabase.rpc("list_open_proposals");
    return (data || []).slice(0, 30);
  }

  // species fallback (also handles unknown intents)
  let q = supabase
    .from("species")
    .select("id, accepted_name, common_name, family, genus, iucn_status, country_focus, thumbnail_url, composite_score")
    .order("composite_score", { ascending: false, nullsFirst: false })
    .limit(60);

  if (tiers.length)     q = q.in("iucn_status",  tiers);
  if (families.length)  q = q.in("family",       families);
  if (genera.length)    q = q.in("genus",        genera);
  if (countries.length) q = q.in("country_focus", countries);

  // If nothing structured was extracted at all, fall through to fulltext
  if (!tiers.length && !families.length && !genera.length && !countries.length && freeText.length >= 2) {
    const { data } = await supabase.rpc("search_species_fulltext", { p_query: freeText, p_limit: 30 });
    return data || [];
  }

  const { data } = await q;
  return data || [];
}
