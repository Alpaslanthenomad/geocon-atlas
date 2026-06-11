# VNEXT-CHAIN-RINGS — the inclusive radial chain (founder model, locked 2026-06-11)

## The real objection (corrected)
The old 6-stage spine was NOT rejected for its *words*. It was rejected because it forced
**non-equivalent areas onto a flat, linear spine** — areas of wildly different scope crammed
into one pipeline — and because that pipeline pointed at a single destination (extraction →
metabolites) with **conservation entirely missing**. The fix is structural, not lexical.

## The model: radial rings, each a CONTAINER
A ring is not a single step. **A ring is a container** that holds *all the work that falls
under it.* "Taxonomy" = whatever taxonomy studies a species has → one ring. The rings are
roughly equivalent in scope (each a major domain), and they are **radial, not a queue.**

Three rules that distinguish this from the old spine:
1. **Containers** — each ring gathers the work beneath it, not one move.
2. **Parallel** — rings need not be sequential (Taxonomy ∥ Conservation can run together).
3. **Overlapping / cross-cutting** — a piece of work can belong to more than one ring. The
   canonical case: **in-vitro work spans BOTH Conservation AND Propagation** (it is wide). So
   the structure is not a clean tree; rings intersect.

## The rings (founder's sequence)
| # | Ring | Holds | Maps from old spine |
|---|------|-------|----------------------|
| 1 | **Taksonomi / Identity** | accepted identity + all taxonomy work | Taxonomy |
| 2 | **Koruma / Conservation** | conservation protocols, BROAD perspective; can run parallel to Taxonomy | NEW — was missing entirely |
| 3 | **Çoğaltım / Propagation** | reproduction; in-vitro lives here AND cross-cuts Koruma | Propagation |
| 4 | **Yetiştirme + Habitat / Cultivation + habitat enrichment** | husbandry at scale + habitat enrichment, merged into one ring | Cultivation |
| 5 | **Ekstraksiyon + Metabolit / Extraction + metabolite profiling** | purpose-driven extraction methods → metabolite profiling → **prepares the Z layer** | Extraction + Chemistry + Metabolites (merged) |
| → | **Z · Değer / Value** | the value layer ring 5 prepares for (money-blind potential) | (the Z firewall layer) |

Key change vs the old spine: **Conservation (Koruma) becomes a first-class ring at the heart**
(the old spine had none), the value-side stages **merge** (Extraction+Chemistry+Metabolites →
one ring that *prepares* Z rather than *being* the destination), and Cultivation absorbs
habitat enrichment.

## Relationship to the gearbox
The species **gearbox** (Kimlik · Koruma · Çoğaltım · Kimya · Değer) is the zoomed-OUT view;
**this chain is the zoomed-IN view** of the same domains. They should read as one structure —
the gearbox rings ARE the chain's roots, summarized.

## Build constraints (why this is careful, not rushed)
The `chain_link_type` registry (6 spine + 181 rail + 176 branch = 363 nodes) is **wired into
the program engine** (region/stage RPCs, apply_move, the radial tree at /geocon/chain). The
restructure must:
- **Preserve node IDs** (the engine keys on IDs, not labels/ordinals) — relabel + regroup +
  ADD the Conservation ring + merge the value-side rings *without* deleting or re-ID-ing nodes.
- Support **cross-cutting membership** (in-vitro ∈ {Koruma, Çoğaltım}) — the old single-parent
  tree cannot express this; needs a secondary "also-belongs-to" relation, not a re-parent.
- Re-surface `/geocon/chain` as the radial rings in this language.

## REAL STRUCTURE (discovered 2026-06-11 — the chain is RICH, not poor)
The 6 "spine" nodes (taxonomy/propagation/cultivation/extraction/chemistry/metabolites) are
**empty placeholders — 0 descendants each.** A simplistic linear spine was laid OVER a far
richer tree and hid it. The REAL content lives in ~20 root domains (spine_role rail/branch):

| domain | desc | belongs to ring |
|--------|------|-----------------|
| `identity` | 43 | 1 Taksonomi |
| `conservation` | 36 (threats/recovery/exsitu/insitu/redlist) | 2 Koruma |
| `ecology` | 75 (habitat/demography/phenology/pollination/biogeography/climate/genetics/seed/threats) | 2 Koruma (+ some cross-cut) |
| `policy` | 14 (abs-nagoya/cites/fairwild/harvest/iplc/legislation) | 2 Koruma (the legal safeguard) |
| `prop` | 22 (seed/vegetative/**invitro**/dormancy_storage) | 3 Çoğaltım |
| `omics` | 52 (genome/transcriptome/proteome/popgen/markers/genebank/g2p/functional/biosynth) | 3 Çoğaltım + 5 (cross-cut: popgen→Koruma) |
| `cult` | 12 (husbandry/health/development) | 4 Yetiştirme+Habitat |
| `trans` | 13 (breeding/domestication/agronomy_yield/postharvest) | 4 Yetiştirme+Habitat |
| `cultivar` | 1 | 4 |
| `chem` | 36 (extract/isolation/structure/profiling/identity/standardization/bioactivity/variability/tox/tissue) | 5 Ekstraksiyon+Metabolit |
| `bioact` | 6 (pharmacology/toxicology/dermal/nutritional/organoleptic/agronomic) | 5 → Z |
| `biosynth` | 3 (pathway/alt_supply/env_regulation) | 5 |
| `app` | 8 (pharma/cosmeceutical/food/fragrance/ornamental/agricultural/nutraceutical/industrial) | **Z · Değer** (the value applications!) |
| `ip` | 4 (patent/trademark/pbr/gi) | Z |
| `supply` | 6 (sourcing/traceability/certification/benefit_sharing/cites_trade/wild_harvest) | Z |
| `product` | 1 (on_market) | Z |
| `ethno` | 6 (traditional_use/abs_provenance/biocultural/bioprospecting/folk_taxonomy/preparation) | cross-cut Koruma↔Z (the ethnobotany gear + ABS firewall) |
| `regulatory` | 1 | Z |

**The in-vitro cross-cut the founder described is literally in the data:** `prop.invitro.*`
(propagation) AND `conservation.exsitu.cryo_invitro` (conservation) — the same work, two rings.

**So the real build is NOT "add conservation" (it exists, 36 deep). It is:**
1. Retire the 6 empty placeholder "spine" nodes (they are the simplistic overlay).
2. Promote/re-designate the ~20 real domains as the rings, grouped per the table above.
3. Express cross-cutting membership (in-vitro ∈ {Koruma, Çoğaltım}; ethno ∈ {Koruma, Z}; omics.popgen ∈ {Çoğaltım, Koruma}) — a secondary relation, not a re-parent.
4. Re-surface /geocon/chain radially in the 5-ring + Z language.

Status: model LOCKED + real structure mapped. Build = retire the overlay + regroup the real
domains + radial UI — a careful, ID-preserving step (the registry is engine-wired but dormant).
