import { supabase } from "./supabase";

/**
 * Generic paralel pagination helper.
 * 1. Önce HEAD count alır
 * 2. Sayfa sayısını hesaplar
 * 3. Tüm sayfaları Promise.all ile paralel çeker
 */
export async function fetchAllPaginated(queryBuilder, countBuilder, pageSize = 1000) {
  const { count, error: countErr } = await countBuilder();
  if (countErr || count == null) {
    let all = []; let from = 0;
    while (true) {
      const { data, error } = await queryBuilder({ from, to: from + pageSize - 1 });
      if (error || !data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return all;
  }
  if (count === 0) return [];

  const numPages = Math.ceil(count / pageSize);
  const pages = await Promise.all(
    Array.from({ length: numPages }, (_, i) => {
      const from = i * pageSize;
      const to = Math.min(from + pageSize - 1, count - 1);
      return queryBuilder({ from, to }).then(({ data, error }) => {
        if (error || !data) return [];
        return data;
      });
    })
  );
  return pages.flat();
}

const PUBLICATIONS_SELECT = "id,species_id,title,authors,doi,year,journal,open_access,primary_topic,relevance_score,cited_by_count,source,abstract,pubmed_id,openalex_id,category,is_curated,contributed_by,s2_tldr,s2_influential_citation_count,s2_reference_count,s2_fields_of_study,s2_enrichment_status,species(accepted_name)";

export async function fetchAllPublications() {
  return fetchAllPaginated(
    ({ from, to }) => supabase.from("publications").select(PUBLICATIONS_SELECT).order("year", { ascending: false }).range(from, to),
    () => supabase.from("publications").select("id", { count: "exact", head: true }),
  );
}

export async function fetchAllMetabolites() {
  return fetchAllPaginated(
    ({ from, to }) => supabase.from("metabolites").select("*, species(accepted_name)").range(from, to),
    () => supabase.from("metabolites").select("id", { count: "exact", head: true }),
  );
}

export async function fetchAllMetabolitePublications() {
  return fetchAllPaginated(
    ({ from, to }) => supabase.from("metabolite_publications").select("metabolite_id,publication_id,confidence,is_primary_source,match_method").range(from, to),
    () => supabase.from("metabolite_publications").select("metabolite_id", { count: "exact", head: true }),
  );
}

export async function fetchAllResearchers() {
  return fetchAllPaginated(
    ({ from, to }) => supabase.from("researchers").select("*").order("h_index", { ascending: false, nullsFirst: false }).range(from, to),
    () => supabase.from("researchers").select("id", { count: "exact", head: true }),
  );
}
