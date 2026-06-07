// THREE AXES, never conflated. This module owns the persona model so the
// distinction can never blur (the failure that breaks auth gates + the firewall):
//
//   STATION  — self-declared identity (undergrad / PhD / professor / R&D rep …).
//              RE-SKINS surfaces: reorders lanes, frames CTAs, filters the tool
//              launcher. NEVER grants access, NEVER hides data from the corpus.
//   ROLE     — verified (profiles.role: observer → admin) + verified org
//              memberships. GATES access. The ONLY axis that unlocks IUCN tools
//              or the commercial (Bahçe) deal desk.
//   INTENT   — explore / run / field (the existing get_my_persona lanes).
//              LENSES ordering. Each station resolves to exactly one intent so
//              the live Shell / IntentRouter plumbing never breaks.
//
// HARD INVARIANT: a STATION value must never appear inside an authorization
// check. If you find `station === ...` deciding what a user may DO (not just
// SEE-FIRST), that is a bug. Gating is role + org accreditation, full stop.

// Each station maps to one intent + the side of the conservation/commerce
// firewall it primarily lives on (signalling only — the wall is schema-enforced).
export const STATIONS = [
  // LEARNERS — the funnel; mostly read, low trust, high growth.
  { key: "undergrad",     label: "Undergraduate",        superClass: "learners",  intent: "explore", firewall: "conservation", gain: "A single guided lane; a good first node to fill on a common species; mentor pairing." },
  { key: "masters",       label: "Master's student",     superClass: "learners",  intent: "run",     firewall: "conservation", gain: "A thesis spine; the gap engine pointed at your taxon; join a program as science." },
  { key: "phd",           label: "PhD student",          superClass: "learners",  intent: "run",     firewall: "both",         gain: "A contribution dashboard; pathway-unlock milestones; grants; recruitable as a specialist." },
  // SCIENTISTS — the doers.
  { key: "research_asst", label: "Research assistant",   superClass: "scientists",intent: "field",   firewall: "conservation", gain: "An assigned-work queue + specimen inbox as your home; portable, credited evidence." },
  { key: "professor",     label: "Professor / PI",       superClass: "scientists",intent: "run",     firewall: "both",         gain: "A portfolio of programs + a lab page; a mentorship queue of matched students." },
  // CONSERVATION INSTITUTIONS.
  { key: "cons_public",   label: "Public conservation",  superClass: "institutions",intent: "run",   firewall: "conservation", gain: "The IUCN Hub as your front door; a jurisdiction ledger; the firewall shown as assurance." },
  { key: "cons_private",  label: "Botanic garden / NGO", superClass: "institutions",intent: "run",   firewall: "conservation", gain: "A germplasm / living-collection panel on the ex-situ ↔ propagation hinge." },
  // INDUSTRY — value side, read-only across the wall.
  { key: "industry_rnd",  label: "Industry R&D",         superClass: "industry",  intent: "run",     firewall: "value",        gain: "A maturity-filtered de-risking watchlist; brief authoring; the recognition registry." },
  { key: "industry_prod", label: "Production / supply",  superClass: "industry",  intent: "run",     firewall: "value",        gain: "A 'find cultivable supply' scout; a production-brief inbox." },
];

export const SUPER_CLASSES = {
  learners:     { label: "Learners",     blurb: "Students finding their footing." },
  scientists:   { label: "Scientists",   blurb: "Researchers doing the work." },
  institutions: { label: "Conservation", blurb: "Public + private conservation bodies." },
  industry:     { label: "Industry",     blurb: "R&D + production, value side of the wall." },
};

const BY_KEY = Object.fromEntries(STATIONS.map((s) => [s.key, s]));

export function getStation(key) {
  return BY_KEY[key] || null;
}

// A station always resolves to one of the three live intents; fall back to
// 'explore' so the Shell/IntentRouter never sees an unknown lane.
export function intentForStation(key) {
  return BY_KEY[key]?.intent || "explore";
}

export function stationsInClass(superClass) {
  return STATIONS.filter((s) => s.superClass === superClass);
}

// Convenience: which firewall side a station signals (NEVER used to gate).
export function firewallSide(key) {
  return BY_KEY[key]?.firewall || "conservation";
}

export const INTENTS = ["explore", "run", "field"];
