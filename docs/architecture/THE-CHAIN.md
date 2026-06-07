# THE CHAIN — GEOCON's working architecture

> Status: **design / proposed spine** (not built). Synthesised 2026-06-07 from a
> 13-agent multi-lens brainstorm + adversarial critique. This is the backbone the
> founder asked for — the operating model that gives every existing piece (theses,
> programs, grants, outcomes, DOIs, completeness, ventures) one meaning.
> Ship incrementally; L0 first; never in one stage.

---

## 1. The idea, in one breath

Every one of the ~47,000 geophyte species is a **Chain** of six ordered links —
the founder's exact value chain made into schema:

```
  taxonomy → propagation → cultivation → extraction → chemistry → metabolites
```

A species is not a page of facts; it is a chain that is mostly **broken**. Today
the two ENDS are strong (taxonomy is full; metabolites/publications are partial)
and the MIDDLE is empty (almost no structured propagation, cultivation, or
extraction knowledge exists anywhere — not just here). **The Chain makes that
emptiness visible, sortable, and claimable on every species, on day one.**

Filling a link is a credited, citable, traceable **Move**. A student's thesis, an
academic's program, an independent's study, and an industry lab's assay are all
the *same primitive* — a Move that advances one link of one species' chain.

---

## 2. Why this becomes GEOCON's identity (and is not a clone)

Every incumbent shows what **is** known. GEOCON's signature is the inverse: it
shows **the shape of what we don't know** about each geophyte, and routes the
right person to each gap.

| Platform | Shows | GEOCON's difference |
|---|---|---|
| iNaturalist | where organisms are | the *biology+chemistry chain*, not occurrence |
| GBIF | occurrence records | structured knowledge across a value chain |
| ResearchGate | papers + social | the knowledge *inside* papers, decomposed per species×link |
| a LIMS | one lab's internal data | an open, cross-institution, gap-driven engine |

The one genuinely new primitive no competitor and no sum-based score has:

### Weakest-link integrity (the anchor)
A species' chain integrity is gated by its **weakest link**, drawn as a literally
**broken chain** — *not* a weighted sum. The live `species.completeness_score` is
a weighted sum, so a strong taxonomy/metabolite end **masks** the empty middle.
Weakest-link gating does three things a sum can't:

1. It makes the empty MIDDLE **sortable and undeniable** across all 47k species
   from day one — the founder's exact stated gap becomes the headline metric.
2. It **inverts prestige**: a humble propagation log on a CR endemic raises a
   broken chain more than yet another taxonomy datapoint — by math, not by plea.
   This is what pulls students and independents in: their humble link *matters most*.
3. It is structurally **inimitable** — it only works because the links are an
   ordered value chain, which is the founder's content thesis.

---

## 3. The trust model — **provenance is sufficient, validation is optional**

This is the insight that makes the engine work at **zero users**, and the one all
six initial proposals missed.

Every proposal first routed a link's "verified/green" state through a Curator
class. But that class is **design-only** (impact-factor tiers, validation, decay,
disputes are all "implementation pending"; only the bare `contribution_events`
plane shipped). Routing trust through a non-existent workforce turns "easy to
manage" into a **282,000-cell hand-validation queue with the founder as sole
bottleneck.** Dead on arrival.

So trust must be **deterministic from evidence, not granted by a human:**

- Every link carries a mandatory `evidence_class`:
  `field | bench_measured | literature | inferred | imported`.
- `fill_strength` is a **deterministic function** of the evidence class —
  `inferred`/`imported` are **hard-capped and half-weighted**, exactly as
  `DATA-INTEGRITY.md` already half-weights an inferred `geophyte_type`.
- A lone, honest, **measured** claim is **terminal-legitimate forever** — no
  endorsement required. (Geophytes take years-to-decades to grow, so
  "replication/consensus" is structurally unreachable for most CR species; the
  trust model must treat a single honest measurement as complete, not perpetually
  "unverified".)
- Human endorsement, when the community eventually exists, is an **optional ×1.2
  booster — never a gate.**

A green link therefore means **"evidenced"**, never "claimed" — and because
`inferred`/`imported` can never reach full strength, **the chain cannot be faked
complete.** Integrity is enforced in the schema, not in a review queue.

---

## 4. The Move — one fabric for all four participants

The four people the founder wants to chain together never touch new plumbing.
Each existing vehicle becomes a **Move** that docks to a `(species_id, link_kind)`
coordinate:

| Participant | Existing vehicle | Lands on links |
|---|---|---|
| Student | **Thesis** track | propagation / cultivation |
| Academic / PI team | **Program** (orchestrates many) | any link group |
| Independent researcher | **Study** (lighter, off-platform) | any link |
| Private sector / lab | **Brief response** (accredited capability) | extraction / chemistry / metabolite |

The **human flywheel**, all on existing surfaces:

```
 student picks a broken link → Thesis → academic/Program orchestrates linked
 links → Grant Studio funds a gap-cluster → verified links become Outcomes +
 Zenodo DOIs → industry reads a species' "chain maturity" (in the SEPARATE
 Ventures layer) → that interest funds new gap-briefs → ...
```

Every Move is recorded as an **append-only Chain Claim** — one immutable record
that is *simultaneously* the unit of **work**, **credit**, and **citation**.
Corrections **append a counter-claim**; nothing is ever overwritten. That is the
traceability (`izlenebilir`) spine: you can read a named metabolite back through
the exact extraction protocol, cultivation conditions, and propagation source that
produced it, each step stamped with who, when, and on what evidence.

### The Connection edge (the literal "links of a chain")
Welding link N to link N+1 — proving the *same* accession/seed-lot flows from the
propagation link into the extraction link into the metabolite link — is a
**separately-credited, scarce act.** This operationalises the founder's literal
"links of a chain" and is structurally inimitable.

Its dual is the **broken-chain detector**: an *evidenced* Chemistry link sitting
above an *empty* Extraction link is logically impossible-if-honest. That single
rule is **both** a data-integrity fraud flag **and** an auto-generated Open Brief —
recruiting engine and integrity check in one.

---

## 5. The IUCN / commercial firewall — structural, not promised

The conservation spine (L0–L2) holds **zero money columns**. The commercial bridge
is a **one-directional, read-only citation**: a `commercialized_outcome` may point
*into* chain links via `evidence_claims[]`, but no chain link, species, or claim
ever references a price, deal, or party. VENN's mission (science → responsible
value) is realised by the bridge *reading* chain maturity as a de-risking signal —
while the IUCN/non-profit wall is enforced by the schema, honouring decision D-001.

---

## 6. The layers — ship strictly in order

**L0 — CHAIN SPINE.** Ships first, alone, **zero new env, valuable at zero users.**
`species_chain_links(species_id, link_kind ENUM, fill_state, evidence_class,
fill_strength, weakest_link bool)`. Seed all 47k×6 rows **honestly** from data that
already exists: taxonomy from `species` + completeness components; propagation /
cultivation from the protocols + `accessions_orgs` + `seed_lots_orgs` already
returned by the **live** `get_species_domain_extras` RPC; metabolites / chemistry
from existing `metabolites` + `publications`. Leave the middle honestly empty.
Compute integrity by **weakest link**; render a six-segment bar with a visible
break, reusing the live `ProvenanceTip` / `species_field_provenance` vocabulary.
→ *The empty middle becomes visible on every page on day one.*

**L1 — PROVENANCE LAW.** The append-only Chain Claim; mandatory `evidence_class`;
deterministic `fill_strength`; inferred/imported hard-capped + half-weighted; no
human gate. `apply_move()` does **single-row recompute only** (the 47k
`recompute_all` blows PostgREST's `statement_timeout` — learned in DI-6).

**L2 — VEHICLE BINDING + CONNECTION EDGE.** Bind Thesis / Program / Study / Brief
as Moves docking to `(species_id, link_kind)`; add the Connection edge. *Honest
scope:* `contribution_events` is publication-keyed today; adding
`scope_species` / `scope_link` and a scoped leaderboard RPC is a **net-new
migration, not a join.**

**L3 — GAP ENGINE + RECOGNITION FIREWALL.** Weakest-link + broken-chain auto-emit
Open Briefs into the live `collaboration_proposals` table; the commercial bridge
stays a one-directional citation.

---

## 7. Cold-start — the beachhead

A wall of broken chains is demoralising at zero users. Seed a **beachhead of
~200 Turkish / Mediterranean CR endemics filled end-to-end**, so the first
visitors see *forged* chains — proof the model produces complete stories — next to
the honest gaps everywhere else.

---

## 8. Honesty about scope (what is live vs design-only)

Live and reusable today: `species`, `species_field_provenance`,
`get_species_domain_extras` (protocols/accessions/seed-lots), `metabolites`,
`publications`, `collaboration_proposals`, Thesis tracks, Programs, completeness
RPC, Zenodo DOI hook, the Ventures recognition bridge.

**Design-only — budget as net-new migrations, do not pretend they exist:**
impact-factor tiers, per-link/per-family leaderboards, `scope_species`/`scope_link`
columns, Curator tier, mentor multiplier, decay, disputes, the materialised view
(per decision-log D-011 / D-012 / D-015).

---

## 9. The first step

Build **L0 only**. It is pure read-model over existing data, needs no new API key,
depends on none of the unbuilt impact machinery, and is *immediately* truthful: it
turns 47k catalogue pages into a worklist that shows, per species, exactly which
link of the chain is missing. Everything else stacks on that spine — when the
founder gives the go.
