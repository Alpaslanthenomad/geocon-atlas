# GEOCON Target Rebase Plan

**Status:** DOC-6 planning document. Documentation only. No runtime authority by itself.  
**Branch context:** `docs/geocon-target-rebase-plan`  
**Core rule:** `repo reality ≠ target architecture`

---

## 2. Executive decision

The next product priority is **not**:

- expanding DeepTech persistence (Sprint 1B+),
- activating Exchange / Value surfaces,
- adding more Program Rooms, Studios, or old Venn Engine features,
- treating the current Program Cockpit as final GEOCON architecture.

The next priority **is**:

```text
Rebase the current Program experience toward the GEOCON target architecture
(BEE Layer 1 — biodiversity stewardship / conservation qualification platform).
```

Until Initial Program Situation and Program Habitat surfaces exist and are validated,
DeepTech remains a local-draft Layer 2 prototype and Exchange stays deferred.

Correct product chain (locked):

```text
GEOCON Program Situation
→ Qualified Signal
→ Translation Boundary
→ DeepTech Translation Case
→ technical capability / readiness assessment
→ (later) Exchange / Value evaluation
```

---

## 3. Source references and limitations

### Authority files read (repo)

| File | Role in this plan |
|------|-------------------|
| `docs/architecture/GEOCON_AI_REFERENCE_LOCK.md` | Target/repo distinction, BEE layers, current priority, forbidden scope |
| `docs/architecture/GEOCON_BEE_AI_AUDIT_PROTOCOL.md` | Audit questions, archive inventory, layer boundaries |
| `docs/architecture/GEOCON_LEGACY_DOCS_SALVAGE_MAP.md` | Salvage mapping, phased doc work (DOC-4/5/6) |
| `CLAUDE.md` | Transitional repo map, stack, non-negotiables (post DOC-4) |
| `docs/AI-WORKFLOW.md` | Required startup order, pre-code audit questions |
| `docs/architecture/README.md` | Folder authority warning, read-first list |
| `docs/architecture/INDEX.md` | Classification legend, re-tagged legacy entries |

### Salvage / repo-reality docs read

| File | Classification used |
|------|---------------------|
| `docs/architecture/02-layers.md` | Transitional — old 5-layer model |
| `docs/architecture/03-programs.md` | Transitional — rooms/tabs/gates lifecycle |
| `docs/architecture/QUICKREF.md` | Legacy/transitional partner quickref |
| `docs/architecture/VENN-ENGINE-CONTRACT.md` | Transitional — engine mechanics salvage |
| `docs/architecture/WORKSPACE-ROADMAP.md` | Technical salvage — member loop, workspace |
| `docs/architecture/NORTH-STAR.md` | Historical strategy |
| `docs/architecture/NORTH-STAR-ANALYSIS.md` | Historical strategy / metrics salvage |
| `docs/architecture/DEEPTECH-MVP-CONTRACT.md` | Target-current — Layer 2 prototype boundary |

### Repo code inventory consulted (read-only, not edited)

- `components/programs/v2/*` — 43 files including Cockpit, DetailPanel, tabs, studios, hooks, RPC wrappers
- `app/geocon/programs/[id]/*` — program landing, propagation sub-route, deeptech sub-route

### Current-only archive — **NOT locally available**

The baseline archive `GEOCON_BEE_Current_Only_Archive_v4_5.zip` and extracted
`03_GEOCON_CURRENT/`, `02_BEE_PLATFORM_CURRENT/`, `01_BEE_DEEPTECH_CURRENT/` folders
were **not found** on the local machine during DOC-6 authoring.

**Limitation:** Detailed claims from the following target documents are **not**
verified line-by-line in this plan. They are referenced by name from the audit
protocol inventory only. Implementation tickets must re-read the archive before coding.

**GEOCON current (not read — names from audit protocol):**

- GEOCON_Implementation_Architecture_v1_9
- GEOCON_Domain_Grammar_and_State_Model_v1_7
- GEOCON_Initial_Program_Situation_Screen_Blueprint_v0_2
- GEOCON_Initial_Program_Situation_Interaction_Model_v0_1
- GEOCON_Program_Control_Plane_v1_1
- GEOCON_Program_State_Machine_Gate_Logic_v1_1
- GEOCON_Program_State_Machine_Prerequisite_Update_v2_0
- GEOCON_Safe_Progression_Horizons_v0_1
- GEOCON_Workbench_Model_Correction_v1_4
- GEOCON_Work_Package_Library_Detailed_Reference_v2_1
- GEOCON_Work_Package_One_Page_Flow_Map_v1_8
- GEOCON_Cross_WP_Integrity_Layer_v1_0
- GEOCON_Evidence_Claim_Output_Guardrail_Model_v1_0
- GEOCON_Experience_Architecture_v0_1
- GEOCON_Experience_Architecture_Gate_v0_1
- GEOCON_Visual_Spatial_Prototype_Brief_v0_2
- GEOCON_Visual_Spatial_Prototype_Red_Team_Review_v1_0

**BEE / layer boundary (not read):**

- BEE_Layered_Platform_Architecture_v0_2
- BEE_Layer_Transition_and_Soft_Handoff_Principles_v0_1
- BEE_Shared_DeepTech_Translation_Layer_v0_3
- BEE_DeepTech_Core_Object_Model_v0_1
- BEE_DeepTech_MVP_Build_Boundary_v0_2
- BEE_Shared_Value_Venture_Layer_v0_1

**What this plan still provides without the archive:** migration framing from
known repo reality → target concept vocabulary locked in authority files and
salvage map; a phased rebase; a bounded first code sprint proposal.

---

## 4. Current repo reality

Transitional implementation summary. Classifications: **preserve**, **salvage**,
**hide/demote**, **replace**, **reframe**, **defer**.

| Artifact | What it is today | Action |
|----------|------------------|--------|
| **Program Cockpit** (`ProgramCockpit.jsx`) | Hero layer above VennHero; derives mission from stage + next required TIC + gate/evidence | **Reframe** → seed logic for Initial Program Situation; **demote** as final home later |
| **ProgramDetailPanel** | 7-tab shell: Foundation, Field & Lab, Pathways, Species, Contributors, Outputs, Stream | **Wrap** → habitat entry; **replace** tab-first IA over time |
| **HeroPanel / VennHero** | Stage pill, species context, blocker pair, health rings, member agreement | **Salvage** data bindings; **reframe** into Program State Summary + Claim Boundary |
| **Rooms / tabs** | Foundation, Field & Lab, Propagation (via tab), Pathways, Outputs | **Reframe** → Work Package domains; **hide/demote** room labels as final UX |
| **Foundation / Field & Lab / Propagation / Output flow** | Venn stage pipeline + gate progression | **Salvage** prerequisite math; **replace** navigation metaphor with Safe Progression Horizons |
| **TIC / Evidence / Gate / Venn Engine** | Half-migrated engine; RPCs + UI on region/stage model | **Salvage** mechanics → Evidence Signal Node + guardrails; **reframe** language away from "gate bureaucracy" |
| **TicCard / TicTree / RoomWorkbench** | Room-scoped work surfaces | **Preserve** short-term; **wrap** under Constraint-based Workbench |
| **Propagation Studio** (`PropagationStudio.jsx`, `/propagation` route) | Execution-flavored studio sub-route | **Demote** — not GEOCON center; candidate DeepTech/specialized module input later |
| **Program Stream** (`StreamTab.jsx`) | Member activity feed | **Reframe** → Activity Rail |
| **Workspace** (`/geocon/workspace`) | Personal hub: assignments, drafts, my programs | **Preserve** adjacent to Program Habitat; not program center |
| **Member gating / join door** | Visibility RPCs, JoinProgramButton, Contributors | **Preserve** — maps to Governance / Language Boundary |
| **MemberAgreementPanel** | Revenue/IP splits, member-only | **Preserve** — Governance boundary; keep off public qualification face |
| **Translation Boundary route** (`/deeptech`, launcher in Cockpit) | Layer 2 local-draft Translation Case (Sprint 0–1A) | **Reframe** — soft boundary signal in GEOCON; **defer** persistence |
| **programRpc.js + hooks** | RPC consumers for stage, region, members, stream | **Preserve** — read adapters for new surfaces |
| **5-layer docs** (02-layers, QUICKREF) | Commons/Programs/Studies/Briefs/Recognition | **Salvage** firewall + table lists; **do not** treat as target layering |

---

## 5. Target product destination

### A. Initial Program Situation

The first GEOCON program screen must answer:

```text
What is this program?
Why does it exist?
What is its current state?
What is blocked?
Why is it blocked?
What can responsibly be done next?
Which claims are allowed?
Which claims are forbidden?
Which boundary is next?
```

**Salvage from repo:** ProgramCockpit already derives mission from engine state
(active stage, next required TIC, gate/evidence). HeroPanel surfaces blockers and
stage. These become **read adapters**, not the final layout authority.

**Not allowed as the answer:** room tabs, propagation studio prominence, TIC
completion as claim truth, DeepTech CTA as primary action.

### B. Program Habitat

Organizing model replacing room-first navigation. Target regions:

| Region | Role |
|--------|------|
| **Target Core** | Species/program focal object, mission, scope |
| **Scientific Grounding Layer** | Species facts, taxonomy, IUCN, provenance (from Species Commons substrate) |
| **Governance / Language Boundary** | Member roles, visibility, agreements, claim language rules |
| **Evidence Signal Node** | Evidence strength, signals, prerequisites — not a scoreboard |
| **Safe Progression Horizons** | What may proceed now vs later; replaces stage-room metaphor |
| **Translation Boundary** | Controlled handoff signal when GEOCON signal needs Layer 2 framing |
| **Context Inspector** | Drill-down on constraints, sources, gaps |
| **Activity Rail** | Member activity (from Stream) |
| **Constraint-based Workbench** | Work surfaces gated by constraints — not generic task board |
| **Cross-WP Integrity** | Cross–Work Package consistency checks |

Phase 1–2 deliver a **skeleton** that reads existing RPC data through this vocabulary.

### C. Work Package logic

Old rooms → Work Package domains (not final tab labels):

| Old room / stage | Work Package domain | Horizon theme |
|------------------|---------------------|---------------|
| **Foundation** | Identity / legitimacy / scope | Why this program exists; taxonomic and conservation scope |
| **Field & Lab** | Biological documentation / material context | Observations, vouchers, baseline assessment |
| **Propagation** | Propagation readiness / method feasibility | Strategy declared — not execution center |
| **Output** | Claim / evidence / output boundary | What may be stated publicly; outputs vs claims |

Pathways tab maps to **value-position salvage** — keep data, demote as primary
navigation; Z-axis content must not bleed into qualification UI.

### D. Translation Boundary

GEOCON shows Translation Boundary as a **controlled boundary signal**:

- Appears when a qualified signal may need technical translation
- Does **not** read as "open DeepTech Studio" or Program tab
- DeepTech route remains Layer 2 at `/geocon/programs/[id]/deeptech`
- Handoff copy follows `DEEPTECH-MVP-CONTRACT.md` and soft-handoff principles (archive doc not read locally)

---

## 6. Rebase strategy

### Phase 0 — Documentation alignment (completed)

- `GEOCON_AI_REFERENCE_LOCK.md`
- `GEOCON_BEE_AI_AUDIT_PROTOCOL.md`
- `GEOCON_LEGACY_DOCS_SALVAGE_MAP.md` (DOC-3A)
- DOC-4 hierarchy patch (`CLAUDE.md`, `AI-WORKFLOW.md`, `README.md`, `INDEX.md`)

### Phase 1 — New Program entry surface

Add **Initial Program Situation** above or before current Program Cockpit on
`/geocon/programs/[id]`. Do not delete Cockpit, DetailPanel, or tabs.

Deliverable: founder-visible screen answering Section 5A questions using existing RPCs.

### Phase 2 — Program Habitat skeleton

New habitat layout section(s) that read program/species/evidence data through target
concepts. Cockpit + tabs remain reachable below or behind "transitional view" link.

Deliverable: habitat scaffold components wired to existing hooks; no new DB.

### Phase 3 — Work Package remap

Map Foundation / Field & Lab / Propagation / Output content to Work Package
cards or domains inside habitat. Do not preserve room names as final UX if they
conflict with target architecture (e.g. "Propagation Studio" as center).

Deliverable: WP domain cards that deep-link to existing tab content initially.

### Phase 4 — Evidence / Claim / Output guardrail

Re-express TIC/Evidence/Gate mechanics as:

- Evidence Signal Node (strength, prerequisites)
- Claim Guardrails (allowed / forbidden claims)
- Safe Progression Horizons (what unlocks responsibly)

Salvage `VENN-ENGINE-CONTRACT.md` math; change language and presentation.

Deliverable: ClaimBoundaryPanel + horizon labels; no auto-promotion of evidence.

### Phase 5 — Translation Boundary cleanup

Demote DeepTech launcher from "studio row" prominence to boundary signal pattern.
Copy: qualified signal → boundary → optional Layer 2 case. No persistence expansion.

Deliverable: `TranslationBoundarySignal.jsx`; Cockpit launcher restyled per founder review.

### Phase 6 — Legacy UI demotion

Once new surfaces work: Cockpit + room tabs become secondary, "classic view", or
debug. Routes stay alive (never delete routes rule).

Deliverable: navigation hierarchy change; founder sign-off required.

### Phase 7 — DeepTech re-link

Only after GEOCON produces a visible qualified signal in habitat: relink boundary
to DeepTech Translation Case with explicit signal payload (still no DB until approved).

Deliverable: handoff contract review against archive DeepTech docs.

### Phase 8 — Exchange later

No Exchange activation, VC surfaces, licensing UI, or investment logic until
GEOCON + DeepTech basis exists. Layer 3 docs are reference only.

---

## 7. Component / file impact map

Likely repo areas affected in future sprints. **No edits authorized by this document.**

| Area | Classification | Notes |
|------|----------------|-------|
| `components/programs/v2/ProgramCockpit.jsx` | Likely **wrapped** + **demoted** | Mission derivation logic **preserved** |
| `components/programs/v2/HeroPanel.jsx` | Likely **refactored** | Blocker/state salvage into new panels |
| `components/programs/v2/VennHero.jsx` | Likely **demoted** | Region viz salvage; not habitat center |
| `components/programs/v2/ProgramDetailPanel.jsx` | Likely **wrapped** | Tabs become transitional entry |
| `components/programs/v2/tabs/*` | Likely **preserved** short-term | Deep-linked from WP domains |
| `components/programs/v2/components/TicCard.jsx`, `TicTree.jsx`, `GateBanner.jsx` | Likely **refactored** | Evidence Signal Node presentation |
| `components/programs/v2/components/RoomWorkbench.jsx` | Likely **wrapped** | Constraint-based Workbench shell |
| `components/programs/v2/studio/PropagationStudio.jsx` | Likely **demoted** | Not GEOCON center |
| `components/programs/v2/studio/DeepTechStudio.jsx` | Likely **preserved** (Layer 2) | No persistence until Phase 7 |
| `components/programs/v2/hooks/*` | Likely **preserved** | RPC adapters for new surfaces |
| `components/programs/v2/lib/programRpc.js` | Likely **preserved** | May add view-model helpers only |
| `app/geocon/programs/[id]/page.js` | Likely **refactored** | Mount Initial Program Situation first |
| `app/geocon/programs/[id]/deeptech/page.js` | Likely **preserved** | Layer 2 route unchanged |
| `app/geocon/programs/[id]/propagation/page.js` | Likely **demoted** | Keep route; reduce prominence |
| `docs/architecture/*` | **Documentation only** | Banners (DOC-5), ticket plans |
| Program state RPC consumers | Likely **preserved** | `get_program_stage_status`, region status, etc. |

---

## 8. First code sprint proposal after DOC-6

### GEOCON Sprint 1 — Initial Program Situation Surface

**Layer:** 1 (GEOCON)  
**Type:** Target migration — UI wrapper only  
**Prerequisite:** Founder accepts DOC-6; current-only archive consulted for blueprint v0_2 before pixel work.

#### Scope (in)

- No DB migration
- No new RPC unless absolutely necessary (prefer existing `get_program_stage_status`, region status, program read RPCs)
- No DeepTech persistence
- No Exchange
- Use existing program data
- Add or wrap UI only
- Show: state, blockers, allowed next action, claim boundary summary, translation boundary signal (read-only / link)

#### Scope (out)

- Deleting Cockpit, tabs, or routes
- Propagation Studio expansion
- TIC auto-completion or evidence promotion
- New gate logic in DB
- DeepTech Sprint 1B

#### Suggested new components

| Component | Purpose |
|-----------|---------|
| `InitialProgramSituation.jsx` | Top-level surface; composes sub-panels |
| `ProgramSituationHeader.jsx` | What / why / species context |
| `ProgramStateSummary.jsx` | Current state, stage/horizon mapping (salvage Cockpit logic) |
| `ProgramBlockerPanel.jsx` | Blocked + why (from HeroPanel/blocker RPCs) |
| `ClaimBoundaryPanel.jsx` | Allowed / forbidden claims (static rules + engine hints first) |
| `TranslationBoundarySignal.jsx` | Soft boundary — link to `/deeptech`, not studio CTA |

#### Suggested mount point

`app/geocon/programs/[id]/page.js` — render `InitialProgramSituation` above existing
`ProgramCockpit` + `ProgramDetailPanel` stack.

#### Acceptance (founder-visible)

Opening any program answers "what is happening and what is safe to do next"
without requiring room navigation first.

---

## 9. Non-goals

This plan **does not authorize**:

- Deleting old UI components or routes
- Deleting or rewriting old docs without review
- Building Exchange, VC, licensing, or investment UI
- Expanding DeepTech persistence (Sprint 1B+)
- Database migrations or RPC changes
- Auto-promoting evidence or TIC completion
- Treating TIC completion as claim truth
- Treating old Rooms as final GEOCON architecture
- Propagation Studio as GEOCON product center
- Value-pathway or Z-region commerce in Layer 1 surfaces

---

## 10. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Old docs mislead AI into room-first builds | Authority order + salvage map + DOC-5 banners on 02/03/QUICKREF |
| Old Program UI dominates founder perception | Initial Program Situation above Cockpit; plain-language demo |
| TIC/Gate language feels bureaucratic | Rename to horizons / signals / guardrails in new surfaces only |
| DeepTech looks like GEOCON tab | Translation Boundary as signal; DEEPTECH-MVP-CONTRACT copy |
| Exchange pulled in too early | Explicit Phase 8 defer; Layer 3 docs marked historical in INDEX |
| Too many docs confuse agents | Lock → audit → salvage → this plan; single sprint scope |
| Archive unavailable during sprint | Block pixel-perfect work until blueprint v0_2 is read |
| Wrapper-only sprint feels shallow | Founder acceptance criterion: clarity of situation, not feature count |
| Half-migrated Venn engine bugs | Reuse existing RPCs; no engine rewrite in Sprint 1 |

---

## 11. Review checklist

Before starting GEOCON Sprint 1:

- [ ] Does this move the repo toward target architecture (not just rename labels)?
- [ ] Does this preserve useful technical material (RPCs, hooks, gating)?
- [ ] Does this avoid treating repo reality as target truth?
- [ ] Does this keep GEOCON, DeepTech, and Exchange separated by layer?
- [ ] Does this produce a buildable next sprint with explicit forbidden scope?
- [ ] Does this avoid DB/runtime changes for Sprint 1?
- [ ] Has the founder answered open questions in Section 12?
- [ ] Has `GEOCON_Initial_Program_Situation_Screen_Blueprint_v0_2` been read from archive?

---

## 12. Open questions for founder

1. **Landing vs overlay:** Should Initial Program Situation **replace** the current
   program landing immediately, or appear **above** Cockpit first (recommended: above first)?

2. **Habitat layout:** Should Program Habitat be **one scrollable page** or a
   **spatial/sectioned layout** (archive mentions visual/spatial prototype — not read locally)?

3. **Classic view:** Should old rooms remain accessible as **technical/debug** views
   indefinitely, or demoted behind a single "transitional view" link?

4. **Test program:** Which existing program should be the **first test case** for
   Sprint 1 (e.g. a Galanthus program with real TIC progress)?

5. **Minimum proof:** What is the **minimum founder-visible improvement** that proves
   the new GEOCON direction — one screen clarity, Turkish copy, blocker honesty, or other?

6. **Claim boundary v1:** For Sprint 1, are static claim rules sufficient, or must
   claim allowed/forbidden be **engine-derived** from day one?

---

## 13. Related documents

| Document | Relationship |
|----------|--------------|
| `GEOCON_AI_REFERENCE_LOCK.md` | Primary alignment |
| `GEOCON_BEE_AI_AUDIT_PROTOCOL.md` | Pre-code audit |
| `GEOCON_LEGACY_DOCS_SALVAGE_MAP.md` | Salvage taxonomy |
| `DEEPTECH-MVP-CONTRACT.md` | Layer 2 boundary (Phase 5–7) |
| `VENN-ENGINE-CONTRACT.md` | Engine salvage (Phase 4) — not target UX |

---

## 14. Change log

### DOC-6 v0.1

- Initial target rebase plan from repo authority files and salvage docs
- Explicit limitation: current-only archive not locally available
- Phases 0–8, component impact map, Sprint 1 proposal, risks, founder questions
