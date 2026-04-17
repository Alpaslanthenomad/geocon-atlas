import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CATEGORIES = ["alkaloid","flavonoid","terpenoid","phenolic","saponin","glycoside","steroid","amino acid","other"];

async function classifyChunk(metabolites) {
  const items = metabolites.map((m, i) => ({
    index: i,
    name: m.compound_name || "",
    cls: m.compound_class || "",
    activity: m.reported_activity || "",
  }));

  const prompt = `Classify each compound into exactly one category based on its name and class.

Categories:
- alkaloid: nitrogen-containing compounds (colchicine, lycorine, galanthamine, indole, purine derivatives)
- flavonoid: polyphenolic flavones, isoflavones, anthocyanins, quercetin, kaempferol, rutin
- terpenoid: terpenes, gibberellins, diterpenes, monoterpenes, sesquiterpenes, carotenoids, limonene
- phenolic: phenolic acids, benzoic acid, cinnamic acid, caffeic acid, ferulic acid, coumarins
- saponin: steroidal or triterpenoid saponins
- glycoside: compounds with sugar moiety, glucosides, galactosides
- steroid: sterols, sitosterol, stigmasterol, cholesterol, steroidal compounds
- amino acid: amino acids, peptides, proteins
- other: anything that doesn't clearly fit above

Compounds:
${items.map(m => `[${m.index}] Name: ${m.name} | Class: ${m.cls} | Activity: ${m.activity}`).join("\n")}

Respond ONLY with JSON array: [{"index":0,"category":"alkaloid"},...]. No other text.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || "[]";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch { return []; }
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const force = url.searchParams.get("force") === "true";
  const log = { processed: 0, classified: 0, errors: [] };

  // Fetch metabolites that need classification
  let query = sb.from("metabolites").select("id, compound_name, compound_class, reported_activity");
  if (!force) query = query.eq("activity_category", "other");
  const { data: mets, error } = await query;

  if (error) return Response.json({ ...log, fatal: error.message }, { status: 500 });
  if (!mets?.length) return Response.json({ ...log, message: "Nothing to classify" });

  log.total = mets.length;

  // Process in chunks of 30
  const CHUNK = 30;
  for (let i = 0; i < mets.length; i += CHUNK) {
    const chunk = mets.slice(i, i + CHUNK);
    try {
      const results = await classifyChunk(chunk);

      for (const r of results) {
        const met = chunk[r.index];
        if (!met) continue;
        const category = CATEGORIES.includes(r.category) ? r.category : "other";
        
        const { error: upErr } = await sb
          .from("metabolites")
          .update({ activity_category: category })
          .eq("id", met.id);

        if (upErr) log.errors.push(`${met.compound_name}: ${upErr.message}`);
        else log.classified++;
      }

      log.processed += chunk.length;
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      log.errors.push(`chunk ${i}: ${e.message}`);
      log.processed += chunk.length;
    }
  }

  return Response.json(log);
}
