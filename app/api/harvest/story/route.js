import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || "service")
);

async function generateStory(sp, pubs, mets, prop, cons) {
  const prompt = `You are GEOCON's scientific and strategic writer. Write a structured story for this geophyte species from the GEOCON platform perspective.

SPECIES DATA:
- Accepted name: ${sp.accepted_name}
- Family: ${sp.family || "Unknown"}
- Geophyte type: ${sp.geophyte_type || "Unknown"}
- IUCN status: ${sp.iucn_status || "Not evaluated"}
- Endemic: ${sp.endemicity_flag ? "Yes" : "No"}
- Country focus: ${sp.country_focus || "Unknown"}
- Region: ${sp.region || "Unknown"}
- Habitat: ${sp.habitat || "Unknown"}
- TC status: ${sp.tc_status || "Not established"}
- Publications: ${pubs} linked
- Metabolites: ${mets} compounds documented
- Has propagation protocol: ${prop ? "Yes" : "No"}
- Has conservation assessment: ${cons ? "Yes" : "No"}
- Composite score: ${sp.composite_score || "Not scored"}
- Decision: ${sp.decision || sp.current_decision || "Not determined"}

Write exactly this JSON structure. Be specific, evidence-based, and concise. Maximum 3 sentences per field.

{
  "scientific_narrative": "What this species is scientifically — taxonomy, morphology, ecology, distribution. Factual and botanical.",
  "conservation_context": "Why this species is under pressure — habitat threats, collection pressure, climate vulnerability, population trend.",
  "habitat_story": "Where this species lives — specific ecosystems, elevation, soil type, associated species, seasonal behavior.",
  "geocon_rationale": "Why GEOCON has selected this species — the intersection of urgency, scientific opportunity, and strategic fit.",
  "rescue_urgency": "What happens if nothing is done — realistic worst case, timeline, irreversibility.",
  "propagation_pathway": "What the propagation journey looks like — current TC status, what protocol would involve, expected timeline, challenges."
}

Return ONLY valid JSON. No markdown, no explanation, no preamble.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || "{}";

  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = url.searchParams.get("force") === "true";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 50);
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const speciesId = url.searchParams.get("species_id");
  const log = { processed: 0, generated: 0, skipped: 0, errors: [] };

  let allSpecies = [];

  if (speciesId) {
    // Tek tür modu
    const { data } = await sb.from("species").select(`
      id, accepted_name, family, geophyte_type, iucn_status, endemicity_flag,
      country_focus, region, habitat, tc_status, composite_score,
      decision, current_decision
    `).eq("id", speciesId);
    allSpecies = data || [];

  } else if (force) {
    // Force modu: batch + offset ile paginate
    const { data } = await sb.from("species").select(`
      id, accepted_name, family, geophyte_type, iucn_status, endemicity_flag,
      country_focus, region, habitat, tc_status, composite_score,
      decision, current_decision
    `).order("composite_score", { ascending: false })
      .range(offset, offset + limit - 1);
    allSpecies = data || [];

  } else {
    // ── FİX: NOT IN yerine LEFT JOIN mantığı ─────────────────
    // Önce bu batch'teki türleri çek (offset + limit ile paginate)
    const { data: batchSpecies } = await sb.from("species").select(`
      id, accepted_name, family, geophyte_type, iucn_status, endemicity_flag,
      country_focus, region, habitat, tc_status, composite_score,
      decision, current_decision
    `).order("composite_score", { ascending: false })
      .range(offset, offset + limit * 3 - 1); // 3x çek, filtreleyeceğiz

    if (!batchSpecies?.length) {
      return Response.json({ ...log, message: "no more species to process" });
    }

    const batchIds = batchSpecies.map(s => s.id);

    // Bu batch içinde story'si olanları bul
    const { data: existingInBatch } = await sb
      .from("species_stories")
      .select("species_id")
      .in("species_id", batchIds);

    const existingSet = new Set((existingInBatch || []).map(s => s.species_id));

    // Sadece story'si olmayanları al, limit kadar
    allSpecies = batchSpecies
      .filter(s => !existingSet.has(s.id))
      .slice(0, limit);
  }

  if (!allSpecies?.length) {
    return Response.json({ ...log, message: "no species without stories in this batch" });
  }

  // Destekleyici verileri çek
  const ids = allSpecies.map(s => s.id);
  const [pubRes, metRes, propRes, consRes] = await Promise.allSettled([
    sb.from("publications").select("species_id").in("species_id", ids),
    sb.from("metabolites").select("species_id").in("species_id", ids),
    sb.from("propagation").select("species_id").in("species_id", ids),
    sb.from("conservation").select("species_id").in("species_id", ids),
  ]);

  const pubMap = {};
  for (const p of (pubRes.value?.data || [])) pubMap[p.species_id] = (pubMap[p.species_id] || 0) + 1;
  const metMap = {};
  for (const m of (metRes.value?.data || [])) metMap[m.species_id] = (metMap[m.species_id] || 0) + 1;
  const propSet = new Set((propRes.value?.data || []).map(p => p.species_id));
  const consSet = new Set((consRes.value?.data || []).map(c => c.species_id));

  // Story'si olanları tekrar kontrol (force modu için)
  const { data: existingStories } = await sb
    .from("species_stories")
    .select("species_id")
    .in("species_id", ids);
  const existingSet = new Set((existingStories || []).map(s => s.species_id));

  for (const sp of allSpecies) {
    if (!force && existingSet.has(sp.id)) {
      log.skipped++;
      log.processed++;
      continue;
    }

    try {
      const story = await generateStory(
        sp,
        pubMap[sp.id] || 0,
        metMap[sp.id] || 0,
        propSet.has(sp.id),
        consSet.has(sp.id)
      );

      if (!story) {
        log.errors.push(`${sp.accepted_name}: parse failed`);
        log.processed++;
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      const payload = {
        species_id: sp.id,
        scientific_narrative: story.scientific_narrative || null,
        conservation_context: story.conservation_context || null,
        habitat_story: story.habitat_story || null,
        geocon_rationale: story.geocon_rationale || null,
        rescue_urgency: story.rescue_urgency || null,
        propagation_pathway: story.propagation_pathway || null,
        generated_by: "Claude Haiku",
        last_generated_at: new Date().toISOString(),
        is_published: false,
      };

      if (existingSet.has(sp.id)) {
        const { error } = await sb
          .from("species_stories")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("species_id", sp.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("species_stories").insert(payload);
        if (error) throw error;
      }

      log.generated++;
      log.processed++;
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      log.errors.push(`${sp.accepted_name}: ${e.message}`);
      log.processed++;
    }
  }

  return Response.json(log);
}
