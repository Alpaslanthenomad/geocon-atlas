import { supabase } from “./supabase”;

/* ════════════════════════════════════════════════════════
GEOCON — Programs Data Access Layer
Tüm program veri erişimi buradan yapılır.
UI bileşenleri Supabase detaylarını bilmez.
════════════════════════════════════════════════════════ */

// ── FETCH ────────────────────────────────────────────────

export async function fetchPrograms() {
const { data, error } = await supabase
.from(“programs”)
.select(”*, species(id, accepted_name, iucn_status, family, thumbnail_url, composite_score)”)
.order(“priority_score”, { ascending: false });
if (error) throw error;
return data || [];
}

export async function fetchProgramById(id) {
const { data, error } = await supabase
.from(“programs”)
.select(”*, species(id, accepted_name, iucn_status, family, thumbnail_url, composite_score)”)
.eq(“id”, id)
.single();
if (error) throw error;
return data;
}

export async function fetchProgramStory(programId) {
const { data, error } = await supabase
.from(“program_story_entries”)
.select(”*”)
.eq(“program_id”, programId)
.order(“entry_date”, { ascending: false });
if (error) throw error;
return data || [];
}

export async function fetchProgramActions(programId) {
const { data, error } = await supabase
.from(“program_actions”)
.select(”*”)
.eq(“program_id”, programId)
.order(“created_at”, { ascending: false });
if (error) throw error;
return data || [];
}

export async function fetchProgramDecisions(programId) {
const { data, error } = await supabase
.from(“program_decisions”)
.select(”*”)
.eq(“program_id”, programId)
.order(“decision_date”, { ascending: false });
if (error) throw error;
return data || [];
}

// ── Home dashboard queries ────────────────────────────────

export async function fetchRecentStoryEntries(limit = 8) {
const { data, error } = await supabase
.from(“program_story_entries”)
.select(”*, programs(program_name, current_module, current_gate)”)
.order(“created_at”, { ascending: false })
.limit(limit);
if (error) throw error;
return data || [];
}

export async function fetchRecentDecisions(limit = 6) {
const { data, error } = await supabase
.from(“program_decisions”)
.select(”*, programs(program_name, current_module)”)
.order(“decision_date”, { ascending: false })
.limit(limit);
if (error) throw error;
return data || [];
}

export async function fetchDueActions(limit = 10) {
const today = new Date().toISOString().split(“T”)[0];
const { data, error } = await supabase
.from(“program_actions”)
.select(”*, programs(program_name, current_module)”)
.in(“status”, [“open”, “Open”, “in progress”, “In Progress”])
.or(`due_date.lte.${today},priority.eq.high`)
.order(“due_date”, { ascending: true, nullsFirst: false })
.limit(limit);
if (error) throw error;
return data || [];
}

export async function fetchBlockedPrograms() {
const { data, error } = await supabase
.from(“programs”)
.select(”*, species(accepted_name, iucn_status)”)
.or(“status.eq.Blocked,status.eq.blocked”)
.not(“primary_blocker”, “is”, null);
if (error) throw error;
return data || [];
}

// ── CREATE ───────────────────────────────────────────────

export async function createProgram(payload) {
const { data, error } = await supabase
.from(“programs”)
.insert({
…payload,
program_code: payload.program_code || `PROG-${Date.now()}`,
status:           payload.status           || “Active”,
current_module:   payload.current_module   || “Origin”,
current_gate:     payload.current_gate     || “Selection”,
readiness_score:  payload.readiness_score  || 0,
confidence_score: payload.confidence_score || 20,
priority_score:   payload.priority_score   || 0,
recommended_pathway: “Origin → Forge → Mesh → Exchange → Accord”,
})
.select()
.single();
if (error) throw error;
return data;
}

export async function createProgramStoryEntry(payload) {
const { data, error } = await supabase
.from(“program_story_entries”)
.insert({
…payload,
entry_date: payload.entry_date || new Date().toISOString().split(“T”)[0],
})
.select()
.single();
if (error) throw error;
return data;
}

export async function createProgramAction(payload) {
const { data, error } = await supabase
.from(“program_actions”)
.insert({
…payload,
status:   payload.status   || “open”,
priority: payload.priority || “medium”,
})
.select()
.single();
if (error) throw error;
return data;
}

export async function createProgramDecision(payload) {
const { data, error } = await supabase
.from(“program_decisions”)
.insert({
…payload,
decision_date: payload.decision_date || new Date().toISOString().split(“T”)[0],
})
.select()
.single();
if (error) throw error;
return data;
}

// ── UPDATE ───────────────────────────────────────────────

export async function updateProgram(id, updates) {
const { data, error } = await supabase
.from(“programs”)
.update({ …updates, updated_at: new Date().toISOString() })
.eq(“id”, id)
.select()
.single();
if (error) throw error;
return data;
}

export async function updateActionStatus(actionId, status) {
const updates = { status };
if ([“completed”,“Completed”].includes(status)) {
updates.completed_at = new Date().toISOString();
}
const { data, error } = await supabase
.from(“program_actions”)
.update(updates)
.eq(“id”, actionId)
.select()
.single();
if (error) throw error;
return data;
}

// ── ADVANCE GATE (module/gate geçişi) ───────────────────

const MODULE_ORDER = [“Origin”,“Forge”,“Mesh”,“Exchange”,“Accord”];
const GATE_ORDER   = [“Selection”,“Validation”,“Protocol”,“Deployment”,“Venture”,“Governance”];

export async function advanceGate(program) {
const gateIdx = GATE_ORDER.indexOf(program.current_gate);
const modIdx  = MODULE_ORDER.indexOf(program.current_module);

let nextGate   = program.current_gate;
let nextModule = program.current_module;

if (gateIdx < GATE_ORDER.length - 1) {
nextGate = GATE_ORDER[gateIdx + 1];
} else if (modIdx < MODULE_ORDER.length - 1) {
nextModule = MODULE_ORDER[modIdx + 1];
nextGate   = GATE_ORDER[0];
}

const updated = await updateProgram(program.id, {
current_gate:   nextGate,
current_module: nextModule,
});

// Auto story entry
await createProgramStoryEntry({
program_id:    program.id,
entry_type:    “Gate Passed”,
title:         `Geçiş: ${program.current_gate} → ${nextGate}`,
summary:       `Program ${program.current_module}/${program.current_gate} aşamasından ${nextModule}/${nextGate} aşamasına ilerledi.`,
author:        program.owner_name || “GEOCON”,
linked_module: nextModule,
linked_gate:   nextGate,
});

return updated;
}

// ── FULL PROGRAM INIT (StartProgramModal kullanır) ──────

export async function initProgram({ species, whyNow, firstAction, ownerName }) {
// 1. Program oluştur
const program = await createProgram({
program_name:        `${species.accepted_name} · GEOCON Program`,
species_id:          species.id,
program_type:        “Conservation & Propagation”,
status:              “Active”,
current_module:      “Origin”,
current_gate:        “Selection”,
owner_name:          ownerName || “Alpaslan Acar”,
risk_level:          [“CR”,“EN”].includes(species.iucn_status) ? “high”
: species.iucn_status === “VU” ? “medium” : “low”,
priority_score:      species.composite_score || 0,
why_this_program:    whyNow,
strategic_rationale: `GEOCON program initiated for ${species.accepted_name}. All programs begin at Origin/Selection and progress through evidence, propagation, community, and venture phases.`,
next_action:         firstAction || “Define baseline: collect available literature, assess ex situ feasibility, initiate GEOCON story.”,
what_is_missing:     “Program story not yet complete — generate via GEOCON story harvester.”,
});

// 2. Açılış hikayesi
await createProgramStoryEntry({
program_id:    program.id,
entry_type:    “Milestone Reached”,
title:         “Program initiated — entering Origin”,
summary:       `GEOCON program started for ${species.accepted_name}. Reason: ${whyNow}. This species will now follow the full GEOCON journey: Origin → Forge → Mesh → Exchange → Accord. Story will be written transparently at every step.`,
author:        ownerName || “Alpaslan Acar”,
linked_module: “Origin”,
linked_gate:   “Selection”,
});

// 3. İlk aksiyon
if (firstAction) {
await createProgramAction({
program_id:   program.id,
action_title: firstAction,
action_owner: ownerName || “Alpaslan Acar”,
status:       “open”,
priority:     “high”,
});
}

return program;
}