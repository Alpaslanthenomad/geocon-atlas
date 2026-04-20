import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const SYSTEM_PROMPT = `You are GEOCON ATLAS AI — a scientific data extraction engine for geophyte (bulbous plant) research. 

Given a publication title, authors, journal, and any available abstract, extract structured information in JSON format.

Return ONLY valid JSON with this exact structure:
{
  "metabolite_claims": [
    {
      "compound_name": "string",
      "compound_class": "string (e.g. alkaloid, flavonoid, saponin)",
      "reported_activity": "string",
      "therapeutic_area": "string or null",
      "cosmetic_relevance": "string or null",
      "evidence_level": "Discovery|Preclinical|Clinical|Established",
      "confidence": 0.0-1.0
    }
  ],
  "protocol_claims": [
    {
      "protocol_type": "string (e.g. micropropagation, somatic embryogenesis, cryopreservation)",
      "explant_type": "string or null",
      "medium": "string or null",
      "success_indicator": "string or null",
      "trl_estimate": 1-6,
      "confidence": 0.0-1.0
    }
  ],
  "researcher_expertise": [
    {
      "name": "string",
      "expertise_tags": ["string"],
      "institution_hint": "string or null"
    }
  ],
  "species_relevance": {
    "conservation_signal": "string or null (any conservation status or threat info)",
    "commercial_signal": "string or null (any market or commercial potential info)",
    "key_finding": "string (one-sentence summary of most important finding)"
  },
  "extraction_confidence": 0.0-1.0,
  "extraction_notes": "string (any caveats or quality notes)"
}

If the publication seems irrelevant to geophytes, return minimal JSON with extraction_confidence < 0.2.
Be conservative with confidence scores. Only extract what is clearly stated or strongly implied.`;

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
      system: SYSTEM_PROMPT,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}

  return null;
}

async function enrichPublication(db, pub) {
  const prompt = `Extract structured geophyte research data from this publication:

Title: ${pub.title || "Unknown"}
Authors: ${pub.authors || "Unknown"}
Journal: ${pub.journal || "Unknown"}
Year: ${pub.year || "Unknown"}
Species link: ${pub.species?.accepted_name || "Unknown species"}
Topic: ${pub.primary_topic || "Not specified"}
DOI: ${pub.doi || "None"}

Extract all metabolite claims, propagation protocol details, researcher expertise tags, and species-relevant findings.`;

  const result = await callClaude(prompt);
  if (!result) return { metabolites: 0, protocols: 0 };

  let newMetabolites = 0;

  for (const claim of result.metabolite_claims || []) {
    if (!claim.compound_name || claim.confidence < 0.3) continue;

    const metId = `MET-AI-${pub.id.slice(-4)}-${(claim.compound_name || "").slice(0, 6).replace(/\s/g, "")}`;

    const { data: existing } = await db
      .from("metabolites")
      .select("id")
      .ilike("compound_name", `%${claim.compound_name}%`)
      .eq("species_id", pub.species_id)
      .single();

    if (existing) {
      await db.from("metabolites").update({
        notes: db.raw ? undefined : `AI-enriched: ${claim.reported_activity || ""} | Confidence: ${claim.confidence}`,
        last_verified: new Date().toISOString().split("T")[0],
      }).eq("id", existing.id);
    } else {
      await db.from("metabolites").upsert({
        id: metId,
        species_id: pub.species_id,
        compound_name: claim.compound_name,
        compound_class: claim.compound_class || "AI-classified pending",
        reported_activity: claim.reported_activity || "Extracted from literature",
        activity_category: claim.therapeutic_area ? "Pharmacological" : "Pending",
        therapeutic_area: claim.therapeutic_area || null,
        cosmetic_relevance: claim.cosmetic_relevance || null,
        evidence: claim.evidence_level || "Discovery",
        confidence: claim.confidence || 0.3,
        source_database: "Claude AI extraction",
        source_paper_id: pub.id,
        ip_potential: "Under AI assessment",
        last_verified: new Date().toISOString().split("T")[0],
        notes: `AI-extracted from: ${(pub.title || "").slice(0, 60)}. Confidence: ${claim.confidence}`,
      }, { onConflict: "id" });
      newMetabolites++;
    }
  }

  const keyFinding = result.species_relevance?.key_finding;
  if (keyFinding && pub.id) {
    await db.from("publications").update({
      key_findings: keyFinding,
      claims_extracted: (result.metabolite_claims?.length || 0) + (result.protocol_claims?.length || 0),
    }).eq("id", pub.id);
  }

  for (const res of result.researcher_expertise || []) {
    if (!res.name) continue;
    const { data: existingRes } = await db
      .from("researchers")
      .select("id, expertise_area")
      .ilike("name", `%${res.name}%`)
      .single();

    if (existingRes && res.expertise_tags?.length) {
      const currentExpertise = existingRes.expertise_area || "";
      const newTags = res.expertise_tags.filter((t) => !currentExpertise.toLowerCase().includes(t.toLowerCase()));
      if (newTags.length) {
        const updated = currentExpertise ? `${currentExpertise}, ${newTags.join(", ")}` : newTags.join(", ");
        await db.from("researchers").update({
          expertise_area: updated.slice(0, 200),
          last_verified: new Date().toISOString().split("T")[0],
        }).eq("id", existingRes.id);
      }
    }
  }

  return {
    metabolites: newMetabolites,
    protocols: result.protocol_claims?.length || 0,
    confidence: result.extraction_confidence || 0,
  };
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const db = getSupabase();
  const startTime = Date.now();
  let totalEnriched = 0;
  let totalNewMetabolites = 0;
  let totalProtocols = 0;
  let errors = 0;

  const { data: pubs } = await db
    .from("publications")
    .select("*, species(accepted_name)")
    .is("key_findings", null)
    .not("title", "is", null)
    .order("relevance_score", { ascending: false })
    .limit(20);

  if (!pubs || pubs.length === 0) {
    return Response.json({ success: true, message: "No unenriched publications found", enriched: 0 });
  }

  for (const pub of pubs) {
    try {
      const result = await enrichPublication(db, pub);
      totalNewMetabolites += result.metabolites;
      totalProtocols += result.protocols;
      totalEnriched++;

      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      errors++;
      console.error(`Enrichment error for ${pub.id}:`, err.message);
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  await db.from("harvest_log").insert({
    source_id: "SRC-005",
    harvest_type: "Claude AI enrichment",
    query_params: JSON.stringify({ publications_processed: totalEnriched }),
    records_fetched: totalEnriched,
    records_new: totalNewMetabolites,
    records_updated: totalEnriched,
    errors: errors,
    freshness_score: 0.95,
    status: errors === 0 ? "success" : "partial",
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: duration,
    next_scheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return Response.json({
    success: true,
    duration_seconds: duration,
    publications_enriched: totalEnriched,
    new_metabolites_discovered: totalNewMetabolites,
    protocol_claims_extracted: totalProtocols,
    errors: errors,
    cost_estimate: `~$${(totalEnriched * 0.003).toFixed(3)}`,
  });
}
