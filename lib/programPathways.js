"use client";
import { supabase } from "./supabase";

/* ─────────────────────────────────────────────────────────
   Program Pathways — RPC wrappers
   Backend reference: get_program_pathways_with_status,
   activate_pathway, pathway_definitions table
───────────────────────────────────────────────────────── */

/**
 * Pathways tab veri çağrısı.
 * @returns {Promise<{
 *   is_owner: boolean,
 *   gate_passed: boolean,
 *   active: Array<PathwayInstance>,    // declared/ready_to_activate/active/realized/abandoned/paused
 *   available: Array<PathwayDefinition> // declare edilmemiş library pathway'leri
 * } | null>}
 */
export async function fetchProgramPathways(programId) {
  if (!programId) return null;
  const { data, error } = await supabase.rpc("get_program_pathways_with_status", {
    p_program_id: programId,
  });
  if (error) {
    console.warn("[programPathways] fetch error:", error.message);
    return null;
  }
  return data || null;
}

/**
 * Library pathway veya custom pathway'i program'a declare et.
 * NOT: Bu fonksiyon doğrudan INSERT yapar; activate için ayrı RPC var.
 *
 * @param {string} programId
 * @param {object} payload
 * @param {string} [payload.pathwayId]   library id (e.g. 'pharma'); custom için bırak null
 * @param {string} [payload.customLabel] custom pathway adı
 * @param {string} [payload.origin]      'declared' | 'emergent' | 'manual' (default: 'declared')
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function declarePathway(programId, { pathwayId = null, customLabel = null, origin = "declared" } = {}) {
  if (!programId) return { success: false, error: "missing_program_id" };
  if (!pathwayId && !customLabel) return { success: false, error: "missing_pathway" };

  const row = {
    program_id: programId,
    pathway_id: pathwayId,
    is_custom: !pathwayId,
    custom_label: customLabel,
    origin,
    status: "declared",
  };

  const { data, error } = await supabase
    .from("program_pathways")
    .insert(row)
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("[programPathways] declare error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, id: data?.id };
}

/**
 * Pathway'i activate et (gate kontrolü + custom syntax destekler).
 * Library pathway: pathwayRef = pathway_id (e.g. 'pharma')
 * Custom pathway:  pathwayRef = `custom:<program_pathways.id>`
 *
 * @returns {Promise<{success: boolean, error?: string, missing_tics?: string[]}>}
 */
export async function activatePathway(programId, pathwayRef) {
  if (!programId || !pathwayRef) return { success: false, error: "missing_params" };
  const { data, error } = await supabase.rpc("activate_pathway", {
    p_program_id: programId,
    p_pathway_id: pathwayRef,
  });
  if (error) {
    console.warn("[programPathways] activate error:", error.message);
    return { success: false, error: error.message };
  }
  return data || { success: false, error: "no_response" };
}

/* ─── UI helpers ─── */

export const PATHWAY_STATUS_LABEL = {
  declared: "Declared",
  ready_to_activate: "Ready",
  active: "Active",
  realized: "Realized",
  abandoned: "Abandoned",
  paused: "Paused",
};

export const PATHWAY_STATUS_COLOR = {
  declared: { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
  ready_to_activate: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  active: { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" },
  realized: { bg: "#DBEAFE", color: "#1E40AF", border: "#BFDBFE" },
  abandoned: { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
  paused: { bg: "#E0E7FF", color: "#3730A3", border: "#C7D2FE" },
};

export const PATHWAY_LABEL = {
  ornamental: "Ornamental",
  pharma: "Pharmaceutical",
  cosmeceutical: "Cosmeceutical",
  seed_bank_commercial: "Seed Bank (Commercial)",
  breeding: "Breeding",
  restoration: "Restoration",
};

export const PATHWAY_DESCRIPTION = {
  ornamental: "Ornamental cultivation: bulbs, varieties, breeder rights.",
  pharma: "Pharmaceutical compounds: clinical pipeline, GMP, regulatory.",
  cosmeceutical: "Cosmeceutical ingredients: INCI, CosIng, formulation.",
  seed_bank_commercial: "Commercial seed banking: ISTA-certified production.",
  breeding: "Genetic improvement: DUS testing, plant breeders' rights.",
  restoration: "Habitat restoration: reintroduction, monitoring, community consent.",
};

export const PATHWAY_ICON = {
  ornamental: "🌸",
  pharma: "💊",
  cosmeceutical: "✨",
  seed_bank_commercial: "🌱",
  breeding: "🧬",
  restoration: "🌍",
};

/**
 * Library'den tüm pathway tanımlarını çek (cache'lenebilir).
 */
export async function fetchPathwayLibrary() {
  const { data, error } = await supabase
    .from("pathway_definitions")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) {
    console.warn("[programPathways] library fetch error:", error.message);
    return [];
  }
  return data || [];
}
