import { supabase } from "./supabase";

/* ════════════════════════════════════════════════════════
   GEOCON — Researchers Data Access Layer
   For ResearcherDetailPanel: full GEOCON presence of one person
════════════════════════════════════════════════════════ */

// Tek researcher tüm detayları
export async function fetchResearcherById(researcherId) {
  const { data, error } = await supabase
    .from("researchers")
    .select("*")
    .eq("id", researcherId)
    .single();

  if (error) {
    console.warn("fetchResearcherById failed:", error.message);
    return null;
  }
  return data;
}

// Researcher'ın yayınladığı/katkıda bulunduğu yayınlar
export async function fetchResearcherPublications(researcherId) {
  const { data, error } = await supabase
    .from("publication_researchers")
    .select(`
      author_as_listed, match_score, match_method, created_at,
      publications(id, title, authors, year, journal, doi, abstract, is_curated, category, species_id, species(accepted_name))
    `)
    .eq("researcher_id", researcherId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("fetchResearcherPublications failed:", error.message);
    return [];
  }
  return data || [];
}

// Researcher'ın çalıştığı türler
export async function fetchResearcherSpecies(researcherId) {
  const { data, error } = await supabase
    .from("researcher_species")
    .select(`
      role, notes, created_at,
      species(id, accepted_name, family, genus, iucn_status, thumbnail_url, composite_score)
    `)
    .eq("researcher_id", researcherId);

  if (error) {
    console.warn("fetchResearcherSpecies failed:", error.message);
    return [];
  }
  return data || [];
}

// Researcher'ın üye olduğu programlar (program_members)
export async function fetchResearcherProgramMemberships(researcherId) {
  const { data, error } = await supabase
    .from("program_members")
    .select(`
      role, joined_at, notes,
      programs(id, program_name, status, current_module, current_gate, species(accepted_name))
    `)
    .eq("researcher_id", researcherId);

  if (error) {
    console.warn("fetchResearcherProgramMemberships failed:", error.message);
    return [];
  }
  return data || [];
}

// Researcher'ın tüm programlardaki authority'si (view'dan)
export async function fetchResearcherAuthority(researcherId) {
  const { data, error } = await supabase
    .from("v_researcher_program_authority")
    .select("*")
    .eq("researcher_id", researcherId)
    .order("authority_score", { ascending: false });

  if (error) {
    console.warn("fetchResearcherAuthority failed:", error.message);
    return [];
  }
  return data || [];
}

// Researcher'ın contributions'ı (zaman akışı)
export async function fetchResearcherContributions(researcherId) {
  const { data, error } = await supabase
    .from("contributions")
    .select(`
      id, contribution_type, what_was_done, how_it_was_done, result_summary,
      contribution_score, impact_score, reliability_score, relevance_score,
      status, created_at, program_id,
      programs(id, program_name)
    `)
    .eq("contributor_id", researcherId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("fetchResearcherContributions failed:", error.message);
    return [];
  }
  return data || [];
}
