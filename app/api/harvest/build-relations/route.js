/**
 * GEOCON Harvest: Full Relationship Builder v2
 * ─────────────────────────────────────────────
 * Tür merkezli tüm ilişkileri kurar:
 * - Yayın ↔ Araştırmacı (yazar ismi eşleştirme)
 * - Metabolit ↔ Yayın (abstract keyword match)
 * - Araştırmacı ↔ Tür
 * - Tür ↔ Tür (aynı genus, ortak metabolit sınıfı)
 */

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DELAY_MS = 200;
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// "Martin Cheek, Eimear Nic Lughadha, Paul M. Kirk, Heather L. Lindon"
// → ["Martin Cheek", "Eimear Nic Lughadha", "Paul M. Kirk", "Heather L. Lindon"]
function parseAuthors(authorStr) {
  if (!authorStr) return [];

  // Noktalı virgülle ayrılmışsa direkt böl
  if (authorStr.includes(";")) {
    return authorStr.split(";").map(a => a.trim()).filter(a => a.length > 2);
  }

  // Virgülle ayrılmış ama "Paul M. Kirk" gibi orta isim baş harfi var.
  // Strateji: tüm parçaları al, tek harfli/baş harfli olanları öncekiyle birleştir
  const parts = authorStr.split(",").map(p => p.trim()).filter(p => p.length > 0);
  const authors = [];
  let current = "";

  for (const part of parts) {
    const isInitial = /^[A-ZÀ-Ö\u00C0-\u024F][\.\-]?$/.test(part.trim());
    const words = part.split(/\s+/).filter(w => w.length > 0);
    const isSingleShort = words.length === 1 && part.length <= 3;

    if (!current) {
      current = part;
    } else if (isInitial || isSingleShort) {
      // Baş harf veya çok kısa parça — öncekine ekle
      current += " " + part;
    } else {
      authors.push(current.trim());
      current = part;
    }
  }

  if (current.trim().length > 2) authors.push(current.trim());

  return authors.length > 0
    ? authors.filter(a => a.length > 2)
    : parts.filter(p => p.length > 2);
}

function normalizeName(name) {
  return (name || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;‐\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameScore(pubAuthor, resName) {
  const pa = normalizeName(pubAuthor);
  const rn = normalizeName(resName);

  if (pa === rn) return 1.0;

  const rParts = rn.split(" ").filter(p => p.length > 0);
  const pParts = pa.split(" ").filter(p => p.length > 0);

  if (rParts.length === 0 || pParts.length === 0) return 0;

  const rLast = rParts[rParts.length - 1];
  const rFirst = rParts[0];
  const pLast = pParts[pParts.length - 1];
  const pFirst = pParts[0];

  // Soyad eşleşmesi
  const lastMatch = rLast === pLast || pa.includes(rLast) || rn.includes(pLast);
  if (!lastMatch) return 0;

  // Ad tam eşleşmesi
  if (rFirst === pFirst && rLast.length >= 4) return 0.95;

  // Baş harf eşleşmesi
  if (rFirst[0] === pFirst[0] && rLast.length >= 5) return 0.80;

  // Sadece uzun soyad
  if (rLast.length >= 7) return 0.65;

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

  const { data: pubs } = await sb
    .from("publications")
    .select("id, title, authors, abstract, year, doi")
    .eq("species_id", sp.id)
    .limit(150);

  const { data: mets } = await sb
    .from("metabolites")
    .select("id, compound_name, compound_class, source_publication_id")
    .eq("species_id", sp.id);

  // ── Publication → Researcher ────────────────────────────────
  if (pubs?.length && researchers?.length) {
    for (const pub of pubs) {
      if (!pub.authors) continue;

      const authorList = parseAuthors(pub.authors);

      for (const author of authorList) {
        let best = null, bestScore = 0;

        for (const r of researchers) {
          const s = nameScore(author, r.name);
          if (s > bestScore && s >= 0.65) { bestScore = s; best = r; }
        }

        if (best) {
          await sb.from("publication_researchers").upsert({
            publication_id: pub.id,
            researcher_id: best.id,
            author_as_listed: author,
            match_score: bestScore,
            match_method: "author_name",
          }, { onConflict: "publication_id,researcher_id" });
if (prErr) console.error("PR upsert error:", prErr.message);

          result.pub_researcher_links++;

          const { error: rsErr } = await sb.from("researcher_species").upsert({
            researcher_id: best.id,
            species_id: sp.id,
            role: "Author",
            notes: `Linked via: ${pub.title?.slice(0, 70) || pub.doi || "publication"}`,
          }, { onConflict: "researcher_id,species_id", ignoreDuplicates: true });

          if (!rsErr) result.researcher_species_links++;
        }
      }
    }
  }

  // ── Metabolit → Publication ─────────────────────────────────
  if (mets?.length && pubs?.length) {
    const pubsWithAbstract = pubs.filter(p => p.abstract && p.abstract.length > 50);

    for (const met of mets) {
      if (!met.compound_name || met.compound_name.length < 4) continue;
      const nameNorm = normalizeName(met.compound_name).replace(/\s+/g, "");

      for (const pub of pubsWithAbstract) {
        const abstNorm = normalizeName(pub.abstract || "").replace(/\s+/g, "");
        if (abstNorm.includes(nameNorm)) {
          const { error } = await sb.from("metabolite_publications").upsert({
            metabolite_id: String(met.id),
            publication_id: pub.id,
            match_method: "keyword",
            confidence: 0.75,
          }, { onConflict: "metabolite_id,publication_id", ignoreDuplicates: true });

          if (!error) {
            result.met_pub_links++;
            if (!met.source_publication_id) {
              await sb.from("metabolites")
                .update({ source_publication_id: pub.id })
                .eq("id", met.id);
              met.source_publication_id = pub.id;
            }
          }
        }
      }
    }
  }

  // ── Related Species ─────────────────────────────────────────
  if (allSpecies?.length) {
    const sameGenus = allSpecies
      .filter(s => s.id !== sp.id && s.genus && s.genus === sp.genus)
      .slice(0, 15);

    for (const related of sameGenus) {
      const { error } = await sb.from("related_species").upsert({
        species_id: sp.id,
        related_species_id: related.id,
        relation_type: "same_genus",
        confidence: 1.0,
      }, { onConflict: "species_id,related_species_id", ignoreDuplicates: true });
      if (!error) result.related_species_links++;
    }

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
         }, { onConflict: "researcher_id,species_id" });
if (rsErr) console.error("RS upsert error:", rsErr.message);
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

  const [resResult, allSpResult] = await Promise.all([
    sb.from("researchers").select("id, name, expertise_area, country"),
    sb.from("species").select("id, accepted_name, genus, family"),
  ]);

  const researchers = resResult.data || [];
  const allSpecies = allSpResult.data || [];

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
    return Response.json({ ...log, message: "No species in this batch" });
  }

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
