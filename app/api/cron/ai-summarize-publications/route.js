// U3.a — AI publication summarizer (Claude Haiku).
//
// Picks the top-N publications missing an ai_summary_md (ranked by
// citation count then year), feeds title + abstract to Claude with a
// strict "one-paragraph, conservation-focused, plain English" prompt,
// writes the result back. Idempotent — re-running skips any row that
// already has a summary.
//
// Auth: CRON_SECRET. ANTHROPIC_API_KEY must be set; if missing the
// endpoint short-circuits with a clear 503 so /admin/health can show
// "AI summaries paused — env missing".

import { createClient } from "@supabase/supabase-js";
import { DEFAULT_MODEL, askText, isEnabled } from "../../../../lib/ai/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid");
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "service");
const CRON_SECRET = process.env.CRON_SECRET;

function authorized(req) {
  const h = req.headers.get("authorization") || "";
  const fromHeader = h.startsWith("Bearer ") ? h.slice(7) : null;
  let fromQuery = null;
  try { fromQuery = new URL(req.url).searchParams.get("secret"); } catch {}
  return !!CRON_SECRET && (fromHeader === CRON_SECRET || fromQuery === CRON_SECRET);
}

const PROMPT = `You are a conservation-biology literature reviewer. Read the
publication title and abstract and write ONE paragraph (4-6 sentences) for a
researcher new to this paper. Focus on: (1) which species or taxonomic group
is studied, (2) what the methods established, (3) what the conservation-
relevant finding is, (4) what comes next if any.

Rules: no marketing tone, no hedging ("this important paper..."), no first
person, no bullet points. Plain English. If the abstract is missing or too
short to summarise, return exactly the string "INSUFFICIENT".

Publication:
Title: {{TITLE}}
Year: {{YEAR}}
Abstract: {{ABSTRACT}}
`;

export async function GET(req) { return POST(req); }

export async function POST(req) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isEnabled()) {
    return Response.json({ error: "ANTHROPIC_API_KEY not set", paused: true }, { status: 503 });
  }
  const admin = createClient(URL, KEY, { auth: { persistSession: false } });

  const u = new URL(req.url);
  const max = Math.max(1, Math.min(20, Number(u.searchParams.get("max")) || 6));

  // Fetch pending. Direct table query — service role bypasses RLS.
  const { data: rows, error } = await admin
    .from("publications")
    .select("id, title, year, abstract_text, cited_by_count")
    .is("ai_summary_md", null)
    .not("title", "is", null)
    .order("cited_by_count", { ascending: false, nullsFirst: false })
    .limit(max);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!rows || rows.length === 0) return Response.json({ ok: true, summarized: 0 });

  const model = DEFAULT_MODEL;
  let summarized = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const abstract = (row.abstract_text || "").trim();
    if (abstract.length < 80) {
      // Too short — mark as INSUFFICIENT once so we stop re-trying
      await admin.from("publications").update({
        ai_summary_md: "INSUFFICIENT",
        ai_summary_at: new Date().toISOString(),
        ai_summary_model: model,
      }).eq("id", row.id);
      skipped++;
      continue;
    }
    const prompt = PROMPT
      .replace("{{TITLE}}", row.title || "")
      .replace("{{YEAR}}", String(row.year || "n/a"))
      .replace("{{ABSTRACT}}", abstract.slice(0, 4000));

    try {
      const summary = (await askText({
        system: "You are a conservation-biology literature reviewer producing brief, plain-English paragraph summaries for researchers. No marketing tone.",
        user: prompt,
        model,
        maxTokens: 400,
      })).trim();
      if (!summary) { failed++; continue; }
      await admin.from("publications").update({
        ai_summary_md: summary,
        ai_summary_at: new Date().toISOString(),
        ai_summary_model: model,
      }).eq("id", row.id);
      summarized++;
    } catch (e) {
      console.warn("[ai-summarize]", row.id, e?.message);
      failed++;
    }
  }

  return Response.json({ ok: failed === 0, summarized, skipped, failed, total: rows.length });
}
