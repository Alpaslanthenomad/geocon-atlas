# GEOCON — Venn Engine Migration Contract (v1.0 FINAL)

> The binding spec for moving the program engine from the old wheel
> (conservation / science) model to the Venn region + stage model. Authored by
> the founder, recorded 2026-06-08. Build Sprint 2-4 to this contract exactly —
> no guessing. Diagnosis: the system is not scattered, it is half-migrated
> (region columns exist in the DB; the RPCs + UI still compute on wheel). The job
> is an engine rewrite, not a rebuild.

## The one-paragraph law (give this to the builder)

> Gate logic stays **stage-based**. Region logic shows **value-position**.
> Integrated Core is a **maturity target, not a gate condition**. Priority is for
> **gate urgency**, not score weight — the ring percentage is computed by **equal
> tic completion**. Evidence strength stays **numeric 0-1**, shown in the UI as
> weak / moderate / strong / verified.

## 1. The three axes (X / Y / Z)

| Axis | System name | DB enum |
|---|---|---|
| X | Biodiversity Safeguard | `safeguard` |
| Y | Applied Knowledge | `knowledge` |
| Z | Regenerative Value | `value` |

Region enum (unchanged — keep it): `x_only, y_only, z_only, xy, xz, yz, xyz`.
`xyz` = the **Integrated Core**. An axis is "present" in a region when its letter
is in the region code (X ∈ {x_only, xy, xz, xyz}, etc.).

## 2. Stage taxonomy (operational time)

`foundation → field_lab → propagation → deep_work → deployment → governance`

Rule: **stage = operational time; region = value position.** Stage is NOT
overridable. Region IS overridable (per program_tic, audited).

## 3. Evidence strength

Numeric `0..1` in the DB. The UI derives the label:

| Range | Label |
|---|---|
| 0.00–0.24 | weak |
| 0.25–0.49 | moderate |
| 0.50–0.74 | strong |
| 0.75–1.00 | verified |

Future automatic inputs: evidence type, source reliability, output count, review
status, external validation. DB stays numeric; UI renders the band.

## 4. Gate logic (the critical decision)

**Gate = stage-transition condition.** A gate opens the NEXT stage; it is NOT a
region-fill check.

```
Foundation Gate    → opens Field & Lab
Field & Lab Gate   → opens Propagation
Propagation Gate   → opens Deployment / Pathway
```

A gate evaluates the required tics of its stage:

```
required tics completed-or-waived
+ critical tics completed-or-waived
+ minimum evidence strength
```

- Foundation Gate: required + critical foundation tics done; `avg(evidence_strength) >= 0.4`.
- Field & Lab Gate: required + critical done; at least 1 material/evidence tic completed.
- Propagation Gate: propagation strategy declared; ≥1 route selected; ≥1 propagation tic in_progress/completed.

**Integrated Core (xyz) is never a gate condition — it is a maturity target.**
Making it a gate would lock early-stage programs. This is the most important rule.

## 5. Integrated Core role

`xyz = maturity accelerator` — it raises program value quality; it does not open
gates. UI states:

```
empty     = no xyz tic
emerging  = xyz tic in_progress
active    = xyz tic completed
validated = xyz tic completed + output/evidence verified (strength >= 0.75)
```

## 6. Priority vs weight

v1: **all tics equal weight** in the ring percentage. Do NOT use priority as a
score weight. `priority = gate importance / UX urgency`:

- `critical` → may be gate-blocking
- `high` → surfaced first in Next-Action
- `support` → supporting

But ring % = equal tic completion, regardless of priority.

## 7. RPC v2 contracts

`get_program_stage_status(program_id, stage)` →
```json
{ "stage": "field_lab", "required_total": 4, "required_done": 1,
  "critical_total": 2, "critical_done": 1, "gate_status": "blocked",
  "next_required_tic": "cons.material_secured" }
```

`get_program_region_status(program_id)` →
```json
{ "safeguard": { "percent": 40, "state": "emerging" },
  "knowledge": { "percent": 29, "state": "early_signal" },
  "value": { "percent": 10, "state": "not_activated" },
  "integrated_core": { "state": "empty", "count_completed": 0 } }
```

Also: `get_effective_region`, `set_program_tic_region_override`,
`recalculate_evidence_strength`.

## 8. Compass v1 contract

Inputs: `screen, program_id, current_stage, selected_tic, gate_status,
region_status, user_state`. Answer logic:

```
WHAT → static template
NEXT → rule engine
WHY  → LLM (later)
```

MVP can ship without LLM, but the architecture must be LLM-ready.

## 9. Sprint order

- **Sprint 2 — RPC v2 (engine first):** get_effective_region,
  get_program_region_status, get_program_stage_status,
  set_program_tic_region_override, recalculate_evidence_strength.
- **Sprint 3 — Program Detail Venn UI:** Hero v3, Tic Breakdown v2, Stage Track,
  Outputs, Tic Complete Modal.
- **Sprint 4 — Compass v1:** context-aware, in-place help.

First target: wheel-based RPC → region/stage-based RPC.
