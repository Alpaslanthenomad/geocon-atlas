import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH = 50;

const CATEGORIES = [
  "Phytochemistry",
  "Conservation",
  "Agronomy",
  "Pharmacology",
  "Taxonomy",
  "Ecology",
  "Biotechnology",
  "Other"
];

async function categorize(publications) {
  const items = publications.map((p, i) => ({
    index: i,
    title: (p.title || "").slice(0, 200),
    abstract: (p.abstract || "").slice(0, 300),
    journal: (p.journal || "").slice(0, 80),
  }));

  const prompt = `Categorize each publication into exactly one category.

Categories:
- Phytochemistry: metabolites, compounds, chemical analysis, essential oils, secondary metabolites
- Conservation: threatened species, population, habitat loss, protected areas, extinction risk
- Agronomy: cultivation, yield, farming, crop production, soil, fertilizer, irrigation
- Pharmacology: medical activity, drug, clinical, therapeutic, toxicology, bioactivity, anti-inflammatory
- Taxonomy: systematics, phylogeny, classification, morphology, nomenclature
- Ecology: distribution, habitat, ecology, community, population dynamics, GBIF, occurrence
- Biotechnology: tissue culture, in vitro, micropropagation, bioreactor, genetic, CRISPR, cell culture
- Other: anything that doesn't fit above

Publications:
${items.map(p => `[${p.index}] Title: ${p.title} | Journal: ${p.journal} | Abstract: ${p.abstract}`).join("\n")}

Respond ONLY with a JSON array of objects with "index" and "category" fields. No other text, no markdown.
Example: [{"index":0,"category":"Phytochemistry"},{"index":1,"category":"Conservation"}]`;

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

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || "[]";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batch = parseInt(url.searchParams.get("batch") || "0");
  const force = url.searchParams.get("force") === "true";
  const log = { batch, processed: 0, categorized: 0, errors: [] };

  // Fetch uncategorized publications (or all if force=true)
  const query = sb
    .from("publications")
    .select("id, title, abstract, journal")
    .order("year", { ascending: false })
    .range(batch * BATCH, (batch + 1) * BATCH - 1);

  if (!force) query.is("category", null);

  const { data: pubs, error } = await query;
  if (error) return Response.json({ ...log, fatal: error.message }, { status: 500 });
  if (!pubs?.length) return Response.json({ ...log, message: "No uncategorized publications in batch" });

  // Process in chunks of 20 to stay within Claude's context
  const CHUNK = 20;
  for (let i = 0; i < pubs.length; i += CHUNK) {
    const chunk = pubs.slice(i, i + CHUNK);
    try {
      const results = await categorize(chunk);

      for (const r of results) {
        const pub = chunk[r.index];
        if (!pub) continue;
        const category = CATEGORIES.includes(r.category) ? r.category : "Other";

        const { error: upErr } = await sb
          .from("publications")
          .update({ category })
          .eq("id", pub.id);

        if (upErr) log.errors.push(`${pub.id}: ${upErr.message}`);
        else log.categorized++;
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
