import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CAS_REGEX = /^[0-9]+-[0-9]+-[0-9]+$/;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const batchSize = parseInt(searchParams.get("batch_size") || "20");

  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get CAS-format metabolites that haven't been fixed yet
  const { data: metabolites, error } = await supabase
    .from("metabolites")
    .select("id, compound_name, activity_category, species_id")
    .limit(batchSize * 3);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const casRecords = (metabolites || [])
    .filter(m => CAS_REGEX.test(m.compound_name))
    .slice(0, batchSize);

  if (casRecords.length === 0) {
    return Response.json({ message: "No CAS numbers found", fixed: 0 });
  }

  // Ask Claude to identify compound names from CAS numbers in batch
  const casList = casRecords.map(r => `${r.compound_name} (${r.activity_category})`).join("\n");

  const prompt = `You are a biochemistry expert. Convert these CAS registry numbers to their common compound names.
For each CAS number, provide the most commonly used name in biochemistry literature.
If you don't know a CAS number, respond with "UNKNOWN".

CAS numbers (with their compound class as hint):
${casList}

Respond with ONLY a JSON array, no other text:
[
  {"cas": "12345-67-8", "name": "Compound Name"},
  ...
]`;

  let fixed = 0;
  const errors = [];

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    });

    const text = response.content[0].text.trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const results = JSON.parse(clean);

    for (const result of results) {
      if (!result.name || result.name === "UNKNOWN") continue;

      const record = casRecords.find(r => r.compound_name === result.cas);
      if (!record) continue;

      const { error: upErr } = await supabase
        .from("metabolites")
        .update({ compound_name: result.name })
        .eq("id", record.id);

      if (upErr) errors.push(`${result.cas}: ${upErr.message}`);
      else fixed++;
    }
  } catch (e) {
    errors.push(`Claude API error: ${e.message}`);
  }

  return Response.json({
    total_cas: casRecords.length,
    fixed,
    not_found: casRecords.length - fixed,
    errors: errors.slice(0, 5)
  });
}
