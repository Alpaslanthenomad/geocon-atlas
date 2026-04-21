import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const BATCH_SIZE = 20; // Her çalıştırmada kaç yayın işlensin
const DELAY_MS = 500;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── Claude API'ye abstract gönder, metabolit çıkar ── */
async function extractMetabolitesFromAbstract(publication) {
  const prompt = `You are a plant biochemistry expert. Extract metabolite/compound information from this scientific abstract.

Species: ${publication.species?.accepted_name || "unknown"}
Title: ${publication.title}
Abstract: ${publication.abstract}

Return ONLY a JSON array (no markdown, no explanation) of compounds found. Each object must have exactly these fields:
{
  "compound_name": "exact compound name",
  "compound_class": "one of: Alkaloid, Flavonoid, Terpenoid, Saponin, Glycoside, Phenolic, Steroid, Polysaccharide, Carotenoid, Essential oil, Other",
  "reported_activity": "brief description of biological activity mentioned",
  "activity_category": "one of: Pharmaceutical, Cosmeceutical, Nutraceutical, Agricultural, Industrial",
  "therapeutic_area": "disease or condition targeted, or empty string",
  "plant_organ": "where compound is found: bulb, tuber, leaf, flower, rhizome, seed, or empty string",
  "evidence": "one of: In vitro, In vivo, Clinical, Review, Isolation only",
  "confidence": 0.0 to 1.0 based on how clearly the compound is described,
  "molecular_formula": "if mentioned, else empty string",
  "molecular_weight": null or number if mentioned
}

If no compounds are clearly mentioned, return empty array [].
Return only valid JSON array, nothing else.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
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

/* ── Metabolitleri Supabase'e kaydet ── */
async function saveMetabolites(publication, compounds) {
  let newCount = 0;
  for (const compound of compounds) {
    if (!compound.compound_name || compound.compound_name.length < 2) continue;
    if (compound.confidence < 0.4) continue; // düşük güven atla

    // Duplicate kontrolü — aynı tür + bileşik adı
    const { data: existing } = await supabase
      .from("metabolites")
      .select("id")
      .eq("species_id", publication.species_id)
      .ilike("compound_name", compound.compound_name)
      .maybeSingle();
    if (existing) continue;

    const metId = `MET-AI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const { error } = await supabase.from("metabolites").insert({
      id: metId,
      species_id: publication.species_id,
      compound_name: compound.compound_name,
      compound_class: compound.compound_class || "Other",
      reported_activity: compound.reported_activity || null,
      activity_category: compound.activity_category || null,
      therapeutic_area: compound.therapeutic_area || null,
      plant_organ: compound.plant_organ || null,
      evidence: compound.evidence || null,
      confidence: compound.confidence || 0.5,
      molecular_formula: compound.molecular_formula || null,
      molecular_weight: compound.molecular_weight || null,
      source_paper_id: publication.id,
      source_database: "Claude API enrichment",
      last_verified: new Date().toISOString().split("T")[0],
      notes: `Auto-extracted from: ${publication.title?.slice(0, 100)}`,
    });

    if (!error) newCount++;
  }
  return newCount;
}

/* ── MAIN HANDLER ── */
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const querySecret = new URL(request.url).searchParams.get("secret");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && querySecret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const batchIndex = parseInt(searchParams.get("batch") || "0");
  const startTime = Date.now();
  let totalProcessed = 0, totalNew = 0, totalSkipped = 0, errors = 0;

  try {
    // Abstract'ı olan ve henüz işlenmemiş yayınları çek
    const { data: publications, error } = await supabase
      .from("publications")
      .select("id, species_id, title, abstract, species(accepted_name)")
      .not("abstract", "is", null)
      .not("abstract", "eq", "")
      .order("year", { ascending: false })
      .range(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE - 1);

    if (error) throw new Error(error.message);
    if (!publications || publications.length === 0) {
      return Response.json({ message: `No publications in batch ${batchIndex}` });
    }

    for (const pub of publications) {
      if (!pub.abstract || pub.abstract.length < 100) {
        totalSkipped++;
        continue;
      }

      try {
        const compounds = await extractMetabolitesFromAbstract(pub);
        totalProcessed++;

        if (compounds.length > 0) {
          const saved = await saveMetabolites(pub, compounds);
          totalNew += saved;
        }

        await delay(DELAY_MS);
      } catch (err) {
        errors++;
        console.error(`Error processing ${pub.id}:`, err.message);
        await delay(1000); // hata sonrası daha uzun bekle
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Harvest log
    await supabase.from("harvest_log").insert({
      source_id: "SRC-CLAUDE",
      harvest_type: `Claude enrichment batch ${batchIndex}`,
      query_params: JSON.stringify({ batch: batchIndex, publications: publications.length }),
      records_fetched: totalProcessed,
      records_new: totalNew,
      errors,
      freshness_score: errors === 0 ? 1.0 : 0.7,
      status: errors === 0 ? "success" : "partial",
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_seconds: duration,
    });

    return Response.json({
      success: true,
      batch: batchIndex,
      publicationsProcessed: totalProcessed,
      publicationsSkipped: totalSkipped,
      newMetabolites: totalNew,
      errors,
      duration_seconds: duration,
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
