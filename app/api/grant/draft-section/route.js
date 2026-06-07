// Grant Studio Phase 1 — AI-assisted section drafting.
//
// Drafts ONE proposal section, grounded in the linked program's REAL data
// (species + IUCN status, outcomes, publications) so the text is specific,
// not generic. The draft is RETURNED for the user to review/edit/save — it
// is never auto-saved as fact. AI is instructed to use only provided facts
// and to mark missing specifics with [EKLE: …] placeholders (no fabrication).

import { createClient } from "@supabase/supabase-js";
import { askText, isEnabled, logUsage, DEFAULT_MODEL } from "../../../../lib/ai/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon";

export async function POST(req) {
  if (!isEnabled()) return Response.json({ error: "AI not configured" }, { status: 503 });

  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return Response.json({ error: "auth required" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad body" }, { status: 400 }); }
  const { proposalId, sectionKey } = body || {};
  if (!proposalId || !sectionKey) return Response.json({ error: "proposalId + sectionKey required" }, { status: 400 });

  // user-scoped client → the context RPC is creator-gated (auth.uid())
  const sb = createClient(URL, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: ctx, error } = await sb.rpc("get_grant_draft_context", { p_proposal_id: proposalId });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!ctx) return Response.json({ error: "not found or not yours" }, { status: 403 });

  const section = (ctx.template_sections || []).find((s) => s.key === sectionKey);
  if (!section) return Response.json({ error: "section not in template" }, { status: 400 });

  const lang = ctx.language === "en" ? "English" : "Turkish";
  const prog = ctx.program;
  const facts = prog ? [
    `Program: ${prog.name || "—"}${prog.type ? ` (${prog.type})` : ""}${prog.scope ? `, scope: ${prog.scope}` : ""}.`,
    prog.member_count ? `Team members: ${prog.member_count}.` : "",
    Array.isArray(prog.species) && prog.species.length
      ? `Target species (${prog.species.length}): ` + prog.species.map((s) => `${s.name}${s.iucn && s.iucn !== "NE" ? ` [IUCN ${s.iucn}]` : ""}${s.family ? ` (${s.family})` : ""}`).join("; ") + "."
      : "",
    Array.isArray(prog.outcomes) && prog.outcomes.length ? `Documented outcomes: ${prog.outcomes.join("; ")}.` : "",
    Array.isArray(prog.publications) && prog.publications.length ? `Related publications: ${prog.publications.slice(0, 6).join("; ")}.` : "",
  ].filter(Boolean).join("\n") : "No GEOCON program is linked to this proposal yet — draft a sound skeleton and mark all specifics with placeholders.";

  const system =
    `You are a grant-writing assistant for a conservation & biodiversity research platform (a geophyte conservation atlas). ` +
    `Draft ONLY the requested proposal section, in ${lang}, in a professional academic register suitable for the funder. ` +
    `Ground the text strictly in the FACTS provided. Do NOT invent data, numbers, partner names, budgets, dates, or citations. ` +
    `Where a specific that you don't have is needed (a figure, a partner, a date), insert a clearly-marked placeholder like [EKLE: …] (Turkish) or [ADD: …] (English) for the author to complete. ` +
    `Aim for roughly the target word count. Return the section body only — no headings, no preamble, no meta commentary.`;

  const user =
    `Funder: ${ctx.funder} · ${ctx.program_code}\n` +
    `Proposal working title: ${ctx.title}\n\n` +
    `SECTION TO DRAFT: ${section.title}\n` +
    `Guidance: ${section.guidance || "—"}\n` +
    `Target length: ~${section.word_limit || 400} words\n\n` +
    `FACTS (use only these):\n${facts}`;

  try {
    const r = await askText({ system, user, model: DEFAULT_MODEL, maxTokens: 1600 });
    await logUsage({ route: "grant/draft-section", model: r.model, tokensIn: r.usage?.input_tokens, tokensOut: r.usage?.output_tokens, latencyMs: r.latencyMs, ok: true });
    return Response.json({ draft: (r.text || "").trim(), model: r.model });
  } catch (e) {
    await logUsage({ route: "grant/draft-section", model: DEFAULT_MODEL, ok: false, errorText: String(e?.message || e) });
    return Response.json({ error: "draft failed", detail: String(e?.message || e) }, { status: 500 });
  }
}
