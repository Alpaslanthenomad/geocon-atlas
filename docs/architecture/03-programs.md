# 03 — Programs

A Program is **a team's collaborative R&D vehicle** focused on one or
more geophyte species, with structured progression through research,
development, and pilot production phases. Programs are the central
unit of work in GEOCON Layer 2.

## What a Program is

- A **named team workspace** with members, roles, and visibility rules
- A **focal entity** for a species (or species group)
- A **structured pipeline** through Foundation Gate → Field & Lab Gate
  → Pathways → Outputs
- A **container for impact accrual** at ×1.5 multiplier
- An **optional Member Agreement** holder for revenue/IP splits
- An **optional source** of Commercialization Recognitions

## What a Program is NOT

- ❌ Not a commercial venture (commerce happens in member orgs)
- ❌ Not a unique-per-species record (N parallel allowed)
- ❌ Not platform-owned (it belongs to its team)
- ❌ Not a contract (Member Agreements are separate records)

## Lifecycle

```
DRAFT
  ↓
DESIGNING   (Foundation TICs being filled in)
  ↓
FOUNDATION GATE  ← decision point: pass or revisit
  ↓
FIELD & LAB     (collecting data, building protocols)
  ↓
FIELD & LAB GATE  ← decision point
  ↓
PATHWAYS DECLARED  (chosen value axes)
  ↓
OUTPUTS PRODUCED    (publications, protocols, accessions)
  ↓
PROGRAM HEALTH = "Realized"
```

A program can also be ABANDONED, PAUSED, or DISSOLVED at any phase.

## Structure: the v2 detail panel

The current implementation (`components/programs/v2/ProgramDetailPanel.jsx`)
provides 7 tabs:

1. **Foundation** — the initial setup TICs (why, what species,
   what justification)
2. **Field & Lab** — observation and data-collection TICs
3. **Pathways** — declared value axes (Conservation, Phytochemistry,
   etc.)
4. **Species** — the linked species detail
5. **Contributors** — members, roles, invite flow
6. **Outputs** — declared knowledge outputs (publications, protocols,
   patents-in-application, etc.)
7. **Stream** — unified activity feed (TIC events, comments, output
   additions, member changes)

Above the tabs sits the **HeroPanel**, which surfaces:
- Stage pill (Designing / Active / Gate Ready / Producing / Realized)
- Species + IUCN + family context
- Owner researcher link
- Next-best-action callout (if set)
- ProgramHealthCardCompact (3-ring breakdown)
- **MemberAgreementPanel** (outsider sees pill; member sees splits;
  owner can edit)
- Primary blocker / what's missing pair
- Why this program + strategic rationale

## Member roles

Roles are stored on `program_members.role`:

- **Lead PI** — academic leader
- **Co-PI** — co-equal collaborator
- **Research staff** — execution
- **Student / intern** — learning by doing (counts for impact via
  mentor multiplier)
- **Reviewer / auditor** — QC role
- **Industry partner** — commercial pathway partner
- **Conservation partner** — botanical / seed bank steward
- **Advisor** — light involvement, no operational duty
- **Citizen contributor** — observations, photos

Each role has implicit weights in Member Agreement and Impact
accrual.

## Visibility modes

Set on the Program record (column to be added):

| Mode | Read | Contribute |
|------|------|------------|
| Public | anyone | invited |
| Open | anyone | anyone (Wikipedia-style) |
| Sealed | members only | members only |

**Sealed graduation rule:** when a sealed program transitions to
"Realized," its knowledge contributions become public. Sealing
protects timing, not eternal secrecy. This is enforced by the
graduate_program() function (planned).

## N programs per species

Multiple programs can target the same species. The species detail
page surfaces all of them in an "Active Programs" block, with each
program's visibility-appropriate summary.

This was a critical decision (D-003). Real-world research is
fragmented across teams who don't want to merge.

## Pathways

A Pathway is a Program's chosen value axis. Common pathways:

- 🌱 Conservation Pathway
- 🌿 Propagation Pathway
- 🧪 Phytochemistry Pathway
- 💄 Cosmetic Application Pathway
- 💊 Pharmaceutical Pathway
- 🥕 Agriculture / Food Pathway
- 📚 Taxonomy Pathway
- 🌐 Ethnobotany Pathway

A Program can have multiple Pathways. Each Pathway accumulates
specific outputs and can generate its own Commercialization Recognition
record at maturity.

**Pathway commercial divergence:** Within the same Program, some
Pathways may stay public-domain (Conservation), while others go on to
commercialization (Phytochemistry). This is normal and expected.

## Outputs

Knowledge outputs declared by the Program. Currently supported types:

- **Publication** — DOI link, peer-reviewed
- **Protocol** — versioned, markdown, often public
- **Accession** — living-collection record
- **Seed lot** — seed bank record
- **Field dataset** — distribution, phenology
- **Patent application** — record only, not the patent itself
- **Pilot batch** — production milestone (tissue culture, extraction)

These map naturally to Phase 3 tables (phenology, accessions, seed
lots, protocols).

## Impact accrual

Programs are K3-bucket (×1.5 multiplier). Every event that maps to a
contribution generates impact points in one or more of the 5
currencies:

| Event | Currency | Base points |
|-------|----------|-------------|
| Add publication | 📚 Research | 10 |
| Add protocol | 🌱 Conservation | 15 |
| Add accession | 🌱 Conservation | 8 |
| Add seed lot | 🌱 Conservation | 12 |
| Add phenology row | 🔭 Discovery | 2 |
| Validate someone else's work | 🤝 Stewardship | 6 |
| Mentor produces work | 🤝 Stewardship | mentor multiplier % |
| Translate species page | 🌐 Network | 5 |
| Resolve dispute | 🤝 Stewardship | 8 |
| Add field observation | 🔭 Discovery | 3 |

These are reference values; the actual triggers attach to
existing tables via Postgres triggers (planned in next sprint).

## Health card

`ProgramHealthCardCompact` (already implemented) shows three rings:

- **X / SAFEGUARD** — conservation completeness
- **Y / KNOWLEDGE** — research completeness
- **Z / VALUE** — applied/development completeness

These map to the TIC completion ratios in the underlying
`get_program_health_assessment` RPC.

## Files and routes

- **Detail panel:** `components/programs/v2/ProgramDetailPanel.jsx`
- **HeroPanel:** `components/programs/v2/HeroPanel.jsx`
- **Tabs:** `components/programs/v2/tabs/*`
- **Hooks:** `components/programs/v2/hooks/*`
- **Routes:** `/geocon/programs`, `/geocon/programs/[id]`,
  `/geocon/programs/new`, `/geocon/programs/analytics`
- **Index route component:** `components/geocon/ProgramsIndexRoute.jsx`
- **Detail route component:** `components/geocon/ProgramDetailRoute.jsx`
- **Analytics route component:** `components/geocon/ProgramsAnalyticsRoute.jsx`

## What's missing

- Visibility modes (Public/Open/Sealed) — UI exposes only the
  underlying column; needs sealed-mode protection in queries
- Sealed graduation knowledge release — design + implementation
- Sorting on Programs index — flagged in the deep-dive audit
- Streamlined "Create program" flow (currently 3 routes; could be
  one wizard)
- Impact accumulation triggers (next sprint)
