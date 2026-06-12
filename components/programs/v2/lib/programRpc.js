// lib/programRpc.js
//
// GEOCON ProgramDetailPanel v2 — RPC wrappers
// All Supabase RPC calls go through here. Each function returns the unwrapped
// jsonb payload (or throws on RPC error).
//
// IMPORTANT: Adjust the import path below to match your project's supabase client.
// In the existing GEOCON repo this is typically `@/lib/supabaseClient` or similar.

import { supabase } from './supabaseClient'; // <-- CHANGE THIS PATH IF NEEDED

// ─────────────────────────────────────────────────────────────────────────────
// Helper: call an RPC and unwrap. Throws Error with friendly message on failure.
// ─────────────────────────────────────────────────────────────────────────────
async function callRpc(fnName, args) {
  const { data, error } = await supabase.rpc(fnName, args);
  if (error) {
    // Postgres RAISE EXCEPTION → error.message has the friendly text
    const err = new Error(error.message || `RPC ${fnName} failed`);
    err.code = error.code;
    err.hint = error.hint;
    err.details = error.details;
    throw err;
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns dual-gate foundation status + all tics (cons + sci).
 * Shape: { program_id, is_owner, gates: { foundation, field_lab }, gate (legacy), tics }
 */
export function getProgramFoundationStatus(programId) {
  return callRpc('get_program_foundation_status', { p_program_id: programId });
}

/**
 * Returns all pathways (declared + library) with status + prerequisite info.
 */
export function getProgramPathwaysWithStatus(programId) {
  return callRpc('get_program_pathways_with_status', { p_program_id: programId });
}

/**
 * Returns members with full role + visibility metadata.
 */
export function getProgramMembersFull(programId) {
  return callRpc('get_program_members_full', { p_program_id: programId });
}

/**
 * Returns outputs, optionally filtered by pathway.
 */
export function getProgramOutputs(programId, pathwayId = null) {
  return callRpc('get_program_outputs', {
    p_program_id: programId,
    p_pathway_id: pathwayId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE — Tic operations (owner only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark a tic as completed with evidence.
 * @param {string} programId
 * @param {string} ticId  e.g. "cons.threat_analysis"
 * @param {object} evidence { link?: string, type?: string, notes?: string }
 *   - type is required if the tic has evidence_required=true
 *   - type must be one of the tic's evidence_options
 */
export function completeProgramTic(programId, ticId, { link = null, type = null, notes = null } = {}) {
  return callRpc('complete_program_tic', {
    p_program_id: programId,
    p_tic_id: ticId,
    p_evidence_link: link,
    p_evidence_type: type,
    p_evidence_notes: notes,
  });
}

/**
 * Waive a tic with a written justification (min 10 chars).
 */
export function waiveProgramTic(programId, ticId, reason) {
  return callRpc('waive_program_tic', {
    p_program_id: programId,
    p_tic_id: ticId,
    p_reason: reason,
  });
}

/**
 * Re-open a completed/waived tic for revision (e.g. Plan A failed → switch to Plan B).
 * Status returns to in_progress; audit captures revisit_started + revisit_marker.
 */
export function revisitProgramTic(programId, ticId, reason) {
  return callRpc('revisit_program_tic', {
    p_program_id: programId,
    p_tic_id: ticId,
    p_reason: reason,
  });
}

/**
 * Tree metadata per tic: { [tic_id]: { parent_tic_id, child_logic, effective_done } }
 * for tree-involved tics only. The UI merges this onto the flat tic list.
 */
export function getProgramTicTree(programId) {
  return callRpc('get_program_tic_tree', { p_program_id: programId });
}

/**
 * Record a non-completing status — failure-as-data. One of:
 *   'blocked' | 'attempted_failed' | 'replaced_by_alternative'.
 * Optional note is money/PII-blind (guarded server-side). Owner OR assignee.
 * These statuses do NOT count toward gate/region progress.
 */
export function setProgramTicStatus(programId, ticId, status, note = null) {
  return callRpc('set_program_tic_status', {
    p_program_id: programId,
    p_tic_id: ticId,
    p_status: status,
    p_note: note,
  });
}

/**
 * Assign a tic to a program member (owner only). Pass assigneeMemberId=null to unassign.
 * Creates the tic instance if it doesn't exist yet.
 */
export function assignProgramTic(programId, ticId, { assigneeMemberId = null, dueDate = null } = {}) {
  return callRpc('assign_program_tic', {
    p_program_id: programId,
    p_tic_id: ticId,
    p_assignee_member_id: assigneeMemberId,
    p_due_date: dueDate,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Collaboration — unified stream + comments
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns every audit event + every non-deleted comment for a program,
 * newest first. Each item has shape { id, kind, at, payload } where kind is
 * one of: tic | output | member | pathway | comment.
 */
export function getProgramStream(programId, limit = 100) {
  return callRpc('get_program_stream', {
    p_program_id: programId,
    p_limit: limit,
  });
}

/**
 * Post a comment on a program. Optionally attaches to a TIC and/or replies to
 * a parent comment. Mentions are an array of researcher_ids (free text @handles
 * will be resolved client-side later).
 */
export function postProgramComment(programId, body, { attachedTicId = null, parentId = null, mentions = [] } = {}) {
  return callRpc('post_program_comment', {
    p_program_id: programId,
    p_body: body,
    p_attached_tic_id: attachedTicId,
    p_parent_id: parentId,
    p_mentions: mentions,
  });
}

/**
 * Per-TIC comment count map: { "cons.threat_analysis": 3, ... }.
 * Cheap aggregate so TicCard can show a "💬 N" badge without loading the stream.
 */
export function getProgramTicCommentCounts(programId) {
  return callRpc('get_program_tic_comment_counts', { p_program_id: programId });
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications — bell + dropdown
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns notifications for the current user, newest first. Each item has
 * { id, type, program_id, program_code, program_name, source_comment_id,
 *   source_tic_id, actor_user_id, actor_name, payload, read_at, created_at }.
 */
export function getMyNotifications({ limit = 50, onlyUnread = false } = {}) {
  return callRpc('get_my_notifications', {
    p_limit: limit,
    p_only_unread: onlyUnread,
  });
}

/** Unread count for the badge. */
export function getMyNotificationUnreadCount() {
  return callRpc('get_my_notification_unread_count', {});
}

/** Mark a single notification as read. */
export function markNotificationRead(id) {
  return callRpc('mark_notification_read', { p_id: id });
}

/** Mark every unread notification as read. Returns how many were affected. */
export function markAllNotificationsRead() {
  return callRpc('mark_all_notifications_read', {});
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE — Pathway operations (owner only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Declare a pathway for the program (sets status='declared'). Can be a library
 * pathway or a custom one (provide custom_label / custom_description / etc.)
 */
export function declarePathway(programId, opts = {}) {
  return callRpc('declare_pathway', {
    p_program_id: programId,
    p_pathway_id: opts.pathwayId ?? null,
    p_owner_notes: opts.ownerNotes ?? null,
    p_custom_label: opts.customLabel ?? null,
    p_custom_description: opts.customDescription ?? null,
    p_custom_required_tics: opts.customRequiredTics ?? null,
    p_custom_regulatory_notes: opts.customRegulatoryNotes ?? null,
  });
}

/**
 * Activate a declared pathway. Requires both gates passed + pathway prereqs met.
 * Returns { success: false, error: 'foundation_gate_not_passed', missing_tics: [...] }
 * on gate failure (does not throw).
 */
export function activatePathway(programId, pathwayId) {
  return callRpc('activate_pathway', {
    p_program_id: programId,
    p_pathway_id: pathwayId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE — Output operations (owner only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add an output to the program. Either a library output_type OR a custom one.
 */
export function addProgramOutput(programId, opts = {}) {
  return callRpc('add_program_output', {
    p_program_id: programId,
    p_output_type: opts.outputType ?? null,
    p_title: opts.title ?? null,
    p_description: opts.description ?? null,
    p_pathway_id: opts.pathwayId ?? null,
    p_evidence_link: opts.evidenceLink ?? null,
    p_evidence_type: opts.evidenceType ?? null,
    p_evidence_notes: opts.evidenceNotes ?? null,
    p_visibility: opts.visibility ?? null,
    p_metadata: opts.metadata ?? {},
    p_custom_label: opts.customLabel ?? null,
    p_custom_category: opts.customCategory ?? null,
  });
}
