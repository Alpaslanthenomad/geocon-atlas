/**
 * GEOCON Harvest: Metabolit ↔ Publication Cross-Linking
 * ──────────────────────────────────────────────────────
 * Aynı türün metabolitlerini o türün yayınlarıyla çapraz bağlar.
 * Abstract'ta bileşik adı geçen yayınları metabolit kaydına link eder.
 * Ayrıca metabolit kaydını ilk kez bulan yayını "source_publication" olarak işaretler.
 *
 * GET /api/harvest/link-metabolites?secret=...&batch=0
 */

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH_SIZE = 15; // Her seferinde kaç tür işlensin
const DELAY_MS = 400;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Compound adının abstract'ta geçip geçmediğini kontrol et
function compoundMentionedInAbstract(compoundName, abstract) {
  if (!abstract || !compoundName) return false;
  const name = compoundName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const abst = abstract.toLowerCase().replace(/[^a-z0-9]/g, "");
  return abst.includes(name);
}

// Claude ile toplu metabolit-yayın eşleştirmesi
async function matchMetabolitesToPubs(species, metabolites, publications) {
  if (!metabolites.length || !publications.length) return [];

  // Özet ver - sadece abstract'ı olan yayınlar
  const pubsWithAbstract = publications
    .filter(p => p.abstract && p.abstract.length > 50)
    .slice(0, 25);

  if (!pubsWithAbstract.length) return [];

  const metList = metabolites.slice(0, 20).map((m, i) =>
    `${i + 1}. ID:${m.id} | Compound:${m.compound_name} | Class:${m.compound_class || "?"} | Activity:${(m.reported_activity || "").slice(0, 60)}`
  ).join("\n");

  const pubList = pubsWithAbstract.map((p, i) =>
    `${i + 1}. ID:${p.id} | Title:${p.title?.slice(0, 80)} | Year:${p.year} | Abstract snippet:${(p.abstract || "").slice(0, 150)}`
  ).join("\n");

  const prompt = `You are linking plant metabolites to the scientific publications that report them.

SPECIES: ${species.accepted_name} (${species.family})

METABOLITES IN DATABASE:
${metList}

PUBLICATIONS (with abstract snippets):
${pubList}

For each metabolite, find which publications mention or report it.
Return ONLY a JSON array, no markdown:
[
  {
    "metabolite_id": "exact ID from metabolites list",
    "publication_ids": ["id1", "id2"],
    "is_primary_source": true,
    "confidence": 0.8
  }
]

Only include high-confidence matches (0.7+). A publication is a primary source if it's likely the first to report this compound.
Return empty array [] if no clear matches found.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || "[]";
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

  const log = {
    batch,
    species_processed: 0,
    simple_links: 0,      // abstract keyword match
    ai_links: 0,          // Claude eşleştirmesi
    source_pub_set: 0,    // primary source ayarlanan
    errors: [],
  };

  // Hem metaboliti hem yayını olan türleri çek
  const { data: species } = await sb
    .from("species")
    .select("id, accepted_name, family")
    .order("id")
    .range(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE - 1);

  if (!species?.length) {
    return Response.json({ ...log, message: "No species in this batch" });
  }

  for (const sp of species) {
    try {
      // Bu türün metabolitlerini çek
      const { data: metabolites } = await sb
        .from("metabolites")
        .select("id, compound_name, compound_class, reported_activity, source_publication_id")
        .eq("species_id", sp.id);

      // Bu türün yayınlarını çek (abstract'ı olanlar önce)
      const { data: publications } = await sb
        .from("publications")
        .select("id, title, abstract, year, doi")
        .eq("species_id", sp.id)
        .not("abstract", "is", null)
        .order("year", { ascending: false })
        .limit(50);

      if (!metabolites?.length || !publications?.length) {
        log.species_processed++;
        continue;
      }

      // ── Basit keyword match ─────────────────────────────────
      for (const met of metabolites) {
        for (const pub of publications) {
          if (compoundMentionedInAbstract(met.compound_name, pub.abstract)) {
            // metabolite_publications tablosuna kaydet
            const { error } = await sb
              .from("metabolite_publications")
              .upsert({
                metabolite_id: met.id,
                publication_id: pub.id,
                match_method: "keyword",
                confidence: 0.75,
              }, { onConflict: "metabolite_id,publication_id", ignoreDuplicates: true });

            if (!error) {
              log.simple_links++;

              // İlk bulunan yayını source olarak kaydet
              if (!met.source_publication_id) {
                await sb
                  .from("metabolites")
                  .update({ source_publication_id: pub.id })
                  .eq("id", met.id);
                log.source_pub_set++;
              }
            }
          }
        }
      }

      // ── Claude AI match ──────────────────────────────────────
      // Keyword ile eşleşmeyen metabolitler için Claude kullan
      const unlinkedMets = metabolites.filter(m =>
        !publications.some(p => compoundMentionedInAbstract(m.compound_name, p.abstract))
      );

      if (unlinkedMets.length > 0) {
        const aiMatches = await matchMetabolitesToPubs(sp, unlinkedMets, publications);

        for (const match of aiMatches) {
          if (!match.metabolite_id || !match.publication_ids?.length) continue;
          if ((match.confidence || 0) < 0.7) continue;

          for (const pubId of match.publication_ids) {
            const { error } = await sb
              .from("metabolite_publications")
              .upsert({
                metabolite_id: match.metabolite_id,
                publication_id: pubId,
                match_method: "ai",
                confidence: match.confidence || 0.75,
              }, { onConflict: "metabolite_id,publication_id", ignoreDuplicates: true });

            if (!error) log.ai_links++;
          }

          // Primary source ayarla
          if (match.is_primary_source && match.publication_ids[0]) {
            const met = metabolites.find(m => m.id === match.metabolite_id);
            if (met && !met.source_publication_id) {
              await sb
                .from("metabolites")
                .update({ source_publication_id: match.publication_ids[0] })
                .eq("id", match.metabolite_id);
              log.source_pub_set++;
            }
          }
        }

        await delay(800); // Claude çağrısı sonrası biraz bekle
      }

      log.species_processed++;
      await delay(DELAY_MS);

    } catch (e) {
      log.errors.push(`${sp.accepted_name}: ${e.message}`);
      log.species_processed++;
    }
  }

  return Response.json(log);
}
