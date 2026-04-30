import { supabase } from "./supabase";

/* ════════════════════════════════════════════════════════
GEOCON — Programs Data Access Layer
All program data access lives here.
UI components should not know Supabase details.
════════════════════════════════════════════════════════ */

const MODULE_ORDER = ["Origin", "Forge", "Mesh", "Exchange", "Accord"];
const GATE_ORDER = ["Selection", "Validation", "Protocol", "Deployment", "Venture", "Governance"];

/* ── FETCH ───────────────────────────────────────────── */

export async function fetchPrograms() {
  const { data, error } = await supabase
    .from("programs")
    .select("*, species(id, accepted_name, iucn_status, family, thumbnail_url, composite_score), created_by_researcher:researchers!created_by(id, name, institution)")
    .order("priority_score", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchProgramById(id) {
  const { data, error } = await supabase
    .from("programs")
    .select("*, species(id, accepted_name, iucn_status, family, thumbnail_url, composite_score), created_by_researcher:researchers!created_by(id, name, institution)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchProgramStory(programId) {
  const { data, error } = await supabase
    .from("program_story_entries")
    .select("*")
    .eq("program_id", programId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchProgramActions(programId) {
  const { data, error } = await supabase
    .from("program_actions")
    .select("*")
    .eq("program_id", programId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchProgramDecisions(programId) {
  const { data, error } = await supabase
    .from("program_decisions")
    .select("*")
    .eq("program_id", programId)
    .order("decision_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchProgramMembers(programId) {
  const { data, error } = await supabase
    .from("program_members")
    .select("*, researchers(id,name,institution,country,expertise_area,member_status)")
    .eq("program_id", programId);

  if (error) {
    console.warn("fetchProgramMembers failed:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchProgramPublications(programId) {
  const { data, error } = await supabase
    .from("program_publications")
    .select("*, publications(id,title,authors,year,journal,doi,abstract,is_curated,category)")
    .eq("program_id", programId)
    .order("added_at", { ascending: false });

  if (error) {
    console.warn("fetchProgramPublications failed:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchProgramSpecies(programId) {
  const { data, error } = await supabase
    .from("program_species")
    .select("*, species(id,accepted_name,family,genus,iucn_status,thumbnail_url,composite_score)")
    .eq("program_id", programId)
    .order("role", { ascending: true });  // 'Linked' < 'Primary' alfabetik; sonra useCases'te primary'i öne sıralarız

  if (error) {
    console.warn("fetchProgramSpecies failed:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchProgramContributions(programId) {
  const { data, error } = await supabase
    .from("contributions")
    .select(`
      id, contribution_type, what_was_done, how_it_was_done, result_summary,
      contribution_score, impact_score, reliability_score, relevance_score,
      status, evidence_links, created_at,
      contributor:researchers!contributions_contributor_id_fkey(id, name, institution),
      verifier:researchers!contributions_verified_by_fkey(id, name)
    `)
    .eq("program_id", programId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("fetchProgramContributions failed:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchProgramAuthority(programId) {
  const { data, error } = await supabase
    .from("v_researcher_program_authority")
    .select("*")
    .eq("program_id", programId)
    .order("authority_score", { ascending: false });

  if (error) {
    console.warn("fetchProgramAuthority failed:", error.message);
    return [];
  }
  return data || [];
}

/* ── PERFORMANCE: tek RPC ile tüm panel verisi ────────
   8 paralel PostgREST round-trip yerine tek çağrı.
   Backend: get_program_full_details (SECURITY INVOKER, RLS aktif).
   Response: { story, actions, decisions, members, publications,
               species, contributions, authority } — hepsi array.
   Şekiller PostgREST nested join formatıyla birebir uyumlu,
   yani UI tarafında alan dönüştürmesi gerekmiyor.
   ──────────────────────────────────────────────────── */
export async function fetchProgramFullDetails(programId) {
  const { data, error } = await supabase
    .rpc("get_program_full_details", { p_program_id: programId });

  if (error) {
    console.warn("fetchProgramFullDetails failed:", error.message);
    throw error;
  }
  return data || {};
}

// Bir tür hangi programlarda kullanılıyor — B yönü tersine link
export async function fetchProgramsForSpecies(speciesId) {
  const { data, error } = await supabase
    .from("program_species")
    .select(`
      role, added_at,
      programs(id, program_name, status, current_module, current_gate, priority_score)
    `)
    .eq("species_id", speciesId);

  if (error) {
    console.warn("fetchProgramsForSpecies failed:", error.message);
    return [];
  }
  return data || [];
}

/* ── HOME DASHBOARD QUERIES ──────────────────────────── */

export async function fetchRecentStoryEntries(limit = 8) {
  const { data, error } = await supabase
    .from("program_story_entries")
    .select("*, programs(program_name, current_module, current_gate)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchRecentDecisions(limit = 6) {
  const { data, error } = await supabase
    .from("program_decisions")
    .select("*, programs(program_name, current_module)")
    .order("decision_date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchDueActions(limit = 10) {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("program_actions")
    .select("*, programs(program_name, current_module)")
    .in("status", ["open", "Open", "in progress", "In Progress"])
    .or(`due_date.lte.${today},priority.eq.high`)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function fetchBlockedPrograms() {
  const { data, error } = await supabase
    .from("programs")
    .select("*, species(accepted_name, iucn_status)")
    .or("status.eq.Blocked,status.eq.blocked,primary_blocker.not.is.null");

  if (error) throw error;
  return data || [];
}

/* ── CREATE ─────────────────────────────────────────── */

export async function createProgram(payload) {
  const insertPayload = {
    ...payload,
    program_code: payload.program_code || `PROG-${Date.now()}`,
    status: payload.status || "Active",
    current_module: payload.current_module || "Origin",
    current_gate: payload.current_gate || "Selection",
    readiness_score: payload.readiness_score ?? 0,
    confidence_score: payload.confidence_score ?? 20,
    priority_score: payload.priority_score ?? 0,
    recommended_pathway:
      payload.recommended_pathway || "Origin → Forge → Mesh → Exchange → Accord",
  };

  const { data, error } = await supabase
    .from("programs")
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createProgramStoryEntry(payload) {
  const { data, error } = await supabase
    .from("program_story_entries")
    .insert({
      ...payload,
      entry_date: payload.entry_date || new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createProgramAction(payload) {
  const { data, error } = await supabase
    .from("program_actions")
    .insert({
      ...payload,
      status: payload.status || "open",
      priority: payload.priority || "medium",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createProgramDecision(payload) {
  const { data, error } = await supabase
    .from("program_decisions")
    .insert({
      ...payload,
      decision_date: payload.decision_date || new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ── UPDATE ─────────────────────────────────────────── */

export async function updateProgram(id, updates) {
  const { data, error } = await supabase
    .from("programs")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateActionStatus(actionId, status) {
  const updates = { status };

  if (["completed", "Completed"].includes(status)) {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("program_actions")
    .update(updates)
    .eq("id", actionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ── GATE / MODULE TRANSITION ────────────────────────── */

export async function advanceGate(program) {
  const gateIdx = GATE_ORDER.indexOf(program.current_gate);
  const modIdx = MODULE_ORDER.indexOf(program.current_module);

  let nextGate = program.current_gate;
  let nextModule = program.current_module;

  const isAtFinalGate = gateIdx === GATE_ORDER.length - 1;
  const isAtFinalModule = modIdx === MODULE_ORDER.length - 1;

  if (!isAtFinalGate) {
    nextGate = GATE_ORDER[gateIdx + 1];
  } else if (!isAtFinalModule) {
    nextModule = MODULE_ORDER[modIdx + 1];
    nextGate = GATE_ORDER[0];
  } else {
    return program;
  }

  const updated = await updateProgram(program.id, {
    current_gate: nextGate,
    current_module: nextModule,
  });

  await createProgramStoryEntry({
    program_id: program.id,
    entry_type: "Gate Passed",
    title: `Transition: ${program.current_gate} → ${nextGate}`,
    summary: `Program advanced from ${program.current_module}/${program.current_gate} to ${nextModule}/${nextGate}.`,
    author: program.created_by_researcher?.name || "GEOCON",
    linked_module: nextModule,
    linked_gate: nextGate,
  });

  return updated;
}

/* ── FULL PROGRAM INIT (used by StartProgramModal) ───── */
// Faz 3.2 sonrası: ownerName parametresi DEPRECATED.
// createdBy (researcher_id) ve ownerDisplayName (action_owner/story author için metin)
// olarak çağırılır. ownerName eski çağrılar için backward-compatible.
export async function initProgram({ species, whyNow, firstAction, createdBy, ownerDisplayName, ownerName }) {
  // Backward compat: eski çağrılar ownerName: "Alpaslan Acar" şeklindeyse
  const displayName = ownerDisplayName || ownerName || "GEOCON";

  const program = await createProgram({
    program_name: `${species.accepted_name} · GEOCON Program`,
    species_id: species.id,
    program_type: "Conservation & Propagation",
    status: "Active",
    current_module: "Origin",
    current_gate: "Selection",
    created_by: createdBy || null,
    risk_level: ["CR", "EN"].includes(species.iucn_status)
      ? "high"
      : species.iucn_status === "VU"
      ? "medium"
      : "low",
    priority_score: species.composite_score || 0,
    why_this_program: whyNow,
    strategic_rationale: `GEOCON program initiated for ${species.accepted_name}. All programs begin at Origin/Selection and progress through evidence, propagation, community, and venture phases.`,
    next_action:
      firstAction ||
      "Define baseline: collect available literature, assess ex situ feasibility, initiate GEOCON story.",
    what_is_missing: "Program story not yet complete — generate via GEOCON story harvester.",
  });

  await createProgramStoryEntry({
    program_id: program.id,
    entry_type: "Milestone Reached",
    title: "Program initiated — entering Origin",
    summary: `GEOCON program started for ${species.accepted_name}. Reason: ${whyNow}. This species will now follow the full GEOCON journey: Origin → Forge → Mesh → Exchange → Accord. Story will be written transparently at every step.`,
    author: displayName,
    linked_module: "Origin",
    linked_gate: "Selection",
  });

  if (firstAction) {
    await createProgramAction({
      program_id: program.id,
      action_title: firstAction,
      action_owner: displayName,
      status: "open",
      priority: "high",
    });
  }

  return program;
}
