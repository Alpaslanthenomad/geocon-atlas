import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const batchSize = parseInt(searchParams.get("batch_size") || "20");

  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get CAS-format metabolites using Postgres regex
  const { data: metabolites, error } = await supabase
    .from("metabolites")
    .select("id, compound_name, activity_category")
    .like("compound_name", "%-%-%")
    .limit(500);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Filter to CAS format: digits-digits-digits
  const casRecords = (metabolites || [])
    .filter(m => /^\d+-\d+-\d+$/.test(m.compound_name))
    .slice(0, batchSize);

  if (casRecords.length === 0) {
    return Response.json({ 
      message: "No CAS numbers found", 
      fixed: 0,
      total_checked: metabolites?.length || 0
    });
  }

  const casList = casRecords.map(r => `${r.compound_name}`).join("\n");

  const prompt = `You are a biochemistry expert. I have a list of CAS registry numbers. For each one, provide the most common biochemical name used in scientific literature.

CAS numbers:
${casList}

Rules:
- Use the most commonly known name (not IUPAC if a trivial name exists)
- If truly unknown, write "UNKNOWN"
- Keep names concise (under 50 characters when possible)

Respond ONLY with valid JSON, no markdown:
[{"cas":"12345-67-8","name":"Compound Name"},...]`;

  let fixed = 0;
  const errors = [];
  const results_log = [];

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const apiData = await res.json();
    if (!apiData.content || !apiData.content[0]) {
      errors.push("API error: " + JSON.stringify(apiData).slice(0,200));
      return Response.json({ total_cas: casRecords.length, fixed: 0, errors });
    }
    const text = apiData.content[0].text.trim()
      .replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    
    const results = JSON.parse(text);

    for (const result of results) {
      if (!result.name || result.name === "UNKNOWN") {
        results_log.push({ cas: result.cas, status: "unknown" });
        continue;
      }

      const record = casRecords.find(r => r.compound_name === result.cas);
      if (!record) continue;

      const { error: upErr } = await supabase
        .from("metabolites")
        .update({ compound_name: result.name })
        .eq("id", record.id);

      if (upErr) {
        errors.push(`${result.cas}: ${upErr.message}`);
        results_log.push({ cas: result.cas, name: result.name, status: "db_error" });
      } else {
        fixed++;
        results_log.push({ cas: result.cas, name: result.name, status: "fixed" });
      }
    }
  } catch (e) {
    errors.push(`Error: ${e.message}`);
  }

  return Response.json({
    total_cas: casRecords.length,
    fixed,
    not_found: casRecords.length - fixed,
    sample: results_log.slice(0, 5),
    errors: errors.slice(0, 5)
  });
}
