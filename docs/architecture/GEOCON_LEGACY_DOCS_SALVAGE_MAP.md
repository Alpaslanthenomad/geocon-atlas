# GEOCON Legacy Docs Salvage Map

**Status:** DOC-3A audit map. Documentation only. No code authority by itself.  
**Branch context:** `docs/geocon-legacy-salvage-map`  
**Authoring rule:** This file classifies legacy repo docs; it does not replace the AI lock files or the current-only archive.

---

## 2. Operating principle

Old GEOCON documentation is **not trash**. It is **technical quarry** — implementation material, vocabulary, RPC names, UI patterns, firewall rules, and historical reasoning that may still be useful.

What must be rejected is often the **old product philosophy**: programs-as-R&D-pipeline, rooms-as-center, propagation-as-GEOCON-heart, chain-as-identity, personalization-as-home, Exchange-as-implicit-GEOCON-goal.

Salvage discipline:

```text
Reject old philosophy where it conflicts with target architecture.
Reuse technical assets where they still earn their place.
Never treat repo docs as final target truth without revalidation.
```

---

## 3. Source-of-truth hierarchy

When any AI agent or engineer reads legacy docs, use this order:

1. **`docs/architecture/GEOCON_AI_REFERENCE_LOCK.md`** — fast alignment; repo vs target distinction; layer model; current priority.
2. **`docs/architecture/GEOCON_BEE_AI_AUDIT_PROTOCOL.md`** — cross-AI audit protocol; five startup questions; forbidden scope; archive inventory.
3. **Current-only archive baseline** — `GEOCON_BEE_Current_Only_Archive_v4_5.zip` and families:
   - `03_GEOCON_CURRENT/`
   - `02_BEE_PLATFORM_CURRENT/`
   - `01_BEE_DEEPTECH_CURRENT/`
4. **Current repo docs** (this map included) — implementation history, transitional specs, salvage quarry.
5. **Repo code** — implementation reality, not automatic architecture truth.
6. **Conversation history / older ZIPs** — context only; lowest authority.

Critical rule:

```text
repo reality ≠ target architecture
```

---

## 4. Classification taxonomy

| Status | Meaning |
|--------|---------|
| **TARGET_CURRENT** | Describes the new BEE layered target model or is explicitly aligned with the current-only archive. |
| **TRANSITIONAL_REPO_REALITY** | Describes what is shipped or half-shipped in the repo today; useful for migration, dangerous as north star. |
| **TECHNICAL_SALVAGE** | Old philosophy may conflict, but tables, RPCs, UI patterns, firewall rules, or vocabulary are reusable. |
| **LEGACY_PHILOSOPHY** | Product framing that steers AI/humans toward the wrong center (rooms, pipeline, chain-as-identity, bench-as-home). |
| **HISTORICAL_STRATEGY** | Strategy/brainstorm docs that inform direction but must not drive immediate build without founder revalidation. |
| **DEPRECATED_OR_REVERTED** | Built then rolled back, rejected, or explicitly marked dormant/reverted. Keep for archaeology only. |
| **UNKNOWN_REQUIRES_REVIEW** | Not yet classified against the current-only archive; read before citing in build plans. |

---

## 5. Main salvage table

**Docs in table:** 17

| File | Current risk | Old philosophy / conflict | Technically reusable parts | New target destination | Recommended action | Priority |
|------|--------------|---------------------------|----------------------------|------------------------|-------------------|----------|
| `CLAUDE.md` | **High** — first file every AI reads; still centers Program Cockpit / Venn engine / rooms as "the backbone" | Treats `components/programs/v2/` as architecture backbone; omits Program Habitat / Initial Program Situation / Translation Boundary model | Stack, non-negotiables, firewall, Supabase conventions, subagent map, reverted-arc warnings | Layer map + doc hierarchy pointer; GEOCON as Layer 1 qualification platform | **DOC-4 patch** — add lock-file precedence, demote program engine to transitional repo reality | P0 |
| `docs/AI-WORKFLOW.md` | **Medium** — orients AI to CLAUDE.md + INDEX without lock files | Assumes INDEX + CLAUDE.md are sufficient; no mandatory audit protocol | `/orient`, `/db`, `/ship`, skills list, cross-model review habit | AI operating system guardrails section referencing lock + audit protocol | **DOC-4 patch** — require reading lock + audit protocol before coding | P0 |
| `docs/architecture/README.md` | **High** — states "if docs conflict with code, code wins for implementation but docs win for intent" without layer distinction | 5-layer Commons/Programs/Studies/Briefs/Recognition model; engineer onboarding starts at 02-layers + 03-programs | Partner/IUCN reading paths, decision-log pointer, table inventory | Architecture folder index with **target vs transitional** banner | **DOC-4 patch** + **DOC-5 banner** on linked legacy entrypoints | P0 |
| `docs/architecture/INDEX.md` | **High** — deep map lacks `[target]` vs `[transitional]` vs `[salvage]` separation | Mixes live program engine, dormant chain, reverted bench, and v-next strategy without hierarchy vs lock files | Comprehensive doc inventory, status tags (`live`/`design`/`dormant`/`reverted`), v-next pointers | Doc index with explicit **authority tiers** and link to this salvage map | **DOC-4 patch** — add lock, audit protocol, salvage map at top | P0 |
| `docs/architecture/02-layers.md` | **High** — teaches 5-layer model as mental model | L2 Programs = "collaborative R&D vehicles" with full research→pilot pipeline; L5 recognition inside GEOCON stack | Species commons table list, brief kinds, firewall separation intent, visibility rules | Scientific Grounding Layer / Reference substrate; Programs reframed as Program Habitat material | **DOC-5 legacy banner**; do not delete | P1 |
| `docs/architecture/03-programs.md` | **High** — canonical program doc matches shipped rooms/tabs/gates | Foundation→Field & Lab→Pathways→Outputs lifecycle; HeroPanel; impact multiplier; pathways as value axes | Member roles, visibility, RPC names, TIC/evidence vocabulary, join door, member agreements hook | Program Situation / Program Habitat / Work Package domains / Evidence Signal Node | **DOC-5 legacy banner**; salvage RPC + member patterns only | P0 |
| `docs/architecture/QUICKREF.md` | **Medium** — partner-facing one-pager encodes old 5-layer story | "Collaborative research platform" + Programs as central R&D pipeline | IUCN/commerce separation summary, brief kinds, recognition as off-platform citation | Partner quickref with BEE layer model and GEOCON qualification framing | **DOC-5 legacy banner**; rewrite later as DOC-4 derivative | P1 |
| `docs/architecture/VENN-ENGINE-CONTRACT.md` | **High** — marked `[live]` in INDEX; AI may treat as final engine spec | Stage gates, regions, Integrated Core, equal tic weight — half-migrated repo engine, not Program Habitat | Evidence strength 0–1, gate vs region law, RPC contracts (`get_program_stage_status`, etc.), member completion rules | Evidence Signal Node / prerequisite logic / Safe Progression Horizons (salvage mechanics, not UX center) | **Reclassify as TRANSITIONAL_REPO_REALITY** in INDEX; banner in DOC-5 | P0 |
| `docs/architecture/WORKSPACE-ROADMAP.md` | **Low–Medium** — mostly accurate shipped notes + open todos | Workspace as personal hub is fine; ties member loop to old program TIC cards | Visibility/join/assignments/drafts shipped list; notification gaps; RLS hardening notes | Activity Rail / personal hub adjacent to Program Habitat; not program center | Keep as **TECHNICAL_SALVAGE**; link from DOC-4 | P2 |
| `docs/architecture/NORTH-STAR.md` | **Low** — question doc, not implementation spec | Frames GEOCON as conservation→full value chain in one product sentence | Founder intent preservation, critical-review structure | Historical strategy input for qualification-platform reframe | **HISTORICAL_STRATEGY** — keep; do not treat as build spec | P2 |
| `docs/architecture/NORTH-STAR-ANALYSIS.md` | **Medium** — influential critique but pre–target-archive | "Knowledge-gap atlas" + chain evidence metric; predates Program Habitat model | Cold-start diagnosis, kill-list discipline, evidence-row north star, Anatolia wedge | Informs Scientific Grounding Layer + Evidence Signal Node; not room architecture | **HISTORICAL_STRATEGY** — salvage metrics language carefully | P1 |
| `docs/architecture/PERSONALIZATION-ARCHITECTURE.md` | **High if unmarked** — rich plan that caused drift | 3-axis persona, station chip, sidebar re-skin — rejected shallow center | Station vs role vs intent separation rule; cold-start degrade-to-atlas rule | Governance / Language Boundary hints only | **DEPRECATED_OR_REVERTED** — INDEX already marks reverted; add banner DOC-5 | P1 |
| `docs/architecture/THE-BENCH.md` | **High if unmarked** | Bench-as-home, species claim, chain-heal as identity — explicitly rejected | Private log + promote pattern, `[EKLE:]` draft discipline, grant draft-section reuse | Constraint-based Workbench **ideas only**; not bench-as-home | **DEPRECATED_OR_REVERTED** — archaeology only | P1 |
| `docs/architecture/THE-CHAIN.md` | **Medium** — dormant but seductive as platform identity | Six-link spine as GEOCON identity; Move primitive as center | Gap visibility concept, credited move idea, incremental L0 warning | Scientific Grounding Layer substrate; not platform spine | **DEPRECATED_OR_REVERTED** / dormant — keep for chain registry context | P2 |
| `docs/architecture/THE-CHAIN-LINK-MODEL.md` | **Medium** — technical schema design for dormant chain | 279-link DAG as identity engine | `chain_link_type` ltree extensibility, spine vs parallel rails, weakest-link concept | Reference ontology / Evidence Signal Node typing — **DB salvage only** | **TECHNICAL_SALVAGE** for registry; not product center | P2 |
| `docs/architecture/THE-CHAIN-VALUE-MAP.md` | **High for Exchange bleed** | Dual mission conserve+create value in one graph; product value pathways explicit | Branch taxonomy for knowledge domains; firewall wording | Exchange / Value layer reference only — **not GEOCON UI** | **LEGACY_PHILOSOPHY** for Layer 1; salvage for Layer 3 planning later | P3 |
| `docs/architecture/VENN-EXCHANGE-VC-STRATEGY.md` | **High if read during GEOCON work** — Exchange/commerce heavy | VC portal, deal room, pitch blocks, bridge listings — Layer 3 | Firewall rules, frozen snapshot pattern, bridge schema ideas, integrity gates | Exchange / Value layer (BEE Layer 3) — explicit separation | **HISTORICAL_STRATEGY** + Layer 3 only; forbid GEOCON sprint citation | P3 |

---

## 6. Salvage mapping section

Old concept → new target architecture mapping:

| Old concept | New target destination | Salvage note |
|-------------|------------------------|--------------|
| **Species Commons** | Scientific Grounding Layer / Reference substrate | Keep public species facts, provenance, IUCN firewall; not the program center |
| **Programs v2** (`ProgramDetailPanel`, tabs, RPCs) | Program Situation / Program Habitat / Governance Boundary | Reuse member gating, RPC wrappers, audit patterns — reframe UX, do not copy room-first IA |
| **Program Cockpit** | Initial Program Situation (candidate material) | Mission/gate/blocker derivation logic is useful; cockpit-as-home is not final |
| **Rooms / Tabs** (Foundation, Field & Lab, Propagation, Outputs) | Work Package grouping / Safe Progression Horizons | Grouping vocabulary only; not final information architecture |
| **Foundation / Field & Lab / Propagation / Output** | Work Package domains / horizon labels | Stage names map to horizons, not to GEOCON product rooms |
| **TIC / Evidence / Gate** | Evidence Signal Node / Claim–Evidence–Output guardrails / prerequisite logic | Keep evidence strength, completion rules, gate math as engine salvage |
| **Propagation Studio** | Technical module or DeepTech input candidate | Layer 2 or specialized module — **not GEOCON center** |
| **Program Stream** | Activity Rail | Member-only activity feed pattern; rename and relocate |
| **Member Agreements** | Governance / Language Boundary | Member-gated revenue/IP records; stay out of public qualification face |
| **Open Briefs** | Collaboration / Capability Signal | Demand signals, not marketplace; partial respond-flow still unbuilt |
| **Commercialization Recognition** | Exchange attribution / citation registry | Layer 3; citation-only from GEOCON, never core qualification UI |
| **Impact Factor** | Later reputation layer | Not Sprint 1 GEOCON core |
| **AI workflow docs** (`CLAUDE.md`, `AI-WORKFLOW.md`) | AI operating system + development guardrails | Must point to lock + audit protocol first |
| **Translation Boundary** (recent) | Controlled handoff: GEOCON → DeepTech | Not a studio CTA; separate layer entry |
| **DeepTech Translation Case** (recent Sprint 0–1A) | BEE Layer 2 local draft | Prototype only; no persistence until GEOCON rebase accepted |

Correct chain (locked):

```text
GEOCON program situation
→ qualified signal
→ Translation Boundary
→ DeepTech Translation Case
→ (later) technical capability assessment
→ (later) Value / Exchange evaluation
```

---

## 7. Immediate action plan

### DOC-4 — Documentation Hierarchy Patch (next)

Update these files to reflect authority hierarchy and BEE layer model:

- `CLAUDE.md` — read lock + audit protocol first; demote program engine to transitional; add target terms (Program Habitat, Initial Program Situation, Translation Boundary)
- `docs/AI-WORKFLOW.md` — mandatory pre-code read list; five audit questions
- `docs/architecture/README.md` — target vs repo-reality distinction; link salvage map
- `docs/architecture/INDEX.md` — top section: lock, audit protocol, salvage map; re-tag VENN-ENGINE as transitional

### DOC-5 — Legacy Banner Patch

Add non-destructive banners to:

- `docs/architecture/02-layers.md`
- `docs/architecture/03-programs.md`
- `docs/architecture/QUICKREF.md`

Banner intent (example):

```text
LEGACY DOC — transitional repo philosophy. Not final target architecture.
See GEOCON_AI_REFERENCE_LOCK.md and GEOCON_LEGACY_DOCS_SALVAGE_MAP.md.
```

### DOC-6 — GEOCON Target Rebase Plan

Define migration from current Program UI to target surfaces:

1. **Initial Program Situation** — first screen: what / why / state / blockers / allowed claims
2. **Program Habitat** — organizing model replacing room-first tabs
3. **Constraint-based Workbench** — work surfaces gated by constraints, not task board
4. **Safe Progression Horizons** — replace stage-room navigation metaphor
5. **Translation Boundary** — visible as boundary signal, not DeepTech launcher
6. **Activity Rail** — absorb Stream / workspace activity patterns
7. **Explicit non-goals** — no Exchange activation, no DeepTech persistence expansion until rebase accepted

Deliverable: ticket-level plan before further GEOCON UI coding.

---

## 8. Forbidden actions

This document **does not authorize**:

- Deleting old docs
- Rewriting old docs without explicit review pass (DOC-4/DOC-5)
- Treating any row in Section 5 as final target architecture without lock/archive check
- Expanding DeepTech persistence (Sprint 1B+) before GEOCON rebase plan accepted
- Activating Exchange, VC, licensing, or investment surfaces inside GEOCON work
- Database migrations or runtime code changes based on this map alone
- Using dormant/reverted docs (THE-BENCH, PERSONALIZATION) as active build specs
- Adding TCR progress bars, execution controls, or value-pathway UI to DeepTech

---

## 9. Review checklist

Before acting on any salvage row, confirm:

- [ ] Does this preserve useful **technical** material (RPCs, tables, patterns, firewall rules)?
- [ ] Does this **reject** old product philosophy where it conflicts with target architecture?
- [ ] Does this keep **GEOCON / DeepTech / Exchange** strictly separated by layer?
- [ ] Does this **prevent AI drift** (lock + audit protocol read first)?
- [ ] Does this provide a **path from repo reality to target architecture** (not a big-bang rewrite fantasy)?
- [ ] Are forbidden scope items explicitly listed for the sprint?
- [ ] Is the work classified as target migration vs repo patching vs documentation-only?

---

## 10. Related authority files (not in salvage table)

These are **authority**, not quarry:

| File | Role |
|------|------|
| `docs/architecture/GEOCON_AI_REFERENCE_LOCK.md` | Primary alignment lock |
| `docs/architecture/GEOCON_BEE_AI_AUDIT_PROTOCOL.md` | Cross-AI audit protocol |
| `docs/architecture/DEEPTECH-MVP-CONTRACT.md` | Layer 2 prototype contract (Sprint 0–1A) |

---

## 11. Change log

### DOC-3A v0.1

- Initial salvage map for 17 legacy repo docs
- Classification taxonomy and source-of-truth hierarchy
- Salvage mapping from old program/chain/room concepts to target architecture
- DOC-4 / DOC-5 / DOC-6 action plan
- Forbidden actions and review checklist
