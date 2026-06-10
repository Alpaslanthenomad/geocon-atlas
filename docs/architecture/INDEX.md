# Docs index — the knowledge backbone

A map of every design doc so an AI (or a human) builds context fast and reads the
right thing first. `CLAUDE.md` at the repo root is the < 200-line orientation;
this is the deeper map. `[live]` = describes shipped code; `[design]` = a plan;
`[dormant]` = built then parked; `[reverted]` = rolled back, kept for reference.

## Start here (vision & strategy)
- **GRAND-MAP.md** `[map · READ FIRST]` — the whole picture (10-agent workflow,
  honest audit + 6 expert lenses): VENN mission ("the incorruptible record of life
  worth saving"), BEE = Biodiversity Execution Engine, started -> now -> should-be,
  per-vertical honest grades, the route, what to kill, the one metric. The "now" is
  the cathedral trap named: immaculate substrate, ~0 lived use. Should-be: a
  single-player tool that mints multiplayer-grade receipts; the homepage is the gap.
- **NORTH-STAR.md** `[design]` — the foundational question: if GEOCON were yours
  and meant for global scale, how would you define / build / market it.
- **NORTH-STAR-ANALYSIS.md** `[design]` — the deep answer. GEOCON = "the atlas of
  what we don't yet know about saving threatened plants; the gap is the product."
  The one metric: an evidenced fact in the atlas (move `chain_evidence` from 0).
  The wedge: Anatolia's threatened bulbs. Critique + kill-list + 90-day plan.
- **01-vision-and-iucn.md** `[live]` — mission + the IUCN/commerce firewall.
- **02-layers.md** `[live]` — the conceptual layers of the system.

## The program engine (the backbone)
- **VENN-ENGINE-CONTRACT.md** `[live]` — THE spec for the program engine. Three
  axes (Safeguard/Knowledge/Value), 7 regions, Integrated Core = maturity not gate,
  6 stages, gate = stage-transition, evidence_strength 0–1, the RPC contracts,
  Compass v1. Build program work to this.
- **03-programs.md** `[live]` — the program model (tics, gates, evidence, members).
- **04-open-briefs.md** `[design/partial]` — advertising a need; respond-flow unbuilt.
- **05-member-agreements.md** `[live]` — revenue/IP split records, member-gated.
- **WORKSPACE-ROADMAP.md** `[live + todo]` — visibility / join-door / member work
  loop / Workspace (all shipped this session) + the open follow-ups.

## The chain (value-chain knowledge model)
- **THE-CHAIN.md** `[dormant]` — the proposed working architecture / spine.
- **THE-CHAIN-LINK-MODEL.md** `[dormant]` — the branched, extensible 279-link model.
- **THE-CHAIN-VALUE-MAP.md** `[dormant]` — the 279-node map, explained + grown.
  NOTE: the registry is seeded in the DB (`chain_link_type`, 363 rows) but the
  6-stage spine *vocabulary* was rejected — re-express as inclusive verticals.

## Personalization & workspace (history)
- **PERSONALIZATION-ARCHITECTURE.md** `[reverted]` — the 3-axis persona / station
  plan. Built then rolled back ("shallow"). Branch `backup/personalization-bench-arc`.
- **THE-BENCH.md** `[reverted]` — the species-claim / chain-heal "bench". Rolled
  back. The lighter project-centric Workspace replaced its intent.
- **09-onboarding-personalization.md** `[live]` — onboarding + intent storage.

## Grand strategy / verticals
- **VERTICAL-ETHNOFLORA-STANDUP.md** `[strategy+SHIPPED]` — vertical 3 (ETHNOFLORA,
  endemic medicinal plants) stood up: 361 real medicinal species seeded (Wikidata
  P1672->medication + GBIF, provenance-labelled), Firewall-B (ABS/Nagoya consent,
  fail-closed) on `bridge.abs_consent` + hardened `ethnobotanical_use_fact` + the
  `_ethno_consent_gate` commerce door, real `/ethnoflora` landing. Codex-clean. The
  Part-A-allowlist standing rule for the future ABS receipt block lives here.
- **THESIS-WORKBENCH-RETENTION.md** `[strategy+building]` — make GEOCON the place
  researchers do their thesis work and stay: a thesis workbench (the in-system
  statistical-analysis tool shipped first, then references/figures/writing) +
  the retention strategy. The one lock-in = the money-blind citable Receipt;
  work-becomes-a-receipt is the inimitable edge.
- **VENN-GRAND-UPGRADE.md** `[strategy]` — deepest-thinking synthesis (10-agent
  workflow): the execution-engine north star, the one inimitable idea (the
  money-blind, consent-clear, citable GAP + its Provenance Receipt), upper-version
  plans for both verticals, universality plan, and the hardest critiques. Execute
  in STRICT sequence: close one real loop before building more.
- **VERTICAL-ETHNOFLORA.md** `[design+rail]` — Vertical 3: endemic medicinal-plant
  conservation, GEOCON-parallel, firewall-separated (a second ABS/Nagoya firewall),
  on the shared rails. Rail registered (verticals.id='medicinal_plants',
  is_public=false); /ethnoflora honest forming face. Not public until one real loop.

## Value chain / commerce (Bahçe)
- **VENN-EXCHANGE-FLOOR.md** `[design+built v1]` — the living borsa floor: a
  money-free ticker tape (shell spine, all layers) + a dynamic sector heatmap
  Overview (verticals × stages/kinds, real fund density) + a count-up board with a
  real UTC clock. All from get_exchange_tape() (counts only, no prices). The borsa
  feel without one fabricated figure.
- **VENN-EXCHANGE-CAMBIUM.md** `[design+built v1]` — the venture-lifecycle layer:
  each venture as a living stem cross-section (dendrochronology). Pith = frozen
  evidence; one growth ring per funding round; breathing cambium = live stage;
  rays = investors; bark = off-ramp. Firewall visible in the geometry. v1 render
  + /exchange/lifecycle shipped; DB event-spine pending a real venture.
- **VENN-EXCHANGE-COLDSTART-PLAYBOOK.md** `[action]` — the manual first move:
  declare the first real commercialized outcome → verify → door → one warm intro.
  Seed-fund sheet + intro/one-pager templates. (commercialized_outcomes is empty;
  the real bottleneck is declaring one evidenced value output, not VC access.)
- **VENN-EXCHANGE-VC-STRATEGY.md** `[design]` — how to open Venn Exchange to VCs:
  transmit (warm intro + tokenized no-login deal room + digest), not onboard; a
  GDPR-safe curated VC directory data-pull; firewall + compliance critic; phased
  P4 plan gated behind one real verified opportunity.
- **THE-EXCHANGE.md** `[design]` — the cross-vertical Ventures vertical: move
  commerce OUT of GEOCON to a BEE-level investor + industry meeting point.
  Firewall-critic verdict + the pre-existing money-in-conservation finding.
- **06-commercialization-recognition.md** `[live]` — outcomes ↔ recognition.
- **07-accredited-labs.md** `[live]` — accredited-lab model.
- **08-impact-factor.md** `[live]` — the impact-factor scoring.

## Operations & reference
- **QUICKREF.md** / **README.md** `[live]` — architecture quick reference.
- **10-decision-log.md** `[live]` — running record of decisions (append here).
- `../DATA-INTEGRITY.md` — the provenance / no-fabrication rules.
- `../DEPLOY.md`, `../ENV.md`, `../CRON-MIGRATION.md` — ops.
- `../IUCN-APPLICATION.md`, `../iucn-api-reapplication.md` — IUCN access.
- `../CODE-AUDIT.md`, root `AUDIT-2026-06-02.md` — audits.
- root `STAGE-GATES.md` — the S0–S5 company growth stages (conditional roadmap).

## Memory (persists across sessions)
Claude Code auto-memory lives outside the repo (the project's `memory/MEMORY.md`).
Key notes: `north_star_and_revert`, `next_version_vision`, `geocon_perf_antipatterns`,
`iucn_coverage_gap`, `species_photo_source_audit`, `globe_spatial_accuracy_roadmap`.
