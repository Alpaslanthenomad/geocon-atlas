import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NCBI_API_KEY = process.env.NCBI_API_KEY || "";
const BATCH_SIZE = 15;
const DELAY_MS = 400;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getAllSpecies() {
  const { data, error } = await supabase
    .from("species")
    .select("id, accepted_name, family")
    .order("accepted_name");
  if (error) throw new Error(error.message);
  return data || [];
}

/* ── PubMed'den PMID listesi çek (esearch) ── */
async function searchPubMed(query, maxResults = 8) {
  const apiKey = NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : "";
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=relevance&retmode=json${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.esearchresult?.idlist || [];
}

/* ── PMID'lerden makale detayı çek (efetch) ── */
async function fetchPubMedDetails(pmids) {
  if (pmids.length === 0) return [];
  const apiKey = NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : "";
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=xml${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const xml = await res.text();
  return parsePubMedXML(xml);
}

/* ── XML parser — basit regex bazlı ── */
function parsePubMedXML(xml) {
  const articles = [];
  const articleBlocks = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

  for (const block of articleBlocks) {
    const pmid = (block.match(/<PMID[^>]*>(.*?)<\/PMID>/) || [])[1];
    const title = (block.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/) || [])[1]
      ?.replace(/<[^>]+>/g, "").trim();
    const year = (block.match(/<PubDate>[\s\S]*?<Year>(.*?)<\/Year>/) || [])[1];
    const journal = (block.match(/<Title>(.*?)<\/Title>/) || [])[1];
    const doi = (block.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/) || [])[1];
    const abstractText = (block.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/) || [])[1]
      ?.replace(/<[^>]+>/g, "").trim();

    // Yazarları topla
    const authorMatches = block.matchAll(/<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?(?:<ForeName>(.*?)<\/ForeName>)?[\s\S]*?<\/Author>/g);
    const authors = [];
    for (const m of authorMatches) {
      if (m[1]) authors.push(`${m[2] ? m[2][0] + ". " : ""}${m[1]}`);
      if (authors.length >= 6) break;
    }

    if (pmid && title) {
      articles.push({ pmid, title, year: parseInt(year) || null, journal, doi: doi ? `https://doi.org/${doi}` : null, authors: authors.join(", "), abstract: abstractText });
    }
  }
  return articles;
}

/* ── Yayınları Supabase'e kaydet ── */
async function savePublications(speciesId, articles) {
  let newCount = 0;
  for (const article of articles) {
    const { data: existing } = await supabase
      .from("publications")
      .select("id")
      .eq("pubmed_id", article.pmid)
      .maybeSingle();
    if (existing) continue;

    const paperId = `PUB-PM-${article.pmid}`;
    const { error } = await supabase.from("publications").upsert({
      id: paperId,
      species_id: speciesId,
      pubmed_id: article.pmid,
      title: article.title,
      authors: article.authors,
      doi: article.doi,
      year: article.year,
      journal: article.journal,
      open_access: false,
      source: "PubMed",
      abstract: article.abstract?.slice(0, 2000) || null,
      last_updated: new Date().toISOString(),
    }, { onConflict: "id" });

    if (!error) newCount++;
  }
  return newCount;
}

/* ── Tek tür için PubMed harvest ── */
async function harvestSpeciesPubMed(species) {
  const name = species.accepted_name;
  const genus = name.split(" ")[0];

  // Biyomedikal odaklı sorgular
  const queries = [
    `${name}[Title/Abstract] AND (alkaloid OR metabolite OR pharmacology OR bioactivity)`,
    `${name}[Title/Abstract] AND (in vitro OR tissue culture OR propagation)`,
    `${genus}[Title/Abstract] AND (phytochemistry OR secondary metabolite OR medicinal)`,
  ];

  let pubsFetched = 0, pubsNew = 0;

  for (const query of queries.slice(0, 2)) { // max 2 sorgu/tür
    const pmids = await searchPubMed(query, 8);
    if (pmids.length === 0) { await delay(DELAY_MS); continue; }

    const articles = await fetchPubMedDetails(pmids);
    pubsFetched += articles.length;
    pubsNew += await savePublications(species.id, articles);
    await delay(DELAY_MS);
  }

  return { pubsFetched, pubsNew };
}

/* ── MAIN HANDLER ── */
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const batchIndex = parseInt(searchParams.get("batch") || "0");
  const startTime = Date.now();
  let totalFetched = 0, totalNew = 0, errors = 0;

  try {
    const allSpecies = await getAllSpecies();
    const totalBatches = Math.ceil(allSpecies.length / BATCH_SIZE);
    const batch = allSpecies.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);

    if (batch.length === 0) {
      return Response.json({ message: `No species in batch ${batchIndex}`, totalBatches });
    }

    for (const species of batch) {
      try {
        const result = await harvestSpeciesPubMed(species);
        totalFetched += result.pubsFetched;
        totalNew += result.pubsNew;
      } catch (err) {
        errors++;
        console.error(`PubMed error for ${species.id}:`, err);
      }
      await delay(300);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    await supabase.from("harvest_log").insert({
      source_id: "SRC-PUBMED",
      harvest_type: `PubMed batch ${batchIndex}/${totalBatches - 1}`,
      query_params: JSON.stringify({ batch: batchIndex, count: batch.length }),
      records_fetched: totalFetched,
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
      source: "PubMed",
      batch: batchIndex,
      totalBatches,
      speciesInBatch: batch.length,
      publications: { fetched: totalFetched, new: totalNew },
      duration_seconds: duration,
      errors,
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
