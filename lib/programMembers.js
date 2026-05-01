"use client";
import { supabase } from "./supabase";

/* ─────────────────────────────────────────────────────────
   Program Members — RPC wrappers + direct table writes
   Backend: get_program_members_full + program_members table
───────────────────────────────────────────────────────── */

/**
 * Contributors tab veri çağrısı.
 * @returns {Promise<{
 *   is_owner: boolean,
 *   members: Array<{
 *     id, role, status,
 *     researcher_id, researcher_name, researcher_email,
 *     user_id, profile_full_name,
 *     external_email, external_name, external_affiliation,
 *     invited_at, invited_by, invitation_message,
 *     accepted_at, declined_at, withdrawn_at,
 *     nda_signed_at, nda_document_link,
 *     coi_disclosed, coi_notes,
 *     visibility,
 *     joined_at, notes
 *   }>
 * } | null>}
 */
export async function fetchProgramMembers(programId) {
  if (!programId) return null;
  const { data, error } = await supabase.rpc("get_program_members_full", {
    p_program_id: programId,
  });
  if (error) {
    console.warn("[programMembers] fetch error:", error.message);
    return null;
  }
  return data || null;
}

/**
 * Yeni üye davet et (RLS owner kontrolünden geçer).
 *
 * Üç giriş tipi:
 *  - GEOCON üyesi: { researcherId } veya { userId }
 *  - External: { externalEmail, externalName, externalAffiliation }
 *
 * @param {string} programId
 * @param {object} payload
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function inviteMember(programId, {
  role,
  researcherId = null,
  userId = null,
  externalEmail = null,
  externalName = null,
  externalAffiliation = null,
  invitationMessage = null,
  visibility = "workspace",
} = {}) {
  if (!programId || !role) return { success: false, error: "missing_params" };
  if (!researcherId && !userId && !externalEmail) {
    return { success: false, error: "missing_identity" };
  }

  // invited_by için researcher_id'mizi profile'dan çekelim
  const { data: { user } } = await supabase.auth.getUser();
  let invitedBy = null;
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("researcher_id")
      .eq("id", user.id)
      .maybeSingle();
    invitedBy = prof?.researcher_id || null;
  }

  const row = {
    program_id: programId,
    role,
    status: "invited",
    researcher_id: researcherId,
    user_id: userId,
    external_email: externalEmail,
    external_name: externalName,
    external_affiliation: externalAffiliation,
    invitation_message: invitationMessage,
    visibility,
    invited_by: invitedBy,
    invited_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("program_members")
    .insert(row)
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("[programMembers] invite error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, id: data?.id };
}

/**
 * Member status değiştir (active/declined/withdrawn).
 */
export async function updateMemberStatus(memberRowId, newStatus, notes = null) {
  if (!memberRowId || !newStatus) return { success: false, error: "missing_params" };

  const patch = { status: newStatus };
  const now = new Date().toISOString();
  if (newStatus === "active") patch.accepted_at = now;
  if (newStatus === "declined") patch.declined_at = now;
  if (newStatus === "withdrawn") patch.withdrawn_at = now;
  if (notes) patch.notes = notes;

  const { error } = await supabase
    .from("program_members")
    .update(patch)
    .eq("id", memberRowId);

  if (error) {
    console.warn("[programMembers] status update error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * NDA imza kaydı.
 */
export async function signMemberNDA(memberRowId, documentLink = null) {
  if (!memberRowId) return { success: false, error: "missing_params" };
  const { error } = await supabase
    .from("program_members")
    .update({
      nda_signed_at: new Date().toISOString(),
      nda_document_link: documentLink,
    })
    .eq("id", memberRowId);
  if (error) {
    console.warn("[programMembers] NDA error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Member visibility değiştir.
 */
export async function updateMemberVisibility(memberRowId, newVisibility) {
  if (!memberRowId || !newVisibility) return { success: false, error: "missing_params" };
  if (!["public", "network", "workspace"].includes(newVisibility)) {
    return { success: false, error: "invalid_visibility" };
  }
  const { error } = await supabase
    .from("program_members")
    .update({ visibility: newVisibility })
    .eq("id", memberRowId);
  if (error) {
    console.warn("[programMembers] visibility error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/* ─── UI helpers ─── */

export const ROLE_LABEL = {
  owner: "Owner",
  co_founder: "Co-Founder",
  conservation_lead: "Conservation Lead",
  science_lead: "Science Lead",
  pathway_lead: "Pathway Lead",
  contributor: "Contributor",
  observer: "Observer",
  // legacy
  "co-owner": "Co-Owner",
};

export const ROLE_ORDER = {
  owner: 1,
  co_founder: 2,
  "co-owner": 2,
  conservation_lead: 3,
  science_lead: 4,
  pathway_lead: 5,
  contributor: 6,
  observer: 7,
};

export const ROLE_COLOR = {
  owner:             { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  co_founder:        { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  "co-owner":        { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  conservation_lead: { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" },
  science_lead:      { bg: "#DBEAFE", color: "#1E40AF", border: "#BFDBFE" },
  pathway_lead:      { bg: "#FCE7F3", color: "#9D174D", border: "#FBCFE8" },
  contributor:       { bg: "#F3F4F6", color: "#374151", border: "#E5E7EB" },
  observer:          { bg: "#E0E7FF", color: "#3730A3", border: "#C7D2FE" },
};

export const STATUS_COLOR = {
  invited:   { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  active:    { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0" },
  declined:  { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
  withdrawn: { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
};

export const VISIBILITY_LABEL = {
  public: "🌐 Public",
  network: "👥 Network",
  workspace: "🔒 Workspace",
};

/** Display name'i tüm fallback'lerden bul. */
export function memberDisplayName(m) {
  return (
    m.profile_full_name ||
    m.researcher_name ||
    m.external_name ||
    m.external_email ||
    m.researcher_id ||
    "Unknown"
  );
}

export function memberDisplayEmail(m) {
  return m.researcher_email || m.external_email || null;
}

export function memberDisplayAffiliation(m) {
  return m.external_affiliation || null;
}
