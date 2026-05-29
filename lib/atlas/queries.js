"use client";
import { supabase } from "../supabase";

/**
 * Query helpers for the Atlas (species) module.
 * All client-side, observer-readable. Writes happen elsewhere through RPC.
 */

export const SPECIES_SORTS = {
  name_asc:    { field: "accepted_name",   ascending: true,  label: "Name A → Z" },
  name_desc:   { field: "accepted_name",   ascending: false, label: "Name Z → A" },
  family_asc:  { field: "family",          ascending: true,  label: "Family A → Z" },
  score_desc:  { field: "composite_score", ascending: false, label: "Composite score (high → low)" },
};

/**
 * Paginated, filtered list of species.
 *
 * filters: {
 *   search?: string                  — ILIKE on accepted_name
 *   families?: string[]              — accepted in any of these families
 *   iucnTiers?: string[]             — accepted IUCN statuses
 *   country?: string                 — ISO-2; matches country_focus OR native_countries
 *   endemicOnly?: boolean
 *   withImageOnly?: boolean
 *   sourceOnly?: 'manual'|'wcvp'|'mixed'   — provenance filter
 * }
 * sort: key of SPECIES_SORTS
 * page: zero-indexed
 * pageSize: rows per page
 */
export async function fetchSpeciesPage({
  filters = {},
  sort = "name_asc",
  page = 0,
  pageSize = 50,
} = {}) {
  const sortDef = SPECIES_SORTS[sort] || SPECIES_SORTS.name_asc;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("species")
    .select(
      "id, accepted_name, family, iucn_status, country_focus, native_countries, thumbnail_url, endemic, composite_score, source",
      { count: "exact" }
    );

  if (filters.search?.trim()) {
    q = q.ilike("accepted_name", `%${filters.search.trim()}%`);
  }
  if (filters.families?.length) {
    q = q.in("family", filters.families);
  }
  if (filters.iucnTiers?.length) {
    q = q.in("iucn_status", filters.iucnTiers);
  }
  if (filters.country) {
    const c = filters.country.toUpperCase();
    q = q.or(`country_focus.eq.${c},native_countries.cs.{${c}}`);
  }
  if (filters.endemicOnly) {
    q = q.eq("endemic", true);
  }
  if (filters.withImageOnly) {
    q = q.not("thumbnail_url", "is", null);
  }
  if (filters.sourceOnly) {
    q = q.eq("source", filters.sourceOnly);
  }
  if (filters.hasOpenCalls) {
    // Resolve the species ids referenced by any currently-active open call
    // once, then constrain the page query with .in('id', …). Empty list
    // short-circuits to zero rows so we never issue a "WHERE id IN ()" call.
    const { data: ids } = await supabase.rpc("list_species_ids_with_open_calls");
    const allow = Array.isArray(ids) ? ids : [];
    if (allow.length === 0) return { rows: [], total: 0 };
    q = q.in("id", allow);
  }

  q = q
    .order(sortDef.field, { ascending: sortDef.ascending, nullsFirst: false })
    // Stable secondary sort to prevent flicker when the primary is equal/null
    .order("id", { ascending: true })
    .range(from, to);

  const { data, count, error } = await q;
  if (error) throw error;
  return { rows: data || [], total: count || 0 };
}

/** Fetch one species by id with everything the detail page needs. */
export async function fetchSpeciesDetail(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from("species")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Programs that target this species. */
export async function fetchProgramsForSpecies(speciesId) {
  if (!speciesId) return [];
  const { data, error } = await supabase
    .from("programs")
    .select("id, program_name, status, current_module, current_gate, risk_level, readiness_score, created_by_researcher:researchers!created_by(name)")
    .eq("species_id", speciesId)
    .order("priority_score", { ascending: false, nullsFirst: false });
  if (error) {
    console.warn("[atlas] programs fetch error:", error.message);
    return [];
  }
  return data || [];
}

/** Publications curated as part of any program targeting this species. */
export async function fetchPublicationsForSpecies(speciesId) {
  if (!speciesId) return [];
  // program_publications has program_id and publication_id; chain through
  // the species → programs link.
  const { data: progs } = await supabase
    .from("programs")
    .select("id")
    .eq("species_id", speciesId);
  const programIds = (progs || []).map((p) => p.id);
  if (programIds.length === 0) return [];

  const { data, error } = await supabase
    .from("program_publications")
    .select("publication:publication_id(id, title, doi, year, journal, authors)")
    .in("program_id", programIds);
  if (error) {
    console.warn("[atlas] publications fetch error:", error.message);
    return [];
  }
  const seen = new Set();
  const out = [];
  for (const row of data || []) {
    const pub = row.publication;
    if (!pub) continue;
    if (seen.has(pub.id)) continue;
    seen.add(pub.id);
    out.push(pub);
  }
  return out;
}

/** Metabolites recorded for this species. */
export async function fetchMetabolitesForSpecies(speciesId) {
  if (!speciesId) return [];
  const { data, error } = await supabase
    .from("metabolites")
    .select("id, compound_name, compound_class, cas_number, reported_activity, confidence")
    .eq("species_id", speciesId)
    .order("confidence", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) {
    console.warn("[atlas] metabolites fetch error:", error.message);
    return [];
  }
  return data || [];
}

/** Distinct families currently in the atlas, for the filter sidebar. */
export async function fetchAtlasFamilies() {
  const { data, error } = await supabase
    .from("species")
    .select("family")
    .not("family", "is", null);
  if (error) return [];
  const counts = new Map();
  for (const r of data || []) {
    counts.set(r.family, (counts.get(r.family) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([family, count]) => ({ family, count }))
    .sort((a, b) => b.count - a.count);
}
