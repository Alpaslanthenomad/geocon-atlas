# THE CHAIN — the link model (expanded, branched, extensible)

> Companion to `THE-CHAIN.md`. Synthesised 2026-06-07 from an 8-agent expansion
> brainstorm (7 domain lenses enumerated **279 candidate links**; a completeness
> critic resolved the structure + the L0 schema). This is the input the founder
> said is "very critical before L0" — the answer to *"connect every possible
> topic to the chain."*
> Status: **design**. Nothing built. It redefines what L0's schema must be.

---

## 1. The verdict

The founder's six links — `taxonomy → propagation → cultivation → extraction →
chemistry → metabolites` — are **coarse rollups, not the links themselves.** Each
explodes into a sub-graph:

- `taxonomy` → a **~20-link identity subtree** (nomenclature, voucher specimens,
  molecular/phylogenetic, morphology/cytology).
- `propagation`+`cultivation` → a **40+ coordinate fork** of three substitutable
  modes (seed / vegetative / in-vitro) plus husbandry, breeding, agronomy, post-harvest.
- `chemistry`+`metabolites` → a **~38-link** extraction → isolation → structure →
  profiling → bioactivity → mechanism sub-graph.

Seven domains enumerated **279 candidate links** and the space is not exhausted.
**So `link_kind` can never be a fixed enum.** The chain is **a directed acyclic
graph with a designated spine** — and the model must be open-ended by construction.

---

## 2. The structure — a DAG with a spine (not a line, not a tree)

Five structural elements:

**(a) The SPINE** — the founder's six, kept as the production line. **This is the
only path weakest-link integrity runs on** ("how far down the value chain is this
species?"). Each spine node is a rollup over its sub-graph.

**(b) PARALLEL RAILS** — root at taxonomy, run *alongside* the spine, not on it:
`ecology-distribution`, `conservation-policy`, `omics-genetics`. **Conservation
gets its OWN weakest-link rail — a `conservation-readiness` integrity reported
BESIDE production integrity**, so a strong taxonomy+metabolite chain can never mask
an unprotected, unbanked, illegally-harvested CR endemic. (This rail is where the
VENN/IUCN conscience lives.)

**(c) The UPSTREAM-FEEDING ROOT** — ethnobotany / traditional knowledge feeds
*backward* into the spine (a traditional use → a metabolite/extraction hypothesis;
a vernacular → taxonomic disambiguation). Edges therefore carry a **direction**:
`feeds_spine | hangs_off_spine | on_spine`.

**(d) The DOWNSTREAM, FIREWALLED FAN** — applications (pharma, nutraceutical,
cosmeceutical, ornamental, food, agricultural, industrial, fragrance) hang off
metabolites/cultivation, then funnel into the **separate Ventures layer** through a
one-directional citation. **Zero money columns cross back.**

**(e) The CROSS-CUTTING MESH** — the edges/shared-nodes that make it a graph, not a
tree: identity-key, the genotype token (barcode/SNP), ploidy, storage-organ type,
phenology, seed-ecology, ex-situ germplasm, symbiosis, locality, ABS/IPLC, and the
biosynthesis weld. Several domains independently re-enumerated these — they must be
**modeled once and shared**, not duplicated per branch.

```
            ethnobotany / TK ──(feeds)──┐
                                        ▼
   IDENTITY ─► propagation ─► cultivation ─► extraction ─► chemistry ─► metabolites ─► [applications] ──▶ Ventures
   (root key)    │  (max-across-modes)            (sub-DAG)                                │  (firewalled, one-way)
      │          └── seed / vegetative / in-vitro                                         │
      │                                                                                   │
   ── rails rooted at identity, run alongside, each with own integrity ──                 │
   ecology · CONSERVATION-readiness · omics ───────────────────────────────────────────  │
   cross-cutting mesh: locality · genotype-token · ploidy · storage-organ · phenology ·   │
                        germplasm · ABS/IPLC · biosynthesis-weld ───────────────────────  ┘
```

---

## 3. Integrity is no longer one rule — it is three

The single "weakest link" rule splits, and this is the heart of the refinement:

1. **Spine integrity = weakest link** over the six production rollups. Unchanged —
   the headline "how complete is this species' value chain" metric.
2. **`circumscription_stability` is a GATE/multiplier on the WHOLE chain**, not a
   node you fill. A species under active revision or with a name in synonymy must
   down-weight every downstream link — because you cannot trust a propagation log
   or a metabolite was measured on the *same* biological entity. *Geophyte-critical:
   Crocus, Allium, Fritillaria, Galanthus, Tulipa, Colchicum are cryptic-species,
   ploidy-variable, molecularly-recircumscribed — identity instability is the norm
   for exactly the CR Mediterranean endemics in the beachhead.*
3. **Propagation fills as MAX-across-modes, not weakest-link** — seed OR vegetative
   OR in-vitro; any one terminal-legitimate measured mode satisfies the rollup.
   (The one principled exception, because the modes are substitutable.)
4. **Conservation-readiness is its OWN weakest-link rail**, reported beside spine
   integrity — never averaged into it.

---

## 4. Six entities that must be first-class — modeled once, shared by all

The completeness pass found the domains kept re-inventing the same shared objects.
L0 must own these as cross-cutting entities, or every branch re-implements them:

1. **The evidence/assertion record** *(the single biggest gap)* — a link is not a
   slot that holds a value; it holds *dated, attributed, supersedable assertions*.
   A 2024 chromosome count corrects a 1960 one; both coexist with provenance. This
   is the temporal layer that lets `fill_strength` decay, lets contradictions live,
   and gives IUCN re-assessment somewhere to sit.
2. **The physical sample** — herbarium sheet, living accession, seed lot, DNA
   extract, chemistry aliquot. **The founder's prized Connection edge IS sample
   lineage** — model it once as a thread, not per branch. (Builds on the live
   `accessions_orgs` / `seed_lots_orgs` / `herbarium_specimens`.)
3. **Media / asset objects** — images, NMR/MS spectra, chromatograms, sequence
   reads, CT scans, rasters. The actual evidence payloads; each with format,
   license, and a pointer to the coordinate it evidences.
4. **External-source lineage** — POWO/WCVP/GBIF/IPNI/CCDB/ChEMBL as versioned
   snapshots. When POWO re-circumscribes a name, every inferred link sourced from
   that snapshot is flagged stale.
5. **The people/actors graph** — collectors, determiners, assessors, breeders, lab
   operators, IPLC knowledge-holders. The founder's "Move = credit + citation"
   *requires* this, and benefit-sharing rides on it.
6. **The method/protocol** as a reusable cross-species object — one stratification
   or micropropagation protocol applies to many species; cite it once, version it.

---

## 5. The L0 schema — an extensible link-type taxonomy (not an enum)

**`link_type`** — the registry, the heart of L0. A governed, versioned taxonomy
addressed by a hierarchical `ltree` path:

| column | meaning |
|---|---|
| `id` uuid | stable surrogate |
| `path` ltree | e.g. `identity.nomenclature.basionym`, `chem.extract.method` — subtree-queryable (`path <@ 'identity'` returns the whole identity branch, GiST-indexed) |
| `parent_id` | self-FK; enforces tree shape + rename safety |
| `label`, `definition_md` | human text |
| `branch_root` | which spine node it rolls up into |
| `spine_role` | `spine \| rail \| branch \| cross_cutting` |
| `direction` | `on_spine \| feeds_spine \| hangs_off_spine` |
| `cardinality` | `one \| many` per species (one accepted name; many cultivars/uses) |
| `default_evidence_classes[]` | which of field/bench_measured/literature/inferred/imported are valid |
| `firewall_class` | `conservation_only \| translational \| neutral` (schema-enforced) |
| `sensitivity_default` | `open \| location_sensitive \| iplc_sensitive \| sealed` |
| `is_gate` bool | true for `circumscription_stability`, `abs_provenance` — multiply/block, not add |
| `fill_rule` | `weakest_link \| max_across_siblings` |
| `status`, `version`, `supersedes_id` | the taxonomy itself evolves |

**`link_fact`** — generic, topic-agnostic value row:
`(species_id, link_type_id, evidence_class, fill_strength [derived], sensitivity
[overrides default], fill_state [empty | inferred | evidenced | evidenced_but_sealed
| contradicted], confidence)`.

**`evidence`** — the temporal child (entity #1 above):
`(link_fact_id, asserted_on, asserted_by → person/org, source → publication/dataset/
specimen/media, method_id, value_json, supersedes_id, retracted)`.

Plus the shared entities: `sample` (lineage thread), `asset` (media), `source`
(external-dataset snapshot), `actor` (people/orgs), `method` (protocols).

**Why a table, not an enum:** adding any future topic — "soundscape ecology",
"archaeobotany", whatever — is an **INSERT, zero migration, zero code.** `ltree`
gives free roll-up integrity per subtree. New link types are proposed/reviewed *as
data*, with provenance, not shipped as code. (Optional `link_type_tag` side-table
for orthogonal facets like `student-fillable`, `climate-relevant` — tags supplement
the tree, never replace it.) The founder's six links are simply seeded rows with
`spine_role = 'spine'`; everything branches by inserting descendant paths.

---

## 6. Sensitivity & firewall — structural, not policy

- **Locality is the master hazard.** Point occurrences, type locality, raw AOO/EOO,
  SDM surfaces, chemotype-by-geography, phylogeography, SNP-by-site, and harvest
  localities are **all the same poaching map** for CR geophytes (Galanthus,
  Sternbergia, Cyclamen, wild Crocus/Tulipa, salep orchids). Model locality **once**
  as a single firewall-controlled link with a *public-coarse-cell / gated-exact-point*
  split; no branch may re-expose raw coordinates. The compound disclosure
  (high-value chemotype location + harvest pressure + tiny population) is co-embargoed.
- **`evidenced_but_sealed` is a real fill-state.** Traditional knowledge may be
  present, provenanced, and integrity-counting yet **not publicly readable**
  (consent-restricted, TK-Label veto). Sensitivity is not binary.
- **ABS / Nagoya is a HARD GATE, not a tag.** No translational link (bioprospecting
  lead, heterologous pathway expression, application, product, patent, benefit-share)
  reaches full strength unless the ABS/PIC-MAT provenance link is satisfied. **A
  patent sitting above an empty ABS link is the biopiracy form of the broken-chain
  fraud flag** — detectable and blockable.
- **The firewall is a schema constraint.** Zero money columns in the chain; a
  `firewall_class` on every link; trade *volume* (CITES) allowed, trade *value /
  price / deal terms* forbidden and structurally impossible to add.

---

## 7. What L0 becomes (revised)

L0 is no longer "a 6-enum table". L0 is:

1. **Seed the `link_type` registry** with the spine (6) + the highest-leverage,
   harvestable-today links the critic flagged: decompose `taxonomy` into the
   identity subtree + `circumscription_stability` gate (POWO/WCVP/IPNI, already
   half-held); chromosome/ploidy/genome-size (CCDB/IPCN/Kew C-values); DNA-barcode
   counts (BOLD/GenBank); TDWG regions (already harvested in DI-6); bioclim envelope
   (WorldClim/CHELSA); ex-situ germplasm as the dual conservation/production node
   (live `get_species_domain_extras`).
2. **Build `link_fact` + `evidence` + `sample`** over existing data, honestly empty
   in the middle.
3. **Render** spine integrity (weakest-link, with the circumscription gate) **and**
   the conservation-readiness rail, side by side — a broken chain plus a separate
   conservation light, on every species, day one.

Everything else (Moves, the weld, the gap engine, the application fan) stacks on
this registry. The registry is what makes "every possible topic connects to the
chain" literally true: the chain's vocabulary is **data the platform grows**, not
code we ship.
