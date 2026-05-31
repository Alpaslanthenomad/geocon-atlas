# 10 — Decision Log

A running record of every architectural decision made between
Alpaslan Sevket Acar (Venn BioVentures, operator) and the Claude
implementation assistant during 2026. Each entry includes WHEN, WHAT,
WHY, and the OUTCOME.

This log is the protection against "we already discussed that" loss
when context is compressed. Always update this when a decision is
made or revised.

---

## Settled decisions

### D-001 — GEOCON is research-only; commerce is off-platform
**When:** Session 2026-05-31 (Programs vision brainstorm)
**Decision:** GEOCON does not file patents, sell products, hold
escrow, or take commissions. Member organizations conduct any
commercial activity through their own legal structures.
**Why:** IUCN compatibility plus credibility with conservation
partners requires structural non-commercial positioning.
**Outcome:** Schema has no money columns; all 5 layers reinforce this
boundary; recognition layer is citation-only.

### D-002 — 5-layer architecture
**When:** Session 2026-05-31
**Decision:** Species Commons / Programs / Studies / Open Briefs /
Recognition. No additional layers without explicit revisit.
**Why:** Earlier draft proposed Marketplace + Ventures inside GEOCON;
Alpaslan correctly rejected as too commercial-feeling. The settled
5-layer model achieves the same outcomes with cleaner positioning.
**Outcome:** All major surfaces map to one of these 5 layers.

### D-003 — N programs per species (parallel teams allowed)
**When:** Session 2026-05-31
**Decision:** Multiple research groups can run parallel programs on
the same species. They are not required to merge or coordinate.
**Why:** Real-world research is fragmented across teams who have
different funders, ethics approvals, and goals. Forcing one program
per species would be unworkable.
**Outcome:** `programs.species_id` is not unique; species detail page
lists all programs.

### D-004 — Three program visibility modes
**When:** Session 2026-05-31
**Decision:** Public / Open / Sealed visibility.
**Why:** Industry partners need sealed mode to participate; academia
prefers public/open; we need both.
**Outcome:** Sealed programs hide member work-in-progress but
**must release knowledge contributions at graduation** — sealing
protects timing, not eternal secrecy.

### D-005 — "Open Briefs" not "Marketplace"
**When:** Session 2026-05-31
**Decision:** The L4 demand-signal layer is called "Open Briefs"
(after research-tender conventions), not "Marketplace."
**Why:** Marketplace implies commercial transaction; we explicitly
reject that framing.
**Outcome:** Implemented as `/geocon/briefs` route with 7 brief kinds
and an urgency tag. Backed by `collaboration_proposals.brief_kind`.

### D-006 — 7 brief kinds
**When:** Session 2026-05-31
**Decision:** research, conservation, capability, production, partner,
service, idea.
**Why:** Covers the spectrum from academic R&D demand to citizen
science bounty to AI-suggested synergy without leaking into commerce.
**Outcome:** Enforced via DB check constraint.

### D-007 — Member Agreements: member-only visibility
**When:** Session 2026-05-31, Alpaslan's explicit choice
**Decision:** Outsiders see only "🔐 Agreement on file"; only active
program members see splits and clauses.
**Why:** Reveals existence (which builds trust) without exposing
sensitive commercial terms.
**Outcome:** `program_member_agreements` RLS enforces this; the
`program_agreement_exists()` RPC is the existence probe outsiders
get; UI shows the pill accordingly.

### D-008 — Commercialization Recognition: dual-path origin
**When:** Session 2026-05-31, Alpaslan's "Both" choice
**Decision:** Recognition can be (a) automatic when launching org's
rep declares the outcome, OR (b) self-declared by a contributor and
promoted by peer endorsements.
**Why:** Org-led ensures coverage of major launches; self-declared
catches cases where the launching org neglects to credit
contributors. Both serve fairness.
**Outcome:** Verification ladder: self_declared → peer_endorsed (3
endorsements) → org_declared (set on declare RPC if caller is
org rep) → venn_verified (if caller is admin).

### D-009 — Other R&D labs can be Venn-accredited too
**When:** Session 2026-05-31
**Decision:** Vitalcore is not unique; any qualified lab in any
country can be Venn-accredited via the existing organization
accreditation flow.
**Why:** Network effect — Venn becomes a meta-accrediting body
rather than the only R&D engine.
**Outcome:** `organizations.lab_country` + `rd_specializations[]`
added. Existing accreditation enums extended to support this.

### D-010 — Brief kind as column (not separate table)
**When:** Session 2026-05-31, my recommendation + Alpaslan's
"undecided but follow your suggestion" deferral
**Decision:** Open Briefs share the `collaboration_proposals` table
with `brief_kind` field distinguishing briefs from legacy proposals.
**Why:** Faster to implement, same RLS, doesn't duplicate plumbing.
**Outcome:** `brief_kind` column added with CHECK constraint.
Discovery route filters on the column.
**Status:** Marked as **REVISITABLE** — Alpaslan said "we can change
this later if it doesn't feel right."

### D-011 — 5-currency impact factor
**When:** Session 2026-05-31 (impact brainstorm)
**Decision:** Discovery / Conservation / Research / Stewardship /
Network — five separate currencies, plus a derived Total Impact.
**Why:** Tek skor reductionist; 5 currency model honors different
contributor types (academic, citizen, curator, translator,
industrial).
**Outcome:** Conceptually agreed. **Not yet implemented** — schema
+ event triggers pending. Will be the next major buildout after
ORCID onboarding.

### D-012 — Three-bucket impact accumulation
**When:** Session 2026-05-31
**Decision:** K1 Historic Import (×0.6, one-time at onboarding via
ORCID/CrossRef/iNat/GBIF) / K2 Studies (×1.0, continuous) / K3
Programs (×1.5, continuous).
**Why:** 20-year veterans shouldn't start at zero; lightweight
external work deserves credit; full Programs earn the bonus for
coordination effort.
**Outcome:** Conceptually agreed. Implementation pending.

### D-013 — Wikidata IUCN sync was a sensible stopgap
**When:** Session 2026-05-30 (during sync run)
**Decision:** Run the Wikidata sync to lift 423 → 745 evaluated
species; stop when diminishing returns hit; apply for IUCN Red List
API as Path B.
**Why:** Wikidata covers ~5-10% of geophytes officially. The rest
need direct IUCN access.
**Outcome:** 322 species lifted (commit `065c816` then `4c0aa0e`);
Path B application form prepared in `docs/iucn-api-reapplication.md`.

### D-014 — Onboarding flow specifics (13 Q&A)
**When:** Session 2026-05-31, after extended brainstorm
**Decision:** Alpaslan answered 13 onboarding design questions:

1. **ORCID is the primary onboarding path** for researchers (not just
   an additional auth method).
2. **Federation defaults:** ORCID + CrossRef auto-import on consent;
   iNaturalist + GBIF surface "did we find you?" prompts requiring
   manual confirmation.
3. **AI-generated welcome paragraph** with 24h per-user cache.
4. **Action suggestion count on welcome screen:** 3 (default rich
   variant). Will revisit with deeper thinking later — may shift to 5
   if a/b testing supports it.
5. **Mission roadmap:** 1 primary + 2 secondary goals.
6. **Mission visibility:** default private; opt-in for mentor-visible.
   Will personalize based on user behavior signals later.
7. **Home dashboard is modular** — user picks/orders cards, can
   subscribe to notifications instead of viewing live tiles.
8. **Mentor matching is active by default**; user can switch to
   passive in profile settings.
9. **NO drip email campaigns** at MVP. Revisit if engagement metrics
   show we need them.
10. **Live presence ghosts enabled** — show "N similar profiles online
    now" on profile pages (lightweight).
11. **Hybrid mentor matching:** AI surfaces qualifying senior
    researchers based on criteria (impact, sustained activity); the
    actual "I'm open to mentor" toggle is manual.
12. **Tone is serious and academic** — no celebratory gamification.
    BUT: include sober status indicators like profile-frame color
    change when a Program is completed, tier ladder badges paired
    with Impact Factor. Status motivates without feeling gamified.
13. **Implementation order approved:** ORCID OAuth → CrossRef bulk
    import → AI welcome generator → Welcome UI → Personalized home
    → Mission editor → iNat/GBIF federation → (drip skipped per #9).

**Status:** Settled at this granularity. Deeper details for #4 and #6
deferred to implementation phase.

### D-014 — ORCID-driven onboarding
**When:** Session 2026-05-31 (after foundation shipped)
**Decision:** New researcher onboarding will be ORCID-based with AI
mediation. Welcome screen, baseline impact import from ORCID, AI
suggestion of relevant programs/briefs, "mission roadmap" creation.
**Why:** The first 5 minutes determine whether someone stays. We need
to make new arrivals feel **valued** (their history is honored) and
**oriented** (they know what to do next).
**Outcome:** Architecture designed; implementation pending. See
[09 — Onboarding & Personalization](./09-onboarding-personalization.md).

### D-015 — Impact Factor data plane shipped (MVP)
**When:** Session 2026-05-31 (autonomous K5 implementation)
**Decision:** Ship the 5-currency × 3-bucket Impact Factor as a
data plane first — `contribution_events` table, three SECURITY
DEFINER RPCs (`impact_factor_breakdown`, `impact_factor_totals`,
`impact_factor_leaderboard`), three auto-seed triggers
(`publication_researchers`, `program_members`,
`commercialization_credits`), and an `ImpactFactorPanel.jsx`
component mounted on researcher and organization detail routes.
**Why:** Without a working data plane, every other downstream
feature (ORCID import, leaderboards, dashboards, recognition
ladders) has nothing to consume. Locking in the schema and the
multiplier semantics now means subsequent UI iterations don't
have to renegotiate them.
**Outcome:** 4,190 publication-link events + 2 program-join events
backfilled from existing rows. Schema stays IUCN-compatible (no
money columns, only base points × bucket multiplier). Multiplier
values match docs/architecture/08-impact-factor.md (K1 0.6, K2
1.0, K3 1.5). Researcher and org pages now show currency tiles
+ bucket sparklines + bucket legend.
**Open:** Per-currency point weights (currently 5 / 3 / 10) are
provisional and will be revisited once contribution volumes
suggest the right ratios. The materialized-view optimization is
deferred until live query latency proves it's needed.

---

## Pending / deferred decisions

### P-001 — Open Briefs as separate sekme vs proposal type
**Status:** Implemented as field on proposals (D-010); marked as
revisitable. If discovery UX feels cramped, split into separate table.

### P-002 — Member Agreement detailed clauses
**Status:** Schema in place (text + jsonb splits + ip_clause +
dispute_clause); standard clauses + percentage defaults to be designed
when first real Program graduates.

### P-003 — 5-currency formula and weights
**Status:** 5 currencies agreed; **Top-3 sum** suggested as Total
formula; user weights adjustable per researcher (advanced mode);
geometric mean rejected as over-rewarding well-roundedness.
Implementation pending.

### P-004 — Mentor multiplier exact value
**Status:** Conceptually agreed (mentee contribution → mentor gets
partial credit). Recommended starting value: 20%. Subject to revision
once data shows behavior.

### P-005 — Federation sources priority order
**Status:** ORCID first (academic), CrossRef (DOI), iNaturalist
(citizen), GBIF (occurrence). Google Scholar pending (scrape policy).
Wikidata already used for IUCN.

### P-006 — Tier-up thresholds (Observer → Fellow)
**Status:** Wikipedia-style thresholds conceptually agreed. Exact
event counts to be calibrated post-launch based on actual contribution
volumes.

### P-007 — Conservation bounty briefs: how funded
**Status:** Venn will issue anchor bounties year one. Subsequent
funding model TBD — possibilities include conservation NGO
sponsorships, government grant programs, biotech foundation
partnerships.

### P-008 — Commercial Venture data dividend
**Status:** Radical idea floated (small % of member-org revenue
flows to Species Commons fund). Not committed. Revisit when first
Program graduates and member orgs are ready to negotiate.

---

## Rejected ideas

### R-001 — Marketplace framing
**Rejected because:** Too commercial-feeling, incompatible with IUCN
positioning, and the user explicitly objected.

### R-002 — Single master impact score
**Rejected because:** Inherits all h-index problems (penalizes
diversity, encourages gaming, excludes non-academic contributors).

### R-003 — Pure context-dependent display (Option D in Q1)
**Rejected because:** Per-page bespoke display rules are unsustainable
and produce inconsistent profiles. Hybrid (C) chosen instead.

### R-004 — Fake/seed/demo data to "make the platform feel full"
**Rejected because:** Alpaslan explicitly forbade fake data. We will
populate organically via partnerships and the upcoming ORCID-driven
onboarding flow.

### R-005 — GEOCON as patent-holder
**Rejected because:** Incompatible with non-commercial positioning.
Patents are filed by member orgs in their own name.

---

## How to add a decision

When you make an architectural choice, add it here with:

```markdown
### D-XXX — Short title
**When:** Date and session context
**Decision:** What was decided (one sentence)
**Why:** Reasoning (one paragraph)
**Outcome:** How it manifests in code or process
**Status:** (optional) Revisitable / Final / Subject to data
```

For pending items, use `P-XXX` and skip the "Outcome" line; add a
clear "Status" instead.

For rejected ideas, use `R-XXX` so the rejection is searchable.

This log is the institutional memory. Treat it as sacred.
