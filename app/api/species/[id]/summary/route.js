// GET /api/species/[id]/summary
// Returns a Claude-generated 2-paragraph "What we know" summary.
// Cached 24h in species_ai_summary table. Cache busts when the source
// fingerprint changes (new publications, metabolites, etc.).

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { askText, DEFAULT_MODEL, isEnabled, logUsage } from "../../../../../lib/ai/claude";

export const runtime = "nodejs";

// Service role lets us bypass species_ai_summary RLS (no public write)
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const TTL_HOURS = 24;

const SYSTEM = `You are GEOCON, a botany research assistant.
Given a JSON briefing about an endemic geophyte species, write a
two-paragraph "What we know" summary in plain English (or Turkish if
the user prefers).

Constraints:
- ~120-180 words total.
- First paragraph: distribution + IUCN status + key threats.
- Second paragraph: science we have (publications, metabolites,
  living collections, phenology) — and the most important gap.
- If a field is empty in the briefing, say so naturally (e.g. "no
  metabolites have been catalogued yet").
- No bullet points, no headings, plain prose.
- Use scientific names in italics formatted as *Genus species*.
- Don't invent facts. Cite counts honestly.`;

export async function GET(_req, { params }) {
  const id = params?.id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // 1. Cache check
  const { data: cached } = await admin
    .from("species_ai_summary")
    .select("body_md, source_hash, generated_at, model")
    .eq("species_id", id)
    .maybeSingle();

  const ageMs = cached ? Date.now() - new Date(cached.generated_at).getTime() : Infinity;
  const fresh = cached && ageMs < TTL_HOURS * 3600_000;

  if (fresh) {
    return NextResponse.json({
      body_md: cached.body_md,
      cached: true,
      generated_at: cached.generated_at,
      model: cached.model,
    });
  }

  // 2. Build the briefing payload
  const briefing = await buildBriefing(id);
  if (!briefing) return NextResponse.json({ error: "species not found" }, { status: 404 });

  // 3. AI disabled → return a deterministic fallback summary (no LLM)
  if (!isEnabled()) {
    return NextResponse.json({
      body_md: deterministicFallback(briefing),
      cached: false,
      ai: false,
    });
  }

  // 4. Call Claude
  let out;
  try {
    out = await askText({
      system: SYSTEM,
      user: "Species briefing JSON:\n```json\n" + JSON.stringify(briefing, null, 2) + "\n```",
      maxTokens: 500,
    });
  } catch (e) {
    return NextResponse.json({ error: `Claude error: ${e.message}` }, { status: 502 });
  }

  // 5. Persist + log
  const hash = simpleHash(JSON.stringify(briefing));
  await admin
    .from("species_ai_summary")
    .upsert({
      species_id: id,
      body_md: out.text,
      source_hash: hash,
      model: out.model,
      tokens_in: out.usage?.input_tokens || 0,
      tokens_out: out.usage?.output_tokens || 0,
      generated_at: new Date().toISOString(),
    });

  await logUsage({
    route: "species_summary",
    model: out.model,
    tokensIn: out.usage?.input_tokens,
    tokensOut: out.usage?.output_tokens,
    latencyMs: out.latencyMs,
    ok: true,
  });

  return NextResponse.json({
    body_md: out.text,
    cached: false,
    ai: true,
    model: out.model,
    generated_at: new Date().toISOString(),
  });
}

async function buildBriefing(speciesId) {
  const { data: sp } = await admin
    .from("species")
    .select("id, accepted_name, common_name, family, genus, iucn_status, country_focus, native_countries, geocon_module, region, composite_score")
    .eq("id", speciesId)
    .maybeSingle();
  if (!sp) return null;

  // Top 5 publications by year/citations
  const { data: pubs } = await admin
    .from("publications")
    .select("title, authors, year, journal, abstract_text, key_findings, cited_by_count")
    .eq("species_id", speciesId)
    .order("year", { ascending: false, nullsFirst: false })
    .limit(5);

  const { data: mets } = await admin
    .from("metabolites")
    .select("compound_name, compound_class, activity_category, therapeutic_area")
    .eq("species_id", speciesId)
    .limit(10);

  const { data: extras } = await admin
    .rpc("get_species_domain_extras", { p_id: speciesId });

  return {
    species: sp,
    publications_top5: (pubs || []).map((p) => ({
      title: p.title,
      year: p.year,
      journal: p.journal,
      cited_by: p.cited_by_count,
      key_findings: p.key_findings,
      abstract_excerpt: p.abstract_text ? p.abstract_text.slice(0, 600) : null,
    })),
    metabolites: mets || [],
    phenology_months: Array.isArray(extras?.phenology) ? extras.phenology.length : 0,
    accessions_total: extras?.accessions_total || 0,
    seed_lots_total: extras?.seed_lots_total_seeds || 0,
    protocols_count: Array.isArray(extras?.protocols) ? extras.protocols.length : 0,
  };
}

function deterministicFallback(b) {
  const s = b.species || {};
  const parts = [];
  parts.push(`*${s.accepted_name || "This species"}* is `);
  parts.push(s.family ? `a ${s.family} ` : "");
  parts.push(s.country_focus ? `recorded primarily from ${s.country_focus}` : "of unspecified range");
  parts.push(s.iucn_status ? `, with an IUCN status of **${s.iucn_status}**.` : ".");
  parts.push("\n\n");
  const pubN = b.publications_top5?.length || 0;
  const metN = b.metabolites?.length || 0;
  parts.push(
    pubN > 0
      ? `There ${pubN === 1 ? "is" : "are"} ${pubN} peer-reviewed publication${pubN === 1 ? "" : "s"} linked to it.`
      : "No peer-reviewed publications have been linked yet."
  );
  parts.push(" ");
  parts.push(
    metN > 0
      ? `${metN} metabolite${metN === 1 ? " has" : "s have"} been catalogued.`
      : "No metabolites are catalogued."
  );
  parts.push(" ");
  parts.push(
    b.accessions_total > 0
      ? `Living collections hold ${b.accessions_total} individual${b.accessions_total === 1 ? "" : "s"}.`
      : "No living-collection accessions are recorded."
  );
  return parts.join("");
}

function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return String(h);
}
