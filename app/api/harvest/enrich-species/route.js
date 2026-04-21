import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  // Fetch species without market_area or tc_status
  const { data: species, error } = await sb
    .from("species")
    .select("id, accepted_name, genus, family, geophyte_type, iucn_status, market_area, tc_status, habitat, region, country_focus")
    .or("market_area.is.null,tc_status.is.null")
    .range(offset, offset + limit - 1);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!species?.length) return Response.json({ message: "All species enriched", enriched: 0 });

  const list = species.map((s, i) =>
    `${i + 1}. ${s.accepted_name} | Family: ${s.family} | Genus: ${s.genus} | Type: ${s.geophyte_type || "geophyte"} | IUCN: ${s.iucn_status || "NE"} | Region: ${s.region || s.country_focus || "unknown"}`
  ).join("\n");

  const prompt = `You are a plant biotechnology and conservation expert specializing in geophytes (bulbous, cormous, rhizomatous plants).

For each species below, provide:
1. market_area: The most likely commercial application(s). Choose from and combine as needed:
   - "Ornamental" (decorative bulbs, garden plants)
   - "Cut flower" (fresh/dried flower trade)
   - "Cosmetic" (extracts, fragrances, skin care)
   - "Pharmaceutical" (medicinal compounds, drug precursors)
   - "Nutraceutical" (food supplements, functional food)
   - "Spice/Food" (culinary use)
   - "Dye/Pigment" (natural colorants)
   - "Research" (scientific/model organism value only)
   Use combinations like "Ornamental + Cosmetic" or "Pharmaceutical + Nutraceutical"

2. tc_status: Likely tissue culture feasibility based on genus and family knowledge:
   - "Established — well documented protocols"
   - "Advanced — multiple protocols available"  
   - "Moderate — some protocols, optimization needed"
   - "Initiated — preliminary work reported"
   - "Early — basic research only"
   - "Challenging — significant technical barriers"
   - "Unknown — no TC reports found"

Be specific and realistic. Use your botanical knowledge of each genus.

Species:
${list}

Return ONLY valid JSON array, no markdown:
[{"id_index":1,"market_area":"Ornamental + Cosmetic","tc_status":"Moderate — optimization needed"},...]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const apiData = await res.json();
  if (!apiData.content?.[0]?.text) {
    return Response.json({ error: "API error", details: JSON.stringify(apiData).slice(0, 200) }, { status: 500 });
  }

  let results;
  try {
    const text = apiData.content[0].text.replace(/```json|```/g, "").trim();
    results = JSON.parse(text);
  } catch (e) {
    return Response.json({ error: "Parse failed", raw: apiData.content[0].text.slice(0, 300) }, { status: 500 });
  }

  let enriched = 0;
  const errors = [];
  const log = [];

  for (const result of results) {
    const sp = species[result.id_index - 1];
    if (!sp) continue;

    const update = {};
    if (!sp.market_area && result.market_area) update.market_area = result.market_area;
    if (!sp.tc_status && result.tc_status) update.tc_status = result.tc_status;

    if (Object.keys(update).length === 0) continue;

    const { error: upErr } = await sb.from("species").update(update).eq("id", sp.id);
    if (upErr) errors.push(`${sp.accepted_name}: ${upErr.message}`);
    else {
      enriched++;
      log.push({ name: sp.accepted_name, ...update });
    }
  }

  return Response.json({
    total: species.length,
    enriched,
    next_offset: offset + limit,
    sample: log.slice(0, 5),
    errors: errors.slice(0, 5)
  });
}
