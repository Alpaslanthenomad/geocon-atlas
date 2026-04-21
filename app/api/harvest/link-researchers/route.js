/**
 * GEOCON Harvest: Publication → Researcher Linking
 * ─────────────────────────────────────────────────
 * Yayınlardaki yazar isimlerini araştırmacı tablosuyla eşleştirir.
 * Hem isim benzerliği hem Claude ile akıllı eşleştirme yapar.
 * Aynı zamanda her yayını species'e bağlar (yazar → uzmanlık → tür).
 *
 * GET /api/harvest/link-researchers?secret=...&batch=0&mode=authors
 * mode: "authors" (default) | "expertise" | "both"
 */

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH_SIZE = 30;
const DELAY_MS = 300;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// İsim normalizasyonu: "Smith, J." → "smith j", "J. Smith" → "j smith"
function normalizeName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[.,;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Soyad + baş harfle basit eşleştirme
function nameMatch(pubAuthor, researcherName) {
  const pa = normalizeName(pubAuthor);
  const rn = normalizeName(researcherName);

  // Tam eşleşme
  if (pa === rn) return 1.0;

  const rParts = rn.split(" ");
  const rLast = rParts[rParts.length - 1];
  const rFirst = rParts[0];

  // Soyad + baş harf ("smith j" içinde "smith" ve "j" var mı?)
  if (pa.includes(rLast) && rFirst && pa.includes(rFirst[0])) return 0.85;

  // Sadece soyad (uzun soyadlar için)
  if (rLast.length >= 5 && pa.includes(rLast)) return 0.65;

  return 0;
}

// Bir yayının yazarlarını araştırmacılarla eşleştir
async function matchAuthorsToResearchers(publication, researchers) {
  const authorStr = publication.authors || "";
  if (!authorStr.trim()) return [];

  // Yazar listesini parse et (virgül veya noktalı virgülle ayrılmış)
  const authorList = authorStr
    .split(/[;]|,(?!\s*[A-Z]{1,3}\.)/) // virgülden böl ama "Smith, J." gibi olanları koru
    .map(a => a.trim())
    .filter(a => a.length > 2);

  const matches = [];

  for (const author of authorList) {
    let bestMatch = null;
    let bestScore = 0;

    for (const researcher of researchers) {
      const score = nameMatch(author, researcher.name);
      if (score > bestScore && score >= 0.65) {
        bestScore = score;
        bestMatch = researcher;
      }
    }

    if (bestMatch) {
      matches.push({
        researcher_id: bestMatch.id,
        researcher_name: bestMatch.name,
        author_as_listed: author,
        match_score: bestScore,
        publication_id: publication.id,
        species_id: publication.species_id,
      });
    }
  }

  return matches;
}

// Claude ile akıllı eşleştirme (expertise bazlı)
async function matchByExpertise(researchers, species) {
  if (!researchers.length || !species.length) return [];

  // Sadece uzmanlığı bilinen araştırmacıları gönder
  const resWithExpertise = researchers
    .filter(r => r.expertise_area && r.expertise_area.length > 5)
    .slice(0, 40);

  if (!resWithExpertise.length) return [];

  const resList = resWithExpertise.map((r, i) =>
    `${i + 1}. ID:${r.id} | Name:${r.name} | Expertise:${r.expertise_area} | Country:${r.country || "?"}`
  ).join("\n");

  const spList = species.slice(0, 20).map(s =>
    `${s.accepted_name} (${s.family}, ${s.iucn_status || "NE"}, ${s.country_focus || "?"})`
  ).join(", ");

  const prompt = `You are linking plant researchers to geophyte species based on expertise fit.

RESEARCHERS:
${resList}

SPECIES IN DATABASE (geophytes - bulbous, cormous, rhizomatous plants):
${spList}

For each researcher, decide which species they are most likely to study based on their expertise area.
Return ONLY a JSON array, no markdown:
[
  {
    "researcher_id": "the exact ID from above",
    "species_names": ["Fritillaria imperialis", "Tulipa gesneriana"],
    "confidence": 0.7,
    "rationale": "one short sentence why"
  }
]

Only include researchers with clear geophyte relevance (confidence >= 0.5).
Return empty array [] if no clear matches.`;

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
  const mode = url.searchParams.get("mode") || "authors"; // "authors" | "expertise" | "both"

  const log = {
    batch, mode,
    publications_processed: 0,
    author_links_created: 0,
    expertise_links_created: 0,
    researcher_species_links: 0,
    errors: [],
  };

  // Tüm araştırmacıları çek
  const { data: researchers } = await sb
    .from("researchers")
    .select("id, name, expertise_area, country");

  if (!researchers?.length) {
    return Response.json({ ...log, message: "No researchers found" });
  }

  // ── MODE: AUTHORS ────────────────────────────────────────────
  if (mode === "authors" || mode === "both") {
    // Abstract'ı olan yayınları çek (batch olarak)
    const { data: publications } = await sb
      .from("publications")
      .select("id, species_id, title, authors, doi, year")
      .not("authors", "is", null)
      .neq("authors", "")
      .order("id")
      .range(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE - 1);

    if (publications?.length) {
      for (const pub of publications) {
        try {
          const matches = await matchAuthorsToResearchers(pub, researchers);

          for (const match of matches) {
            if (match.match_score < 0.65) continue;

            // publication_researchers tablosuna kaydet
            const { error: linkErr } = await sb
              .from("publication_researchers")
              .upsert({
                publication_id: match.publication_id,
                researcher_id: match.researcher_id,
                author_as_listed: match.author_as_listed,
                match_score: match.match_score,
                match_method: "author_name",
              }, { onConflict: "publication_id,researcher_id", ignoreDuplicates: true });

            if (!linkErr) {
              log.author_links_created++;

              // Araştırmacıyı tür ile de ilişkilendir
              if (match.species_id) {
                await sb
                  .from("researcher_species")
                  .upsert({
                    researcher_id: match.researcher_id,
                    species_id: match.species_id,
                    role: "Author",
                    notes: `Auto-linked via publication: ${pub.title?.slice(0, 80) || pub.doi || ""}`,
                  }, { onConflict: "researcher_id,species_id", ignoreDuplicates: true });

                log.researcher_species_links++;
              }
            }
          }

          log.publications_processed++;
        } catch (e) {
          log.errors.push(`pub ${pub.id}: ${e.message}`);
        }

        await delay(DELAY_MS);
      }
    }
  }

  // ── MODE: EXPERTISE ──────────────────────────────────────────
  if (mode === "expertise" || mode === "both") {
    const { data: species } = await sb
      .from("species")
      .select("id, accepted_name, family, iucn_status, country_focus");

    if (species?.length && researchers?.length) {
      const expertiseMatches = await matchByExpertise(researchers, species);

      for (const match of expertiseMatches) {
        if (!match.researcher_id || !match.species_names?.length) continue;

        for (const spName of match.species_names) {
          const sp = species.find(s =>
            s.accepted_name.toLowerCase() === spName.toLowerCase() ||
            s.accepted_name.toLowerCase().includes(spName.toLowerCase().split(" ")[0])
          );

          if (!sp) continue;

          const { error } = await sb
            .from("researcher_species")
            .upsert({
              researcher_id: match.researcher_id,
              species_id: sp.id,
              role: "Expert",
              notes: `Auto-linked by expertise: ${match.rationale || ""}`,
            }, { onConflict: "researcher_id,species_id", ignoreDuplicates: true });

          if (!error) log.expertise_links_created++;
        }
      }

      await delay(500);
    }
  }

  return Response.json(log);
}
