# GEOCON Program Habitat — Phase 2 Ticket Breakdown v1

**Status:** Planning only. No runtime authority by itself — follows
`GEOCON_TARGET_REBASE_PLAN.md` Phase 2 scope: "habitat scaffold components
wired to existing hooks; no new DB."

**Core rule carried over:** `repo reality ≠ target architecture`. Nothing here
deletes Cockpit, tabs, or routes. Everything wraps or reframes existing data.

Each ticket is sized to be finishable in one sitting, buildable, and shippable
on its own — no ticket depends on a future one to be safe to merge.

---

## Sequencing logic

Ordered by (1) lowest risk / pure scaffolding first, (2) highest data-salvage /
least new logic next, (3) anything requiring a product decision (not just a
wiring decision) pushed to the end. This mirrors how Phase 1 actually shipped
(3–9 July): lock docs → one wrapper surface → cleanup. Same shape, smaller bites.

---

## Ticket 1 — Habitat shell (pure scaffold, no data)

**Goal:** A `ProgramHabitat.jsx` component that renders 10 empty, labeled
region slots (Target Core, Scientific Grounding Layer, Governance/Language
Boundary, Evidence Signal Node, Safe Progression Horizons, Translation
Boundary, Context Inspector, Activity Rail, Constraint-based Workbench,
Cross-WP Integrity) as placeholder cards.

**Mount point:** Below `InitialProgramSituation`, above `ProgramCockpit`,
behind a "habitat preview" toggle — not the default view yet.

**Data:** None. Static labels only.

**Out of scope:** Any RPC calls, any real content.

**Acceptance:** Opening a program shows the 10-region skeleton; toggling
between it and the classic Cockpit view works; nothing else changes.

---

## Ticket 2 — Activity Rail (lowest-risk salvage)

**Salvage source:** `useProgramStream` / `getProgramStream` (already powers
`StreamTab.jsx`).

**Goal:** Wire the Activity Rail slot to the existing stream data — same read,
new presentation (rail, not tab).

**Out of scope:** Posting comments from this view (read-only for v1).

**Acceptance:** Activity Rail shows real recent program activity.

---

## Ticket 3 — Governance / Language Boundary

**Salvage source:** `useProgramMembers` / `getProgramMembersFull`,
`MemberCard.jsx`, `VisibilityBadge.jsx`.

**Goal:** Show member roles + visibility state in the Governance slot.
`MemberAgreementPanel` data stays member-gated exactly as today (per
`CLAUDE.md` non-negotiable #5 — PII/NDA gating unchanged).

**Out of scope:** Any new role/permission logic.

**Acceptance:** Governance slot reflects real membership + visibility data.

---

## Ticket 4 — Target Core

**Salvage source:** `useProgramFoundation` / `getProgramFoundationStatus`,
existing Program header / species context.

**Goal:** Target Core slot shows species/program focal object, mission
sentence (already has the `UNSAFE_MISSION_PATTERNS` filter from
`InitialProgramSituation.jsx` — reuse it here, don't reimplement).

**Out of scope:** New mission-authoring UI.

**Acceptance:** Target Core shows the same filtered mission sentence logic
already proven in Sprint 1A, now inside the habitat shell.

---

## Ticket 5 — Translation Boundary signal

**Salvage source:** Existing `/deeptech` route + `DEEPTECH-MVP-CONTRACT.md`
copy requirements; partial work already done in the "workbench action
demotion" commits (8–9 July).

**Goal:** Move the DeepTech entry point into the habitat's Translation
Boundary slot as a soft signal (not a studio CTA) — finishes what the 8 July
demotion commits started, now inside the new shell instead of inside Cockpit.

**Out of scope:** Any DeepTech persistence (Sprint 1B) — still frozen.

**Acceptance:** Translation Boundary slot shows the signal; clicking it goes
to the existing DeepTech Translation Case unchanged.

---

## Ticket 6 — Evidence Signal Node

**Salvage source:** `TicCard.jsx`, `TicTree.jsx`, `GateBanner.jsx`, existing
TIC/Evidence RPCs.

**Goal:** Re-present TIC/Evidence/Gate data as "signal strength +
prerequisites" language — explicitly **not** a score or progress bar (per
Rebase Plan Section 5B and `DEEPTECH-MVP-CONTRACT.md`'s "TCR is a state, not
a score" precedent — apply the same rule here).

**Out of scope:** Any change to underlying TIC completion logic, gate math,
or the Venn engine itself. This is presentation only.

**Acceptance:** Evidence Signal Node shows real evidence state in
non-gamified language; a red-team pass (like the Sprint 1 Product Coherence
Review) checks it doesn't read as a scoreboard.

---

## Ticket 7 — Safe Progression Horizons

**Salvage source:** `get_program_stage_status`, `get_program_region_status`
(existing RPCs per `CLAUDE.md`).

**Goal:** Translate stage/region state into "what may proceed now vs. later"
language, replacing the stage-room metaphor for this slot only (old rooms
stay reachable elsewhere, per "never delete routes").

**Out of scope:** New stage/region computation logic — pure relabeling of
existing RPC output.

**Acceptance:** Horizons slot answers "what's safe to do next" without
navigating into rooms first.

---

## Ticket 8 — Scientific Grounding Layer

**Salvage source:** Species Commons substrate (species pages, taxonomy, IUCN
data) — first ticket pulling from outside the program engine.

**Goal:** Show species facts / taxonomy / IUCN / provenance relevant to this
program's focal species inside the habitat, read-only.

**Out of scope:** Editing species data from this view.

**Acceptance:** Grounding Layer shows real species facts tied to the
program's target.

---

## Deferred — needs a founder product decision first, not just wiring

These three are intentionally last because the Rebase Plan doesn't fully
specify their shape yet — each needs a short founder decision before a ticket
can be written:

- **Context Inspector** — drill-down UX on constraints/sources/gaps. Needs:
  what does "drill down" mean concretely — modal, side panel, expand-in-place?
- **Constraint-based Workbench** — replaces `RoomWorkbench.jsx`. Needs:
  which constraints gate which actions, decided explicitly (not inherited
  silently from old room logic).
- **Cross-WP Integrity** — cross–Work Package consistency checks. Needs: this
  assumes Work Package remap (Rebase Plan Phase 3) exists first — likely
  belongs after Phase 3, not inside Phase 2 at all. Recommend moving this out
  of Phase 2 scope entirely and re-filing under Phase 3/4.

---

## Non-goals (carried from the Rebase Plan, still binding)

Same list as `GEOCON_TARGET_REBASE_PLAN.md` Section 9 — no Exchange/VC/
licensing UI, no DeepTech Sprint 1B, no DB migrations, no auto-promoted
evidence, no deleted routes or components.

---

## Suggested order for a single-founder pace

Tickets 1–4 are pure salvage/relabeling of data that already exists and is
already proven safe (mission filter, member gating). They could reasonably
be one short session each. Ticket 5 closes a loop already half-started.
Tickets 6–8 are where real judgment calls live (language, non-gamified
framing, species integration) — better done one at a time, each reviewed
before starting the next, rather than batched.
