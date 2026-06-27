# DeepTech MVP — Sprint 0 Contract

Binding spec for the DeepTech technical reasoning instrument. Sprint 0 is a
static shell only — no database, no RPCs, no execution paths.

## One-line law

> DeepTech is a technical reasoning instrument, not a lab execution system.

## What DeepTech is

A program-scoped surface where a team frames an **Initial Technical Situation**:
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

Sprint 0 UI shows **TCR-0** as static placeholder state only.

## Initial Technical Situation — required sections

Every DeepTech Studio view must surface these blocks (static in Sprint 0):

1. **Source Signal** — what entered the reasoning chain (observation, literature, assay hint, etc.)
2. **Translation Object** — the technical object the team is reasoning about
3. **Technical Question** — the falsifiable or decidable question under study
4. **Method Route** — candidate approach (not executed in MVP)
5. **Traceability Context** — provenance, species/program anchors, gaps labelled
6. **Current TCR State** — state label only (no score bar)
7. **Next Safe Technical Step** — the next reasoning action, not a lab action
8. **Boundary Summary** — what this MVP explicitly does not do

## Required copy (must appear in the Studio shell)

- "DeepTech is a technical reasoning instrument, not a lab execution system."
- "Method Route selected does not produce technical evidence."
- "No controlled run exists in this MVP."
- "TCR is a technical state, not a score."

## Allowed UI actions (Sprint 0)

- Back to Program
- Review technical situation (in-page navigation)
- Read contract (in-page contract section)

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

## Routing (Sprint 0)

```
/geocon/programs/[id]/deeptech  →  DeepTechStudio.jsx (static shell)
```

Launcher: `ProgramCockpit` Studios row (same pattern as Propagation Studio).

## Firewall and integrity

- Money-blind: no prices, pathways, Exchange, or Z-region commerce framing
- No writes to `chain_evidence`, `program_tics`, or receipt mint in Sprint 0
- Any future AI assist must use `[EKLE:]` / `[ADD:]` placeholders; never auto-save as fact

## Sprint 1+ (not approved — do not build yet)

- `deeptech_session` / `deeptech_block` tables
- Member-scoped save/load RPCs
- Optional server-side reasoning assist (draft only)
- TIC weld or receipt mint (explicit human promote only)

## Revert trigger

If DeepTech grows run execution, sample inventory, batch workflow, a TCR progress
bar, or value-pathway UI, it has left the instrument contract — revert or strip
before merge.
