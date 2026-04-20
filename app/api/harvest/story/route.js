import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateStory(sp, pubs, mets, prop, comm, cons) {
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
- Market area: ${sp.market_area || "Unknown"}
- Publications: ${pubs} linked
- Metabolites: ${mets} compounds documented
- Has propagation protocol: ${prop ? "Yes" : "No"}
- Has commercial hypothesis: ${comm ? "Yes" : "No"}
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
  "propagation_pathway": "What the propagation journey looks like — current TC status, what protocol would involve, expected timeline, challenges.",
  "commercial_hypothesis": "What commercial value this species could generate — specific sectors, compounds, applications, revenue model hypothesis.",
  "market_narrative": "Who would buy this — target buyers, market maturity, price positioning, supply gap.",
  "value_chain": "How value flows from ex situ propagation to end product — production steps, key actors, geography, IP considerations."
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
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const speciesId = url.searchParams.get("species_id"); // single species mode
  const log = { processed: 0, generated: 0, skipped: 0, errors: [] };

  // Fetch species
  let allSpecies = [];

  if (speciesId) {
    // Single species mode
    const { data } = await sb.from("species").select(`
      id, accepted_name, family, geophyte_type, iucn_status, endemicity_flag,
      country_focus, region, habitat, tc_status, market_area, composite_score,
      decision, current_decision
    `).eq("id", speciesId);
    allSpecies = data || [];
  } else if (force) {
    // Force mode: fetch all species
    const { data } = await sb.from("species").select(`
      id, accepted_name, family, geophyte_type, iucn_status, endemicity_flag,
      country_focus, region, habitat, tc_status, market_area, composite_score,
      decision, current_decision
    `).order("composite_score", { ascending: false }).limit(limit);
    allSpecies = data || [];
  } else {
    // Default: only fetch species WITHOUT stories (new species auto-handled)
    const { data: existingStoryIds } = await sb
      .from("species_stories")
      .select("species_id");
    const existingIds = (existingStoryIds || []).map(s => s.species_id);

    let q = sb.from("species").select(`
      id, accepted_name, family, geophyte_type, iucn_status, endemicity_flag,
      country_focus, region, habitat, tc_status, market_area, composite_score,
      decision, current_decision
    `).order("composite_score", { ascending: false }).limit(limit);

    if (existingIds.length > 0) {
      q = q.not("id", "in", `(${existingIds.map(id => `"${id}"`).join(",")})`);
    }
    const { data } = await q;
    allSpecies = data || [];
  }

  if (!allSpecies?.length) return Response.json({ ...log, message: "no species without stories" });

  // All fetched species need stories (existingSet only used for force/update mode)
  const { data: existingStories } = await sb
    .from("species_stories")
    .select("species_id")
    .in("species_id", allSpecies.map(s => s.id));
  const existingSet = new Set((existingStories || []).map(s => s.species_id));

  // Fetch supporting data
  const ids = allSpecies.map(s => s.id);
  const [pubRes, metRes, propRes, commRes, consRes] = await Promise.all([
    sb.from("publications").select("species_id").in("species_id", ids),
    sb.from("metabolites").select("species_id").in("species_id", ids),
    sb.from("propagation").select("species_id").in("species_id", ids),
    sb.from("commercial").select("species_id").in("species_id", ids),
    sb.from("conservation").select("species_id").in("species_id", ids),
  ]);

  const pubMap = {};
  for (const p of pubRes.data || []) pubMap[p.species_id] = (pubMap[p.species_id] || 0) + 1;
  const metMap = {};
  for (const m of metRes.data || []) metMap[m.species_id] = (metMap[m.species_id] || 0) + 1;
  const propSet = new Set((propRes.data || []).map(p => p.species_id));
  const commSet = new Set((commRes.data || []).map(c => c.species_id));
  const consSet = new Set((consRes.data || []).map(c => c.species_id));

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
        commSet.has(sp.id),
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
        commercial_hypothesis: story.commercial_hypothesis || null,
        market_narrative: story.market_narrative || null,
        value_chain: story.value_chain || null,
        generated_by: "Claude Haiku",
        last_generated_at: new Date().toISOString(),
        is_published: false,
      };

      if (existingSet.has(sp.id)) {
        // Update existing
        const { error } = await sb
          .from("species_stories")
          .update({ ...payload, story_version: sb.rpc ? undefined : 1, updated_at: new Date().toISOString() })
          .eq("species_id", sp.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await sb.from("species_stories").insert(payload);
        if (error) throw error;
      }

      log.generated++;
      log.processed++;
      await new Promise(r => setTimeout(r, 800)); // rate limit
    } catch (e) {
      log.errors.push(`${sp.accepted_name}: ${e.message}`);
      log.processed++;
    }
  }

  return Response.json(log);
}
