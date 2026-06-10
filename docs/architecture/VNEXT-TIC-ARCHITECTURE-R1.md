# v-next tic-architecture — Round 1 (a substrate to iterate on)

> 7-agent, science-grounded. The work-graph: which tics are required vs optional, their sequence, and how tic-paths route to outputs (conservation actions X/Y + money-blind value potentials Z). NOT a build.

## The work-graph
ONE GRAMMAR, THREE AXES. The work-graph is a single template graph, authored ONCE over the two assets that already ship — `tic_definitions` (the catalog of evidenced-work units) and `chain_link_type` (the 279/363-node, firewall-tagged value-chain). It is NOT 47k bespoke graphs. A POSITION (researcher x species x axis) is a CURSOR onto this shared template; only the per-species evidence (`chain_link_fact` / `chain_evidence` / receipts) is species-specific, so "generic across 47k yet legible" falls out for free.

The graph reads identically on all three axes; only the OUTPUT TYPE differs, and the difference is forced by the chain's `firewall_class`, not by a separate rulebook:

- SHARED FIRST-CONTACT TRUNK (all axes): `sci.taxonomy_verified` (root, no work is valid before identity is fixed) -> `cons.threat_analysis` / `sci.specimen_documented` (voucher) -> `cons.baseline_assessment`. These are shipped foundation/field_lab tics; nothing forks until after the trunk.

- X (SAFEGUARD) + Y (KNOWLEDGE) = CONSERVATION arms. Largely linear, gate-heavy spines that terminate in a REAL CONSERVATION ACTION drawn from the 103 `firewall_class='conservation_only'` chain leaves (seed banking, in-vitro/cryo ex-situ, living collection, reintroduction, a filed Red List assessment, habitat enrichment, a threat-abatement plan) — an OPEN menu, not a short list. The honest asymmetry that fell out of real practice: X is gate-heavy (you cannot bank seed of unknown storage behaviour, cannot reintroduce without genetic breadth + threat-abatement + a secured recipient site + long-term monitoring), while Y is enrichment-heavy and deliberately gate-light (knowledge is open-ended; the forced-exit must not coerce basic research).

- Z (VALUE) = a SHORT SHARED TRUNK that FANS. The trunk is the real natural-product discovery pipeline: source/voucher+ABS -> extract -> metabolite profile -> crude screen -> bioassay-guided isolation -> pure-compound potency -> MECHANISM/target -> therapeutic mapping. At the mechanism node the graph FANS into HUNDREDS of distinct, money-blind value-potentials over the 135 `firewall_class='translational'` leaves (bioact.* x app.* x indication), because one molecular target maps to many candidate activity classes, sectors and indications. The fan is in the TERMINALS, not the trunk — a handful of tics opens a wide menu with zero fabrication.

So the unification is: TIC NODES connected by typed DEPENDENCY EDGES, advancing a POSITION CURSOR, routing to firewall-typed OUTPUT TERMINALS via one UNLOCK RULE. The same five-primitive grammar runs X, Y and Z; the axis only selects which firewall_class of terminal is eligible.

## The grammar (minimal primitives)
FIVE PRIMITIVES. Two already exist as tables, one as ltree paths; only two are genuinely new, and both are thin.

1. TIC NODE — the unit of evidenced work. Maps to shipped `tic_definitions` (id, `stage`, `default_region`/axis-affinity, `priority` critical/high/support, `is_required`, `evidence_required`, `gate_validation_rule` jsonb) + `tic_evidence_options`. A tic is COMPLETE iff `complete_program_tic` recorded an evidence row of an allowed class carrying a real source ref (DOI/voucher/assay) — a predicate, never a checkbox. NEW: one column `chain_path ltree[]` — the weld that says which `chain_link_type` node(s) a tic's evidence lights (e.g. `sci.metabolite_profiling` -> `chem.profiling.quant`). `firewall_class` is inherited from the anchored chain node, never stored twice.

2. PREREQUISITE EDGE — two layers. (a) COARSE/REQUIRED backbone = the shipped `tic_gate_requirements` + Venn gate rules ("cannot enter Propagation until Field&Lab required+critical tics done"); kept verbatim. (b) FINE EDGES = one NEW thin table `tic_edge(from_tic, to_tic, edge_kind)` where edge_kind in {requires (hard: B locked until A), enriches (soft: raises confidence, never gates), substitutes (OR-group; encodes the chain's shipped fill_rule='max_across_siblings', e.g. seed OR vegetative OR in-vitro propagation)}. Edges are TEMPLATE-LEVEL (on tic/chain ids, not per species) — ~tens of rows for the whole 47k corpus, seedable from the ltree parent->child order, hand-curating only the cross-trunk welds.

3. OUTPUT TERMINAL — a typed sink. Maps to the existing `chain_link_type` LEAF nodes (already firewall-tagged: 103 `conservation_only` = X/Y conservation actions; 135 `translational` = Z value-potentials) + the shipped `commercialized_outcomes` ladder for the EXIT (self->peer->org->venn_verified). The terminal vocabulary already exists as DATA; the grammar adds nothing to it, it only routes work toward it.

4. UNLOCK RULE — the one genuinely new piece of LOGIC, but a pure read-function over existing data (one RPC/VIEW `get_available_terminals(position_id)`, no new storage). A terminal T is AVAILABLE for (species S, position P) iff: (1) PREREQ MET — every `requires` edge feeding T's anchor node is complete on P; (2) GATE MET — T not gated below P's stage; (3) FLOOR MET — evidence-strength along T's chain path >= T.min_strength, via the shipped weakest-link / `recalculate_evidence_strength` math; (4) FIREWALL OK — T.firewall_class matches P.axis (X/Y -> conservation_only only; Z -> translational only). AVAILABILITY is binary; STRENGTH is the separately-rendered 0.00-1.00 band — keeping them apart is what makes the Z-fan honest.

5. POSITION CURSOR — whose work it is. Maps to the reconception's thin `positions(researcher, species, axis, status, program_id?)`. Owns no graph and no evidence; it POINTS. Routing runs relative to the cursor. The graph is global; the cursor is personal — this is why nothing forks per species.

NET NEW PERSISTENCE: one column (`chain_path`) + one thin edge table (`tic_edge`) + one thin compound-identity weld (`species_compound`, species x molecule + chembl_id/InChIKey + provenance, populated by the VERB — the only thing that lets a Z leaf inherit external compound->activity edges) + two read-functions. Everything load-bearing already ships.

## Required vs optional
THE PRINCIPLE (one sentence): a tic is REQUIRED (a true gate) only when a downstream output is scientifically INVALID or UNSAFE without it; it is OPTIONAL (enrichment) when it only RAISES strength/confidence/quality; and it is CONDITIONAL (router-required) when it is required ONLY IF a specific output is targeted. Validity gates, not bureaucracy.

This maps onto fields that already exist — `priority` (critical/high/support) + `is_required` + the gate rules — so "required vs optional" is read off the catalog, not invented.

X (SAFEGUARD) — gate-heavy, because the science is unforgiving:
- REQUIRED (validity): taxonomy_verified (a fact about a misidentified plant is a fabricated fact); threat_analysis + baseline_assessment (no prioritisation/assessment without them); material_secured + viability_check (dead/no material = no ex-situ).
- CONDITIONAL-REQUIRED (router): seed_storage_behaviour is required the MOMENT any storage output is targeted — it ROUTES the whole strategy (orthodox -> seed bank; recalcitrant/intermediate -> in-vitro/cryo forced; Berjak/Walters). Reintroduction forces germination_protocol + genetic_diversity_captured + threat_abatement_plan + secured recipient site (each a literature-named precondition; Godefroid 2011). Monitoring (>=4 yr) is REQUIRED to CLOSE a return-to-wild output — the single most cited failure mode.
- OPTIONAL (enrichment): duplicate safety-backup, viability assay refinements — raise the band, never gate.

Y (KNOWLEDGE) — deliberately FLAT/enrichment-heavy. The ONLY hard gates are taxonomy_verified and pure data-dependencies (cannot validate a structure you haven't isolated; cannot be peer-cited before published). Everything else is ADDITIVE — each characterisation independently fills a distinct chain node and raises strength. This asymmetry directly answers the reconception's fear of coercing open-ended research; a "parked/exploring" Y state must be first-class.

Z (VALUE) — required vs optional is AUTOMATIC and elegant: source_voucher+ABS, extract and metabolite_profile are REQUIRED to surface ANY Z potential (without a named compound there is nothing to route). Crude-screen, isolation, pure-potency, mechanism, therapeutic-mapping are all OPTIONAL ENRICHMENTS that do not gate VISIBILITY — they raise the TIER (cap on strength) of already-visible potentials. "Some tics required to unlock, others raise confidence" is literally how the Z fan works.

The unifying mechanic: the OUTPUT ROUTER reuses the exact gate-evaluation pattern the engine already runs (required + critical + min evidence_strength) — an output is eligible when every `requires` tic in its dependency closure is complete; the router is just "a gate whose target is an output instead of a stage."

## Routing logic (tic-paths -> outputs)
Routing = the UNLOCK RULE run relative to a position cursor, producing (a) which terminals are AVAILABLE and (b) at what STRENGTH BAND. Availability is binary (prereqs + gate + firewall + min-strength floor); strength is the rendered 0.00-1.00 from real `chain_link_fact.fill_strength` rows. Separating the two is the whole trick.

CONSERVATION ACTIONS (X / Y, the conservation_only terminals).
The router exposes a conservation action as ELIGIBLE when its dependency set is satisfied — independent of stage, so a position can sit in one stage and unlock several actions. Worked routing seeds:
- Red List assessment filed: needs {taxonomy, threat_analysis, baseline} (+ optional habitat/distribution). LOWEST-barrier X win, available very early — this is the terminal that bridges the 47k stub-status IUCN gap.
- Germplasm accession banked: needs {material_secured, viability, seed_storage_behaviour} + route-appropriate storage tic.
- In-vitro / cryo ex-situ: FORCED terminal on the recalcitrant branch (the seed-behaviour determination routes here).
- Reintroduction/translocation: the heaviest — needs {germination_protocol, genetic_diversity, threat_abatement, secured_site}, then monitoring to CLOSE. Cannot be offered until ex-situ propagation + threat-abatement + genetic breadth exist — the canonical "you cannot reintroduce without X" gate.
- Habitat enrichment, threat-abatement plan (as standalone deliverable): lighter dependency sets. Menu stays OPEN (assisted migration, metacollection contribution, GSPC targets are new rows).

VALUE-POTENTIALS (Z, the translational terminals) — how a SHORT trunk branches to HUNDREDS.
The fan is NOT authored per potential and NOT invented: it is a JOIN over external, citable bioactivity DBs (ChEMBL/PubMed), gated by what the researcher has actually evidenced on THIS species via the `species_compound` weld. A characterised compound INHERITS by structure-identity every documented target->activity->domain edge the MOLECULE has in the public record. GEOCON does not assert those activities OF THE SPECIES; it surfaces them as CANDIDATE potentials the species' chemistry makes plausible.

Each potential is a point (ACTIVITY CLASS x VALUE DOMAIN x INDICATION), rendered at an EVIDENCE TIER:
- Coordinate 1 ACTIVITY CLASS (~12, each backed by a real ChEMBL action_type / target family): enzyme-inhibition(neuro) e.g. AChE; cytoskeletal/antimitotic e.g. tubulin; antiproliferative; antiviral; anti-inflammatory; antimicrobial/antifungal; antioxidant; metabolic-enzyme(tyrosinase/alpha-glucosidase); receptor-modulation; insecticidal; allelopathic; extensible.
- Coordinate 2 VALUE DOMAIN (~7, the translational terminal type): pharmaceutical, nutraceutical, cosmeceutical, agrochemical, veterinary, industrial-biomaterial, research-reagent. Activity x Domain ~= 84 cells; the inner INDICATION fan (AChE -> Alzheimer/myasthenia/post-anaesthesia, cited from ChEMBL disease_efficacy/ATC/PubMed, never asserted by GEOCON) takes it to hundreds.
- Coordinate 3 EVIDENCE TIER (the honesty axis = a STRENGTH CAP): T0 inferred-by-genus (cap ~0.15) -> T1 literature-on-compound, this extract UNTESTED (cap ~0.40, weak) -> T2 this-species extract screened (~0.65) -> T3 pure compound from this species assayed (~0.85) -> T4 mechanism/clinical-precedent (~1.0, rare).

THE FAN FIRES AT ONE TIC: the instant metabolite_profiling lands and a compound is named, every external edge for that compound flips from VISIBLE-gap to AVAILABLE-at-T1 SIMULTANEOUSLY — dozens-to-hundreds of (A x D x i) points, each at honest T1 ("the molecule does X; this accession is untested for X"). Subsequent enrichment tics (crude-screen, isolation, pure-potency, mechanism) promote INDIVIDUAL points to T2/T3/T4 without touching the rest. Catalog = the cross-product of two finite vocabularies, filtered by evidence, joined to external DBs — authored once, lit per species. Adding the 300th indication is an evidence row, never a migration.

Hard caps preserve integrity: an `is_gate` chain node (ABS/Nagoya provenance, circumscription stability) MULTIPLIES the cap toward 0 — a Z potential above unresolved taxonomy or missing benefit-sharing provenance can be VISIBLE but is strength-capped near 0 (the biopiracy guard, already in the substrate). Exit-eligibility (declare a Commercial Output) requires the strong band, so weak fan-potentials are visible-as-gap but not over-broadcast.

## Worked example
GALANTHUS ELWESII (a real geophyte), one researcher, two positions on the SAME species, one shared template graph. Science confirmed live in ChEMBL this session.

POSITION A — Galanthus elwesii x X (SAFEGUARD). Watch -> Active -> Managed (a Program on the Venn engine).
1. sci.taxonomy_verified (foundation, critical) — POWO/IPNI ref -> receipt. Foundation gate progresses; circumscription_stability gate-node satisfied (no synonymy block).
2. cons.threat_analysis (foundation, critical; requires step 1) — IUCN/field data -> receipt. Foundation gate met -> Field&Lab opens.
3. cons.material_secured (field_lab, critical; requires step 2) — provenance-stamped accession/seed-lot. Lights conservation.exsitu.seed_banking.
4. cons.seed_storage_behaviour — orthodox confirmed -> seed-bank route open (had it been recalcitrant, the in-vitro/cryo route would be FORCED).
5. cons.viability_check (support; enriches step 3) — germination assay -> receipt. Raises seed-banking band weak->moderate.
ROUTING (unlock rule on an X position): clause 4 admits only conservation_only terminals. AVAILABLE: conservation.exsitu.seed_banking (band moderate). This is the forced Conservation Win — a banked accession, ZERO money columns. ~102 other conservation terminals exist but are LOCKED (prereqs unmet) — honestly shown as the gap (the North-Star: the gap is the product).

POSITION B — Galanthus elwesii x Z (VALUE). The fan.
1. sci.metabolite_profiling (field_lab, region yz; requires shared taxonomy from A1) — HPLC-MS profile -> DOI receipt names GALANTAMINE + LYCORINE. Lights chem.profiling.quant.
THE FAN FIRES: every ChEMBL/PubMed edge for both compounds flips to AVAILABLE @ T1 at once, each money-blind, each "compound does X; this extract untested for X":
   - galantamine -> AChE inhibition -> pharmaceutical (Alzheimer): T1 on the species-assay axis, BUT flagged with approved-drug precedent (live: CHEMBL659 -> AChE CHEMBL220, INHIBITOR, direct_interaction:true, disease_efficacy:true, max_phase 4) — the UI shows both honestly: "molecule: verified anti-Alzheimer; this accession: not yet assayed."
   - galantamine -> AChE -> nutraceutical (cognitive-support candidate): T1.
   - lycorine -> antiproliferative -> pharmaceutical/oncology; antiviral; anti-inflammatory; antimicrobial -> agrochemical: all T1 (lycorine ~196 PubMed hits, almost all preclinical = honestly T1).
   - extract -> tyrosinase-type -> cosmeceutical (skin-brightening): T1. ... dozens more (A x D x i) points, all T1, all honest gaps.
Enrichment promotes INDIVIDUAL points:
2. chem.bioactivity.crude_screen (this G. elwesii extract vs AChE, IC50, DOI) -> AChE/pharmaceutical point rises T1->T2; lycorine points stay T1.
3. chem.isolation.fractionation + chem.bioactivity.pure_compound (galantamine isolated from THIS accession, assayed) -> T2->T3.
4. chem.bioactivity.mechanism (target CHEMBL220, MoA confirmed) -> T3->T4 verified for that ONE point.
EXIT: at deployment the researcher declares a Commercial Output = "documented acetylcholinesterase-inhibition potential, G. elwesii, T3/verified, provenance DOI" — a POTENTIAL, money-blind. It climbs self->peer->org->venn. Only at venn_verified may the Exchange CITE it, one-directional. The galantamine drug/supplement/deal NEVER appears in GEOCON.

NET: two tics (taxonomy + profiling) opened dozens-to-hundreds of candidate potentials across pharma/nutra/cosmeceutical/agrochemical; four more promoted ONE to verified — and not one claim was fabricated. The independent COLCHICINE anchor proves the fan is general: one trunk -> one mechanism (live: CHEMBL107 -> tubulin CHEMBL2095182, INHIBITOR, binds beta-tubulin, max_phase 4) -> three real differently-mature potentials off the SAME mechanism node — gout (approved 1961, ATC M04AC01, verified), cardiovascular (Phase 3, NCT05633810, moderate/strong), oncology (via demecolcine CHEMBL312862, Phase 2, moderate).

## Reconciliation with the existing engine
This SITS ON the shipped engine and the 279-chain; it replaces nothing. Component-by-component map:
- TIC NODE = shipped `tic_definitions` (id, stage, default_region, priority, is_required, evidence_required, gate_validation_rule) + `tic_evidence_options`. Reused as-is; the 12 active tics are the trunk. The propagation/deep_work/deployment/governance stages are currently EMPTY of tics — the new X/Y/Z tics are ROWS in this table, not columns, filling that gap.
- REQUIRED BACKBONE = shipped `tic_gate_requirements` + the Venn gate rules in VENN-ENGINE-CONTRACT, verbatim. Region stays a value-position never a gate; stage-transition stays the only gate; xyz/integrated_core stays a maturity target never a gate.
- TERMINALS = the existing `chain_link_type` leaves (363 rows, already firewall_class-tagged: 103 conservation_only, 135 translational, 125 neutral; with spine_role, fill_rule weakest_link/max_across_siblings, is_gate, ltree path). The Z trunk-then-fan (chem.extract -> ... -> chem.bioactivity.mechanism -> bioact.*/app.*) is ALREADY encoded as paths. No new chain vocabulary.
- PER-SPECIES STATE = shipped `chain_link_fact` (species x node, fill_strength, sensitivity) + `chain_evidence` (dated, attributed, value_json money-blind). The lit graph already exists.
- STRENGTH / TIER = shipped `recalculate_evidence_strength` + weakest-link math; T0-T4 are bands on the existing 0-1 scale; is_gate nodes already multiply.
- EXIT = shipped `commercialized_outcomes` ladder (self->peer->org->venn_verified) + `commercialization_credits`.
- CURSOR = the reconception's thin `positions`; a Managed position IS a Program on the Venn engine (apply_move, complete_program_tic, get_program_stage_status).

DELTA introduced: one column `tic_definitions.chain_path ltree[]` (the tic->chain weld); one thin `tic_edge` table (fine dependencies, ~tens of template rows); one thin `species_compound` weld (the structure-identity join that lets a Z leaf inherit external compound edges, populated by the VERB); plus read-only routing functions `get_available_terminals` / `get_program_next_tics`. Dependencies could alternatively live in the existing `gate_validation_rule` jsonb (zero new tables) — an engineering call, low stakes. The router itself is a derived VIEW reusing the exact gate-evaluation pattern. Additive, reversible, no engine rewrite — consistent with the contract and the reconception's minimal-additive-persistence rule. Honors the rejected-6-stage-spine memory: this routes work over the chain nodes without resurrecting the rejected stage VOCABULARY.

## Firewall check (potential not product)
THE FIREWALL IS THE SHAPE OF THE SUBSTRATE, NOT A RULE THE GRAPH MUST REMEMBER — there is nowhere to put money. Three structural locks, all already shipped, plus the grammar's own discipline:

1. TERMINAL TYPE IS FORCED BY SCHEMA. Every Z terminal is a `chain_link_type` with firewall_class='translational' = "documented bioactivity/use POTENTIAL with provenance" by definition. The unlock rule (clause 4) admits translational terminals ONLY to Z-axis positions; X/Y positions can never even see them, and conservation_only terminals can never carry value. A price/deal is not a translational node — it has no node to attach to.

2. WRITE-ENFORCED MONEY-BLINDNESS. `chain_evidence.value_json` carries the `evidence_json_is_clean` CHECK (money/PII keys rejected at WRITE); legacy money columns were physically evicted to `bridge.species_market` (Jun 2026). A value-potential carries only {activity_class, domain, indication?, evidence_tier, provenance_ref} and nothing else. The public Provenance Receipt (`get_chain_receipt` -> /receipt/[pid]) projects an ALLOWLIST only — money-blind at write, store AND read.

3. THE PRODUCT LIVES ONLY IN THE EXCHANGE, ONE-DIRECTIONAL. GEOCON's Z exit mints a POTENTIAL statement onto the outcomes ladder; the finished product — the cream, the formulation, the licence, the VC round — is pure commerce and is NEVER created in GEOCON. The Exchange may CITE a venn_verified GEOCON potential (read-only, one-directional, allowlist) to seed a product; GEOCON never reads price/deal data back. GEOCON's job ENDS at the evidenced potential.

POTENTIAL-NOT-PRODUCT is also preserved at the SEMANTIC layer by the evidence tier: a Z terminal renders as a CANDIDATE ("compound shows activity X, this extract untested" at T1; "this accession's isolate shows IC50 Y" at T3) — never as a marketed claim. The money-blind line and the no-fabrication line are the SAME line: tier is a ceiling computed only from real rows; unlocked-but-weak = an honest open question, the North-Star payoff, not a claimed result. The biopiracy guard (is_gate ABS/circumscription nodes cap strength toward 0) means a potential over missing benefit-sharing provenance is visible-as-gap but cannot mature. Routing work toward translational terminals can only ever produce more documented, cited, money-blind potentials.

## What to decide next (round 2 — founder call)
- MIN_STRENGTH / TIER FLOORS per terminal (taste + integrity call): what band must a path reach before a terminal is merely VISIBLE-as-gap vs AVAILABLE-to-claim vs EXIT-eligible? Recommendation: visible always (the gap is the product), available at >= moderate (T2), exit-eligible at >= strong (T3). The exact floors decide how much of the atlas reads as open questions.
- HOW WIDE DOES T1 BROADCAST PUBLICLY? One profiled species can surface hundreds of T1 fan-potentials — simultaneously the North-Star payoff AND a scoop / over-claim surface. Recommend tiering visibility like locality data using the existing `chain_link_fact.sensitivity` (T1 gaps member-visible, T2+ public). This is a firewall-adjacent and reputational call, so it is genuinely the founder's.
- IS X's REINTRODUCTION GATE HARD OR ADVISORY? The literature backs germination + genetic-breadth + threat-abatement + secured-site + >=4yr monitoring as hard preconditions, but that is heavy and keeps X outputs 'open' for years. Confirm reintroduction is GATED not merely recommended, and decide whether an interim 'provisional win' state is allowed before monitoring closes it.
- MUST Y STAY UNCOERCED? Y is deliberately gate-light so the forced-exit does not punish basic research (reconception hardest-truth #3). Confirm a first-class 'parked / exploring' Y state, and confirm Published-Knowledge is a real terminal win equal in standing to a conservation action.
- THE DISPLAY-TIER SPLIT for Z: show BOTH axes (molecule-in-literature vs assay-on-this-species), so galantamine reads 'molecule: verified / this accession: untested' — honest but two numbers per potential — or collapse to the conservative species-axis only (hides the precedent)? A truth-in-presentation call.
- EXTERNAL-DB JOIN CONFIDENCE FLOOR: what admits a compound->activity edge into the fan — >=1 curated ChEMBL mechanism, OR >=2 independent PubMed assays? Sets how trigger-happy the fan is and who curates the activity x domain vocabulary.
- WHO AUTHORS the `tic_edge` set and the tic->chain weld? It is small (tens of edges, mostly derivable from ltree parent->child order) but it is where domain truth lives — founder decides whether to seed-then-curate himself, delegate to a science advisor, or AI-draft with [EKLE:] placeholders for human sign-off.
- DEPENDENCY HOME: extend the existing `gate_validation_rule` jsonb (zero new tables) vs a dedicated `tic_edge`/`tic_dependencies` table (cleaner to query). Low-stakes engineering call, but it sets the authoring ergonomics.

## Round-1 caveats (honest gaps)
- This is a SUBSTRATE to iterate on, not a build or a final spec. No migration was written, no RPC implemented, no row inserted — the tic catalog beyond the 12 active tics, the `tic_edge` rows, the `chain_path` welds and the `species_compound` join are all DESIGNED, not shipped.
- The propagation/deep_work/deployment/governance tic sets for X and Y are proposed as ROWS but were drafted from literature + first principles, not yet reconciled against any existing partial seeding in the live `tic_definitions`; the exact tic ids, labels and priorities need a pass against the DB before they are real.
- The Z fan's honesty depends entirely on the `species_compound` weld being populated truthfully by the VERB and on a curation floor for external edges that does not yet exist — without it, a single weak paper could mint a T1 potential. The confidence floor is flagged for round 2 but unbuilt.
- Strength-band semantics (T0-T4 -> 0-1) are asserted to map onto the shipped `recalculate_evidence_strength`, but the actual function's behaviour with the new tier caps and is_gate multipliers has NOT been read/verified against code — it is a design assumption to confirm.
- The conservation-action terminal counts (103 conservation_only) and translational counts (135) come from the frame findings' inspection of `chain_link_type`; they ground the 'open menu, not a short list' claim but were not independently re-counted this round.
- The 47k-generic claim holds structurally (template graph + per-species cursor) but legibility at scale is UNTESTED — whether a researcher can actually navigate hundreds of T1 fan-potentials without drowning is a UI/UX question this substrate does not answer.
- The X/Y vs Z asymmetry (X gate-heavy, Y gate-light, Z visibility-ungated-but-tier-capped) is a strong claim that 'fell out of the science'; it is well-motivated but is itself a design stance the founder may want to pressure-test rather than accept.
- Reconciliation assumes the rejected 6-stage SPINE VOCABULARY stays dead while its NODES are reused for routing; if any UI surfaces the chain node paths to users, the rejected vocabulary could leak back in — a presentation risk not resolved here.