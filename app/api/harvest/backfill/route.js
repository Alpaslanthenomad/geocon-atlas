import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OPENALEX_EMAIL = "atlas@geocon.bio";

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return null;
  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) { words[pos] = word; }
  }
  return words.filter(Boolean).join(" ").trim() || null;
}

/* ── Tek yayın için OpenAlex'ten abstract çek ── */
async function fetchAbstract(openalexId) {
  try {
    const id = openalexId.split("/").pop();
    const url = `https://api.openalex.org/works/${id}?mailto=${OPENALEX_EMAIL}&select=id,abstract_inverted_index`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return reconstructAbstract(data.abstract_inverted_index);
  } catch { return null; }
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const batchIndex = parseInt(searchParams.get("batch") || "0");
  const BATCH_SIZE = 50; // abstract fetch daha hızlı, 50 yapabiliriz
  const startTime = Date.now();
  let updated = 0, skipped = 0, errors = 0;

  // Abstract'ı olmayan OpenAlex yayınlarını çek
  const { data: pubs, error } = await supabase
    .from("publications")
    .select("id, openalex_id")
    .eq("source", "OpenAlex")
    .is("abstract", null)
    .not("openalex_id", "is", null)
    .range(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE - 1);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!pubs || pubs.length === 0) {
    return Response.json({ message: `Batch ${batchIndex} empty — all abstracts filled or no more pubs` });
  }

  for (const pub of pubs) {
    try {
      const abstract = await fetchAbstract(pub.openalex_id);
      if (abstract) {
        await supabase.from("publications").update({ abstract }).eq("id", pub.id);
        updated++;
      } else {
        skipped++;
      }
      await delay(150);
    } catch {
      errors++;
    }
  }

  return Response.json({
    success: true,
    batch: batchIndex,
    processed: pubs.length,
    updated,
    skipped,
    errors,
    duration_seconds: Math.round((Date.now() - startTime) / 1000),
  });
}
