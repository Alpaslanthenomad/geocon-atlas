/**
 * GEOCON Harvest: Full Relationship Builder
 * ─────────────────────────────────────────
 * Tek bir endpoint ile tür merkezli tüm ilişkileri kurar:
 * - Tür ↔ Yayın (zaten var, kontrol eder)
 * - Tür ↔ Metabolit (yayından çıkarır, zaten var)
 * - Yayın ↔ Araştırmacı (yazar eşleştirme)
 * - Metabolit ↔ Yayın (kaynak bulma)
 * - Araştırmacı ↔ Tür (uzmanlık bazlı önerim)
 * - Tür ↔ Tür (ilgili türler: aynı genus, benzer metabolit)
 *
 * Bu endpoint hem manuel hem otomatik çalışır.
 * GET /api/harvest/build-relations?secret=...&species_id=...
 * veya &batch=0 ile toplu çalıştır
 */

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DELAY_MS = 300;
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function normalizeName(name) {
  return (name || "").toLowerCase().replace(/[.,;]/g, " ").replace(/\s+/g, " ").trim();
}

function nameScore(pubAuthor, resName) {
  const pa = normalizeName(pubAuthor);
  const rn = normalizeName(resName);
  if (pa === rn) return 1.0;
  const parts = rn.split(" ");
  const last = parts[parts.length - 1];
  const first = parts[0];
  if (last.length >= 5 && pa.includes(last) && first && pa.includes(first[0])) return 0.85;
  if (last.length >= 6 && pa.includes(last)) return 0.65;
  return 0;
}

async function buildRelationsForSpecies(sp, researchers, allSpecies) {
  const result = {
    species_id: sp.id,
    species_name: sp.accepted_name,
    pub_researcher_links: 0,
    met_pub_links: 0,
    researcher_species_links: 0,
    related_species_links: 0,
    errors: [],
  };

  // 1. Bu türün tüm yayınlarını çek
  const { data: pubs } = await sb
    .from("publications")
    .select("id, title, authors, abstract, year, doi")
    .eq("species_id", sp.id)
    .limit(100);

  // 2. Bu türün metabolitlerini çek
  const { data: mets } = await sb
    .from("metabolites")
    .select("id, compound_name, compound_class, source_publication_id")
    .eq("species_id", sp.id);

  // ── Publication → Researcher linking ───────────────────────
  if (pubs?.length && researchers?.length) {
    for (const pub of pubs) {
      if (!pub.authors) continue;

      const authorList = pub.authors
        .split(/;|,(?!\s*[A-Z]{1,2}\.)/)
        .map(a => a.trim())
        .filter(a => a.length > 3);

      for (const author of authorList) {
        let best = null, bestScore = 0;
        for (const r of researchers) {
          const s = nameScore(author, r.name);
          if (s > bestScore && s >= 0.65) { bestScore = s; best = r; }
        }

        if (best) {
          // publication_researchers
          await sb.from("publication_researchers").upsert({
            publication_id: pub.id,
            researcher_id: best.id,
            author_as_listed: author,
            match_score: bestScore,
            match_method: "author_name",
          }, { onConflict: "publication_id,researcher_id", ignoreDuplicates: true });

          // researcher_species
          const { error } = await sb.from("researcher_species").upsert({
            researcher_id: best.id,
            species_id: sp.id,
            role: "Author",
            notes: `Auto-linked via: ${pub.title?.slice(0, 70) || pub.doi || "publication"}`,
          }, { onConflict: "researcher_id,species_id", ignoreDuplicates: true });

          if (!error) {
            result.pub_researcher_links++;
            result.researcher_species_links++;
          }
        }
      }
    }
  }

  // ── Metabolit → Publication linking ────────────────────────
  if (mets?.length && pubs?.length) {
    const pubsWithAbstract = pubs.filter(p => p.abstract && p.abstract.length > 50);

    for (const met of mets) {
      if (!met.compound_name) continue;
      const nameNorm = met.compound_name.toLowerCase().replace(/[^a-z0-9]/g, "");

      for (const pub of pubsWithAbstract) {
        const abstNorm = (pub.abstract || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (abstNorm.includes(nameNorm) && nameNorm.length >= 4) {
          const { error } = await sb.from("metabolite_publications").upsert({
            metabolite_id: met.id,
            publication_id: pub.id,
            match_method: "keyword",
            confidence: 0.75,
          }, { onConflict: "metabolite_id,publication_id", ignoreDuplicates: true });

          if (!error) {
            result.met_pub_links++;
            // İlk source publication
            if (!met.source_publication_id) {
              await sb.from("metabolites")
                .update({ source_publication_id: pub.id })
                .eq("id", met.id);
              met.source_publication_id = pub.id; // yerel güncelle
            }
          }
        }
      }
    }
  }

  // ── Related Species (aynı genus) ───────────────────────────
  if (allSpecies?.length) {
    const sameGenus = allSpecies.filter(s =>
      s.id !== sp.id &&
      s.genus === sp.genus
    ).slice(0, 10);

    for (const related of sameGenus) {
      const { error } = await sb.from("related_species").upsert({
        species_id: sp.id,
        related_species_id: related.id,
        relation_type: "same_genus",
        confidence: 1.0,
      }, { onConflict: "species_id,related_species_id", ignoreDuplicates: true });

      if (!error) result.related_species_links++;
    }

    // Aynı metabolit sınıfına sahip türler (alkaloid, flavonoid vb.)
    if (mets?.length) {
      const metClasses = [...new Set(mets.map(m => m.compound_class).filter(Boolean))];
      if (metClasses.length > 0) {
        const { data: sharedMetSpecies } = await sb
          .from("metabolites")
          .select("species_id")
          .in("compound_class", metClasses)
          .neq("species_id", sp.id)
          .limit(20);

        const uniqueSpIds = [...new Set((sharedMetSpecies || []).map(m => m.species_id))];
        for (const relId of uniqueSpIds.slice(0, 5)) {
          await sb.from("related_species").upsert({
            species_id: sp.id,
            related_species_id: relId,
            relation_type: "shared_metabolite_class",
            confidence: 0.7,
            notes: metClasses.join(", "),
          }, { onConflict: "species_id,related_species_id", ignoreDuplicates: true });
          result.related_species_links++;
        }
      }
    }
  }

  return result;
}

export async function GET(req) {
  const url = new URL(req.url);
  const secret = req.headers.get("x-cron-secret") || url.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const speciesId = url.searchParams.get("species_id");
  const batch = parseInt(url.searchParams.get("batch") || "0");
  const batchSize = parseInt(url.searchParams.get("size") || "20");

  const log = {
    mode: speciesId ? "single" : "batch",
    batch,
    total_pub_researcher: 0,
    total_met_pub: 0,
    total_researcher_species: 0,
    total_related_species: 0,
    species_processed: 0,
    errors: [],
  };

  // Tüm araştırmacıları ve türleri bir kez çek
  const [resResult, allSpResult] = await Promise.all([
    sb.from("researchers").select("id, name, expertise_area, country"),
    sb.from("species").select("id, accepted_name, genus, family"),
  ]);

  const researchers = resResult.data || [];
  const allSpecies = allSpResult.data || [];

  // Hangi türleri işleyeceğiz?
  let targetSpecies = [];

  if (speciesId) {
    const { data } = await sb
      .from("species")
      .select("id, accepted_name, genus, family, country_focus, iucn_status")
      .eq("id", speciesId)
      .single();
    if (data) targetSpecies = [data];
  } else {
    const { data } = await sb
      .from("species")
      .select("id, accepted_name, genus, family, country_focus, iucn_status")
      .order("composite_score", { ascending: false })
      .range(batch * batchSize, (batch + 1) * batchSize - 1);
    targetSpecies = data || [];
  }

  if (!targetSpecies.length) {
    return Response.json({ ...log, message: "No species to process" });
  }

  // Her tür için ilişkileri kur
  for (const sp of targetSpecies) {
    try {
      const result = await buildRelationsForSpecies(sp, researchers, allSpecies);
      log.total_pub_researcher += result.pub_researcher_links;
      log.total_met_pub += result.met_pub_links;
      log.total_researcher_species += result.researcher_species_links;
      log.total_related_species += result.related_species_links;
      log.species_processed++;
      if (result.errors.length) log.errors.push(...result.errors);
    } catch (e) {
      log.errors.push(`${sp.accepted_name}: ${e.message}`);
    }

    await delay(DELAY_MS);
  }

  return Response.json(log);
}
