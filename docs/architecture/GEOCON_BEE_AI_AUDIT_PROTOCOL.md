# GEOCON / BEE AI Audit Protocol

**Version:** v0.1  
**Status:** Cross-AI operating audit file  
**Intended users:** ChatGPT, Claude, Cursor, custom agents, external AI reviewers, future RAG/indexing systems  
**Baseline archive:** `GEOCON_BEE_Current_Only_Archive_v4_5.zip`  
**Primary repo path:** `docs/architecture/GEOCON_BEE_AI_AUDIT_PROTOCOL.md`  
**Companion lock file:** `docs/architecture/GEOCON_AI_REFERENCE_LOCK.md`

---

## 0. Purpose

This file is not merely a prompt. It is a **portable audit and operating protocol** for any AI agent working on GEOCON / BEE.

Its purpose is to prevent the following failures:

1. Treating the current GitHub repository implementation as the final GEOCON architecture.
2. Confusing legacy / transitional repo artifacts with the new target architecture.
3. Building DeepTech as if it were a GEOCON room, tab, or studio.
4. Activating Exchange / value logic before the GEOCON → DeepTech foundation is stable.
5. Writing code before identifying the correct platform layer, source documents, boundaries, and forbidden scope.
6. Allowing future AI agents to drift away from the current-only architecture library.

Core principle:

```text
Repo reality is implementation evidence.
The current-only architecture archive is target architecture evidence.
They are not the same thing.
```

---

## 1. Fast startup instruction for any AI

Any AI agent must begin by reading and obeying:

```text
docs/architecture/GEOCON_AI_REFERENCE_LOCK.md
docs/architecture/GEOCON_BEE_AI_AUDIT_PROTOCOL.md
```

Then it must answer these five audit questions **before proposing code**:

```text
1. Which layer does this task belong to?
2. Is this target-architecture migration, temporary repo patching, separate-layer prototyping, or documentation?
3. Which current-only documents are authoritative for this task?
4. Which existing repo files are implementation reality only, not target authority?
5. What must not be built in this sprint?
```

If the AI cannot answer these five questions, it must not write code.

---

## 2. Layer map

GEOCON / BEE is layered:

```text
BEE — Biodiversity Execution Engine
│
├── Layer 1: GEOCON
│   Biodiversity stewardship / conservation qualification platform
│
├── Layer 2: DeepTech
│   Shared technical translation platform
│
└── Layer 3: Exchange / Value
    Responsible value, venture, licensing, partnership, and commercialization layer
```

Layer meaning:

| Layer | Platform | Core question | Primary object | Forbidden confusion |
|---|---|---|---|---|
| 1 | GEOCON | Which biodiversity program matters, why, under which constraints, and what can responsibly be done? | Program / Program Situation | Do not reduce to old Program Cockpit, rooms, task board, or propagation studio |
| 2 | DeepTech | Can a qualified GEOCON signal become a technical translation case? | Translation Case | Do not treat as GEOCON tab, room, studio, or lab execution system |
| 3 | Exchange / Value | Can a validated technical capability responsibly become value, partnership, licensing, or venture logic? | Value Case | Do not activate before GEOCON and DeepTech establish responsible basis |

---

## 3. Source-of-truth hierarchy

Use this hierarchy for all AI reasoning:

1. `GEOCON_AI_REFERENCE_LOCK.md`
2. This file: `GEOCON_BEE_AI_AUDIT_PROTOCOL.md`
3. `GEOCON_BEE_Current_Only_Archive_v4_5.zip`
4. Current-only document families inside the archive:
   - `03_GEOCON_CURRENT/`
   - `02_BEE_PLATFORM_CURRENT/`
   - `01_BEE_DEEPTECH_CURRENT/`
5. Current GitHub repository code
6. Conversation history
7. Historical ZIPs, screenshots, older duplicate documents

Critical rule:

```text
The current repo is a build target and evidence source.
It is not automatically the architecture source of truth.
```

---

## 4. Current-only archive inventory

The active compact archive is:

```text
GEOCON_BEE_Current_Only_Archive_v4_5.zip
```

It contains the current working library only. Historical duplicates, older update packs, render screenshots, QA contact sheets, and previous master archives are intentionally excluded.

### 4.1 GEOCON current documents

Folder:

```text
03_GEOCON_CURRENT/
```

Important GEOCON documents include:

```text
GEOCON_Final_Scope_Freeze_and_Build_Boundary_v0_1.docx
GEOCON_Implementation_Architecture_v1_9.docx
GEOCON_Implementation_Boundary_Sprint_Scope_v1_1.docx
GEOCON_Domain_Grammar_and_State_Model_v1_7.docx
GEOCON_Terminology_and_Model_Corrections_v1_6.docx
GEOCON_Initial_Program_Situation_Screen_Blueprint_v0_2.docx
GEOCON_Initial_Program_Situation_Interaction_Model_v0_1.docx
GEOCON_Program_Control_Plane_v1_1.docx
GEOCON_Program_State_Machine_Gate_Logic_v1_1.docx
GEOCON_Program_State_Machine_Prerequisite_Update_v2_0.docx
GEOCON_Safe_Progression_Horizons_v0_1.docx
GEOCON_Workbench_Model_Correction_v1_4.docx
GEOCON_Work_Package_Library_Detailed_Reference_v2_1.docx
GEOCON_Work_Package_One_Page_Flow_Map_v1_8.docx
GEOCON_Cross_WP_Integrity_Layer_v1_0.docx
GEOCON_Evidence_Claim_Output_Guardrail_Model_v1_0.docx
GEOCON_Sprint_1_Developer_Handoff_Brief_v1_8.docx
GEOCON_Sprint_1_Ticket_Level_Build_Plan_v0_1.docx
GEOCON_Sprint_1_Technical_Product_Implementation_Spec_v0_3.docx
GEOCON_Experience_Architecture_v0_1.docx
GEOCON_Experience_Architecture_Gate_v0_1.docx
GEOCON_Visual_Spatial_Prototype_Brief_v0_2.docx
GEOCON_Visual_Spatial_Prototype_Red_Team_Review_v1_0.docx
```

### 4.2 BEE platform current documents

Folder:

```text
02_BEE_PLATFORM_CURRENT/
```

Important BEE documents include:

```text
BEE_Layered_Platform_Architecture_v0_2.docx
BEE_Layer_Transition_and_Soft_Handoff_Principles_v0_1.docx
BEE_Shared_Value_Venture_Layer_v0_1.docx
```

### 4.3 DeepTech current documents

Folder:

```text
01_BEE_DEEPTECH_CURRENT/
```

Important DeepTech documents include:

```text
BEE_Shared_DeepTech_Translation_Layer_v0_3.docx
BEE_DeepTech_Core_Object_Model_v0_1.docx
BEE_DeepTech_MVP_Build_Boundary_v0_2.docx
BEE_DeepTech_MVP_Build_Contract_v0_1.docx
BEE_DeepTech_MVP_Developer_Handoff_Brief_v0_1.docx
BEE_DeepTech_MVP_Ticket_Level_Build_Plan_v0_1.docx
BEE_DeepTech_Technical_Control_Plane_v0_1.docx
BEE_DeepTech_Technical_Question_Library_v0_1.docx
BEE_DeepTech_Translation_Object_Type_Registry_v0_1.docx
BEE_DeepTech_Red_Team_Hardening_Patch_v0_1.docx
```

---

## 5. GEOCON target architecture audit

GEOCON target architecture must be treated as **BEE Layer 1**.

GEOCON is not merely:

```text
species list
old dashboard
old Program Cockpit
old room flow
generic workbench
propagation studio
TIC/evidence/gate-only flow
commercial/value pipeline
DeepTech workspace
```

GEOCON target architecture centers on:

```text
Initial Program Situation
Program Habitat
Target Core
Scientific Grounding Layer
Governance / Language Boundary
Evidence Signal Node
Safe Progression Horizons
Translation Boundary
Context Inspector
Activity Rail
Constraint-based Workbench
Cross-WP Integrity
Work Package logic
Claim / Evidence / Output guardrails
Program State Machine
Prerequisite logic
```

### GEOCON first-interaction test

A correct GEOCON screen must answer:

```text
What is this program?
Why does it exist?
What is its current state?
Why is it in this state?
What is blocked?
Why is it blocked?
What can be responsibly done next?
Which claims are allowed?
Which claims are forbidden?
Which boundary does the program approach next?
```

If a screen cannot answer these questions, it is not yet aligned with the new GEOCON target architecture.

---

## 6. DeepTech audit

DeepTech is **BEE Layer 2**.

Correct relationship:

```text
GEOCON qualified signal → Translation Boundary → DeepTech Translation Case
```

DeepTech works on:

```text
Source Signal
Translation Object
Technical Question
Method Route
Traceability Context
TCR State
Next Safe Technical Step
```

DeepTech must not be represented as:

```text
GEOCON room
GEOCON tab
GEOCON studio
propagation extension
lab execution system
sample inventory
batch workflow
evidence promotion system
commercial/value surface
```

### Current DeepTech repo status

Recent merged work includes:

```text
Sprint 0:
- Added /geocon/programs/[id]/deeptech
- Added static DeepTechStudio shell
- Added DEEPTECH-MVP-CONTRACT.md
- No DB, no RPC, no execution

Sprint 0.1:
- Reframed entry from DeepTech Studio to Translation Boundary / Teknik Çeviri Sınırı
- Clarified DeepTech as separate layer, not GEOCON room/tab/studio

Sprint 1A:
- Added browser-only editable draft fields
- Added computed local TCR-0 / TCR-1 / TCR-2 preview
- Added Next Safe Technical Step
- Still no DB writes, RPCs, runs, samples, batches, evidence promotion, or value logic
```

Interpretation:

```text
This is a Layer 2 prototype.
It is not the final GEOCON target architecture.
It must not pull GEOCON back into the old Program Cockpit / Rooms model.
```

---

## 7. Exchange / Value audit

Exchange / Value is **BEE Layer 3**.

It should not be activated before the following chain exists:

```text
GEOCON Program Situation
→ Qualified Signal
→ Translation Boundary
→ DeepTech Translation Case
→ Technical capability/readiness assessment
→ Value / Exchange evaluation
```

Exchange is not current priority unless explicitly requested.

Forbidden premature elements:

```text
commercial CTA
investment-ready button
license pathway
value score
market-opportunity route
partner/value matching
automated venture readiness
```

---

## 8. Repo reality vs target architecture audit

Before modifying any repo file, classify it as one of:

```text
A. Target-aligned and should be preserved
B. Transitional but useful
C. Legacy and should be deprecated or hidden
D. Conflicting with target architecture
E. Unknown; requires document comparison
```

Known transitional/legacy patterns in the repo include:

```text
Program Cockpit
Program rooms
Foundation / Field & Lab / Propagation / Output room flow
Propagation Studio
TIC / Evidence / Gate flow
Old Program Flow assumptions
Generic task-board workbench assumptions
```

These are not automatically wrong, but they are not final authority.

Every AI must avoid this error:

```text
Because something exists in the repo, it must be the target product model.
```

---

## 9. Sprint classification protocol

Every sprint must be classified before work begins.

### 9.1 Layer classification

```text
Layer 1 — GEOCON
Layer 2 — DeepTech
Layer 3 — Exchange / Value
Platform shell / shared BEE infrastructure
Documentation / architecture governance
```

### 9.2 Work type classification

```text
A. Target architecture migration
B. Temporary repo patch
C. Prototype of a separate layer
D. Documentation / audit / governance
E. Red-team review
F. Technical debt cleanup
```

### 9.3 Scope boundary

Every sprint must include:

```text
Allowed files
Forbidden files
Allowed behavior
Forbidden behavior
Data persistence rule
Execution rule
Value/commercial rule
Migration/RPC rule
Rollback trigger
```

---

## 10. Mandatory no-build list unless explicitly approved

Unless explicitly approved, do not build:

```text
database migration
Supabase RPC
database writes
execution system
run/trial launcher
sample workflow
batch workflow
evidence promotion
TIC auto-completion
TCR-3+
commercial/value pathway
Exchange activation
investment/licensing UI
AI auto-save as fact
AI auto-promotion of evidence
```

This list may be narrowed or expanded per sprint, but any change must be explicit.

---

## 11. AI response contract

When any AI proposes an implementation, it must answer in this structure:

```text
1. Layer:
2. Work type:
3. Source documents to consult:
4. Repo files likely affected:
5. What this changes:
6. What this does not change:
7. Forbidden scope:
8. Build/test command:
9. Review criteria:
10. Rollback trigger:
```

If the AI cannot fill this structure, it should ask for clarification or audit documents before coding.

---

## 12. Cursor coding protocol

Use this at the top of every Cursor implementation prompt:

```text
Before coding, read:
- docs/architecture/GEOCON_AI_REFERENCE_LOCK.md
- docs/architecture/GEOCON_BEE_AI_AUDIT_PROTOCOL.md

Do not treat current Program Cockpit / Rooms / Propagation Studio / TIC-Evidence-Gate flow as final GEOCON architecture.

First state:
1. Which layer this task belongs to
2. Whether this is target migration, repo patching, separate-layer prototyping, or documentation
3. Which files you intend to edit
4. Which current-only documents are relevant
5. What you will not build

Do not commit or push unless explicitly approved.
```

---

## 13. External AI / custom AI usage protocol

When using this file with an external AI, provide at minimum:

```text
1. GEOCON_AI_REFERENCE_LOCK.md
2. GEOCON_BEE_AI_AUDIT_PROTOCOL.md
3. CURRENT_ONLY_ARCHIVE_MANIFEST.txt
4. Relevant current-only documents for the target layer
5. Current repo file excerpts only after layer classification
```

Recommended ingestion order for RAG/custom AI:

```text
Priority 1: GEOCON_AI_REFERENCE_LOCK.md
Priority 2: GEOCON_BEE_AI_AUDIT_PROTOCOL.md
Priority 3: CURRENT_ONLY_ARCHIVE_MANIFEST.txt
Priority 4: BEE layered documents
Priority 5: GEOCON current documents
Priority 6: DeepTech current documents
Priority 7: Current repo code
Priority 8: conversation logs / prompts
Priority 9: historical archives, only if requested
```

Do not let custom AI ingest old ZIPs at equal priority with current-only documents unless building a historical comparison engine.

---

## 14. Audit modes

### Mode A — Architecture audit

Use when checking whether a proposed feature matches the target model.

Questions:

```text
Which layer owns this feature?
Does the feature belong in GEOCON, DeepTech, Exchange, or shared BEE?
Does it accidentally activate a later layer?
Does it rely on repo legacy assumptions?
Which current-only document supports it?
```

### Mode B — Repo migration audit

Use when modifying current repo UI/code.

Questions:

```text
Is this preserving, hiding, renaming, replacing, or deprecating existing repo structures?
Does it move the repo toward Initial Program Situation / Program Habitat?
Does it reduce dependence on old Program Cockpit / Rooms assumptions?
```

### Mode C — Sprint boundary audit

Use before coding.

Questions:

```text
What is the minimum buildable slice?
What is explicitly out of scope?
What would make this sprint unsafe?
What test proves the boundary was respected?
```

### Mode D — Red-team audit

Use before merge.

Questions:

```text
Did the change reintroduce old architecture as target?
Did it make DeepTech look like a GEOCON room/studio?
Did it make Exchange/value appear too early?
Did it add unapproved DB, RPC, execution, sample, batch, or evidence behavior?
```

---

## 15. Current strategic road map

### Phase 0 — Architecture governance

Status: active.

Outputs:

```text
GEOCON_AI_REFERENCE_LOCK.md
GEOCON_BEE_AI_AUDIT_PROTOCOL.md
Current-only archive baseline
Repo/source-of-truth distinction
```

### Phase 1 — GEOCON Target Architecture Rebase

Next priority.

Purpose:

```text
Move the current repo from transitional Program Cockpit / Rooms assumptions toward the new GEOCON target architecture.
```

Primary target concepts:

```text
Initial Program Situation
Program Habitat
Constraint-based Workbench
Safe Progression Horizons
Translation Boundary as controlled signal
Claim / Evidence / Output guardrails
Cross-WP Integrity
```

### Phase 2 — GEOCON first target screen

Likely output:

```text
Initial Program Situation screen
```

Must answer:

```text
What is this program?
What is its state?
What is blocked?
Why is it blocked?
What can be responsibly done next?
```

### Phase 3 — Program Habitat / spatial model

Purpose:

```text
Replace or shadow old rooms with a new program situation model.
```

### Phase 4 — Controlled Translation Boundary

Purpose:

```text
Show that a signal may require technical translation without making DeepTech a GEOCON CTA or studio.
```

### Phase 5 — DeepTech continuation

Only after GEOCON rebase is aligned.

Potential next DeepTech step:

```text
Minimal draft persistence for Translation Cases
```

Still forbidden unless approved:

```text
execution
sample/batch workflow
evidence promotion
TCR-3+
value/commercial logic
```

### Phase 6 — Exchange / Value

Last layer.

Not current priority.

---

## 16. Merge / PR audit checklist

Before merge, answer:

```text
1. Does this PR mention the correct layer?
2. Does it preserve repo-vs-target distinction?
3. Does it cite or align with the current-only archive?
4. Does it avoid unapproved DB/RPC/execution/value changes?
5. Does it avoid making DeepTech a GEOCON room/tab/studio?
6. Does it avoid making Exchange appear prematurely?
7. Does build pass?
8. Are changed files limited to the approved scope?
9. Is there a rollback path?
10. Does the PR description state forbidden scope?
```

---

## 17. Manual update protocol

When a new archive is created:

```text
1. Update baseline archive name in this file.
2. Update document inventory if versions changed.
3. Update GEOCON_AI_REFERENCE_LOCK.md.
4. Add a change-log entry.
5. Commit both governance files before new feature work.
```

When repo architecture changes:

```text
1. Update Current code status section if needed.
2. Add migration notes.
3. Mark whether old structures are preserved, hidden, deprecated, or replaced.
```

When an external AI is added:

```text
1. Provide this file and the reference lock first.
2. Provide the current-only manifest.
3. Provide only relevant documents for the layer.
4. Do not start from repo files alone.
```

---

## 18. Compact prompt for any AI

```text
You are working on the GEOCON / BEE platform.

Before answering, read and obey:
- GEOCON_AI_REFERENCE_LOCK.md
- GEOCON_BEE_AI_AUDIT_PROTOCOL.md

Critical rule:
Do not treat the current repo implementation as the final GEOCON target architecture.

Target layer model:
GEOCON = Layer 1 stewardship / conservation qualification platform.
DeepTech = Layer 2 technical translation platform.
Exchange = Layer 3 responsible value / venture layer.

Current priority:
Rebase the repo toward the new GEOCON target architecture before expanding DeepTech persistence or Exchange.

Before proposing code, state:
1. Layer
2. Work type
3. Source documents
4. Files to edit
5. Forbidden scope
6. Test/build command
7. Rollback trigger
```

---

## 19. Change log

### v0.1

- Establishes portable cross-AI audit protocol.
- Distinguishes repo reality from target architecture.
- Defines layer ownership for GEOCON, DeepTech, and Exchange.
- Captures current-only archive baseline `GEOCON_BEE_Current_Only_Archive_v4_5.zip`.
- Adds sprint, PR, merge, Cursor, and external AI audit checklists.
- Sets GEOCON Target Architecture Rebase as next priority before DeepTech persistence or Exchange.
