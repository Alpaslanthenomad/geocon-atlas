import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const batchSize = parseInt(searchParams.get("batch_size") || "30");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch researchers not yet scored (priority is null or 0)
  const { data: researchers, error } = await supabase
    .from("researchers")
    .select("id, name, expertise_area, department, collaboration_fit")
    .or("priority.is.null,priority.eq.0")
    .range(offset, offset + batchSize - 1);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!researchers?.length) return Response.json({ message: "All researchers scored", scored: 0 });

  // Build batch prompt
  const list = researchers.map((r, i) =>
    `${i + 1}. Name: ${r.name} | Expertise: ${r.expertise_area || "Unknown"} | Dept: ${r.department || "Unknown"}`
  ).join("\n");

  const prompt = `You are scoring researchers for relevance to a GEOPHYTE CONSERVATION and PLANT BIOTECHNOLOGY platform (GEOCON).

The platform focuses on:
- Bulbous/cormous/rhizomatous plant species (Tulipa, Crocus, Fritillaria, Allium, Galanthus, Cyclamen, Orchidaceae etc.)
- Ex situ conservation and tissue culture (micropropagation, in vitro)
- Phytochemistry and secondary metabolites of geophytes
- Plant ecology and conservation biology
- Ornamental horticulture and bulb production

Score each researcher on TWO criteria:

1. priority (1-5):
   5 = Directly works on geophytes OR plant tissue culture OR geophyte phytochemistry
   4 = Works on related bulb/ornamental plants, plant conservation, OR plant biotechnology broadly
   3 = Plant scientist but not specifically geophytes (ecology, taxonomy, general botany)
   2 = Adjacent field (mycology, general biochemistry, plant pathology)
   1 = Unrelated field (immunology, bone health, marine biology, microbiology etc.)

2. collaboration_fit (one of): "Core", "Secondary", "Peripheral", "Not relevant"
   Core = Direct geophyte/TC/conservation specialist
   Secondary = Plant scientist, useful for specific aspects
   Peripheral = Adjacent, occasional relevance
   Not relevant = No connection to geophyte conservation

Researchers to score:
${list}

Return ONLY valid JSON array, no markdown:
[{"id_index":1,"priority":5,"collaboration_fit":"Core"},...]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
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

  let scored = 0;
  const errors = [];

  for (const result of results) {
    const researcher = researchers[result.id_index - 1];
    if (!researcher) continue;

    // Convert numeric priority (1-5) to enum: high, medium, candidate, inactive
    const priorityMap = {
      5: "high", 4: "high",
      3: "medium", 2: "candidate", 1: "inactive"
    };
    const priorityText = priorityMap[result.priority] || "candidate";

    const { error: upErr } = await supabase
      .from("researchers")
      .update({
        priority: priorityText,
        collaboration_fit: result.collaboration_fit
      })
      .eq("id", researcher.id);

    if (upErr) errors.push(`${researcher.name}: ${upErr.message}`);
    else scored++;
  }

  return Response.json({
    total: researchers.length,
    scored,
    offset,
    next_offset: offset + batchSize,
    errors: errors.slice(0, 5)
  });
}
