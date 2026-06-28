# DeepTech MVP — Sprint 0 Contract

Binding spec for the DeepTech technical reasoning instrument. Sprint 0 is a
static shell only — no database, no RPCs, no execution paths.

## One-line law

> DeepTech is a technical reasoning instrument, not a lab execution system.

## Architecture placement

> DeepTech may be launched from a GEOCON Program context, but it is not a GEOCON
> Program tab, room, or execution surface.

Correct mental model:

```
GEOCON Program → Translation Boundary → DeepTech Translation Case
```

DeepTech is a **shared technical translation layer**. A program may hand off a
GEOCON signal through the Translation Boundary; the Translation Case is where
that signal is framed — not inside the program engine rooms.

## What DeepTech is

A Translation Case surface where a team frames an **Initial Technical Situation**:
what signal arrived, how it was translated into a technical object, which
question is worth asking, which method route is under consideration, and what
traceability context applies — before any controlled run exists.

## What DeepTech is NOT (Sprint 0–1 hard boundaries)

- Not a lab execution system
- Not a run launcher or batch workflow
- Not a sample inventory or accession ledger
- Not an evidence promoter or TIC auto-completer
- Not a commercial, value-pathway, licensing, or investment surface
- Not a progress score — **TCR is a technical state, not a score**

## TCR (Technical Chain Reasoning) — state model

TCR names where the reasoning chain stands. It is **descriptive state**, not a
percentage, bar, or leaderboard.

| State | Meaning (Sprint 0 placeholder) |
|-------|--------------------------------|
| TCR-0 | Source signal received; situation not yet framed |
| TCR-1 | Translation object and technical question drafted |
| TCR-2 | Method route selected; traceability context attached |

TCR-3 and above are **out of scope** for DeepTech MVP (controlled runs,
evidence promotion, pathway activation).

Sprint 0 UI showed **TCR-0** as static placeholder only. Sprint 1A adds
**in-browser editable draft fields** with computed TCR (no persistence).

## Sprint 1A — local draft (shipped scope)

- Five editable fields in the Translation Case: Source Signal, Translation
  Object, Technical Question, Method Route, Traceability Context
- **Browser-only state** — no database writes, no RPCs, no localStorage in 1A
- **Reset local draft** clears component state only
- TCR computed from draft content:
  - **TCR-0** — Translation Object or Technical Question missing
  - **TCR-1** — both present; Method Route or Traceability Context missing
  - **TCR-2 (preview)** — all four framing fields present; preview only, no
    evidence or execution implied; TCR-3 remains out of scope
- Next Safe Technical Step derived from first missing required field
- Forbidden: Save to database, execution controls, evidence/TIC promotion

## Sprint 1B (not approved — do not build yet)

- `deeptech_session` / `deeptech_block` tables and member-scoped persistence

## Initial Technical Situation — required sections

Every DeepTech Translation Case view must surface these blocks (editable draft
fields in Sprint 1A for items 1–5; computed read-only for 6–8):

1. **Source Signal** — what entered the reasoning chain (observation, literature, assay hint, etc.)
2. **Translation Object** — the technical object the team is reasoning about
3. **Technical Question** — the falsifiable or decidable question under study
4. **Method Route** — candidate approach (not executed in MVP)
5. **Traceability Context** — provenance, species/program anchors, gaps labelled
6. **Current TCR State** — state label only (no score bar)
7. **Next Safe Technical Step** — the next reasoning action, not a lab action
8. **Boundary Summary** — what this MVP explicitly does not do

## Required copy (must appear in the Translation Case shell)

- "DeepTech is a technical reasoning instrument, not a lab execution system."
- "Method Route selected does not produce technical evidence."
- "No controlled run exists in this MVP."
- "TCR is a technical state, not a score."

## Allowed UI actions (Sprint 0–1A)

- Back to Program
- Review technical situation (in-page navigation)
- Read contract (in-page contract section)
- Reset local draft (Sprint 1A — clears in-browser state only)

## Forbidden UI actions (never in DeepTech MVP)

- Start experiment
- Launch run
- Add sample
- Create batch
- Promote evidence
- Open value pathway
- Commercialize
- License
- Investment-ready
- Save to database

## Routing

```
/geocon/programs/[id]/deeptech  →  DeepTechStudio.jsx (Translation Case)
```

Launcher: `ProgramCockpit` Studios row as **Translation Boundary** (not labelled
as a Program Studio). Route pattern matches propagation sub-pages; product
semantics do not.

## Firewall and integrity

- Money-blind: no prices, pathways, Exchange, or Z-region commerce framing
- No writes to `chain_evidence`, `program_tics`, or receipt mint in Sprint 0–1A
- Any future AI assist must use `[EKLE:]` / `[ADD:]` placeholders; never auto-save as fact

## Sprint 1C+ (not approved — do not build yet)

- Optional server-side reasoning assist (draft only)
- TIC weld or receipt mint (explicit human promote only)

## Revert trigger

If DeepTech grows run execution, sample inventory, batch workflow, a TCR progress
bar, or value-pathway UI, it has left the instrument contract — revert or strip
before merge.
