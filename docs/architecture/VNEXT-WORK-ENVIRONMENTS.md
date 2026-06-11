# v-next — GEOCON work-environments (the benches researchers do their own work in)

> Captured so nothing is forgotten (the founder asked: GEOCON users need, on their work pages, ALL the structures/tables/tracking/recording for their own work). 8-agent, grounded in real practice (DwC/ICN/IUCN/protocols). Generalizes the shipped Thesis Workbench; built ONE AT A TIME, simple.

## Overview
GEOCON v-next is a portfolio of WORK-ENVIRONMENTS (benches), one per work-area/GEAR on a species. The species page is a GEARBOX; a PROGRAM is a team turning one GEAR; a researcher holds a POSITION (researcher x species x axis: X=safeguard, Y=knowledge, Z=value). Each bench is the surface where that team actually DOES and LOGS its discipline's work -- with the real tables, controlled vocabularies, tracking systems, and capture forms a practitioner needs day-to-day -- and then turns a unit of that work into an evidenced fact via THE VERB: a DOI/voucher/registry/accession-backed record becomes a tic -> a money-blind chain_evidence row -> a citable Provenance Receipt at /receipt/[pid], on a 0-1 confidence band (potential, never price). Seven environments are specified (five detailed here): Taxonomy/Identity, Conservation/IUCN, Propagation/Tissue-Culture, Chemistry/Extraction, Bioactivity/Pharmacology, Field Collection/Observation, and the Thesis/Analysis bench. They are not seven unrelated apps: they all reuse ONE scaffold (the generalized Thesis Workbench), they share one evidence substrate (chain_link_fact/chain_evidence/chain_receipt), one firewall (conservation money-blind; value = documented potential), and one engine (programs + program_tic + the Venn region/stage model). Taxonomy is the trunk -- no other bench's evidence is trustworthy until identity is fixed; Chemistry is the bridge that feeds Z; Bioactivity is the top value gear that physically cannot turn until the gears below it settle. Built ONE AT A TIME, simply -- because the prior v1 personalization arc died of complexity.

## The shared scaffold (every bench reuses this)
Every environment is the SAME scaffold re-skinned -- the generalized Thesis Workbench -- so nothing is invented twice. The four reusable pieces: (1) TABBED BENCH ON A POSITION/PROGRAM -- one species-scoped page mounted on the species GEARBOX, opened from a program; a few tabbed panels, each a small record-keeper, plus a persistent STATUS HEADER showing where the work stands (identity resolved/contested; assessment draft->published; line healthy/contaminated). (2) THE RECORD-TABLE PATTERN -- each panel is structured records with controlled-vocab chips/dropdowns (the IucnAssessmentEditor CATEGORIES+CRITERIA chip UI, reused verbatim for every enum), explicit units as their own columns (never free-typed into a value field), [EKLE:]/[ADD:] placeholders for unconfirmed specifics, and a MANDATORY provenance pair {source_kind, source_ref} on every assertable row (Save is disabled without it). Bulk/import data and reproducible computation reuse AnalysisPane.jsx (XLSX.read + SHA-256 content hash + a persisted, versioned run + a recent-runs history strip + recharts figures). Citations reuse ReferenceLibrary.jsx (DOI -> CSL-JSON via /api/geocon/resolve-doi; receipt-as-citation). Narrative reuses WritingDesk.jsx (markdown + preview). Offline/mobile capture reuses FieldRoute.jsx (localStorage queue + flush + camera). (3) THE VERB-TO-RECEIPT ACTION -- the green "turn this work into a receipt" card from AnalysisPane: a settled record completes a program_tic via complete_program_tic, writes a chain_evidence row whose value_json passes the evidence_json_is_clean money/PII CHECK, lights the welded chain_link_type node, recalculates evidence strength (weakest-link), and mints a chain_receipt projected money-blind through get_chain_receipt -> /receipt/[pid]. (4) VIEWER GATING -- fn_program_can_see_interior redacts evidence/PII/precise localities for non-members; owner-OR-assignee may edit/log (the complete_program_tic permission shape); public face = mission + names + aggregate progress + verified facts. A draft->peer/promote state machine (IucnAssessmentEditor's draft->peer_review->submitted->published, relabeled per discipline; EntityDiscussion for contested records) sits on top. The new code per bench is therefore only: the discipline's tables + enums (data, not logic), one or two thin mint_*_receipt RPCs (twins of mint_thesis_run_receipt), and at most one genuinely new integration.

## Cross-cutting (provenance, sensitivity, firewall, receipts)
PROVENANCE: every assertable row carries a mandatory {source_kind, source_ref} pair (DOI, registry id, herbarium barcode, GenBank/BOLD accession, instrument file hash) and Save is disabled without it; resolvers/imports land DRAFTS the curator confirms, never auto-asserted facts ([EKLE:]/[ADD:] gate every unconfirmed specific); inference is provenance-weighted and capped; the determination/run history is append-only (supersede, never overwrite). SENSITIVITY TIERS: precise localities are tiered public/member/sensitive and member-gated -- the precise coordinates of a CR/EN harvested geophyte are the single most dangerous datum (poaching), so receipts and field records default to obscured coordinates for threatened taxa; PII (donor orgs, ABS/CITES/Nagoya permit refs, emails/NDA/COI) is member-gated; ABS/Nagoya status is a biopiracy gate that strength-caps any Z-relevant record lacking a permit toward 0. THE FIREWALL: conservation data is money-blind at WRITE (no money columns exist; legacy ones evicted to bridge.species_market), STORE (chain_evidence.value_json must pass the evidence_json_is_clean CHECK; thesis labels pass _receipt_safe_label), and READ (get_chain_receipt projects an allowlist only); value is documented POTENTIAL on a 0-1 evidence band, never a price/product/deal -- the strongest a bench may say is 'this material yields/does X by this validated method', and commerce may only CITE a venn_verified receipt one-directionally, read-only. RECEIPTS: every bench mints through the same path -- a settled record completes a program_tic (complete_program_tic, owner-OR-assignee) -> writes a chain_evidence row -> lights the welded chain_link_type node -> recalculate_evidence_strength (weakest-link) -> mint a chain_receipt at /receipt/[pid] (a thin mint_*_receipt RPC per bench, all twins of mint_thesis_run_receipt); receipts are citable, reproducible, ORCID/CV-attachable, and can be cited back as a money-blind source -- so evidence compounds. LINKS TO SPECIES/PROGRAM: each bench mounts as a tab on the species GEARBOX, scoped to a position (researcher x species x X/Y/Z axis) inside a program; tics advance the program's Venn region (X/Y/Z) and stage (foundation->...->governance); a tic gated on identity is invalid until Taxonomy's circumscription_stable flag is true; the receipt is opening evidence that promotes a Watch position to Active and moves a species off the North-Star zero (an evidenced fact in the atlas). Viewer gating (fn_program_can_see_interior) governs every read: members see interior detail, the public sees mission + names + aggregate progress + verified facts; routes are never deleted -- benches mount as new tabs so deep-links stay alive.

## Build order
1. Thesis / Analysis bench FIRST (already ~80% shipped and already minting receipts): not a build but a CONNECT+GATE -- wire its live verb into the program/portfolio spine (write chain_evidence + complete a program_tic + issue a canonical chain_receipt + promote the position), add the supervisor sign-off, add one defensibility stat. Highest value-per-effort because the verb already works; this also makes the shipped thesis receipts count toward the engine and the North-Star metric. Firewall-critical wiring -> mandatory /crosscheck.
2. Conservation / IUCN bench SECOND (the IucnAssessmentEditor seed is already shipped): add only the EOO/AOO spatial run (reusing AnalysisPane wholesale) + mint_iucn_receipt + the read-only criteria hint. Lowest marginal effort on a shipped seed, and delivers the cleanest new conservation fact for narrow-range geophytes.
3. Taxonomy / Identity bench THIRD (the trunk -- highest systemic leverage): one new taxon_name table + the /api/geocon/resolve-taxon resolver + the append-only determination log + the identity_status header, with the single sci.taxonomy_verified tic wired end-to-end. It is the lowest-barrier, highest-leverage win because fixing identity unblocks every downstream X/Y/Z position; clones the IUCN editor UI so build cost is mostly the resolver.
4. Field Collection bench FOURTH (the PWA Field Notebook seed is already shipped): add three fields (count+unit, phenophase chip, voucher line) + one voucher_specimen table + the sci.specimen_documented tic. Small, additive, and it feeds the conservation and taxonomy benches with primary evidence.
5. Propagation / germination bench FIFTH (first genuinely new structural idea -- the parent->timepoint time-series): ship ONLY the germination path + accession spine + offline count logging + mint_prop_germination_receipt. Defer tissue culture and storage-behaviour as separate later slices.
6. Chemistry / Extraction bench SIXTH (the Z-feeding bridge): ship the spine one record at a time -- chem_sample + chem_extraction (auto yield%) + chem_quantitation (calibration via the shipped regression) + mint_chem_receipt. Defer the fingerprint table, isolation/NMR checklist, and the ChEMBL weld.
7. Bioactivity / Pharmacology bench LAST (the top value gear): it physically cannot turn until Chemistry settles a compound and Propagation an authenticated lineage below it. Ship the single assay form + the verb + the read-only two-axis fan + the honest stall state; defer batch import and auto-writing the fan. Built last by gear-train order, not by importance.

## Per-environment essence
- **Taxonomy / Identity Bench** — The root/trunk bench: it fixes what the plant IS before any X/Y/Z work is valid (sci.taxonomy_verified is the trunk node; the firewall caps everything above an unresolved circumscription toward 0). One species-scoped page with up to five tabbed record-keepers -- NAMES & SYNONYMY (accepted name + act-typed, registry-linked synonym set, upgrading the read-only synonyms table), TYPES & VOUCHERS (holo/lecto/neotype on herbarium_specimens), CHARACTER MATRIX (DELTA-style char x state score sheet), MOLECULAR & CYTOGENETIC (barcode accessions + chromosome counts), and the append-only DETERMINATION HISTORY (annotation-slip log; redeterminations supersede, never overwrite) -- under an IDENTITY STATUS header (unresolved_stub->in_revision->resolved/contested/unplaced; circumscription_stable flag the gate reads). Controlled vocab is ICN/DwC-grounded (taxon_rank, nomenclatural_status, type_status, act_type); exactly-one-accepted-name is DB-enforced. The verb: a determination/nomenclatural act, registry- or literature-cited, mints a money-blind receipt -- credit for the unglamorous identity work everything depends on. V1: the NAMES & SYNONYMY panel on a new taxon_name table + a /api/geocon/resolve-taxon resolver (POWO+WFO) + the append-only determination_event log + the identity_status header, with the single sci.taxonomy_verified tic wired end-to-end -- the lowest-barrier, highest-leverage unlock in the atlas. The one substantive new piece is the resolver; the determination-event log + status rollup is the bench's distinctive new spine; everything else clones IucnAssessmentEditor + ReferenceLibrary + AnalysisPane.
- **Conservation / IUCN Assessment Bench** — The X/Y bench for filing a Red List assessment (IUCN Categories & Criteria v3.1 / SIS model) and tracking the conservation actions that follow -- money-blind by construction. Generalizes the already-shipped IucnAssessmentEditor (the seed: CR/EN/VU categories + A-E criteria + 5 SIS narrative sections + draft->peer->submitted->published) into a full assessor's desk. Its one quantitative job reuses the Thesis Workbench spine: import a CSV of occurrence points (iucn_occurrence), hash them, and compute EOO (minimum convex polygon, km^2) and AOO (2x2 km occupied-cell sum, km^2) as a reproducible iucn_spatial_run -- the two numbers criterion B needs. Adds (over time) structured threats (IUCN Threats v3.3) + actions (Conservation Actions v2.0) pickers, the structured B-criterion checklist that the seed currently fakes as free text, population feeders for A/C/D, and an iucn_action_log time series (hectares fenced, ramets reintroduced) -- the 'track over time' layer. Localities sensitivity-tiered (a CR geophyte's precise coordinates must never leak). V1: occurrence CSV -> EOO/AOO spatial run -> mint_iucn_receipt (money-blind, reproducible from hash) + wire the computed metrics as a read-only hint into the existing category/criteria buttons (assessor still decides; nothing auto-asserts); keep the shipped narrative editor + state machine + SIS export untouched. New: EOO/AOO compute, four small tables + the structured criterion-B row, two static IUCN vocab seed tables, and one mint RPC.
- **Propagation / Tissue-Culture / Ex-situ Bench** — The bench for germination/dormancy trials, seed-storage-behaviour determinations, in-vitro culture lines, and the accession/provenance tracking under all of it -- the one environment whose unit of work is a LIVING BATCH tracked through TIMEPOINTS, not a single record. Everything hangs off a prop_accession (a uniquely-numbered lot of known provenance -- the genebank/FAO/BGCI universal; nothing is trustworthy without it). Three trial families: germination (sow under controlled pretreatments -- cold/warm strat, GA3, scarification, smoke/KAR1 -- and score emergence at day 7/14/21..., deriving final germination %, MGT, T50); storage-behaviour (desiccation + freeze-retest -> orthodox/intermediate/recalcitrant, Roberts/Kew SID); and tissue culture (explant -> MS/WPM media + PGR recipe -> subculture cycles with contamination % and multiplication ratio tracked per vessel -- contamination is first-class, the daily reality of TC). Left rail = accessions/active batches; right = the selected-batch editor + a 20-second 'log next count/subculture' strip reusing FieldRoute's offline queue (greenhouse wifi is poor). The verb: a closed germination result, a confirmed storage-behaviour call, or an established protocol becomes a money-blind biological-fact receipt (e.g. '78% germination after GA3 + 12wk cold strat, n=50') -- genuinely new knowledge for ~47k mostly-unstudied geophytes. V1: ONLY the germination path + its accession spine end-to-end (accession -> trial -> offline-safe weekly counts -> close -> mint_prop_germination_receipt). DEFER tissue culture and storage-behaviour as later one-at-a-time slices. The new structural idea is the parent->timepoint time-series; everything else reuses the scaffold.
- **Chemistry / Extraction / Phytochemistry Bench** — GEAR 4: the bridge that turns vouchered MATERIAL into molecule-level facts -- foundational and Z-FEEDING but not itself the value gear (a profile can stop at Y-knowledge; a value program cannot proceed without it). A LEDGER of five linked record-types mirroring the Z trunk: chem_sample (provenance/voucher + organ + phenophase + ABS/Nagoya status -- the biopiracy gate) -> chem_extraction (method/solvent/ratio -> auto extraction_yield_pct, which is simultaneously a knowledge fact AND the wild-collection-pressure number the Safeguard gear cites) -> chem_profile (HPLC/LC-MS fingerprint -> tentative compound list, gaps logged first-class) -> chem_compound/isolation (structure ID with an NMR/HRMS/UV/IR chip checklist reusing the IUCN criteria-chip UI; populates the InChIKey/chembl_id weld that lets the downstream Bioactivity fan fire -- structure identity only, never a claim of activity) -> chem_quantitation (content in ug/gDW vs a certified reference standard with the ICH Q2 validation battery -- the single quantitative fact a Z claim rests on). Units normalized to dry-weight gram so populations compare. Each settled record is one tic -> money-blind receipt (value_json carries technique/params/value/units/provenance, never price). V1: chem_sample + chem_extraction (auto yield%) + chem_quantitation (import a calibration CSV, compute r2/LOD/LOQ via the shipped regression) + mint_chem_receipt -- ~3 forms + 1 import + 1 mint, each a thin restyle of AnalysisPane/IucnAssessmentEditor. DEFER the full fingerprint table, isolation/NMR checklist, and the ChEMBL weld+fan (a separate downstream gear). The strongest thing it can say is 'this organ of this population yields X% of compound Y by this validated method' -- a fact; what Y is worth lives only in the Exchange, citing this receipt.
- **Bioactivity / Pharmacology Bench** — The Z (value) bench -- the top gear, built LAST because it physically cannot turn until Chemistry hands up a settled, identified compound and Propagation hands up an authenticated lineage. It answers one question -- what does this molecule DO to a named target, how strongly, is there a translation signal -- and produces a money-blind COMMERCIAL POTENTIAL record (a documented POTENTIAL, never a product or price). Three panes: an ASSAY LEDGER (bioassay_record rows mirroring ChEMBL's curated shape exactly -- target+organism+standard_type+relation+value+units+pChEMBL+assay_type; organism is load-bearing because the same compound, e.g. galantamine, reads IC50 across a 1000x range by organism/format), a POTENTIAL MAP (compound->target->indication potentials at an evidence TIER T0-T4 that acts as a strength CAP), and the reused evidence/receipt rail. Its hardest, defining job is HONESTY: every potential keeps TWO numbers apart and side-by-side -- the molecule's world-literature status (max_phase/ATC: galantamine = approved) vs whether THIS accession has actually been assayed (often: not yet) -- so 'molecule is an approved drug' is never collapsed into 'this accession is proven'. THE FAN: when a compound is named (chembl_id/inchikey weld), the live ChEMBL/PubMed join pre-populates candidate potentials at honest T1; the researcher curates, never auto-asserts. assay_origin (measured_here->can climb; literature->caps at T1; inferred_genus->T0) is the firewall pivot. V1: one structured assay form (reskinned IucnAssessmentEditor) + the verb (a settled bioassay completes a chem.bioactivity.* tic -> money-blind receipt) + the fan read-only/two-axis-labeled + the honest 'fed by Chemistry: waiting' STALL state + first-class gap recording. New: the assay_compound/bioassay_record/potential_record tables, the fan join, and the two-axis renderer.
- **Field Collection / Observation Bench** — The X-axis foundation/field_lab bench where a real wild population becomes an evidenced fact -- generalizes the shipped PWA Field Notebook (FieldRoute.jsx: GPS+species+photo+notes+voice, offline queue) from a single pin-drop into a structured collection event with a voucher and a population census, leaving the read-only community feed (ObserveRoute) as-is. Spine = three real standards: Darwin Core occurrence terms (the record), the herbarium voucher model (collector + collecting number + institution = the physical proof), and IUCN field constructs (subpopulation, location, AOO 2x2 km grid, census of MATURE individuals -- with the geophyte-real ramet-vs-genet distinction since bulbs clone, and a phenophase chip since bulbs are visible only weeks per year). Shape: a CARD per site visit -> nested observations per species -> each carries a voucher stub + a count + a phenology snapshot. geo_privacy obscuring is acute here -- the precise locality of a CR bulb is the single most dangerous datum in the atlas (poaching), defaulted to obscured for CR/EN. The verb: a confirmed observation + a real voucher (collecting number + institution = the field equivalent of a DOI) completes sci.specimen_documented -> money-blind receipt crediting the collector. V1: keep the mobile notebook as the capture surface, add exactly three fields (individual_count+unit, phenophase chip, voucher line) + one new voucher_specimen table, and wire the single specimen-documented tic -> /receipt, offline queue preserved. DEFER collection-event grouping, census/AOO trend series, multi-photo, the desk editor, and DwC import/export.
- **Thesis / Analysis / Writing Bench** — The in-system graduate research environment AND the reference pattern every other bench generalizes -- the most MATURE of the seven, already SHIPPED and already minting receipts. A researcher does their whole thesis inside GEOCON: imports data and runs the core stats battery (descriptives, Welch t, one-way ANOVA, Pearson/Spearman, OLS regression via AnalysisPane.jsx, APA-7 reporting with effect sizes + CIs), builds a money-blind reference library (DOI->CSL-JSON + receipt-as-citation via ReferenceLibrary.jsx), and writes chaptered markdown with inline [@cite-key] tokens (WritingDesk.jsx) -- never touching R/SPSS/Excel/Zotero/Word. It is the RETENTION work-area (a thesis is a multi-year object) and the live proof of the verb: a hashed dataset + a run -> mint_thesis_run_receipt (which scrubs column labels through _receipt_safe_label) -> a citable, reproducible, ORCID-attachable finding at /receipt/[pid] that can be cited back as a source. Its v-next job is therefore CONNECT + GATE, not build: (1) wire the verb into the program/portfolio spine so a mint also writes chain_evidence (money/PII CHECK), completes a Y-knowledge program_tic, issues a canonical chain_receipt, and promotes the species_set position Watch->Active -- closing the parallel-receipt-island gap (firewall-critical -> mandatory /crosscheck); (2) add a supervisor sign-off gate before public mint (reusing the IUCN draft->peer state machine); (3) add one defensibility stat (Shapiro/Levene + a non-parametric suggestion). DEFER Tukey post-hoc, in-bench PubMed search, figure numbering, and any AI draft-assist beyond the [EKLE:] never-auto-fact convention.

---
## Full bench specs (tables · tracking · recording · tic→receipt · v1)
### TAXONOMY / IDENTITY BENCH — the work-environment for a taxonomist fixing what the plant IS, before any X/Y/Z work is val
**Kullanan:** A taxonomist / systematist / herbarium curator / floristic monographer working on a geophyte's circumscription. In the GEOCON model this is a researcher holding a POSITION (researcher x species x axis) on the KNOWLEDGE (Y) axis whose work-area is identity — but because taxonomy is the shared first-contact trunk for ALL axes, anyone running an X (safeguard) or Z (value) program depends on this bench's output (you cannot bank seed, file a Red List assessment, or claim a compound's bioactivity for a misidentified plant). Day-to-day users: the monographer revising a genus (re-typifying, lectotypif

**Veri yapıları / tablolar:** All tables species-scoped (species_id text FK), created_by uuid, program_id uuid (the position/program this work belongs to), created_at/updated_at, and a provenance pair {source_kind, source_ref} on every assertable row. Controlled vocabularies are enforced as Postgres enums or CHECK lists (no free-text where a standard exists), aligned to Darwin Core (DwC) + the ICN (Shenzhen/Madrid Code) + TDWG.

1. taxon_name (one row per name string in play — accepted + every synonym; UPGRADES the existing read-only `synonyms` table)
   - name_id (pk), species_id
   - scientific_name text (the bare name w/o author), scientific_name_authorship text (DwC; e.g. "(L.) Herb.")
   - taxon_rank enum {species, subspecies, variety, forma, genus, ...} (DwC verbatim TDWG ranks)
   - nomenclatural_status enum {accepted, heterotypic_synonym, homotypic_synonym, basionym, replaced_synonym, orthographic_variant, nom_illeg, nom_nud, nom_rej, nom_cons, unplaced} (ICN article-grounded)
   - relationship_to_accepted enum {is_accepted, has_basionym, pro_parte_synonym, misapplied} 
   - registry ids: ipni_id, powo_id, wfo_id, tropicos_id, gbif_taxon_id (nullable; the global anchors)
   - publication: protologue_citation (CSL-JSON, reuses ReferenceLibrary CSL shape), year int, page text
   - source_kind enum {curator, powo, wfo, ipni, tropicos, gbif, literature}, source_ref text, confidence enum {certain, probable, uncertain}
   UNIT/VOCAB note: rank + status are the only places a non-taxonomist gets it wrong; both constrained. accepted name is the row where nomenclatural_status='accepted' (exactly one per species, DB-enforced).

2. type_specimen (extends existing `herbarium_specimens`; a voucher BECOMES a type by carrying a type_status)
   - voucher_id (pk), species_id, name_id (which name this types)
   - type_status enum {holotype, isotype, lectotype, neotype, syntype, paratype, epitype, topotype, none/determination_voucher} (ICN + DwC typeStatus)
   - institution_code (Index Herbariorum acronym, e.g. K, P, MO, E), herbarium_catalog_number / barcode
   - collector text, collector_number text, collection_date date
   - locality text, country (ISO-3166), tdwg_region text, decimalLatitude/Longitude (DwC; SENSITIVITY-TIERED — reuse the existing locality redaction)
   - typified_by_ref text (the lectotypification/neotypification publication, if a designating act), image_url (IIIF/JSTOR/GBIF)
   - source_kind, source_ref
   UNIT/VOCAB: type_status is the load-bearing controlled vocab; institution_code constrained to Index Herbariorum.

3. character_matrix + character_state_score (the DELTA/Nexus morphological score sheet, split header/cells)
   - character (char_id, species_scope, character_name e.g. "leaf vernation", character_type enum {qualitative_multistate, qualitative_binary, quantitative}, unit text e.g. "mm" / null, states jsonb [{code, label}] for qualitative, ordering enum {unordered, ordered})
   - character_state_score (score_id, char_id, name_id, state_code OR numeric value/min/max, scored_by uuid, source_kind, source_ref, note)
   UNIT/VOCAB: quantitative characters carry an explicit unit (mm, cm, count); qualitative characters carry a closed state list — this is exactly how DELTA/Lucid/Xper3 keys store data, so it exports to those formats later.

4. molecular_marker (DNA barcodes + sequences)
   - marker_id (pk), species_id, name_id, voucher_id (the specimen the DNA came from — vouchered sequences only, a real-practice integrity rule)
   - marker enum {rbcL, matK, ITS, ITS2, trnH-psbA, trnL-F, ndhF, ycf1, whole_plastome, other}
   - repository enum {GenBank, BOLD, ENA, custom}, accession text (e.g. GenBank "OQ123456" / BOLD process id), sequence_length int, primers text
   - source_kind, source_ref (the paper depositing it)

5. chromosome_count (cytogenetics)
   - count_id (pk), species_id, name_id, voucher_id
   - somatic_2n int, gametic_n int (nullable), ploidy_level text (e.g. "2x", "4x", "6x"), base_number_x int
   - karyotype_formula text (e.g. "2n=2x=14, 12m+2sm"), method enum {squash_aceto, FISH, flow_cytometry_C_value, other}, c_value_pg numeric (genome size, optional)
   - counted_by, source_kind, source_ref

6. determination_event (the annotation-slip log — APPEND-ONLY, the spine of "what changed over time")
   - det_id (pk), species_id, voucher_id (nullable — can be a name-level act not tied to one sheet), name_id (the name asserted by this event)
   - act_type enum {original_determination, redetermination, lectotypification, neotypification, synonymisation, resurrection, new_combination, status_change, circumscription_revision}
   - determined_by text (the human determiner — may differ from created_by), determination_date date
   - basis enum {morphology, molecular, type_examination, literature, expert_opinion}, confidence enum {certain, probable, tentative}
   - rationale_md text, source_kind, source_ref, supersedes det_id (nullable; chains the history)
   UNIT/VOCAB: act_type is grounded in ICN nomenclatural acts — these are the events that genuinely "change what the plant is" and therefore the events that mint receipts.

7. identity_status (one row per species_id — the rolled-up header state)
   - species_id (pk), status enum {unresolved_stub, in_revision, resolved, contested, unplaced}
   - circumscription_stable bool (the gate flag the firewall reads), accepted_name_id FK, last_determination det_id, updated_at
   This is the bench's single most important output: it moves a species from the 47k "taxonomic stub" pile (per the IUCN coverage-gap memory, only 423 have real status) toward "identity fixed".

**Takip:** What changes over time on this bench (the state the UI tracks):

- IDENTITY STATUS lifecycle (the headline): unresolved_stub -> in_revision -> resolved | contested | unplaced. Mirrors the IucnAssessmentEditor draft->peer_review->submitted->published state machine, but the states are taxonomic, not workflow. `circumscription_stable` is the boolean the engine's gate node reads — flipping it true is what unlocks downstream X/Y/Z work.
- DETERMINATION HISTORY as an append-only timeline: every determination_event is immutable; a redetermination SUPERSEDES (never overwrites) the prior, so the page shows the full chain "det. J. Smith 1998 (morphology) -> redet. as syn. of X, A. Jones 2021 (molecular, type examination)". This is the annotation-slip model herbaria actually use — a curator never erases the old slip.
- PER-NAME nomenclatural status: a name can move heterotypic_synonym -> accepted (resurrection) or accepted -> synonym (sinking); each move is a determination_event, and exactly-one-accepted is invariant-enforced.
- COMPLETENESS / GAP meters (the North-Star "gap is the product" rendered): per-species progress bars — has accepted name w/ registry id? has a designated type? has >=N diagnostic characters scored? has a barcode? has a chromosome count? Each unfilled slot is an honest open question, shown as a gap, not hidden.
- PEER-REVIEW state on contested determinations: reuses EntityDiscussion (already wired into IucnAssessmentEditor) so a synonymisation can be debated before it flips circumscription_stable.
- DRAFT vs PROMOTED: like the workspace `program_tic_draft -> promote` pattern, a determination can be a private draft on the bench before it is committed as a determination_event that mints a receipt.

**Kayıt/giriş:** How the researcher enters data — strongly biased to IMPORT/RESOLVE over hand-typing, reusing shipped capture patterns:

- REGISTRY RESOLVE (the DOI pattern, generalized): paste an IPNI / POWO / WFO / Tropicos id or a name string -> a server resolver (`/api/geocon/resolve-taxon`, modeled exactly on the existing `/api/geocon/resolve-doi`) returns the structured name, authorship, rank, basionym, protologue, and synonym set, prefilled for one-click confirm. This is the primary path — most rows are resolved, not typed. NEVER auto-saved as fact: it lands as a draft the curator confirms (the [EKLE:] / no-auto-assert rule).
- PROTOLOGUE / LITERATURE by DOI: the original-publication citation is added through the existing ReferenceLibrary (DOI -> CSL-JSON), then attached as the name's protologue_citation — zero new citation code.
- CHARACTER MATRIX score grid: a spreadsheet-like editor (character rows x this-taxon column); qualitative cells are a dropdown of the character's declared states, quantitative cells take a number + the character's fixed unit. Optional CSV/XLSX import reuses the AnalysisPane XLSX.read importer verbatim for bulk-scoring a matrix exported from DELTA/Mesquite.
- VOUCHER capture: institution_code autocompletes against Index Herbariorum; "fetch from GBIF" pulls a specimen record by occurrence id (same resolver pattern). Type-status is a chip selector (the IucnAssessmentEditor criteria-chip UI, relabeled).
- BARCODE / CHROMOSOME forms: short structured forms with constrained dropdowns (marker, repository, method) + the accession/count + a mandatory source_ref. A sequence accession is validated against a GenBank/BOLD id pattern; no free sequence pasting in v1.
- DETERMINATION slip: a small form (act_type, determiner, date, basis, confidence, rationale_md, source) — markdown rationale uses the same Markdown component as the IUCN narrative sections.
- Every assertable row REQUIRES a provenance pair (source_kind + source_ref); the Save button is disabled without it, mechanically enforcing the data-integrity constraint.

**Tic→kanıt→receipt:** The verb is: a nomenclatural/determination act, registry- or literature-cited, becomes a tic -> evidence row -> money-blind receipt, exactly as AnalysisPane mints a thesis-run receipt.

- WHICH ACTS MINT (the tic catalog for this bench, all anchoring the `sci.taxonomy_verified` trunk node, region y/knowledge, stage foundation): 
  (a) sci.taxonomy_verified — accepted name confirmed against >=1 registry id + protologue citation. THE root tic; completing it satisfies the circumscription_stability gate node and unblocks every downstream X/Y/Z position on this species. Lowest-barrier, highest-leverage win in the whole atlas.
  (b) sci.type_designated — a holotype cited, or a lectotype/neotype DESIGNATED with the designating publication.
  (c) sci.synonymy_resolved — a synonymisation/resurrection committed (a determination_event of act_type synonymisation|resurrection|new_combination).
  (d) sci.character_diagnosis — a minimum diagnostic character set scored that distinguishes this taxon (enrichment tic; raises strength, gate-light per the Y asymmetry).
  (e) sci.barcode_deposited / sci.chromosome_counted — a vouchered GenBank/BOLD accession, or a chromosome count with voucher (enrichment).
- THE FLOW: completing one of these calls `complete_program_tic` with an evidence row carrying {act, name_id/voucher_id, source_kind, source_ref} — a real ref (registry id, DOI, herbarium barcode, or GenBank accession), never a checkbox. That writes to `chain_evidence` (value_json passes the `evidence_json_is_clean` money/PII CHECK trivially — taxonomy has no money keys), lights the welded `chain_link_type` node (e.g. sci.* under the conservation/knowledge spine), and recalculates evidence strength.
- THE RECEIPT: the bench then offers "mint a Provenance Receipt" (the exact AnalysisPane green-card UI). `get_chain_receipt -> /receipt/[pid]` projects the allowlist: species, accepted name, act type, the citation/registry id, determiner, date, evidence tier — and NOTHING money. A taxonomist gets a citable, ORCID-attachable receipt for "designated lectotype of X (Smith 2026), GEOCON-XXXXXXXX" — credit for the unglamorous identity work that everything else depends on.
- FIREWALL: structurally trivial here — taxonomy is money-blind by nature; there is no value column to evict and no translational terminal an identity act can route to (the unlock rule's firewall clause admits only conservation_only/neutral terminals to a Y position). The only integrity risk is FABRICATED identity, which the mandatory provenance pair + no-auto-assert resolver + append-only determination history together prevent.

**Mevcut yeniden-kullanım vs yeni:** REUSES (do not rebuild):
- AnalysisPane verb pattern — the import (XLSX.read) for bulk character-matrix loading, the save-reproducible-run -> mint-receipt flow, and the green "turn work into a receipt" card. The character matrix is structurally an AnalysisPane dataset (rows x columns + hash + provenance).
- ReferenceLibrary — protologue and revision citations entered by DOI -> CSL-JSON; receipts-as-citations; cite-key export. ZERO new citation code; the name's protologue is just a ReferenceLibrary entry tagged onto a name_id.
- IucnAssessmentEditor — the WHOLE page skeleton transfers: tabbed/sectioned card layout, the criteria-chip selector (relabeled for type_status and act_type chips), the category-button row (relabeled for taxon_rank / nomenclatural_status), the Markdown narrative + preview (for determination rationale), the draft->peer->committed state machine (relabeled to the identity-status lifecycle), the sticky action bar, and EntityDiscussion for contested determinations. The IUCN editor's get/save/advance RPC trio is the template for the taxonomy RPC trio.
- Existing DATA tables: `synonyms` (read-only import) is the seed for taxon_name; `herbarium_specimens` (read-only import) is the seed for type_specimen — the bench ADDS the curator layer (act-typing, provenance, determiner, type_status, link to a name) on top of these, rather than duplicating them. The `/api/geocon/resolve-doi` route is the template for `/api/geocon/resolve-taxon`.
- The shipped engine: tic_definitions / chain_link_type / chain_link_fact / chain_evidence / chain_receipt / complete_program_tic / get_chain_receipt — all reused as-is; this bench just adds new sci.* tic rows (rows, not columns) and welds them to existing sci.* chain nodes.

GENUINELY NEW (the irreducible taxonomy-specific parts):
- The `/api/geocon/resolve-taxon` resolver (POWO/IPNI/WFO/Tropicos/GBIF) — the one substantive new integration.
- The append-only `determination_event` log + supersede chain + the identity_status rollup — taxonomy's "annotation slip" has no analogue in the thesis/IUCN/field tools; this is the bench's distinctive spine.
- The split character (header) / character_state_score (cell) model with per-character units + closed state lists — richer than AnalysisPane's flat dataset because characters are reusable across taxa and exportable to DELTA/Lucid.
- Constrained nomenclatural enums (taxon_rank, nomenclatural_status, type_status, act_type) — ICN/DwC-grounded controlled vocabularies that don't exist anywhere yet.
- molecular_marker + chromosome_count structured forms (small, but new tables).

**v1 kapsamı:** V1 (the simplest bench that delivers the highest-leverage tic in the atlas — a fixed identity that unblocks everything downstream):

SHIP:
- The NAMES & SYNONYMY panel built on a new `taxon_name` table, with the `/api/geocon/resolve-taxon` resolver for POWO + WFO (the two free, comprehensive registries) — paste id/name, confirm accepted name + authorship + rank + the synonym set, attach protologue via the existing ReferenceLibrary.
- The DETERMINATION HISTORY panel (`determination_event`, append-only) with a minimal act_type set {original_determination, redetermination, synonymisation, resurrection, lectotypification} — this is the spine and the source of receipts.
- The IDENTITY STATUS header (`identity_status`) with the circumscription_stable flag.
- ONE verb wired end-to-end: the `sci.taxonomy_verified` tic — confirm accepted name against a registry id + cite the protologue -> complete_program_tic -> mint receipt. That single tic is the unlock gate for X/Y/Z, so it alone justifies v1.
- Whole UI cloned from IucnAssessmentEditor (card layout, chip selectors, state machine, sticky bar, EntityDiscussion) + the AnalysisPane mint card. Reuse `synonyms`/`herbarium_specimens` as read-only prefill where rows already exist.

DEFER (later iterations, one at a time, per the "built ONE AT A TIME, simply" lock):
- Character matrix panel (the DELTA-style grid) — useful but the heaviest UI; defer until a monographer actually needs it. When built, reuse AnalysisPane's XLSX import.
- Molecular & cytogenetic panel (barcode + chromosome forms) — defer; small, additive, low initial demand.
- Type-designation as a first-class minting act beyond just recording a holotype citation (lectotypification receipts).
- Extra registries (IPNI, Tropicos, GBIF) beyond POWO/WFO; CSV bulk import of matrices; DELTA/Nexus/Lucid export.
- Cross-species character KEY generation (interactive identification key) — explicitly a v3+ ambition, NOT v1.

GUARDRAILS HELD: simplicity (one new table + one resolver + a cloned UI is the whole v1; the v1-arc died of complexity, so the bench ADDS to the seed components rather than inventing a framework); firewall (money-blind by construction, no value column anywhere near identity); data integrity (mandatory provenance pair, resolver lands drafts not facts, append-only history, exactly-one-accepted invariant). Routes never deleted — the bench mounts as a new tab on the existing species page / program, deep-links preserved.

### CONSERVATION / IUCN ASSESSMENT BENCH — the work-environment for a conservationist filing a Red List assessment and track
**Kullanan:** A conservationist / Red List assessor (often a taxonomic or regional specialist; for GEOCON, a geophyte specialist) acting as the assessment AUTHOR, plus PEER REVIEWERS (the existing EntityDiscussion peer-review thread) and an admin/Red List Authority coordinator who can override status. Scope of the desk: filing ONE Red List assessment for one taxon (the species the program sits on) — criteria A-E, EOO/AOO + population/threat data, the draft->peer->submitted->published flow — PLUS tracking the conservation ACTIONS that follow (threat-abatement / habitat / ex-situ records that change state ove

**Veri yapıları / tablolar:** Reuse `iucn_assessments` as-is (id, species_id, status, proposed_category, criteria[], 5 *_md narrative fields, created_by, submitted_at/to, timestamps). ADD these tables (all keyed to assessment_id; controlled vocab from IUCN standards):

1. `iucn_occurrence` (the spatial substrate — feeds EOO/AOO): id, assessment_id, lat numeric, lon numeric, coord_uncertainty_m int, basis_of_record (enum: specimen | observation | literature | inferred), event_date date, source_ref text, locality_text text, sensitivity (enum: public | generalized | precise_gated) DEFAULT precise_gated, is_extant bool. UNITS: degrees (WGS84), metres. NOTE: imported as a file (CSV of points) so it reuses the AnalysisPane import pattern.

2. `iucn_spatial_run` (the reproducible computation — the Thesis Workbench run, exactly): id, assessment_id, occurrence_hash text, eoo_km2 numeric, aoo_km2 numeric, n_points int, n_occupied_cells int, grid_cell_km int DEFAULT 2, method (enum: mcp_2km_grid), library_versions jsonb, computed_at. This is the row that becomes a receipt.

3. `iucn_criterion_b` (structures the B-checklist the seed fakes): assessment_id, condition_a_fragmented bool, condition_a_locations int, decline_eoo bool, decline_aoo bool, decline_habitat bool, decline_locations bool, decline_mature_individuals bool, extreme_fluctuations bool. (i-v map to the standard B(b) sub-conditions.)

4. `iucn_population` (feeds A/C/D): assessment_id, mature_individuals_est int, mature_individuals_low int, mature_individuals_high int, population_trend (enum: increasing | stable | decreasing | unknown), generation_length_yrs numeric, reduction_pct numeric, reduction_window (enum: past_3gen | future_3gen | past_and_future), basis_of_estimate text. UNITS: count of MATURE individuals (IUCN's unit, not total plants — for geophytes, flowering-size individuals), years, percent.

5. `iucn_threat` (controlled vocab = IUCN Threats Classification Scheme v3.3): assessment_id, threat_code text (e.g. "5.2.1"), threat_label text, scope (enum: whole>90% | majority 50-90% | minority <50% | unknown), severity (enum: very_rapid_declines | rapid | slow_significant | causing/could_cause_fluctuations | negligible | no_decline | unknown), timing (enum: ongoing | future | past_likely_to_return | past_unlikely | unknown), stress_md text.

6. `iucn_action` (controlled vocab = IUCN Conservation Actions Classification v2.0): assessment_id, action_code text (e.g. "1.1 Site/area protection", "3.1 Species management", "3.4.2 Genome resource bank/ex-situ"), action_label text, status (enum: in_place | needed | recommended), notes_md text. THIS is the "track conservation actions over time" table — its `status` and a linked progress log are the trackable state.

7. `iucn_action_log` (the action-tracking time series — NEW, this is habitat/threat-abatement tracking): id, action_id, logged_on date, observation_md text, outcome_metric_label text, outcome_metric_value numeric, outcome_metric_unit text (e.g. "hectares fenced", "ramets reintroduced", "% poaching incidents") — money-blind by construction (the firewall CHECK forbids currency keys).

All money/PII keys are structurally impossible in evidence because the receipt path runs value_json through the shipped `evidence_json_is_clean` CHECK.

**Takip:** Three distinct state-machines, all already half-present:

1. ASSESSMENT WORKFLOW (reuse exactly — already shipped): `iucn_assessments.status` draft -> peer_review -> submitted -> published, advanced by `advance_iucn_assessment`, with author/admin gating and the EntityDiscussion peer-review thread. This is the seed's state machine; keep it.

2. EVIDENCE-READINESS (new, lightweight, derived not stored): a per-criterion "is this backed?" rollup — does the proposed category's criteria have the data behind them? E.g. proposing EN under B1 requires an EOO spatial_run; proposing under A requires a population reduction estimate; under D requires mature_individuals_est. Surface as a checklist of green/amber/red so the assessor sees the GAP (north-star: the gap is the product). Computed from whether the feeder tables are filled — no new state column.

3. CONSERVATION-ACTION PROGRESS (new — the "track over time" the founder named): each `iucn_action` carries status (needed -> in_place) and accumulates `iucn_action_log` rows over months/years. This is the longitudinal record — a fenced site, a reintroduction cohort, a monitoring count — that turns a one-time assessment into a living conservation program. Each material log entry is a candidate TIC.

These map onto the Venn engine: assessment workflow advances the program's STAGE (foundation->...->governance); each backed criterion + each logged action outcome is a TIC in the X (safeguard) / Y (knowledge) region.

**Kayıt/giriş:** Five capture modes, ranked by reuse:

1. OCCURRENCE IMPORT (reuse AnalysisPane file-import verbatim): drag a CSV/XLSX of points (lat, lon, date, source). Hash the rows (sha256, same as the thesis dataset), then run the spatial computation client-side. NEW compute code only — minimum convex polygon area for EOO and a 2x2 km grid-cell tally for AOO (both standard, deterministic, no external service; can run in-browser with turf.js or a small geodesic helper). The run persists like a thesis run (dataset_hash + method + library_versions) so it is reproducible — that is the whole point of receipts.

2. CRITERIA + CATEGORY (reuse the seed's button grids): proposed-category buttons and criteria chips already exist; v1 UPGRADES the B-criterion chips into the structured `iucn_criterion_b` checklist (the a/b(i-v) conditions) and auto-suggests which thresholds the computed EOO/AOO crosses (read-only hint, never auto-asserts the category).

3. THREATS + ACTIONS (new but trivial — picker, not form): a searchable picker over the IUCN Threats v3.3 and Actions v2.0 hierarchies (static seed tables), then scope/severity/timing dropdowns. No free typing of codes.

4. NARRATIVE (reuse WritingDesk + ReferenceLibrary verbatim): the 5 *_md sections are markdown textareas with preview (already shipped) — wire in ReferenceLibrary so every claim cites a DOI source or a Provenance Receipt cite-key. SIS .json export already exists.

5. ACTION LOG (new, simplest form): date + observation + one optional outcome metric (label/value/unit). Field-collected outcomes can arrive from the existing PWA field notebook (a fenced-area photo, a reintroduction count) — the field notebook is the mobile capture front-end for `iucn_action_log`.

**Tic→kanıt→receipt:** The VERB, modeled exactly on AnalysisPane's `mint_thesis_run_receipt` -> `chain_receipt` -> `/receipt/[pid]`:

A. THE TIC. A verifiable state change with evidence. In this bench, three tic types: (i) a SPATIAL RUN completes (an EOO/AOO computed from hashed occurrence points); (ii) the ASSESSMENT is PUBLISHED (category+criteria finalized after peer review); (iii) a CONSERVATION ACTION outcome is LOGGED (a measured habitat/abatement result). Each completes a `program_tic` in the X (safeguard) or Y (knowledge) region via `complete_program_tic`.

B. THE EVIDENCE. The tic writes a `chain_link_fact` (species_id, the relevant link_type, fill_state, evidence_class, confidence) and a `chain_evidence` row whose `value_json` carries ONLY the money-blind payload: for a spatial run -> {eoo_km2, aoo_km2, n_points, occurrence_hash, grid_cell_km, method, library_versions}; for a published assessment -> {category, criteria[], assessment_id, peer_reviewed:true}; for an action outcome -> {action_code, outcome_metric_label, outcome_metric_value, outcome_metric_unit}. `chain_evidence.source_kind`='iucn_assessment'|'spatial_run'|'action_log', `source_ref`=the row id, `method_id` set, `asserted_by`=user. The shipped `evidence_json_is_clean` CHECK rejects any currency/PII key — the firewall is enforced at write.

C. THE RECEIPT. `mint_iucn_receipt(p_*_id)` (new RPC, twin of mint_thesis_run_receipt) inserts `chain_receipt` (pid, link_fact_id, version, citation_md, minted_by) and returns the pid -> the public money-blind Provenance Receipt at `/receipt/[pid]`. A published assessment's receipt is the citable, ORCID-attachable artifact ("EOO 142 km^2 / AOO 12 km^2, EN B1ab(iii); assessor X; peer-reviewed; reproducible from hash abc123"). Value here is conservation STATUS, never product — band stays in the 0-1 evidence sense, never money.

**Mevcut yeniden-kullanım vs yeni:** REUSES (do not rebuild):
- IucnAssessmentEditor.jsx — the whole narrative + category + criteria + status-machine + SIS-export shell; it IS the seed. Keep its draft->peer->submitted->published flow and EntityDiscussion peer thread.
- AnalysisPane.jsx pattern — file import, sha256 dataset hash, reproducible-run persistence, and the exact mint-receipt UI block (the green "İşi bir receipt'e çevir" card). The EOO/AOO computation slots in as a new "method" alongside the stats.
- ReferenceLibrary.jsx — DOI import + receipt-as-citation for the 5 narrative sections, verbatim.
- WritingDesk.jsx — markdown writing surface for narratives.
- PWA field notebook — mobile capture front-end for occurrence points and action-log outcomes.
- chain_link_fact / chain_evidence / chain_receipt + evidence_json_is_clean CHECK + /receipt/[pid] + program_tic/complete_program_tic — the entire tic->evidence->receipt spine, unchanged.
- Existing sensitivity tiering for locality redaction.

GENUINELY NEW (small, well-bounded):
- EOO/AOO compute code (minimum convex polygon + 2km grid; deterministic, in-browser).
- 4 small tables: iucn_occurrence, iucn_spatial_run, iucn_threat, iucn_action (+ iucn_action_log) — plus the structured iucn_criterion_b.
- 2 static vocab seed tables: IUCN Threats Classification v3.3 + Conservation Actions Classification v2.0 (pickers).
- mint_iucn_receipt RPC (clone of mint_thesis_run_receipt, different value_json projection).
- The evidence-readiness rollup (derived, no new state).

**v1 kapsamı:** SIMPLEST USEFUL v1 (the v1 arc died of complexity — so ship the smallest thing that mints a real receipt):

SHIP:
1. Occurrence CSV import + the EOO/AOO spatial run (reusing AnalysisPane wholesale) — this is the highest-value new capability: it turns scattered points into the two numbers criterion B needs, reproducibly.
2. Mint that spatial run as a money-blind Provenance Receipt (mint_iucn_receipt) — the verb works end-to-end on day one. THE one metric (an evidenced fact, moved from 0) is satisfied by a single real EOO/AOO receipt.
3. Wire the computed EOO/AOO as a read-only HINT into the existing category/criteria buttons (which B thresholds are crossed) — assessor still decides; nothing auto-asserts.
4. Keep the shipped narrative editor + draft->peer->published flow + SIS export untouched.

DEFER (named, not lost):
- Structured iucn_criterion_b checklist (keep the seed's free-text chips for v1; structure them in v2).
- Full threats/actions pickers (v1: keep threats/actions as the existing narrative *_md sections; add the structured tables + IUCN vocab seeds in v2).
- iucn_action_log longitudinal action-tracking + field-notebook capture (v2 — this is the "track over time" layer; the assessment must exist before actions can be tracked against it).
- Population table A/C/D feeders (v2 — B-criterion via EOO/AOO is the most common trigger for narrow-range geophytes and the cleanest to compute, so lead with it).
- Auto-resolving occurrence points from GBIF (v2 — v1 takes a user CSV; this aligns with the recorded globe-accuracy roadmap memo).

Firewall + simplicity held throughout: zero money surface anywhere in conservation; every receipt passes the evidence_json_is_clean CHECK; v1 is one new compute path + one new RPC on top of two already-shipped components.

### PROPAGATION / TISSUE-CULTURE / EX-SITU BENCH — the work-environment a propagator uses to plan, run and log germination/d
**Kullanan:** A propagator / ex-situ conservation horticulturist / seed-bank or tissue-culture technician working inside a PROGRAM on a threatened geophyte. Day-to-day they are: accessioning incoming material (seed lots, wild-collected bulbs, donated tissue), sowing germination trials and scoring them weekly, running a desiccation+retest to determine storage behaviour, initiating and subculturing in-vitro lines while fighting contamination, and keeping provenance clean enough that a genebank or IUCN assessor would accept it. Owner edits; program members can log timepoints on batches assigned to them (reuse 

**Veri yapıları / tablolar:** All new tables live in a `prop` schema (parallel to `bridge`), each with program_id + species_id FKs, created_by, RLS via program membership. STRICTLY money-blind — no price/yield-value/buyer columns ever; value is potential, logged elsewhere as Z-region, never product.

1. prop_accession (the spine — one lot of material)
   - accession_code TEXT (human ID, e.g. "GEOCON-2026-0042"; unique per program)
   - material_type ENUM: seed | bulb | corm | tuber | rhizome | bulbil | offset | tissue_explant | in_vitro_line
   - source_type ENUM: wild_collection | botanic_garden | seed_bank | donation | commercial_supplier | reintroduction_salvage
   - provenance: collector_name, collection_date, country, admin_region; locality is sensitivity-TIERED (precise coords member-gated, public sees coarse region only — reuse existing locality tier logic)
   - wild_origin BOOLEAN, donor_org_id FK (PII member-gated), permit_ref TEXT (CITES/ABS/Nagoya note — member-only)
   - quantity_initial NUMERIC + quantity_unit ENUM (seeds | g | bulbs | vessels)
   - parent_accession_id (self-FK, for derived lines e.g. an in-vitro line off a seed lot)
   - status ENUM: active | depleted | contaminated_lost | transferred | archived
   - notes_md, created_by, created_at

2. prop_germination_trial (parent of many scoring timepoints)
   - accession_id FK, n_seeds_sown INT, sow_date
   - substrate ENUM: agar | filter_paper | peat | sand | perlite_vermiculite | soil_mix | other(text)
   - pretreatment ENUM[] (multi): none | cold_stratification | warm_stratification | GA3 | scarification_mechanical | scarification_acid | smoke_KAR1 | leaching | after_ripening  (these are the standard dormancy-breaking treatments in the seed-ecology literature)
   - pretreatment_detail TEXT (e.g. "GA3 250 mg/L 24h"; "4°C 12 weeks")
   - temp_regime TEXT (e.g. "20/10°C 12/12h"), photoperiod_hours NUMERIC, light_regime ENUM: light | dark | alternating
   - dormancy_class ENUM (optional call): PD | MD | MPD | PY | PY+PD | non_dormant | unknown  (Baskin & Baskin classification — physiological/morphological/morphophysiological/physical)
   - status ENUM: running | completed | abandoned
   - germination_criterion TEXT (controlled default "radicle ≥2 mm" — the criterion MUST be recorded for reproducibility)

3. prop_germination_score (the timepoint — child rows, the thing logged weekly)
   - trial_id FK, observed_on DATE, day_index INT (days since sow)
   - n_germinated_cumulative INT, n_abnormal INT, n_rotten INT, n_dormant_remaining INT
   - (final-germination-percentage, MGT mean germination time, T50, and germination rate index are DERIVED, never stored as raw fact — computed like AnalysisPane computes stats)
   - note TEXT, scored_by

4. prop_storage_behaviour_test (the orthodox/recalcitrant determination)
   - accession_id FK, test_method ENUM: desiccation_100seed | comparative_germination
   - initial_moisture_pct NUMERIC, target_moisture_pct NUMERIC, drying_method ENUM: silica_gel | controlled_RH_15pct | open_air
   - viability_before_pct, viability_after_drying_pct, viability_after_freeze_pct (–20°C retest = orthodox confirmation)
   - viability_method ENUM: germination | tetrazolium_TZ | cut_test | embryo_excision
   - determination ENUM: orthodox | intermediate | recalcitrant | unknown  (Roberts 1973 / Kew SID controlled call)
   - confidence ENUM: provisional | confirmed
   - notes_md

5. prop_culture_line (one in-vitro line)
   - accession_id FK, explant_type ENUM: shoot_tip | nodal_segment | bulb_scale | twin_scale | basal_plate | leaf | anther | callus | protocorm | meristem
   - initiation_date, sterilization_protocol TEXT (e.g. "70% EtOH 30s + 1.5% NaOCl 15min + 3x rinse" — the real surface-sterilization log)
   - stage ENUM: initiation | multiplication | rooting | acclimatization (the standard Murashige micropropagation stages I–IV)
   - status ENUM: active | contaminated | senesced | weaned_exsitu | terminated

6. prop_media_recipe (reusable, per program — the tissue-culture media record)
   - name TEXT, basal_medium ENUM: MS | half_MS | WPM | B5 | Knudson_C | custom  (MS=Murashige-Skoog, WPM=Woody Plant Medium — the canonical bases)
   - sucrose_g_l NUMERIC, agar_g_l NUMERIC, ph NUMERIC (record-on-autoclave, standard 5.7–5.8)
   - pgr JSONB[]: list of {compound ENUM(BAP|kinetic|2iP|TDZ|zeatin|NAA|IBA|IAA|2,4-D|GA3|ABA), concentration NUMERIC, unit ENUM(mg/L|µM)}  (cytokinins + auxins — the two PGR classes every protocol balances)
   - additives TEXT (activated charcoal, casein hydrolysate, etc.), notes_md

7. prop_subculture_event (the tracking heartbeat of a culture line — child rows)
   - line_id FK, event_date, media_recipe_id FK, vessel_count INT
   - contamination ENUM: clean | bacterial | fungal | yeast | mixed | suspected
   - contamination_pct NUMERIC (% vessels affected), viability ENUM: vigorous | normal | weak | necrotic
   - multiplication_ratio NUMERIC (shoots out / explants in — the propagation-rate metric), n_shoots INT, n_roots INT
   - action ENUM: subcultured | discarded | moved_to_rooting | moved_to_acclimatization
   - operator, note

Controlled-vocab principle: every ENUM above is rendered as the same chip/dropdown UI the IUCN editor uses for categories+criteria. Units are explicit columns, never free-typed into a value field.

**Takip:** State that changes over time (this is what makes it a bench, not a form):
- ACCESSION lifecycle: active -> depleted | contaminated_lost | transferred | archived, with quantity drawn down as material is sown/initiated. The left rail shows live accession status badges.
- GERMINATION TRIAL as a TIME SERIES: the parent trial is running -> completed | abandoned; the body of the work is the stream of prop_germination_score timepoints (day 7/14/21/28…). The UI shows a cumulative germination curve (reuse AnalysisPane's recharts Line/Scatter Figure) and live-derives final germination %, MGT, T50 from the timepoints. "Log next count" is a one-tap action.
- STORAGE-BEHAVIOUR test: provisional -> confirmed, advancing only when the freeze-retest viability is in (a real two-step determination, mirrors the IUCN draft->peer state machine).
- CULTURE LINE health over subculture cycles: each prop_subculture_event is a heartbeat carrying contamination state + multiplication ratio; the line trends active -> contaminated/senesced/weaned. A small per-line sparkline of contamination_pct and multiplication_ratio across events shows whether the line is thriving or being lost (contamination is THE daily reality of TC — it must be first-class, not a note).
- PROGRAM-level rollup: counts of active accessions, running trials, healthy lines, and determinations made — these are the aggregate-progress numbers non-members are allowed to see, and they feed the program's stage/region status (a working storage-behaviour determination is Y-knowledge; an established protocol that could underpin restoration is X-safeguard).
- Assignment tracking: a batch can be assigned to a program member who then logs its timepoints (owner-OR-assignee, reusing complete_program_tic's permission shape).

**Kayıt/giriş:** How data is entered/captured — three capture surfaces, each reusing a shipped pattern:
1. STRUCTURED FORMS (primary) — the batch editor is a controlled-vocab form exactly like IucnAssessmentEditor: ENUM dropdowns/chips for material_type, pretreatment, basal_medium, contamination, determination; explicit numeric+unit fields; markdown notes with [EKLE:]/[ADD:] placeholders for anything not yet known (never auto-filled). Save via an RPC; state-advance via buttons.
2. FAST TIMEPOINT CAPTURE (the bench heartbeat) — a compact "log a count / log a subculture" strip that is mobile-friendly and reuses FieldRoute's offline-queue (localStorage) so a technician scoring trays at a greenhouse bench with poor wifi never loses a count; queued writes flush on reconnect. Photo-per-timepoint optional via the same <input capture="environment"> the field notebook uses (a contamination photo, a germination tray photo).
3. CSV/XLSX IMPORT (bulk/back-fill) — reuse AnalysisPane's XLSX.read + SHA-256 content-hash + save_*_dataset path so a propagator can import an existing germination spreadsheet or a media-prep log; the import is hashed for reproducibility and the columns are mapped to the timepoint schema.
4. MEDIA RECIPE LIBRARY — a small reusable picker (mirrors ReferenceLibrary's saved-item list): recipes are defined once per program and selected on each subculture event, so the PGR composition is recorded by reference, never re-typed (and never drifts).
A small in-bench reference panel can pull a real DOI-backed protocol via the existing /api/geocon/resolve-doi path so the operator records "protocol: Smith 2019 [DOI]" against a trial — provenance for the method itself.

**Tic→kanıt→receipt:** The verb is identical in shape to mint_thesis_run_receipt — work becomes a tic -> evidence -> money-blind receipt, on the 0–1 confidence band:

What qualifies as a TIC (a verifiable state change with evidence), the bench's mintable units:
- A COMPLETED GERMINATION RESULT: trial closed with a defended final germination % / MGT / T50, the protocol (pretreatment, temp, criterion) recorded, backed by the timepoint series + (ideally) a DOI for the method. Fact = "Tulipa sprengeri: 78% germination after GA3 + 12wk cold stratification (n=50), criterion radicle ≥2mm." This is genuinely new knowledge for ~47k mostly-unstudied geophytes — moves the atlas off 0.
- A STORAGE-BEHAVIOUR DETERMINATION (orthodox/intermediate/recalcitrant), confirmed by the freeze-retest. This is high-value: it tells every future conservationist whether the seed can be banked at all. Fact = "Galanthus X: orthodox (viability retained after desiccation to 5% MC + –20°C)."
- AN ESTABLISHED PROTOCOL: a culture line that reached a stable multiplication ratio / a documented acclimatization success — a reproducible micropropagation method for a threatened species.

The flow (reuse the AnalysisPane mint UI verbatim):
1. Operator finishes the batch; bench shows a green "turn this into a receipt" strip.
2. mint_prop_*_receipt RPC writes a chain_link_fact + chain_evidence (the timepoint series JSON, protocol params, dataset hash, library/method versions, optional method DOI) + chain_receipt with a generated PID, projected through get_chain_receipt -> /receipt/[pid].
3. The receipt is citable, reproducible, ORCID-attachable, and MONEY-BLIND: chain_evidence.value_json passes the evidence_json_is_clean CHECK; the receipt projects the allowlist only. A propagation receipt asserts a biological fact (germination %, storage class, protocol) — it NEVER carries price, market size, or buyer. Value/Z stays "potential," logged separately, never as product. Firewall holds at write, store, and read.
4. confidence band 0–1 = provenance-weighted: a single-replicate provisional trial scores low; an n=50 replicated determination with a method DOI scores high. Inference/estimate is capped, exactly as data-integrity rule 1 requires.

**Mevcut yeniden-kullanım vs yeni:** REUSES (the v1 arc died of complexity — lean hard on shipped code):
- Whole-record editor shell = IucnAssessmentEditor.jsx (load RPC -> form state -> controlled-vocab chips/dropdowns -> save RPC -> state-machine advance buttons -> EntityDiscussion thread for peer review of a protocol). The batch editor is this, re-skinned.
- Controlled-vocab chip/dropdown UI = the IUCN CATEGORIES + CRITERIA_HINTS chip pattern, reused for every ENUM (material_type, pretreatment, basal_medium, contamination, determination).
- Import + reproducible-run + content-hash = AnalysisPane.jsx (XLSX.read, SHA-256, save_*_dataset, list_*_runs history strip, recharts Figure for the germination curve / contamination sparkline).
- The MINT verb = AnalysisPane's mint_thesis_run_receipt UI and mint_prop_*_receipt RPC pattern -> chain_link_fact/chain_evidence/chain_receipt -> /receipt/[pid]. Copy it, do not reinvent.
- Method/protocol references = ReferenceLibrary.jsx (DOI -> CSL via /api/geocon/resolve-doi; cite a GEOCON receipt as a source; the media-recipe library is the same "saved reusable items" list shape).
- Fast offline timepoint capture = FieldRoute.jsx (localStorage queue, online/offline flush, <input capture="environment"> photo, geolocation optional).
- Permissions/redaction = fn_program_can_see_interior + owner-OR-assignee (complete_program_tic); locality sensitivity tiers; PII member-gating. All existing.

GENUINELY NEW (the irreducible discipline-specific core):
- The prop.* tables and ENUMs above (accession, germination trial+score, storage-behaviour test, culture line, media recipe, subculture event) — the domain data model.
- The parent->timepoint TIME-SERIES tracking shape (a trial = definition + many child observations over days/weeks) — IUCN/Thesis are single-record; this is the one new structural idea, and it is the heart of the bench.
- The derived metrics (final germination %, MGT, T50, multiplication ratio, contamination trend) computed from timepoints — small pure functions in the AnalysisPane style.
- mint_prop_germination_receipt / mint_prop_storage_receipt / mint_prop_protocol_receipt RPCs (thin wrappers around the existing chain mint, mapping prop facts to chain_link_fact).

**v1 kapsamı:** SIMPLEST USEFUL V1 (ship one vertical slice end-to-end, resist the cathedral):
Build ONLY the GERMINATION/DORMANCY trial path plus its accession spine — the single most common, most valuable, lowest-complexity propagation record, and the one that most directly mints atlas-moving facts for ~47k unstudied geophytes.

V1 includes:
- prop_accession (minimal: code, material_type, source_type, coarse provenance, quantity, status) — required because nothing is trustworthy without it.
- prop_germination_trial + prop_germination_score (parent + timepoints) with the pretreatment/temp/criterion controlled vocab.
- Batch editor reusing the IucnAssessmentEditor shell; "log next count" strip reusing FieldRoute's offline queue; cumulative germination curve reusing AnalysisPane's Figure; derived final-germination % / MGT / T50.
- mint_prop_germination_receipt -> chain_receipt -> /receipt/[pid], money-blind, reusing the AnalysisPane mint UI exactly.
- Program-membership RLS + aggregate-only public view.
This is a complete loop: accession a seed lot -> sow a trial -> log weekly counts (offline-safe) -> close it -> mint a citable money-blind germination receipt. A real propagator gets value on day one.

DEFER (v2+, only after the loop is proven, each added ONE AT A TIME exactly as LOCKED):
- TISSUE CULTURE entirely (prop_culture_line, prop_media_recipe, prop_subculture_event) — highest complexity (contamination tracking, PGR recipes, multi-stage); it is its own later slice.
- prop_storage_behaviour_test (the orthodox/recalcitrant determination) — second slice; valuable but needs the freeze-retest two-step and viability methods.
- CSV/XLSX bulk import of germination data, DOI-method-reference panel, photo-per-timepoint, parent/derived accession lineage, permit/ABS-Nagoya fields.
- Cross-batch analytics and any program-stage auto-advance from bench activity.
Hold simplicity: v1 is one table family + one editor + one mint RPC, all four reusing shipped components. No new design language, no new framework, no speculative generality.

### CHEMISTRY / EXTRACTION / PHYTOCHEMISTRY BENCH — the work-environment for turning vouchered plant MATERIAL into molecule-
**Kullanan:** A phytochemist / natural-products chemist working ONE plant's chemistry as a position (researcher x species x Chemistry-gear), promotable to a managed program on the Venn engine. Day-to-day they: register a chemical sample tied to a voucher (organ, population, phenophase), run/log extractions (solvent, method, yield%), profile the extract (TLC/HPLC-DAD/LC-MS/GC-MS fingerprint -> tentative compound list), isolate compounds to purity, confirm structure (NMR/HRMS/UV/IR/MP/[a]D), and quantify a target compound against a certified reference standard with a validated method. Secondary users: a conse

**Veri yapıları / tablolar:** FIVE linked record-tables (the Z trunk made concrete), all scoped to program_id + species_id, all evidence-bearing. Money-blind by construction (no price/cost/market/supplier-quote column exists; enforced by the evidence_json_is_clean CHECK on any value_json that reaches chain_evidence).

1. chem_sample (provenance/voucher of the chemical material — the label every later number bolts onto):
- sample_code (text, lab accession e.g. GE-2026-014), species_id (FK), voucher_ref (herbarium + accession #, REQUIRED — inherits identity from the Taxonomy gear), source_material enum {wild_collected, ex_situ_accession, in_vitro_propagated, commercial_reference} (the firewall+sustainability hook: in_vitro/ex_situ is the non-wild supply the value floor needs), organ enum {bulb, corm, tuber, rhizome, basal_plate, leaf, scape, flower, seed, root, whole_plant}, phenophase enum {dormant, sprouting, vegetative, budding, flowering, fruiting, senescent} (alkaloid yield varies by phenophase/season — Katoch 2012), collection_date, locality_text + locality_geom (SENSITIVITY-TIERED, member-gated), collector, fresh_or_dry enum {fresh, air_dried, freeze_dried, oven_dried}, drying_temp_c, biomass_g (dry weight basis recorded), moisture_pct, ABS_status enum {not_required, PIC_MAT_on_file, pending, na} + abs_ref (Nagoya provenance — an is_gate node; missing PIC/MAT caps any downstream Z potential toward 0). UNIT NOTE: all masses g dry weight unless flagged fresh.

2. chem_extraction (the extraction run — what state changes; one row per run, batchable):
- extraction_id, sample_code (FK), method enum {maceration, percolation, soxhlet, ultrasound_UAE, microwave_MAE, supercritical_CO2, accelerated_solvent_ASE, acid_base_alkaloid, infusion, steam_distillation}, solvent (controlled list: MeOH, EtOH, EtOAc, n-hexane, DCM, acetone, water, MeOH:H2O ratios, ionic-liquid; green-chemistry flag), solvent_to_sample_ratio (mL/g), temperature_c, duration_min, n_cycles, ph (for acid-base alkaloid workups), defatting_step bool, extract_mass_g (OUTPUT), extraction_yield_pct (= extract_mass_g/biomass_g x 100 — the HARD NUMBER, the load-bearing conservation fact), recovery_cap_note (e.g. "classical solvent recovers ~50% of galantamine present" — Akram/Svinyarov), storage_conditions. This is the AnalysisPane-equivalent: parameterized, reproducible, hash the parameter set.

3. chem_profile (phytochemical fingerprint — the tentative compound list before isolation):
- profile_id, extraction_id (FK), technique enum {TLC, HPLC_DAD, HPLC_UV, UPLC_DAD, LC_MS, LC_MSMS, GC_MS, NMR_fingerprint, FTIR}, instrument_model + column/stationary_phase, mobile_phase + gradient_program, flow_rate_mL_min, detection (wavelength_nm or m/z range or MS mode), detected_features jsonb [{rt_min, mz, uv_lambda_max, tentative_id, match_basis enum {library_MS, std_co_injection, lit_RT, none}, confidence enum {tentative, putative, confirmed}}], raw_data_file_ref (instrument file upload), data_format (mzML/CDF/JCAMP-DX/raw). Records HONEST GAPS as first-class: "feature at RT 8.2, m/z 288 — unidentified" is a valid logged output.

4. chem_compound + chem_isolation (compound isolation to purity + structure ID — the durable molecular identity):
- compound_id, profile_id (FK), trivial_name, iupac_name, compound_class enum {Amaryllidaceae_alkaloid, isoquinoline_alkaloid, cardiac_glycoside, saponin, flavonoid, phenolic, terpenoid, tropolone_colchicine_type, other}, molecular_formula, exact_mass, InChIKey, SMILES, CAS, pubchem_cid, chembl_id (the structure-identity WELD — populates species_compound so the Bioactivity fan can inherit public ChEMBL/PubMed compound->target edges; this is the only thing that lets a Z leaf light up, and it is structure-identity, NOT a claim of activity).
- isolation sub-fields: isolation_method enum {column_chromatography, prep_HPLC, prep_TLC, CPC, recrystallization, CCC}, purity_pct + purity_method enum {HPLC_area, NMR, qNMR}, yield_mg, yield_pct_of_extract.
- structure_evidence jsonb (the IUCN-editor-style checklist of structural confirmations, each a chip + a data ref): {one_D_NMR_1H, one_D_NMR_13C, two_D_NMR (COSY/HSQC/HMBC/NOESY), HRMS, UV, IR, melting_point_c, optical_rotation, XRD, comparison_to_literature} — id_status enum {tentative, fully_characterized, novel_structure} (a NOVEL structure is the gear's strongest tooth, analogous to a new-species description in the Taxonomy gear).

5. chem_quantitation (quantitation vs a reference standard — the number a value claim rests on):
- quant_id, compound_id (FK), sample_code (FK — back to the exact organ/population/phenophase), method enum {HPLC_DAD, UPLC_MSMS, GC_MS, qNMR, LC_MS}, reference_standard (CRM name + supplier_lot — supplier is provenance, NOT commerce; NO PRICE), calibration_range + calibration_unit, r2 (linearity), lod + loq (ng/mL or ug/mL), accuracy_recovery_pct, precision_intraday_rsd_pct, precision_interday_rsd_pct (the ICH Q2(R1) validation battery — confirmed real-world in Katoch 2012 & Ozdemir 2017), content_value + content_unit (ug/g DW, mg/g DW, or %w/w — the QUANTITATIVE FACT, e.g. "40 ug/gDW galantamine, light-grown bulblets"), validated bool, validation_ref. UNIT NORMALIZATION enforced: always per dry-weight gram unless fresh-flagged, so cross-population numbers compare.

**Takip:** State that changes over time, reusing the engine's tic/region/stage + the IUCN editor's draft->peer->published machine; nothing new invented:

- PER-RECORD STATE: each of the 5 record-types carries a status {draft -> peer_review -> verified} mirroring IucnAssessmentEditor's state machine (advance_* RPC, author+admin gating). A compound's id_status (tentative -> fully_characterized -> novel) and a quant's validated flag are the within-record maturity ticks.

- BATCH / RUN TRACKING (the chemistry-specific axis the Thesis Workbench lacks): extractions and quantitation are RUNS — multiple per sample, each timestamped, each with its own parameter set + hash, so a researcher tracks "GE-2026-014 extracted 3 ways, yields 0.8 / 1.1 / 1.4%". The chem_extraction and chem_quantitation tables ARE the run ledger (one row = one run), exactly like AnalysisPane's list_thesis_analysis_runs history panel — reproducible, hash-stamped, never overwritten.

- TIMEPOINT / PHENOPHASE tracking: because content varies by phenophase/season, the same compound can have many quant rows across phenophase x organ x population — the bench tracks this as a small matrix (the genuinely chemistry-native tracking need), surfacing "max galantamine at flowering, bulb, light-grown".

- EVIDENCE BAND (the gear thickening): each settled record cuts a tooth into the Chemistry gear via chain_link_fact.fill_strength on the welded chain node (chem.profiling.quant etc.); band climbs weak->moderate->strong->verified as source->extract->profile->isolate->quant complete. recalculate_evidence_strength (shipped) drives this; weakest-link math means an unvouchered sample caps the whole chain low.

- GEAR-INTERLOCK STATE (read-only, derived): the bench shows the two upstream prerequisites as lights — TAXONOMY settled? (identity gear) and NON-WILD SUPPLY settled? (safeguard/propagation gear) — because a Chemistry receipt keyed to a misidentified plant or built only on wild-dug bulbs is flagged. It does not gate the work (you can profile anytime) but it conditions whether the downstream Z fan may MATURE past T1.

**Kayıt/giriş:** How data is entered/captured — three lanes, all already proven in the shipped code:

1. STRUCTURED FORMS (primary) — like IucnAssessmentEditor: per-record forms with controlled-vocab dropdowns (organ, phenophase, method, solvent, technique, compound_class), numeric fields with explicit UNIT LABELS, and the structure_evidence checklist rendered as toggle-chips exactly like the IUCN A/B/C/D/E criteria chips (NMR_1H, NMR_13C, HMBC, HRMS, UV, IR, MP, [a]D, XRD). Auto-computed fields: extraction_yield_pct = extract_mass/biomass; quant content normalized to /gDW. [EKLE:] placeholders for any specific the researcher must confirm (e.g. "[EKLE: confirm reference standard lot]").

2. INSTRUMENT-FILE IMPORT (the AnalysisPane lane) — upload the raw/processed instrument file (CSV/XLSX peak tables from HPLC/GC-MS; mzML/CDF/JCAMP-DX/raw chromatograms; a calibration-curve CSV). The bench parses the peak table into detected_features and computes calibration r2/LOD/LOQ/RSD client-side (reuse AnalysisPane's XLSX.read + simple-statistics + linear-regression battery — calibration is literally a linear regression, already shipped), stores a SHA-256 content hash of the parsed data so the run is reproducible, and persists library/instrument versions. Files attach as evidence refs.

3. EXTERNAL-DB LOOKUP (assisted, money-blind) — when a compound is named, resolve InChIKey/chembl_id via the bio-research ChEMBL/PubChem connectors to populate the structure-identity weld (species_compound). This pulls STRUCTURE identity only; it does NOT assert activity (that is the downstream Bioactivity gear). DOIs of the isolation/quant papers are first-class source refs on every receipt.

Co-authoring & review: EntityDiscussion thread per record (reuse the shipped peer-review thread on IucnAssessmentEditor) so a co-author can challenge a tentative ID before it advances to verified.

**Tic→kanıt→receipt:** THE VERB, identical mechanics to AnalysisPane's mint_thesis_run_receipt -> /receipt/[pid], money-blind end to end. Each settled record-type is one TIC (a verifiable state-change with a DOI/voucher/assay-backed evidence row); completing it via complete_program_tic lights its welded chain node and lets the researcher mint a Provenance Receipt (0-1 band).

The 5 chemistry tics (= the Z trunk in tic vocabulary):
- chem.source_documented (chem_sample with voucher + provenance) -> receipt: "vouchered sample, organ X, population Y, phenophase Z"
- chem.extraction_logged (chem_extraction with yield%) -> receipt: "extraction yield N% by method M" (this receipt is ALSO the conservation/wild-pressure fact the Safeguard gear cites)
- chem.metabolite_profiling (chem_profile, tentative compound list) -> receipt: "HPLC-MS profile names GALANTAMINE + LYCORINE" — THE FAN-FIRING TIC: the instant a compound is named + welded (species_compound via InChIKey/chembl_id), the downstream Bioactivity gear's money-blind potentials flip visible at honest T1
- chem.compound_isolated / chem.structure_confirmed (chem_compound, id_status fully_characterized/novel) -> receipt: "compound isolated to N% purity, structure confirmed by NMR+HRMS" (novel structure = strongest tooth)
- chem.quantitation_validated (chem_quantitation, validated) -> receipt: "M ug/gDW of compound C, ICH-validated method, vs CRM" — the single quantitative fact a Z value-claim rests on

EVIDENCE -> RECEIPT -> firewall: each tic writes a chain_evidence row whose value_json carries ONLY {technique, parameters, content_value, content_unit, provenance_ref, evidence_tier} — the evidence_json_is_clean CHECK rejects any money/PII key at WRITE. The receipt projects an allowlist (get_chain_receipt) — money-blind at write, store, read. The Chemistry gear's terminal is a conservation/knowledge output (Y: a published profile/quant is citable knowledge) OR it HANDS UP a quantified compound to the Z value gear — but the bench itself never emits a price/product. POTENTIAL-NOT-PRODUCT: the strongest thing this bench can say is "this organ of this population yields X% of compound Y by this validated method" — a fact, money-blind; what that compound is WORTH lives only in the Exchange, one-directional, citing this receipt.

**Mevcut yeniden-kullanım vs yeni:** REUSES (do not rebuild):
- AnalysisPane.jsx pattern WHOLESALE — file import (XLSX.read), client-side stats (simple-statistics/jstat: calibration curve = linear regression already implemented; descriptives for replicate runs), SHA-256 content hash, reproducible run persistence (save_run with method+params+versions+hash), the runs-history panel, and the mint-receipt block (mint_thesis_run_receipt -> /receipt/[pid]). Chemistry quantitation IS a Thesis-Workbench analysis run with chemistry fields.
- IucnAssessmentEditor.jsx pattern — the draft->peer_review->verified state machine (save_*/advance_* RPCs, author+admin gating, locked-when-submitted), the criteria-checklist-as-chips UI (reused verbatim for the structure_evidence confirmation checklist: NMR/HRMS/UV/IR/MP/[a]D chips), narrative sections with markdown preview (for method narrative + interpretation, [EKLE:]-gated), the SIS-style JSON export (chemistry analog: a machine-readable compound+quant record), and EntityDiscussion peer-review thread.
- ReferenceLibrary.jsx / WritingDesk.jsx — DOI-backed citations for every source ref; the method write-up desk.
- Field notebook (PWA) — the chem_sample provenance capture (organ/phenophase/locality/voucher) is the SAME capture the field notebook already does offline; the sample registration reuses it, just adds the lab-side fields.
- Substrate: programs + program_tic + chain_link_fact/chain_evidence/chain_receipt + species_compound weld + recalculate_evidence_strength + complete_program_tic — all shipped.

GENUINELY NEW (thin):
- 5 chemistry record tables (chem_sample/extraction/profile/compound/quantitation) — but they are structurally identical to thesis_dataset/thesis_analysis_run with chemistry columns; same save/list/mint RPC shape.
- The controlled vocabularies (organ, phenophase, extraction method, solvent, technique, compound_class, structure_evidence) — data, not logic.
- The phenophase x organ x population quant matrix view — a small new read.
- The ChEMBL/PubChem InChIKey resolver to populate species_compound — a thin external lookup (structure identity only; the activity fan itself is the DOWNSTREAM Bioactivity gear, not built here).

**v1 kapsamı:** V1 (the simplest useful slice — ship the spine, one record-type proven end-to-end first, exactly how the Thesis Workbench grew):

SHIP:
1. chem_sample registration — voucher + species + organ + phenophase + source_material + biomass + locality(sensitivity-tiered) + ABS_status. (Reuses field-notebook capture.) This is the firewall+identity anchor; nothing valid without it.
2. chem_extraction run-log — method + solvent + ratio + temp + duration + extract_mass -> AUTO extraction_yield_pct. One row per run, hash-stamped, history panel. (Reuses AnalysisPane run pattern.) Yield% is the single highest-value v1 output: it is simultaneously a knowledge fact AND the wild-collection-pressure number the Safeguard gear needs.
3. chem_quantitation — import a calibration CSV, compute r2/LOD/LOQ via the SHIPPED regression, enter content_value in ug/gDW vs a named reference standard. (Pure AnalysisPane reuse.)
4. THE VERB on all three -> mint_chem_receipt -> /receipt/[pid], money-blind, via the existing receipt path. A real researcher mints a credited, money-blind chemistry receipt from 0 — the North-Star metric.

State machine: draft->verified only in v1 (skip peer_review until there are 2 users); EntityDiscussion thread on.

DEFER (named, not forgotten):
- chem_profile full fingerprint table + raw-chromatogram (mzML/CDF) parsing — v1 logs a tentative compound list as simple text + DOI; full instrument-file ingestion is v2 (heavy parsing, low cold-start value with ~0 users).
- chem_compound/structure_evidence isolation+NMR/HRMS checklist — v2 (the IUCN-chip pattern is ready to reuse, but isolation is the rarest operation; defer until a program actually isolates).
- The species_compound ChEMBL weld + the Bioactivity FAN — explicitly a SEPARATE downstream gear (Bioactivity/Pharmacology); v1 chemistry just records the InChIKey field so the weld is possible later. Do NOT build the fan here.
- Cross-population phenophase matrix view, qNMR purity, supercritical/green-extraction specialized fields — v2 enrichments.
- Full ICH Q2 validation workflow (robustness, specificity, system-suitability) — v1 captures the core 6 (r2, LOD, LOQ, accuracy, intra/inter-day RSD); the rest is v2.

This keeps v1 to ~3 forms + 1 import + 1 mint button — the complexity that killed the v1 arc is avoided by shipping ONE record-type at a time, each a thin restyle of the already-shipped Thesis Workbench.

### BIOACTIVITY / PHARMACOLOGY BENCH — the Z (value) work-environment. The 5th gear in the gear-machine; the upper, value ge
**Kullanan:** A pharmacologist / natural-product bioactivity researcher running a Z (value) program on one geophyte species, after Chemistry has settled at least one identified compound (SMILES/InChIKey + quantitation) and Propagation/Material has handed up an authenticated lineage. In practice the same solo researcher may wear all hats (the cold-start reality), so the bench must be usable by someone entering ONE literature IC50 they read, not only someone running a screening campaign. Secondary readers: program members (full detail), the public/species page (aggregate band + verified potentials only), and 

**Veri yapıları / tablolar:** Four new tables (thin) + reuse of the shipped chain substrate. All units/vocab are taken from the live ChEMBL curated schema (verified this session against the real galantamine->AChE record) so a record round-trips against the external DB the fan joins to.

A) assay_compound (the molecule weld — = the `species_compound` weld the tic-architecture flagged as the one genuinely new join). Fields: id; species_id (text, FK species); program_id; compound_name (controlled where possible, e.g. GALANTAMINE); chembl_id (nullable, the join key to the fan); inchikey (text, the structure-identity anchor — preferred over name); smiles; source_chemistry_receipt (FK chain_receipt — the Chemistry bench output this compound was settled by; NULL = honest gap "compound named in literature, not yet isolated from this accession"); abs_provenance_ref (Nagoya/ABS note — the biopiracy guard pointer). One row per compound on this species. THE FAN KEYS ON inchikey/chembl_id.

B) bioassay_record (the Assay Ledger row — mirrors ChEMBL activities one-to-one). Fields + units + controlled vocab:
  - assay_compound_id (FK A); target_name (e.g. "Acetylcholinesterase"); target_chembl_id (nullable); target_organism (CONTROLLED + load-bearing: Homo sapiens / Electrophorus electricus / Rattus norvegicus … — the live record shows IC50 swinging 1000x by organism, so this is NOT optional);
  - standard_type — controlled vocab {IC50, EC50, Ki, Kd, AC50, GI50, ED50, Potency, MIC, percent_inhibition};
  - standard_relation — controlled {=, >, <, >=, <=, ~} (a ">10 µM" inactive is a real, valuable record);
  - standard_value (numeric) + standard_units — controlled {nM, µM, mM, pM, M, µg/mL, %} with nM as the normalization target;
  - pchembl_value (numeric, nullable; = -log10(molar potency); computed only when relation='=' and units convert to molar — the standardized cross-assay potency);
  - assay_type — controlled {B binding, F functional/cell, A ADME, T toxicity, P physicochemical, U unclassified};
  - assay_format/description (free text: "Ellman assay, AChE from E. electricus");
  - assay_origin — controlled {measured_here (this researcher ran it on this species' material), literature (read from a paper about the compound), inferred_genus (T0, weakest)} — THIS FIELD IS THE FIREWALL/HONESTY PIVOT: measured_here can climb to T2/T3; literature caps at T1; inferred_genus caps at T0;
  - material_lineage_ref (FK to the Propagation/Material receipt — for measured_here rows, what was assayed; enforces "no anonymous wild-harvest feeds the value gear");
  - data_validity — controlled {ok, outside_typical_range, potential_author_error, potential_transcription_error, unvalidated_assay} (the real record carries "Outside typical range" — gaps are first-class);
  - selectivity_note, admet_flag (free text, optional);
  - source_kind {doi, protocol, dataset} + source_ref (DOI/accession — required; this is what the receipt cites).

C) potential_record (the Potential Map point — the money-blind commercial-potential atom, the OUTPUT). Fields (ALLOWLIST — schema-enforced money-blind, no price/market/deal column can exist):
  - assay_compound_id (FK A); activity_class — controlled ~12 (each backed by a real ChEMBL target family): enzyme_inhibition_neuro (AChE/BChE), cytoskeletal_antimitotic (tubulin), antiproliferative, antiviral, anti_inflammatory, antimicrobial_antifungal, antioxidant, metabolic_enzyme (tyrosinase/alpha-glucosidase), receptor_modulation, insecticidal, allelopathic, other;
  - value_domain — controlled, MAPPED TO THE SHIPPED chain `app.*` leaves {pharmaceutical, nutraceutical, cosmeceutical, agricultural, veterinary, industrial_biomaterial, research_reagent} (firewall_class='translational' already);
  - indication_area (free text or controlled list, e.g. "Alzheimer's", cited from ChEMBL disease_efficacy/ATC/PubMed — NEVER asserted by GEOCON of the species);
  - evidence_tier — controlled {T0 inferred_by_genus (cap ~0.15), T1 literature_on_compound_this_extract_untested (cap ~0.40), T2 this_species_extract_screened (~0.65), T3 pure_compound_this_species_assayed (~0.85), T4 mechanism/clinical_precedent (~1.0)} — the honesty axis = a strength CAP;
  - molecule_axis_signal (the SECOND, separate number: the molecule's world-literature maturity — e.g. {none, preclinical, trial_phase_1..3, approved} from ChEMBL max_phase/ATC; for galantamine = approved, ATC N06DA04) — DISPLAYED SEPARATELY from evidence_tier so the UI always reads "molecule: verified anti-Alzheimer; THIS accession: not yet assayed";
  - best_bioassay_record (FK B, the strongest measured-here evidence promoting this point, nullable);
  - provenance_ref (DOI); chain_link_fact_id (FK — the chain node this potential lights: bioact.pharmacology / chem.bioactivity.* / the app.* domain leaf).

D) NO new mechanism table — mechanism is just a bioassay_record with standard_type capturing the MoA + a chain_evidence row anchored on chem.bioactivity.mechanism; the action_type controlled vocab {INHIBITOR, ANTAGONIST, AGONIST, BLOCKER, MODULATOR, PAM, NAM, OPENER, ACTIVATOR, SUBSTRATE} lives as a field on B when assay_type='B' and a mechanism is named.

REUSED SUBSTRATE (no new columns): chain_link_fact (species_id x link_type_id, fill_state, fill_strength 0-1, evidence_class, sensitivity, confidence) is the per-species lit-state; chain_evidence (asserted_on/by, source_kind, source_ref, value_json jsonb under the evidence_json_is_clean money/PII-blind CHECK, method_id, supersedes_id, retracted) is where each settled assay/potential writes; chain_receipt (pid, doi, crossref jsonb, citation_md, minted_at/by) is the money-blind receipt. value_json carries ONLY {standard_type, relation, value, units, pchembl, target, organism, assay_type, action_type, evidence_tier, activity_class, value_domain, indication?, provenance_ref} — every key is on the clean allowlist.

**Takip:** What changes state over time (the bench's "living gear"):
1) PER-POTENTIAL EVIDENCE TIER — the central tracked state. A potential_record moves T0->T1->T2->T3->T4 as evidence accrues: the fan fires every point to T1 at compound-naming; a crude_screen on THIS species' extract promotes the matching point T1->T2; isolation+pure-compound assay T2->T3; mechanism confirmation T3->T4. Each promotion is one bioassay_record + one receipt. Tiers are CAPS, never asserted — fill_strength is recomputed (shipped recalculate_evidence_strength + weakest-link) only from real rows.
2) PER-COMPOUND FAN STATE — VISIBLE-gap (no compound yet) -> FIRED (compound named, dozens-to-hundreds of T1 points live) -> ENRICHED (individual points promoted). The species page band ticks off 0 as this accrues.
3) ASSAY-RUN STATUS — a bioassay_record is {planned, run, recorded, retracted/superseded}; superseding is first-class (a better assay replaces an "outside_typical_range" one via chain_evidence.supersedes_id, both kept for provenance — mirrors the live "Outside typical range" galantamine record).
4) PROGRAM POSITION on the Venn engine — Watch -> Active (first DOI-backed fact) -> Managed program; and the gear's own arc active (assays running) -> passive (an activity stands characterized) -> reaches value position only when a translation signal + strong band attach. A passive bench is a standing open call another researcher revives.
5) COMMERCIAL-POTENTIAL EXIT LADDER — the shipped commercialized_outcomes ladder self -> peer -> org -> venn_verified; only at venn_verified may the Exchange cite. Tracked per declared potential.
6) MOLECULE-AXIS DRIFT — molecule_axis_signal can change as the world moves (a compound enters a trial); refreshed from ChEMBL on view, never frozen, always shown beside the species-axis tier.

**Kayıt/giriş:** How data is entered/captured — deliberately low-ceremony, "enter the ONE fact you have," generalizing AnalysisPane's import-and-run flow:
1) PRIMARY: a structured ASSAY FORM (the IucnAssessmentEditor pattern — labeled fields + controlled-vocab chip/select pickers, not free prose). The researcher picks compound (from this species' assay_compound rows, or adds one by name+InChIKey/ChEMBL-id), picks target + organism + standard_type + relation + units from controlled selects, types value + pChEMBL (auto-computed where possible), picks assay_type + assay_origin + data_validity, and pastes the DOI. assay_origin defaults the tier ceiling. This is the verb's capture surface.
2) FAN AUTOFILL (the magnet): when a compound is added with a chembl_id/inchikey, the bench JOINS the live ChEMBL/PubMed record (the bio-research MCP, demonstrated this session: get_bioactivity, get_mechanism) and PRE-POPULATES candidate potential_records at T1 with the molecule_axis_signal filled (max_phase/ATC) — each clearly labeled "literature on the molecule; this accession untested." The researcher never types the fan; they confirm/curate it. Nothing autofilled is auto-asserted as a species fact — [EKLE:]-style placeholders gate anything the researcher must confirm, exactly like AnalysisPane's interpretation lines.
3) BATCH IMPORT (the AnalysisPane lever, reused near-verbatim): a CSV/XLSX of assay results (a screening plate, a dose-response set) imported with a content-hash, columns mapped to bioassay_record fields, persisted reproducibly. This is literally the AnalysisPane import->hash->save pattern retargeted from a thesis dataset to an assay sheet.
4) GAP RECORDING is a first-class capture: a "no validated assay / activity reported but not characterized to standard" entry (pancratistatin, lycorine cases) is a valid bioassay_record with assay_origin='literature', data_validity='unvalidated_assay' — the gap is the product.
CAPTURE GUARD: source_ref (DOI/protocol) is REQUIRED on every settled record (no receipt without a citation); material_lineage_ref required when assay_origin='measured_here'.

**Tic→kanıt→receipt:** The verb, end to end, reusing AnalysisPane's mint flow verbatim:
1) TIC = one settled, evidenced state-change in this bench. The trunk tics (chain nodes already in the DB): the FAN-OPENING tic is upstream — sci.metabolite_profiling (Chemistry) names the compound. In THIS bench the tics are the enrichment/characterization moves, each anchored to a shipped chain node: chem.bioactivity.crude_screen (this species' extract vs target, IC50), chem.bioactivity.pure_compound (isolated compound assayed), chem.bioactivity.mechanism (target+action_type confirmed), chem.bioactivity.therapeutic_mapping (indication area), feeding the bioact.pharmacology + app.* domain leaves.
2) A tic COMPLETES iff a bioassay_record (or confirmed potential_record) carries a real source_ref of an allowed evidence_class — a predicate, never a checkbox (the tic-architecture rule). complete_program_tic records it.
3) EVIDENCE: completing the tic writes a chain_evidence row (asserted_by, source_kind, source_ref=DOI, value_json = the money-blind allowlist payload {type,value,units,pchembl,target,organism,assay_type,action_type,evidence_tier,activity_class,value_domain,indication?}). The evidence_json_is_clean CHECK physically rejects any money/PII key — the firewall is the shape of the substrate, not a rule the bench remembers. recalculate_evidence_strength updates the chain_link_fact band; the tier acts as the cap.
4) RECEIPT: the researcher clicks "Receipt mint et" (the exact AnalysisPane button) -> mint mints a chain_receipt (pid + DOI + crossref + citation_md) at /receipt/[pid] via get_chain_receipt, which projects an ALLOWLIST only — money-blind at write, store AND read. The receipt is citable, reproducible, attributable; it can go on a CV/ORCID.
5) EXIT (the Z-specific terminal): at deployment the researcher DECLARES a Commercial Output = a potential_record at its tier (e.g. "documented AChE-inhibition potential, G. elwesii, T3, provenance DOI") — a POTENTIAL, money-blind. It climbs the shipped commercialized_outcomes ladder self->peer->org->venn_verified. Only at venn_verified may the Exchange CITE it, one-directional, read-only. The galantamine drug/supplement/licence/deal NEVER appears in GEOCON. The two-axis honesty is preserved into the receipt: it states the species-axis tier, and separately the molecule's world status — never collapsing "molecule is an approved drug" into "this accession is proven."

**Mevcut yeniden-kullanım vs yeni:** REUSES (the Thesis Workbench pattern, near-verbatim):
- AnalysisPane.jsx import->content-hash->save->reproducible-run->"mint receipt" flow is the spine of the Assay Ledger: file import for batch assay sheets, the persisted-run list ("Geçmiş koşular"), and the green mint card (mint_thesis_run_receipt -> a mint_bioassay_receipt twin) are reused structurally. The [EKLE:] never-auto-assert discipline and the SHA-256 dataset hash carry over directly.
- IucnAssessmentEditor.jsx is the template for the structured ASSAY FORM: controlled-vocab chips/selects (its CATEGORIES + CRITERIA_HINTS pattern becomes standard_type / units / assay_type / activity_class / value_domain pickers), the labeled-section card layout, the draft->peer_review->submitted->published state machine (becomes the assay {planned->run->recorded} + the exit self->peer->org->venn ladder), the author/admin viewer-gating, and the SIS .json export (becomes a per-potential money-blind JSON export). EntityDiscussion peer-review thread reused for assay peer review.
- The shipped chain substrate is reused with ZERO new columns: chain_link_fact / chain_evidence (with its money-blind CHECK) / chain_receipt / get_chain_receipt / recalculate_evidence_strength / commercialized_outcomes ladder. The Z chain vocab already exists (bioact.pharmacology, chem.bioactivity.crude_screen/pure_compound/mechanism/therapeutic_mapping, app.pharmaceutical/nutraceutical/cosmeceutical/agricultural/…, all firewall_class='translational').
- The field notebook (PWA) is the offline capture seed for measured_here rows (quick assay-result jot with photo of a plate/curve, synced later into a bioassay_record).

GENUINELY NEW:
- assay_compound (the species_compound / molecule weld) + bioassay_record + potential_record tables. This is the one new persistence the tic-architecture already named as required.
- THE FAN: the live external join (ChEMBL/PubMed via the bio-research MCP) that pre-populates candidate potentials at T1 with the separate molecule-axis signal. New, and the bench's defining capability. Needs a curation FLOOR (>=1 curated ChEMBL mechanism OR >=2 independent PubMed assays) — a founder call.
- The TWO-AXIS honesty renderer (species-axis tier vs molecule-axis world-status, side by side). New UI discipline, the firewall's semantic face.

**v1 kapsamı:** SIMPLEST USEFUL V1 (resists the v1 complexity death — one bench, one verb, no campaign tooling):
SHIP:
1) assay_compound + one bioassay_record per (compound x target) entered through the structured ASSAY FORM (reskinned IucnAssessmentEditor): pick/add compound by name+ChEMBL-id, pick target+organism+standard_type+relation+units+assay_type+assay_origin+data_validity, type value+pChEMBL, paste DOI. Controlled vocab exactly as in ChEMBL.
2) The verb end-to-end: a settled bioassay_record completes a chem.bioactivity.* tic -> writes a money-blind chain_evidence row -> mints a chain_receipt at /receipt/[pid]. This is the AnalysisPane mint flow retargeted — the ONE thing that must work.
3) THE FAN, read-only minimal: when a compound has a chembl_id, fetch its real bioactivity+mechanism (bio-research MCP) and SHOW the candidate potentials at T1 with the molecule-axis signal, clearly two-axis labeled, NOT yet auto-written as potential_records — the researcher reads the fan; confirming a point into a stored potential_record is one click that requires a tier-appropriate bioassay_record.
4) The STALL state: if no identified compound exists on this species, the bench shows "fed by Chemistry: waiting" — honest, not an error.
5) GAP recording as a first-class entry (assay_origin='literature' / data_validity='unvalidated_assay').

DEFER (v2+):
- BATCH CSV/XLSX import of screening plates (reuse AnalysisPane import later; v1 is single-record entry).
- AUTO-WRITING the full fan as stored potential_records + the curation floor logic (start by only showing it; storing each point needs the confidence-floor founder call).
- pChEMBL auto-computation across non-nM units (v1: accept what the researcher enters; flag if relation!='=').
- Dose-response curve fitting / IC50 estimation inside the bench (v1: enter the published IC50; computing it from raw points is a later AnalysisPane-style "run").
- ADMET/selectivity panels, the Exchange citation hook (only the venn_verified ladder rung matters at the firewall boundary; the Exchange side is out of scope for the bench).
- The hard vs soft VALUE-GEAR FLOOR (does a Z program lock until a Safeguard win exists, or just cap strength near 0?) — a founder call flagged in the docs; v1 takes the cap-toward-0 stance (fan visible, potential strength-capped) which is the tic-architecture's current position and the least coercive.

### FIELD COLLECTION / OBSERVATION BENCH — the work-environment for the X-axis foundation/field_lab trunk tics `sci.specimen
**Kullanan:** A field botanist / conservation collector — the person physically at the locality. Day-to-day they: travel to a site, record where they are (GPS + locality description + habitat), find a target geophyte, count/estimate the population (mature individuals, ramets vs genets — geophytes clone, so this distinction is real), note phenology (leaf/bud/flower/fruit/dormant — critical for bulbs that are visible only weeks per year), collect a voucher specimen with a personal collecting number, photograph it, and flag threats (grazing, harvest pressure, ploughing). On the X/Y axes they are the evidence s

**Veri yapıları / tablolar:** Reuse + extend the shipped `field_observations` (id, species_id|proposed_name, user_id, observer_name, observed_at, lat, lng, accuracy_m, photo_url, notes, status, verified_by, voice_url/transcript). Make it Darwin-Core-shaped and add the three discipline tables:

1) `collection_event` (NEW — the site visit, groups observations; DwC Event/Location): id, program_id?, user_id, event_date (date), site_name (text), locality_text (verbatimLocality), habitat (text), elevation_m (int), country_code (ISO-3166), admin_area (text), centroid_lat/centroid_lng + coordinate_uncertainty_m (DwC coordinateUncertaintyInMeters), datum (default 'WGS84'), geo_privacy (controlled: 'public'|'obscured'|'private' — mirrors iNat + chain_link_fact.sensitivity tiers public/member/sensitive), notes.

2) `field_observations` extended (the DwC Occurrence per species per event): + event_id (FK), record_number (DwC recordNumber — the collector's running number, e.g. "AS-0421"), individual_count (int) + count_method (controlled: 'exact'|'estimate'|'present'|'ramet_estimate'), count_unit (controlled: 'mature_individuals'|'genets'|'ramets'|'flowering_stems'), reproductive_condition (controlled BBCH-lite phenophase: 'vegetative'|'budding'|'flowering'|'fruiting'|'senescing'|'dormant'|'not_recorded' — geophyte-aware), establishment_means (DwC controlled: 'native'|'introduced'|'cultivated'|'uncertain'), identification_qualifier (controlled: 'confident'|'cf'|'aff'|'tentative'), determiner_id + determined_on (who verified the ID).

3) `voucher_specimen` (NEW — the physical proof; herbarium model): id, observation_id (FK), collector_name, collecting_number (text, = record_number), collection_date, institution_code (Index Herbariorum acronym, e.g. 'K','E','ANK' — controlled-ish), accession_number (nullable, filled when accessioned), specimen_type (controlled: 'pressed_sheet'|'spirit'|'bulb_living'|'seed_lot'|'silica_dna'|'photo_only'|'observation_only'), duplicates_count (int), status (controlled: 'collected'|'in_press'|'deposited'|'accessioned'|'cited'), abs_permit_ref (Nagoya/ABS permit — the biopiracy guard; a Z-relevant voucher with no permit is strength-capped).

4) `population_census` (NEW, optional per observation — the IUCN baseline datum): id, observation_id, subpopulation_label (text), location_label (text — IUCN "location" sense), mature_individuals_est (int), area_searched_m2 (int), aoo_grid_cell (text — 2x2km cell id), density_note (text), trend_vs_prior (controlled: 'increasing'|'stable'|'decreasing'|'unknown'|'first_record').

5) `observation_photo` (NEW — many photos per obs, not one URL): id, observation_id, storage_path, caption, role (controlled: 'habit'|'flower'|'habitat'|'bulb'|'voucher_label'|'threat'). Units everywhere explicit (m, m2, count); all controlled vocabularies are short closed enums chosen from DwC / IUCN so records stay legible and importable.

**Takip:** State that changes over time, tracked as status enums (never money):
- OBSERVATION status: 'draft' (offline/queued) -> 'submitted' -> 'id_pending' (proposed_name, awaiting determination) -> 'id_confirmed' (species_id bound, determiner set) -> 'evidence_promoted' (fed a tic) | 'rejected'. This reuses the existing field_observations.status + verified_by.
- VOUCHER lifecycle: collected -> in_press -> deposited -> accessioned -> cited (cited = referenced by a published assessment/paper; the moment it can anchor a strong-band fact). This is the field analogue of the IUCN editor's draft->peer_review->submitted->published ladder.
- POPULATION over time: repeated census rows on the same subpopulation_label across event_dates give a trend series (trend_vs_prior + the count history) — this is the literal IUCN "continuing decline" signal feeding `cons.baseline_assessment`.
- PHENOLOGY across the season: multiple observations of one population through the year track the phenophase calendar (when does this bulb actually flower at this site) — reusable as the AnalysisPane time-series.
- PROGRAM-level rollup: per position (species x X), how many events / vouchers / confirmed IDs / census points exist = the program's field-evidence depth, surfaced on get_program_stage_status as Field&Lab readiness.

**Kayıt/giriş:** Two capture modes, one data model:
1) IN-FIELD (mobile PWA, the shipped FieldRoute pattern, extended): one-tap GPS (navigator.geolocation, already built), live species search OR free-text proposed_name (built), Pl@ntNet ID assist (built), camera multi-photo via <input capture="environment"> (extend the existing stub to the new observation_photo table + Supabase Storage), voice memo -> overnight transcript (built). NEW field-mode inputs: a numeric stepper for individual_count + unit picker, a phenophase chip row (single tap), a voucher toggle ("I collected a specimen") that auto-fills record_number from the collector's running counter. Offline-first preserved: the existing localStorage queue (gx_field_obs_queue) extends to queue the whole event+observation+voucher payload and flush on reconnect — this is non-negotiable because fieldwork happens with no signal.
2) AT-DESK (review/enrich, reuses Thesis Workbench layout): a richer form to attach the institution/accession, write the locality+habitat prose, confirm IDs, enter census numbers, and set geo_privacy. 
3) IMPORT: a CSV/Darwin Core Archive importer (deferrable) so a researcher's existing collection book maps straight in (recordedBy->observer, recordNumber->record_number, etc.) — and an export the same way, so GEOCON is not a roach motel for their data.
Capture writes through RPCs (submit_field_observation exists; add submit_collection_event, attach_voucher, record_census) — anon key + RLS, geo_privacy enforced at read.

**Tic→kanıt→receipt:** The verb runs exactly as the locked model: a field record becomes a tic only when it carries real provenance, and money can never enter. Path:
1) A confirmed observation + its voucher is the EVIDENCE for a trunk tic. `sci.specimen_documented` (voucher) completes when a `voucher_specimen` row exists with a collecting_number + institution (a real physical specimen, not a claim). `cons.baseline_assessment` completes when >=1 `population_census` row with mature_individuals_est + method exists. `sci.taxonomy_verified` is GATED on id_confirmed (a misidentified pin is a fabricated fact — the root rule).
2) complete_program_tic records a `chain_evidence` row: source_kind='voucher'|'field_observation'|'census', source_ref = the voucher citation (Institution + accession/collecting number) or the observation id — the field equivalent of a DOI. The `evidence_json_is_clean` CHECK guarantees value_json holds only {individual_count, phenophase, aoo_cell, ...} and rejects any money/PII key, so the firewall holds at write.
3) That lights the `chain_link_fact` for the species (e.g. occurrence/baseline nodes), raising fill_strength via the shipped weakest-link math. A voucher with abs_permit_ref present strengthens; missing ABS on a Z-relevant record caps strength near 0 (the biopiracy guard).
4) The public Provenance Receipt (get_chain_receipt -> /receipt/[pid]) projects the allowlist: species, fact, collector credit, institution, date, coordinates AT THE PUBLIC PRIVACY TIER (obscured for sensitive taxa) — money-blind, PII-gated. The receipt is the credited, money-blind proof that one more cell of the atlas moved from 0. Firewall: a field bench produces only conservation_only facts (occurrence, baseline, threat) — it has no translational terminal and literally no money column to attach to.

**Mevcut yeniden-kullanım vs yeni:** REUSES (do not rebuild):
- The PWA Field Notebook (FieldRoute.jsx) end-to-end: GPS capture, offline localStorage queue + flush, live species search, proposed_name fallback, Pl@ntNet ID, voice memo + overnight transcript, "recent records" list. This is the in-field capture core.
- ObserveRoute.jsx live feed + real-time postgres_changes subscription + photo grid — the community read surface, unchanged.
- The Thesis Workbench triad pattern: AnalysisPane.jsx (stats) becomes the population/phenology time-series view; ReferenceLibrary.jsx becomes the voucher/specimen catalog; WritingDesk.jsx becomes the locality+habitat prose editor. Same layout, new content.
- The IUCN editor's state-machine + chip-checklist + narrative-section UI (IucnAssessmentEditor.jsx) is the direct sibling: the voucher lifecycle ladder and the establishment/phenophase chips reuse its STATUS_META + criteria-chip components verbatim.
- The shipped field_observations table, submit_field_observation RPC, sensitivity tiering (chain_link_fact.sensitivity public/member/sensitive), and the chain_evidence/tic substrate.
GENUINELY NEW (thin, additive — honors the minimal-persistence rule):
- 4 small tables: collection_event, voucher_specimen, population_census, observation_photo (+ ~6 columns on field_observations).
- The numeric count-stepper + phenophase-chip + voucher-toggle field inputs.
- geo_privacy obscuring at read (coordinate fuzzing for sensitive taxa) — a read-time RPC concern.
- 3 write RPCs + 1 read RPC; optional DwC CSV import/export. No new engine, no new chain vocabulary.

**v1 kapsamı:** V1 (the simplest thing that mints a real receipt — resist the complexity that killed the last arc): keep the shipped mobile Field Notebook AS THE CAPTURE SURFACE and add exactly three structured fields to it — individual_count (+ unit), phenophase chip, and a "voucher: collecting number + institution" line. Add ONE new table, `voucher_specimen`, plus a `record_number` column on field_observations. Wire ONE tic: `sci.specimen_documented` completes when a confirmed observation has a voucher row -> chain_evidence (source_kind='voucher', source_ref=Institution+number) -> chain_link_fact occurrence node -> /receipt. That is the whole verb: a botanist drops a pin, names the bulb, counts it, records the specimen they pressed, and gets a credited money-blind receipt — one atlas cell off 0. Keep the existing offline queue and geo_privacy=obscured default for any CR/EN species. 
DEFER (named so they are not forgotten, not built in v1): collection_event grouping (v1 lets each observation stand alone; group later), population_census trend series + AOO 2x2km grid math (needs the IUCN-assessment integration; baseline_assessment tic can wait for v2), multi-photo observation_photo (v1 keeps the single photo_url), the desk-mode rich editor, the Darwin Core CSV import/export, determiner workflow for community-submitted IDs, and the AnalysisPane phenology time-series. The v1 test is binary and matches the North-Star: did a real field researcher mint one voucher-backed, credited, money-blind receipt from 0? Everything else is enrichment layered on after that proves out.

### THE THESIS / ANALYSIS / WRITING BENCH — the in-system graduate research environment. A researcher does their whole thesi
**Kullanan:** PRIMARY: a graduate researcher (undergrad / MSc / PhD / postdoc — the level enum already exists on thesis_tracks.level) doing an empirical geophyte thesis. They own the thesis (thesis_tracks.student_user_id) and are the only one who can mint a receipt from their analysis (enforced in mint_thesis_run_receipt: auth.uid() must equal student_user_id).

SECONDARY: the SUPERVISOR (thesis_tracks.supervisor_user_id) — second role already modelled in list_my_theses with a role chip and a two-column student/supervisor view. Today the supervisor can see and co-edit but has no formal sign-off act. v-next 

**Veri yapıları / tablolar:** SHIPPED (verified column-level — reuse as-is):
- thesis_tracks: id uuid PK, student_user_id uuid, supervisor_user_id uuid, title text, institution text, level text {undergrad|msc|phd|postdoc}, started_at date, target_defense_date date, status text {proposal|data_collection|analysis|writing|submitted|defended}, species_set text[] (GEOCON species ids — the link to the atlas), notes_md text, program_id uuid (link to a program — already present, currently under-used), created_at.
- thesis_dataset: id, thesis_id FK, name text (filename), columns_json jsonb (column names), row_count int, content_hash text (sha256 of rows — the REPRODUCIBILITY anchor), rows_json jsonb (raw rows persisted when <=20000), created_by, created_at.
- thesis_analysis_run: id, thesis_id, dataset_id FK, method text {descriptives|ttest|anova|correlation|regression}, input_columns_json jsonb, parameters_json jsonb, results_json jsonb (full stat output incl chart data), software_versions_json jsonb (e.g. simple-statistics 7, jstat 1.9 — pinned for reproducibility), dataset_hash text, created_by, created_at.
- thesis_reference: id, thesis_id, csl_json jsonb (CSL-JSON), doi text, receipt_pid text (when the source IS a GEOCON receipt), source_kind text {doi|receipt|manual}, cite_key text (e.g. ozhatay-2019), created_by, created_at.
- thesis_section: id, thesis_id, section_key text (e.g. introduction/methods), title text, body_md text, ord int, updated_by, updated_at — chaptered manuscript.
- thesis_milestones: id, thesis_id, label text, due_date date, completed_at timestamptz, kind text, notes_md text — proposal-deposit-defense timeline.
- thesis_run_receipt: id, pid text (GEOCON-T + 7 hex of run id), analysis_run_id, thesis_id, projection_json jsonb (money/PII-scrubbed public face), citation_md text, is_public bool, minted_at, minted_by.

CONTROLLED VOCAB / UNITS: level + status enums above; method enum above; reference source_kind {doi|receipt|manual}; citation styles {apa|vancouver}; export {bibtex|csl-json|markdown|latex}. Stat outputs carry their conventional units/precision (p to 4dp, effect sizes to 3dp, df to 1dp — already coded). Dataset columns are researcher-free-text but are SCRUBBED at mint via _receipt_safe_label so a column named e.g. a price never reaches the public receipt.

NEW (v-next, small): (1) thesis_analysis_run gains nullable program_tic_id + chain_receipt_pid so a run can attach to a program tic and route through the canonical chain substrate (closes the parallel-receipt-island gap). (2) thesis_run_receipt gains supervisor_approved_by uuid + supervisor_approved_at (the advisor sign-off gate). (3) optional thesis_figure table (id, thesis_id, run_id nullable, caption_md, figure_number int, png_blob/url) so exported figures get stable Figure-N numbering for the manuscript — deferred past v1.

**Takip:** WHAT CHANGES OVER TIME (state machines already partly shipped):
1. Thesis lifecycle — thesis_tracks.status advances proposal -> data_collection -> analysis -> writing -> submitted -> defended (STATUS_ORDER in ThesisRoute drives a stage progress bar). This is the spine the researcher watches across years.
2. Milestone progress — thesis_milestones.completed_at fills in over time; milestone_done/milestone_total drives the card progress bar + next_due_at. Tracks the calendar (proposal deposit, committee meeting, submission, defense).
3. Analysis-run history — thesis_analysis_run is append-only; every run is timestamped + dataset-hashed, so the chain of attempts (which test on which dataset version) is itself the audit trail. ReferenceLibrary/AnalysisPane already render Gecmis kosular (recent runs) with the hash.
4. Manuscript progress — per-chapter persisted/empty dot in WritingDesk shows which sections exist; word/citation counts could surface chapter maturity (deferred).
5. Receipt state — a run is unminted -> minted (one receipt per run, idempotent: mint returns the existing pid if already minted). v-next adds: minted -> supervisor_approved -> tic_attached -> public.
6. NEW supervisor review state on a result (draft finding -> submitted-to-supervisor -> approved/changes-requested) mirroring the IUCN editor's draft->peer_review pattern.

WHAT IS DELIBERATELY NOT TRACKED here: money, market interest, commercial pipeline. Those live in bridge.species_market and may only cite a conservation receipt, never the reverse.

**Kayıt/giriş:** HOW DATA ENTERS (all shipped except where noted):
- DATASET IMPORT: file picker accepts .csv/.xlsx/.xls; parsed client-side with SheetJS (XLSX.read -> sheet_to_json); first sheet, header row -> columns_json; rows hashed (sha256, first 32 hex) for reproducibility; persisted via save_thesis_dataset (rows stored when <=20000 to keep payloads sane). No instrument integration in v1 — the import is the capture surface; an instrument/ELN file just becomes the CSV.
- ANALYSIS: pick method + column(s) from dropdowns (numeric columns auto-detected: >=60% finite), press Analiz et; result computed in-browser, persisted via save_thesis_analysis_run with method+params+results+software_versions+dataset_hash. Interpretation text is auto-drafted but every biological claim is an [EKLE:] placeholder the researcher must fill — NEVER auto-asserted as fact (the data-integrity rule).
- REFERENCES: three capture modes — (a) paste a DOI -> server resolves CSL-JSON via /api/geocon/resolve-doi (Crossref); (b) manual form (authors/year/title/journal); (c) paste a GEOCON receipt PID -> get_chain_receipt -> store the underlying paper metadata tagged with the receipt id. cite_key auto-generated (family-year).
- WRITING: chaptered markdown textareas, debounced autosave (~1.4s) via save_thesis_section; inline [@cite-key] tokens; [EKLE:] for anything unconfirmed.
- EXPORT (capture going OUT): references -> BibTeX / CSL-JSON; manuscript -> Markdown / LaTeX (\\cite{} from [@key]); a published run -> its receipt page. These keep the work portable and prevent lock-in fear.
- NEW (v-next): a PubMed/Crossref SEARCH-to-add inside ReferenceLibrary (the bio-research PubMed tool pattern) so a researcher finds + adds a reference without leaving the bench; and a one-click attach a minted receipt-as-reference into the writing surface.

**Tic→kanıt→receipt:** THE VERB (this is the bench's reason to exist, and it is the ONE environment where the verb is already live end-to-end):
1. A researcher imports a dataset (hashed) and runs a test -> a thesis_analysis_run row (the unit of verifiable work).
2. They press Receipt mint et -> mint_thesis_run_receipt(run_id): asserts auth.uid()==student; scrubs every column label through _receipt_safe_label (money/PII screen); builds a money-blind projection_json {method, finding, statistics, scrubbed columns, species accepted_name, institution, thesis_title, dataset_hash, reproducible:true, as_of} + a citation_md; inserts thesis_run_receipt with pid GEOCON-T+7hex. The finding lands at /receipt/[pid] — citable, money-blind, reproducible, ORCID/CV-attachable. This MOVES a species from 0 evidenced facts (the North-Star metric).
3. The receipt can then be cited BACK into the researcher's own (or anyone's) reference library as source_kind=receipt — a money-blind citable source no external manager can resolve. This is the value loop: evidence compounds.

THREE GAPS v-next closes so a thesis result is a first-class program/portfolio event:
- TIC: the run currently mints to the PARALLEL thesis_run_receipt table and does NOT create a program_tic nor write chain_evidence/chain_receipt. v-next: if the thesis has a program_id, minting also (a) writes the same money-blind projection into chain_evidence (which carries the evidence_json_is_clean money/PII CHECK — a second firewall), (b) completes/creates a program_tic via complete_program_tic so it advances the program's Y-axis (knowledge) region, and (c) issues a canonical chain_receipt. The thesis pid stays as a convenience alias.
- SIGN-OFF: insert a supervisor_approved gate before public listing — the discipline's real bar (a finding is not citable until the advisor signs), mirroring IUCN draft->peer_review.
- POSITION: per the locked portfolio model, the species_set entry becomes/links a position; the receipt is opening evidence that auto-promotes a Watch position to Active (band lifts off 0).
Firewall stance throughout: conservation work is money-blind at write (no money columns), store (_receipt_safe_label + evidence_json_is_clean), and read (allowlist projection). Value is potential, surfaced only on the Z-axis via the separate bridge, never inside this bench.

**Mevcut yeniden-kullanım vs yeni:** REUSES (this bench IS the shipped pattern — ~80% done):
- AnalysisPane.jsx, ReferenceLibrary.jsx, WritingDesk.jsx, ThesisRoute.jsx — all live, all keep working.
- The whole thesis_* table family + RPCs (save_thesis_dataset, save_thesis_analysis_run, list_thesis_analysis_runs, save/list/delete_thesis_reference, save/list_thesis_section, mint_thesis_run_receipt, list_my_theses, start_thesis_track).
- The receipt machinery (_receipt_safe_label scrub, /receipt/[pid], get_chain_receipt).
- This trio is precisely what the OTHER six environments generalize: (import -> typed records -> persisted reproducible run -> mint a money-blind receipt) is the universal bench shape. The IucnAssessmentEditor.jsx contributes the draft->peer_review->submitted->published state machine + admin override + criteria checklist pattern (reuse for the supervisor sign-off). The PWA field notebook contributes the offline-capture pattern (not needed here — thesis work is desk-bound).

GENUINELY NEW (small, deferrable, do NOT rebuild what exists):
1. Program-tic + chain-substrate bridge at mint (the principal new wiring; the only critical/firewall-touching piece — run /crosscheck on it).
2. Supervisor sign-off gate on a result before public mint.
3. PubMed/Crossref in-bench search-to-add for references.
4. A few stats gaps the discipline expects: a normality/assumption check (Shapiro/Levene) + a non-parametric fallback (Mann-Whitney/Kruskal-Wallis) + ANOVA post-hoc (Tukey HSD — already flagged as [EKLE:] sonraki surum in the code). These make the analysis defensible, not just runnable.
5. Stable Figure-N numbering / figure export for the manuscript.

**v1 kapsamı:** V1 (smallest useful increment — the bench already exists, so v1 is CONNECT + GATE, not build):
1. WIRE THE VERB INTO THE PROGRAM/PORTFOLIO SPINE — when a thesis has a program_id, minting a run also writes chain_evidence (money/PII CHECK enforced), completes a program_tic on the Y/knowledge region, and issues a canonical chain_receipt; the species_set entry promotes the matching Watch position to Active. This is the single highest-value change: it makes the already-shipped thesis verb count toward the program engine and the North-Star metric instead of sitting in a parallel island. It is firewall-critical -> mandatory /crosscheck (codex review) before ship.
2. SUPERVISOR SIGN-OFF GATE — a result must be advisor-approved before it can mint publicly (reuse the IUCN draft->peer_review state machine; two columns and one RPC).
3. ONE DEFENSIBILITY STAT — add an assumptions check (Shapiro-Wilk normality + Levene) with an automatic non-parametric suggestion, so a minted t-test/ANOVA receipt is not challengeable on its face. Keep it as a surfaced warning, not a wall.

DEFER (explicitly out of v1): Tukey HSD post-hoc; mixed models / repeated-measures; PubMed in-bench search; figure-numbering + figure table; collaborative real-time co-writing; AI draft-assist beyond the existing [EKLE:] convention (any AI text stays placeholder, never auto-fact); instrument/ELN ingestion (the CSV import is sufficient — instruments belong to the propagation/extraction benches, not the thesis bench). Rationale for the cuts: the v1 personalization arc died of complexity; this bench is already the most complete of the seven, so v1 must resist re-building it and instead spend its budget on the three connections that turn a finished private workbench into a public, program-attached, money-blind evidence engine.
