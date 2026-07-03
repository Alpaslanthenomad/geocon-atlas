# GEOCON / BEE AI Reference Lock

**Status:** Current working reference for ChatGPT, Claude, Cursor, and any other AI collaborator  
**Purpose:** Prevent architectural drift while updating the GEOCON/BEE repository from the old/transitional implementation toward the new target architecture captured in the current-only archive.  
**Current archive baseline:** `GEOCON_BEE_Current_Only_Archive_v4_5.zip`  
**Recommended repo path:** `docs/architecture/GEOCON_AI_REFERENCE_LOCK.md`

---

## 1. Critical rule

Do **not** treat the current repository implementation as the final GEOCON architecture.

The repository currently contains transitional or legacy implementation artifacts such as:

- Program Cockpit
- Program rooms
- Foundation / Field & Lab / Propagation / Output room flow
- Propagation Studio
- TIC / Evidence / Gate flow
- Old Program Flow assumptions
- Generic workbench/task-board patterns

These may be useful as implementation material, but they are **not** the final target architecture unless explicitly revalidated against the current-only architecture documents.

Correct distinction:

```text
repo reality ≠ target architecture
```

The current target architecture is defined by the latest/current documents in the current-only archive, not by whatever currently exists in code.

---

## 2. Source of truth hierarchy

When an AI agent works on GEOCON/BEE, use this hierarchy:

1. **This reference lock file** — fast alignment layer.
2. **Current-only archive** — latest target architecture library.
3. **Relevant current documents inside the archive**, especially GEOCON current docs and BEE layered docs.
4. **Current GitHub repository code** — implementation reality, not necessarily target truth.
5. **Conversation history / previous prompts** — useful context, but lower authority than the architecture lock and current archive.

Do not use old ZIP packs, historical master archives, screenshots, or earlier duplicate document versions as the active target unless the user explicitly asks for historical comparison.

---

## 3. Platform layer model

The architecture is layered:

```text
BEE — Biodiversity Execution Engine
│
├── Layer 1: GEOCON
│   Biodiversity stewardship / conservation qualification platform
│
├── Layer 2: DeepTech
│   Shared technical translation platform
│
└── Layer 3: Value / Exchange
    Responsible value, venture, licensing, partnership, and commercialization layer
```

Short interpretation:

```text
GEOCON  = Which biodiversity program matters, why, under which constraints, and what is safely knowable?
DeepTech = Can a qualified GEOCON signal become a technical translation case?
Exchange = Can a validated technical capability responsibly become value, partnership, licensing, or venture logic?
```

---

## 4. GEOCON target architecture

GEOCON is **not** merely a species list, old program dashboard, task board, propagation studio, or value pipeline.

GEOCON is BEE Layer 1: a stewardship and conservation qualification platform.

The current target GEOCON architecture is centered on:

- Initial Program Situation
- Program Habitat
- Target Core
- Scientific Grounding Layer
- Governance / Language Boundary
- Evidence Signal Node
- Safe Progression Horizons
- Translation Boundary
- Context Inspector
- Activity Rail
- Constraint-based Workbench
- Cross-WP Integrity
- Work Package logic
- Claim / Evidence / Output guardrails
- Program State Machine and prerequisite logic

GEOCON should make the following clear in the first user interaction:

```text
What is this program?
Why does it exist?
What is its current state?
What is blocked?
Why is it blocked?
What can be responsibly done next?
Which claims are allowed?
Which claims are not allowed?
When does a signal require translation rather than execution?
```

---

## 5. DeepTech target position

DeepTech is BEE Layer 2.

DeepTech is **not**:

- a GEOCON room
- a GEOCON tab
- a GEOCON studio
- a propagation extension
- a lab execution system
- a sample inventory
- a batch workflow
- an evidence promotion system
- a commercial/value surface

Correct relationship:

```text
GEOCON qualified signal → Translation Boundary → DeepTech Translation Case
```

DeepTech begins only after a GEOCON signal is sufficiently framed for technical translation.

DeepTech works on:

- Source Signal
- Translation Object
- Technical Question
- Method Route
- Traceability Context
- TCR State
- Next Safe Technical Step

DeepTech must not imply execution, evidence, or value by default.

---

## 6. Value / Exchange target position

Value / Exchange is BEE Layer 3.

Exchange should not be activated before GEOCON and DeepTech establish a responsible basis for value evaluation.

Correct chain:

```text
GEOCON program situation
→ qualified signal
→ Translation Boundary
→ DeepTech Translation Case
→ technical capability / readiness assessment
→ Value / Exchange evaluation
```

Exchange is not the current priority unless explicitly requested.

---

## 7. Current code status after recent work

The repository has recent merged work for DeepTech MVP prototyping:

### Sprint 0

- Added `/geocon/programs/[id]/deeptech`
- Added a static `DeepTechStudio` shell
- Added `DEEPTECH-MVP-CONTRACT.md`
- No database, no RPC, no execution

### Sprint 0.1

- Reframed entry from “DeepTech Studio” to “Translation Boundary / Teknik Çeviri Sınırı”
- Clarified that DeepTech is a separate layer, not a GEOCON room/tab/studio

### Sprint 1A

- Added browser-only editable local draft fields:
  - Source Signal
  - Translation Object
  - Technical Question
  - Method Route
  - Traceability Context
- Added computed local TCR state:
  - TCR-0
  - TCR-1
  - TCR-2 preview only
- Added Next Safe Technical Step
- Still no database writes, RPCs, runs, samples, batches, evidence promotion, or value logic

Important interpretation:

```text
This recent DeepTech work is a Layer 2 prototype.
It is not the final GEOCON architecture.
It should not cause GEOCON to remain locked into the old Program Cockpit / Rooms model.
```

---

## 8. Current strategic priority

The priority is not to expand DeepTech persistence immediately.

The priority is:

```text
Rebase the current repository UI and product flow toward the new GEOCON target architecture.
```

Specifically, before building more DeepTech or Exchange features, align the repository around:

1. Initial Program Situation
2. Program Habitat
3. Constraint-based Workbench
4. Safe Progression Horizons
5. Translation Boundary as a controlled boundary signal, not a DeepTech CTA
6. Claim / Evidence / Output guardrails
7. Cross-WP Integrity

---

## 9. Mandatory AI operating protocol

Before any AI agent writes code, it must answer these questions:

### Question 1 — Which layer is this task?

```text
Layer 1 — GEOCON
Layer 2 — DeepTech
Layer 3 — Value / Exchange
Platform shell / shared BEE infrastructure
Documentation / architecture lock
```

### Question 2 — Is this target migration or repo patching?

```text
A. Migrating repo toward new target architecture
B. Temporarily patching existing repo behavior
C. Prototyping a separate layer
D. Documentation only
```

### Question 3 — Which current-only documents are relevant?

At minimum, check the file names and select relevant documents from:

- `03_GEOCON_CURRENT/`
- `02_BEE_PLATFORM_CURRENT/`
- `01_BEE_DEEPTECH_CURRENT/`

### Question 4 — What must not be built?

Every sprint must explicitly list forbidden scope.

Common forbidden scope unless approved:

- No database migration
- No Supabase RPC
- No database writes
- No execution system
- No run/trial launcher
- No sample workflow
- No batch workflow
- No evidence promotion
- No TIC auto-completion
- No TCR-3+
- No commercial/value pathway
- No Exchange activation

---

## 10. Recommended next sprint framing

Recommended next sprint name:

```text
GEOCON Target Architecture Rebase — Sprint 0
```

Purpose:

```text
Create a clear bridge between the existing repo implementation and the new GEOCON target architecture.
```

Expected output:

- Identify current Program Cockpit / Rooms assumptions
- Decide what is kept, renamed, hidden, deprecated, or replaced
- Define the first target screen: Initial Program Situation
- Define Program Habitat as the new organizing model
- Define how Translation Boundary appears without becoming a DeepTech CTA
- Produce a ticket-level implementation plan before coding

Do not expand DeepTech Sprint 1B persistence until this rebase plan is accepted.

---

## 11. Cursor / Claude / ChatGPT startup prompt

Use this prompt at the start of any new AI coding session:

```text
Before coding, read docs/architecture/GEOCON_AI_REFERENCE_LOCK.md.

Do not treat the current repository’s Program Cockpit / Rooms / Propagation Studio / TIC-Evidence-Gate flow as the final GEOCON target architecture.

Those are transitional repo artifacts.

The current target architecture comes from the current-only GEOCON/BEE architecture archive and reframes GEOCON as BEE Layer 1: a biodiversity stewardship and conservation qualification platform.

DeepTech is BEE Layer 2: a separate technical translation platform.

Correct model:
GEOCON qualified signal → Translation Boundary → DeepTech Translation Case → later Value / Exchange

Current priority:
Rebase the existing repo UI toward the new GEOCON target architecture before expanding DeepTech persistence or Exchange.

Before editing files, state:
1. Which layer this task belongs to
2. Whether this is target migration or repo patching
3. Which files you intend to edit
4. What you will not build

Do not commit or push unless explicitly approved.
```

---

## 12. Manual update procedure

When a new current-only archive is created:

1. Update the `Current archive baseline` line in this file.
2. Update the source-of-truth document families if names/versions changed.
3. Add a short change note under `Change log`.
4. Commit this file before asking AI agents to continue implementation.

Recommended branch name:

```text
chore/geocon-ai-reference-lock
```

Recommended commit message:

```text
Add GEOCON AI reference lock
```

---

## 13. Change log

### v0.1

- Establishes repository-vs-target distinction
- Locks layered model: GEOCON → DeepTech → Exchange
- Defines GEOCON target architecture terms
- Classifies recent DeepTech route work as Layer 2 prototype
- Sets next priority as GEOCON Target Architecture Rebase before DeepTech persistence
