# GEOCON personalization architecture — persona, personal-page-as-workspace, sidebar, BEE, chain->Programs

> Plan / design (not built). Synthesised 2026-06-07 from a 12-agent deep brainstorm
> (4 codebase scouts + 7 idea threads + synthesis), grounded in the live code.
> Status: for the founder to evaluate; we build on approval.

# GEOCON Atlas — Persona & Personal-Page Architecture (Lead Architect Synthesis)

## The one decision that resolves everything: THREE axes, never conflated

The whole plan hangs on separating what the codebase already keeps separate but the brief blurs together. Every downstream choice falls out of this.

- **STATION** (new, self-declared identity: undergrad / PhD / professor / conservation-rep / R&D-rep…) → **re-skins** surfaces. Never grants, never hides data.
- **ROLE** (`profile.role`, existing, verified: observer→admin) → **gates** access. Untouched. Only this + verified `org_memberships` unlock IUCN tools or `/geocon/ventures`.
- **INTENT** (`explore`/`run`/`field`, existing `get_my_persona`) → **lenses** ordering. Each station maps down to one intent so `Shell.jsx`/`IntentRouter.jsx` plumbing never breaks.

Hard invariant, lint-enforced: **station never appears in an auth gate.** Codified in a new `lib/persona.js` exporting `{ station, role, intent }`. This single rule defuses the firewall-breach risk (a self-declared "R&D rep" cannot fish IUCN data) and the filter-bubble risk (station reorders, never filters the corpus).

---

## 1. Persona taxonomy (final set)

5 super-classes, 9 shippable stations (+3 documented-but-deferred). Each maps to an intent and a firewall side.

| # | Station | Super-class | Intent | Firewall side | What declaring it GAINS |
|---|---|---|---|---|---|
| A1 | Undergraduate | LEARNERS | explore→field | Conservation (read) | One-lane home; "fill your first node" on common (non-CR) species; mentor-pairing |
| A2 | Master's | LEARNERS | run | Conservation | Thesis spine widget; gap-engine pointed at their taxon; join program as `science` |
| A3 | PhD | LEARNERS→SCI | run | Both | Contribution dashboard; pathway-unlock TICs; grants surface; recruitable specialist |
| B1 | Research assistant | SCIENTISTS | field | Conservation+Knowledge | Assigned-TIC queue + specimen inbox as home; portable evidence credit |
| B2 | Professor / PI | SCIENTISTS | run | Both | Portfolio of owned programs + lab page + Member Agreement; mentorship queue |
| C1 | Public conservation rep | CONS. INSTITUTIONS | run | **Conservation only** | IUCN Hub as front door; jurisdiction ledger; firewall shown as assurance |
| C2 | Private conservation (botanic garden/NGO) | CONS. INSTITUTIONS | run | Conservation | Germplasm/accession panel on the ex-situ↔propagation hinge |
| D1 | Private-sector R&D rep | INDUSTRY | run | **Value (read-only)** | Maturity-filtered de-risking watchlist; brief authoring; recognition registry |
| D2 | Production / manufacturing rep | INDUSTRY | run | **Value (read-only)** | "Find cultivable supply" scout; production-brief inbox |
| — | Taxonomist (B3), ABS/Policy auditor (C3), Investor login (D3) | — | — | — | **Documented, deferred** — ship as role flags / CRM-only, no bespoke home yet |

Cold-start rule baked in: every station home **degrades to the global atlas** (newest chain claim, biggest open weakest-link gap), never to an empty social feed.

---

## 2. Personalization architecture — resolving "two navigations"

**The disjoint-concepts test, applied ruthlessly:** *"Does this exist when I'm logged out?"* Yes → sidebar (the commons). No → personal page (your relationship to the commons). This is the rule that stops the personal page from metastasizing into a second sidebar.

### The universal public sidebar (exact minimal nav)
Replace `NAV_PERSONAL` + the 4 `NAV_WORLDS` in `Shell.jsx` with **5 flat reading rows + 1 workspace door**. Identical for everyone, signed-in or out. Delete `NavWorld`, `worldForPath`, `openWorlds` accordion state.

```
Atlas       /geocon/species     ← the 47k-species product
Explore     /geocon/explore     ← globe + map
The Chain   /geocon/chain       ← the 279-node model
Ask         /geocon/ask
Library     /geocon/library     ← NEW shelf page: Publications/Researchers/Orgs/Specimens/Metabolites/What's-new
─────
[ Your workspace ]  ← the ONE door, only when signed in
```
Home = the logo (already links `/geocon`); drop the "Home" row. `Watching`/`Drafts` leave the sidebar entirely → they're "mine," so they live on the personal page. The 6 Library reference routes collapse into one `/geocon/library` shelf-card page. **No routes deleted** — every `/geocon/*` path survives on deep-link; only the *reach* changes.

### The personal page = the workspace hub (`/geocon/profile` → "Your workspace")
The 14 ex-"Work"/"Field" tools re-home here, **filtered to you**, behind one door. `IntentRouter` moves OFF the public home INTO this page (home `/geocon` becomes calm editorial — Atlas grid + trust strip, no PM console greeting strangers). Structure:

```
YOUR WORKSPACE   [station chip ▾]   [Settings ⚙]
─ Your next action ─  (cold-start-proof: intent + biggest open chain gap)
─ Continue ─  Drafts(n) · My programs(n, +3-ring glyph) · Inbox(n)
─ Your tools ─  station-filtered launcher grid (rest behind "All tools")
  [Watching] [Contributions→Moves] [Affiliations]
  [Settings: ORCID · Notifications · Saved searches · Webhooks · API keys]  ← demoted to accordion
```
`ProfileRoute.jsx`'s 10-section scroll collapses: identity/ORCID/orgs stay; the 4 plumbing panels (`SavedSearchesPanel`, `WebhookChannelsPanel`, `ApiKeysPanel`, notif prefs) fold under Settings; `MyContributions`→Moves tab; `SpecimenRequestInbox`→Continue lane. The **station chip** is the editable control surface (expands the 3 intents to the 9 stations); changing it re-weights the launcher and reorders lanes — **reorders, never hides** (the `IntentRouter` invariant, preserved).

**Mobile:** remap bottom nav to mirror desktop — `Home · Atlas · Explore · Library · Workspace`.

---

## 3. Per-persona experience (compact)

| Station | Home (`IntentRouter`/`MyMissionFeed`) foregrounds | Personal page foregrounds | Steered to (chain branch) |
|---|---|---|---|
| Undergrad | One lane: "fill your first node" on common species | Mentor-pairing; node tally | 4 Propagation (single nodes) |
| Master's | Thesis lane; propagation/compound briefs on joinable programs | Thesis spine (layer of nodes + gate status) | 4+5, one species/layer |
| PhD | "Own a pathway"; grants surface | Pathway-readiness panel; ORCID/alerts | 5+6 deep nodes |
| Research asst | Field lane; capability briefs | Specimen Request Inbox promoted; batch tally | 1+2, many species |
| Professor/PI | "Orchestrate"; students who matched missions | Portfolio dashboard; mentorship queue; Member Agreements | whole layers; branch-3 gate |
| Public cons. rep | IUCN Hub as front door; red-list gaps | Jurisdiction ledger; **firewall-assurance panel** | 3+2 |
| Private cons. | "Bank it & propagate it" | Living-collection/germplasm panel | 3 ex-situ + 4 propagation |
| R&D rep (D1) | "Read what's de-risked"; 3-ring maturity cards | De-risking watchlist; recognition registry | 5+7 (read of maturity) |
| Production rep (D2) | "Find cultivable supply" | Supply-readiness; production-brief inbox | 4 agronomy + 7 supply chain |

**The highest-leverage surface is NOT the home — it's the species/chain page.** A thin **persona band** injected into commons pages ("open Moves you could fill here," persona-framed) is where work attaches to a `(species, link)` coordinate. Build the band as a reusable primitive, not a separate destination.

---

## 4. BEE / Ventures (Bahçe) redesign

**Naming first:** "BEE" is overloaded — auth label in `ProfileRoute.jsx:301` ("Sign in via BEE") vs. commerce surface. Call the commercial surface **Bahçe / The Garden** in all user-visible strings; retire "BEE" there.

**Three concentric access rings — the firewall becomes the access model:**
| Ring | Who | Sees | Firewall |
|---|---|---|---|
| 1 Recognition (public read) | everyone | `CommercializedOutcomes` citation registry | citation only |
| 2 Operator desk (org-scoped) | D1/D2/C-reps | their org's declared outcomes + Member-Agreement text | no price RPCs called here |
| 3 Deal desk (admin) | Venn only | today's `VenturesRoute.jsx` (`list_bridge_opportunities` + Investor CRM) | money lives ONLY here |

Money concepts (`ticket_min`, investor thesis via `list_bridge_investors`) are structurally absent from Rings 1–2 because those RPCs aren't called there. Concrete moves:
1. **Ship the missing `/geocon/ventures/[id]` detail route** — `open_bridge_opportunity` + cards link to it but no component exists (live dangling link). Add a **6-segment chain-readiness strip** via new `get_opportunity_chain_readiness(p_outcome_id)` (reads `chain_claim.fill_strength`, zero writes back).
2. **3 tabs:** Pipeline (kanban by stage) · Investors (admin-only) · Recognition feed (the door, discoverable from inside).
3. **Reach via the personal page, never the public sidebar.** Remove `VENTURES_NAV` from the shell; render a persona-conditional "Translation desk" card on `ProfileRoute` for D1/D2 (Ring 2) and "Deal desk" for admin (Ring 3). Door stays `role==="admin"` + `venn_verified`-only (`CommercializedOutcomes.jsx:130`).

---

## 5. The 279-node chain → Programs

**Thesis: a TIC is not a generic checkbox — it is a `(species_id, link_type_id)` coordinate the program commits to advance.** The 12 hard-coded TICs (`cons.threat_analysis`, `sci.metabolite_profiling`…) are already path-shaped strings; formalize them as the first rows of an `ltree` `link_type` registry. The seam exists: `programRpc.declarePathway` already accepts `customRequiredTics`.

- **Chain footprint (new tab-0 in `ProgramDetailPanel.jsx`):** a program claims a rectangle in the 47k×279 grid = `program_species[]` × committed `link_type_id`s. `program_tics` widens to `program_chain_claim(program_id, species_id, link_type_id, …)` (default species = primary → single-species UI unchanged). Rendered as a species×spine matrix colored by global `link_fact` fill-state — the founder's "broken chain" drawing, scoped.
- **Rings re-derived, SVG unchanged** (`ProgramHealthCardCompact` in `HeroPanel.jsx` untouched; only `get_program_health_assessment` body changes): **Safeguard = conservation-rail weakest-link** (a missing `cons.material_secured` gates the ring red — no more 80%-green-while-wild-harvested); **Knowledge = spine weakest-link** with a circumscription-stability multiplier (unstable taxonomy down-weights all rings); **Value = welded pathways only** (same seed-lot traced propagation→metabolite, not merely associated).
- **Broken link → claimable Brief:** every claimed-but-empty cell auto-emits an Open Brief into `collaboration_proposals` via the existing `assign_program_tic`, routed by subtree to the right persona's vehicle (propagation cell → student Thesis; chemistry cell → lab Brief; conservation cell → C-rep). **Persona = which slice of the 279 your "fill a gap" CTA points at.** Per-cell firewall via `link_type.firewall_class`/`sensitivity` (C-reps can't see application-fan columns; D-reps can't see exact locality) — the wall as row-level security on the footprint.

---

## 6. Top risks + mitigations

| Risk | Mitigation |
|---|---|
| **Three axes collapsed into one "persona" dropdown** → every auth gate breaks | `lib/persona.js` with `station/role/intent` separated; lint rule "station never in a gate" |
| **Filter bubble** (GEOCON-specific: scale/gaps ARE the pitch) | Personalize entry-points/framing only; never filter species/chain corpus; all lanes stay visible (reorder-not-remove) |
| **Cold-start empty feeds** signal dead product | Every station home degrades to atlas-seeded "biggest open chain gaps now" — computable today, zero other users |
| **Two navigations** (personal page becomes 2nd sidebar) | Disjoint-concepts test: logged-out→sidebar, "mine"→personal page; move Watching/Drafts off shell |
| **Firewall breach via commercial station in public shell** | Commercial station re-skins home toward *reading the commons as de-risking evidence*; no buy/deal/contact affordance outside admin Ventures; Bahçe reachable only via personal page |
| **Identity mis-declaration** (R&D rep self-picks "professor") | Station never unlocks data; only verified role + `org_memberships.accreditation_status` does |
| **Privacy** (inferred persona, free-text `mission_text`) | Inferred persona reorders own home only, never shown to others / never feeds bridge, one-click resettable; mission_text never in cross-firewall match |
| **A11y** (gradient-only "suggested" pill 8px; emoji semantics; post-async reflow) | Fix at `Badge`/`SectionHeader` primitives (text-labeled, AA); lucide+aria-label replace emoji `KIND_META`; resolve persona before first paint — no reflow after interactive |

---

## 7. Phased build order (start point: BEE, as the founder named)

**Phase 0 — The three-axis scaffold (foundation; cold-start-proof, firewall-safe by construction).** Ship `lib/persona.js` (`station/role/intent`). Remove `Watching`/`Drafts` from `NAV_PERSONAL` in `Shell.jsx` → move to `ProfileRoute`. Add a single "Your next action" band to `ProfileRoute` (intent + biggest open chain gap). *Cheapest move that proves the sidebar can shrink and locks the axis discipline before any persona UI hard-codes the wrong conflation.*

**Phase 1 — BEE/Bahçe (the founder's named start point, now expressible safely).** Ship the missing `/geocon/ventures/[id]` detail route + `get_opportunity_chain_readiness` strip (fixes live dangling link, makes chain→commerce provenance-backed). Add the persona-conditional "Translation desk" card to `ProfileRoute` for D1/D2. Rename "BEE"→"Bahçe" in user-visible strings. *This is the persona-reaches-via-profile pattern demonstrated on exactly one card, touching zero conservation-spine schema.*

**Phase 2 — Universal sidebar + workspace hub.** Gut `NAV_WORLDS`/`NavWorld` → 5 reading rows + Library shelf page (`/geocon/library`) + one Workspace door. Move `IntentRouter` off home into the workspace; home goes editorial. Remap mobile tabs. Add station chip + station-filtered launcher.

**Phase 3 — Station expansion + persona band.** Extend `set_my_intent`/`get_my_persona` from 3 intents to 9 stations (each still resolving to an intent). Build the reusable persona band; inject into species/chain pages (the highest-leverage surface).

**Phase 4 — Chain→Programs.** Seed `link_type` ltree with the 12 TIC IDs (zero UI change). Widen `program_tics`→`program_chain_claim`. Add Footprint tab-0. Re-derive `get_program_health_assessment` rings. Wire broken-cell→Open Brief with per-cell firewall RLS.

Each phase is independently shippable and truthful at zero users. Phase 0 buys the discipline; Phase 1 honors the founder's BEE start point *after* the scaffold exists, so BEE lands as "a commercial-station re-skin of the commons," never "a commerce lane in the public shell."

---

### Key components cited
`components/geocon/Shell.jsx` (NAV_PERSONAL:53-59, NAV_WORLDS:63-116, VENTURES_NAV:120) · `IntentRouter.jsx` (LANES:26-57, get_my_persona reorder:77-81) · `ProfileRoute.jsx` (workspace hub target; BEE-auth string:301) · `HomeRoute.jsx` (drop IntentRouter) · `VenturesRoute.jsx` + `CommercializedOutcomes.jsx` (Bahçe rings; door:130) · `components/programs/v2/ProgramDetailPanel.jsx` + `HeroPanel.jsx` + `lib/programRpc.js` (chain footprint) · new `lib/persona.js`, `app/geocon/library/page.js`, `components/geocon/ventures/OpportunityDetailRoute.jsx` · docs `THE-CHAIN.md`, `THE-CHAIN-LINK-MODEL.md`, `THE-CHAIN-VALUE-MAP.md`, `06-commercialization-recognition.md`, `10-decision-log.md` (D-001).