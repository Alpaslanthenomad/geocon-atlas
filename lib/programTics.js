"use client";
import { supabase } from "./supabase";

/* ─────────────────────────────────────────────────────────
   Program Tics — RPC wrappers
   Backend reference: get_program_foundation_status,
   complete_program_tic, waive_program_tic
───────────────────────────────────────────────────────── */

/**
 * Foundation tab veri çağrısı.
 * @param {string} programId
 * @returns {Promise<{
 *   is_owner: boolean,
 *   gate: { passed: boolean, counts: object, missing_tics: string[], rule_version_used: number },
 *   tics: Array<{
 *     tic_id, wheel_type, category, label, description, display_order,
 *     is_core, is_required, evidence_required, verified_by_role,
 *     status, evidence_link, evidence_type, evidence_notes,
 *     waiver_reason, completed_at, completed_by, is_custom,
 *     evidence_options: Array<{evidence_type, preference_rank}>
 *   }>
 * } | null>}
 */
export async function fetchFoundationStatus(programId) {
  if (!programId) return null;
  const { data, error } = await supabase.rpc("get_program_foundation_status", {
    p_program_id: programId,
  });
  if (error) {
    console.warn("[programTics] foundation status error:", error.message);
    return null;
  }
  return data || null;
}

/**
 * Bir tic'i complete et (owner only).
 * @returns {Promise<{success: boolean, error?: string, tic_id?: string}>}
 */
export async function completeTic(programId, ticId, { evidenceLink = null, evidenceType = null, evidenceNotes = null } = {}) {
  if (!programId || !ticId) {
    return { success: false, error: "missing_params" };
  }
  const { data, error } = await supabase.rpc("complete_program_tic", {
    p_program_id: programId,
    p_tic_id: ticId,
    p_evidence_link: evidenceLink,
    p_evidence_type: evidenceType,
    p_evidence_notes: evidenceNotes,
  });
  if (error) {
    console.warn("[programTics] completeTic error:", error.message);
    return { success: false, error: error.message };
  }
  return data || { success: false, error: "no_response" };
}

/**
 * Bir tic'i gerekçeli waive et (owner only, min 10 char reason).
 * @returns {Promise<{success: boolean, error?: string, tic_id?: string, is_core_required?: boolean}>}
 */
export async function waiveTic(programId, ticId, reason) {
  if (!programId || !ticId) {
    return { success: false, error: "missing_params" };
  }
  if (!reason || reason.trim().length < 10) {
    return { success: false, error: "reason_too_short" };
  }
  const { data, error } = await supabase.rpc("waive_program_tic", {
    p_program_id: programId,
    p_tic_id: ticId,
    p_reason: reason.trim(),
  });
  if (error) {
    console.warn("[programTics] waiveTic error:", error.message);
    return { success: false, error: error.message };
  }
  return data || { success: false, error: "no_response" };
}

/* ─── UI helpers ─── */

export const TIC_STATUS_LABEL = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  waived: "Waived",
};

export const TIC_STATUS_COLOR = {
  pending: { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
  in_progress: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  completed: { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" },
  waived: { bg: "#E0E7FF", color: "#3730A3", border: "#C7D2FE" },
};

export const WHEEL_LABEL = {
  conservation: "Conservation",
  science: "Science",
};

export const WHEEL_COLOR = {
  conservation: { primary: "#0E7C66", soft: "#E1F5EE" },
  science: { primary: "#1E40AF", soft: "#DBEAFE" },
};

/**
 * Tic listesini wheel ve category bazında grupla.
 * Science wheel için "foundation" / "deep" alt grupları var.
 */
export function groupTicsByWheel(tics = []) {
  const groups = {};
  tics.forEach((t) => {
    if (!groups[t.wheel_type]) groups[t.wheel_type] = { foundation: [], deep: [], bonus: [] };
    const bucket = t.category || (t.is_core && t.is_required ? "foundation" : "deep");
    if (!groups[t.wheel_type][bucket]) groups[t.wheel_type][bucket] = [];
    groups[t.wheel_type][bucket].push(t);
  });
  // sort by display_order within each bucket
  Object.values(groups).forEach((g) => {
    Object.values(g).forEach((arr) => arr.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
  });
  return groups;
}

/**
 * Gate progress yüzdesi (0–100).
 */
export function gateProgressPct(gate) {
  if (!gate?.counts) return 0;
  const total = gate.counts.required_total || 0;
  const done = gate.counts.required_completed || 0;
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}
