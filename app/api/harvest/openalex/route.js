import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OPENALEX_EMAIL = "atlas@geocon.bio";
const BATCH_SIZE = 20;       // Her çalıştırmada kaç tür işlensin
const PUBS_PER_QUERY = 10;   // Her sorgu için max yayın
const DELAY_MS = 300;        // API rate limit için bekleme

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/* ── OpenAlex inverted index → düz metin ── */
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return null;
  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }
  return words.filter(Boolean).join(" ").trim() || null;
}

/* ── Supabase'den tüm türleri çek ── */
async function getAllSpecies() {
  const { data, error } = await supabase
    .from("species")
    .select("id, accepted_name, family, genus")
    .order("accepted_name");
  if (error) throw new Error(`Species fetch failed: ${error.message}`);
  return data || [];
}

/* ── Tür adından sorgu listesi oluştur ── */
function buildQueries(species) {
  const name = species.accepted_name;
  const genus = name.split(" ")[0];
  const queries = [
    name,                                    // "Fritillaria imperialis"
    `${name} tissue culture`,               // in vitro çalışmalar
    `${name} secondary metabolites`,        // metabolit araştırmaları
    `${genus} conservation propagation`,    // genus bazlı koruma
  ];
  // Orchidaceae için salep araması ekle
  if (species.family === "Orchidaceae") {
    queries.push(`${genus} salep tuber`);
  }
  // Crocus için saffron ekle
  if (name.includes("Crocus sativus")) {
    queries.push("saffron crocin pharmacology", "saffron safranal");
  }
  // Colchicum için kolşisin ekle
  if (genus === "Colchicum") {
    queries.push("colchicine alkaloid biosynthesis");
  }
  return queries.slice(0, 3); // max 3 sorgu/tür (rate limit için)
}

/* ── OpenAlex'ten yayın çek ── */
async function fetchOpenAlexWorks(query, perPage = PUBS_PER_QUERY) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&sort=cited_by_count:desc&per_page=${perPage}&mailto=${OPENALEX_EMAIL}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

/* ── OpenAlex'ten araştırmacı detayı çek ── */
async function fetchAuthorDetails(authorId) {
  try {
    const res = await fetch(`https://api.openalex.org/authors/${authorId}?mailto=${OPENALEX_EMAIL}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

/* ── Yayınları Supabase'e kaydet ── */
async function savePublications(speciesId, works) {
  let newCount = 0;
  for (const work of works) {
    if (!work.title || !work.id) continue;
    const openAlexId = work.id;

    // Duplicate kontrolü
    const { data: existing } = await supabase
      .from("publications")
      .select("id")
      .eq("openalex_id", openAlexId)
      .maybeSingle();
    if (existing) continue;

    const paperId = `PAP-${work.id.split("/").pop().slice(0, 10)}`;
    const authors = (work.authorships || [])
      .map(a => a.author?.display_name)
      .filter(Boolean)
      .slice(0, 6)
      .join(", ");

    const { error } = await supabase.from("publications").upsert({
      id: paperId,
      species_id: speciesId,
      openalex_id: openAlexId,
      title: work.title,
      authors,
      doi: work.doi,
      year: work.publication_year,
      journal: work.primary_location?.source?.display_name || null,
      open_access: work.open_access?.is_oa || false,
      primary_topic: work.topics?.[0]?.display_name || null,
      relevance_score: work.relevance_score || null,
      cited_by_count: work.cited_by_count || 0,
      abstract: reconstructAbstract(work.abstract_inverted_index),
      source: "OpenAlex",
      last_updated: new Date().toISOString(),
    }, { onConflict: "id" });

    if (!error) newCount++;
  }
  return newCount;
}

/* ── Araştırmacıları Supabase'e kaydet ── */
async function saveResearchers(speciesId, works) {
  let newCount = 0;
  const seenAuthors = new Set();

  for (const work of works) {
    for (const authorship of (work.authorships || []).slice(0, 3)) {
      const author = authorship.author;
      if (!author?.id || seenAuthors.has(author.id)) continue;
      seenAuthors.add(author.id);

      const { data: existing } = await supabase
        .from("researchers")
        .select("id")
        .eq("openalex_id", author.id)
        .maybeSingle();
      if (existing) continue;

      const authorDetails = await fetchAuthorDetails(author.id.split("/").pop());
      await delay(100);

      const inst = authorship.institutions?.[0];
      const resId = `RES-${author.id.split("/").pop().slice(0, 8)}`;

      const { error } = await supabase.from("researchers").upsert({
        id: resId,
        openalex_id: author.id,
        name: author.display_name,
        institution: inst?.display_name || null,
        country: inst?.country_code || null,
        h_index: authorDetails?.summary_stats?.h_index || null,
        publications_count: authorDetails?.works_count || null,
        recent_activity_year: work.publication_year,
        expertise_area: work.topics?.[0]?.display_name || null,
        species_links: [speciesId],
        priority: "candidate",
        collaboration_fit: "candidate — auto-harvested",
        notes: `Auto-harvested via OpenAlex. Species: ${speciesId}`,
        last_verified: new Date().toISOString().split("T")[0],
      }, { onConflict: "id" });

      if (!error) newCount++;
    }
  }
  return newCount;
}

/* ── Tek bir tür için tam harvest ── */
async function harvestSpecies(species) {
  const queries = buildQueries(species);
  let pubsNew = 0, resNew = 0, pubsFetched = 0;

  for (const query of queries) {
    const works = await fetchOpenAlexWorks(query);
    pubsFetched += works.length;
    pubsNew += await savePublications(species.id, works);
    resNew += await saveResearchers(species.id, works);
    await delay(DELAY_MS);
  }

  return { pubsFetched, pubsNew, resNew };
}

/* ══════════════════════════════════════════
   MAIN HANDLER — Vercel Cron veya Manuel Tetikleme
   
   Batch parametresi ile hangi grubu çalıştıracağını belirle:
   ?batch=0  → tür 1-20
   ?batch=1  → tür 21-40
   ...vb
   
   Vercel cron ile her gün farklı batch çalıştır:
   0 6 * * 0 → batch 0 (Pazar)
   0 6 * * 1 → batch 1 (Pazartesi)
   ...
══════════════════════════════════════════ */
export async function GET(request) {
  // Auth kontrolü
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const batchIndex = parseInt(searchParams.get("batch") || "0");

  const startTime = Date.now();
  let totalPubsFetched = 0, totalPubsNew = 0, totalResNew = 0, errors = 0;
  const errorList = [];

  try {
    // 1. Tüm türleri Supabase'den çek
    const allSpecies = await getAllSpecies();
    const totalBatches = Math.ceil(allSpecies.length / BATCH_SIZE);

    // 2. Bu çalıştırma için batch seç
    const start = batchIndex * BATCH_SIZE;
    const batch = allSpecies.slice(start, start + BATCH_SIZE);

    if (batch.length === 0) {
      return Response.json({
        message: `No species in batch ${batchIndex}. Total batches: ${totalBatches}`,
        totalSpecies: allSpecies.length,
        totalBatches,
      });
    }

    // 3. Batch'teki her türü harvest et
    for (const species of batch) {
      try {
        const result = await harvestSpecies(species);
        totalPubsFetched += result.pubsFetched;
        totalPubsNew += result.pubsNew;
        totalResNew += result.resNew;
      } catch (err) {
        errors++;
        errorList.push(`${species.accepted_name}: ${err.message}`);
        console.error(`Error harvesting ${species.id}:`, err);
      }
      await delay(200); // türler arası bekleme
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // 4. Harvest log kaydet
    await supabase.from("harvest_log").insert({
      source_id: "SRC-005",
      harvest_type: `OpenAlex batch ${batchIndex}/${totalBatches - 1}`,
      query_params: JSON.stringify({ batch: batchIndex, species: batch.map(s => s.id) }),
      records_fetched: totalPubsFetched,
      records_new: totalPubsNew + totalResNew,
      records_updated: 0,
      errors,
      freshness_score: errors === 0 ? 1.0 : 0.7,
      status: errors === 0 ? "success" : "partial",
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_seconds: duration,
    });

    // 5. Data source güncelle
    await supabase.from("data_sources")
      .update({
        last_successful_harvest: new Date().toISOString(),
        freshness_score: 1.0,
      })
      .eq("id", "SRC-005");

    return Response.json({
      success: true,
      batch: batchIndex,
      totalBatches,
      speciesInBatch: batch.length,
      totalSpecies: allSpecies.length,
      publications: { fetched: totalPubsFetched, new: totalPubsNew },
      researchers: { new: totalResNew },
      duration_seconds: duration,
      errors,
      errorList: errorList.slice(0, 5),
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
