# 08 — Impact Factor (5-Currency Reputation System)

The Impact Factor is GEOCON's reputation system. It is not a single
number; it is a **5-currency stack** designed to honor different
contributor archetypes while remaining comparable across people and
organizations.

**Status:** Architecturally agreed; implementation pending.
This document is the canonical design that will guide the build.

## The 5 currencies

| Symbol | Currency | Driven by |
|--------|----------|-----------|
| 🔭 | **Discovery** | Field observations, GPS-tagged photos, first-finds, novel sightings |
| 🌱 | **Conservation** | Accessions, seed bank lots, propagation protocols, IUCN reassessment data |
| 📚 | **Research** | Publications, citations, peer-validated bench findings |
| 🤝 | **Stewardship** | Validation of others' work, dispute resolution, mentorship |
| 🌐 | **Network** | Brokered collaborations, translation contributions, ethnobotanical knowledge |

## Why 5, not 1?

Single-number reputation systems (h-index, Reddit karma, etc.) suffer
known pathologies:

- They reduce diverse contribution to a single dimension
- They reward gaming the chosen metric
- They privilege one archetype (in h-index: senior academics) and
  ignore others
- They cannot represent specialization

5 currencies let:
- A field photographer parlay Discovery
- A botanic garden curator parlay Conservation
- An academic researcher parlay Research
- A community moderator parlay Stewardship
- A translator parlay Network

All five are visible side-by-side. No archetype is ranked below
another.

## Total Impact (derived)

For quick comparison, a derived **Total Impact** number is shown
alongside the five sub-scores. The formula:

```
Total Impact = sum of top-3 currencies
```

This avoids penalizing specialization (a researcher with 80 📚 and 0
elsewhere still gets 80 Total, not less), while requiring at least
some breadth to score very high.

Alternative formulas considered and rejected:
- Sum of all 5 → encourages spread-thin behavior over depth
- Geometric mean → penalizes specialists too harshly
- Weighted sum → opens "why is Research × 2?" debate

Advanced users can override the formula in their profile (e.g.,
geometric mean for "well-rounded" sort).

## Tiered status

Wikipedia-style status tiers, each unlocking functional rights:

| Tier | Name | Threshold | Unlocked rights |
|------|------|-----------|-----------------|
| 0 | Observer | sign-up | reading, watching, commenting |
| 1 | Contributor | 5 validated contributions | field log, phenology, photo upload, brief response |
| 2 | Curator | 50 contribs + 5 peer endorsements | **validate others' contributions** |
| 3 | Steward | 200 contribs + community vote | dispute resolution, sealed-program graduation |
| 4 | Fellow | community + Venn annual | board seat, advisor pool, free premium |

Curator+ holders have **validation power**, which delegates trust and
scales the system without requiring Venn to validate everything.

## Three-bucket accumulation

Impact accumulates from three sources with different multipliers:

```
Bucket K1 — Historic Import (×0.6, one-time at onboarding)
  Sources: ORCID, CrossRef, iNaturalist, GBIF
  Purpose: honor prior work without giving full credit (since it
           wasn't done on platform)

Bucket K2 — Studies (×1.0, continuous)
  Source: self-declared external work, peer-validated
  Purpose: track ongoing research that doesn't fit a Program

Bucket K3 — Programs (×1.5, continuous)
  Source: structured Program work with full TIC/ring discipline
  Purpose: reward the coordination effort of formal Programs
```

A 20-year veteran with ORCID arrives with substantial K1 baseline.
They are not at zero. As they engage on platform, K2 and K3 stack on
top.

## Decay model

Three time windows, each shown:

- **Lifetime** — all-time accumulation, no decay (h-index honor)
- **Last 12 months** — recent-active signal (annual decay 20%)
- **Last 30 days** — current activity signal (no decay, just recent)

This protects veterans (lifetime preserved) while signaling whether
they're active right now.

## Mentor multiplier

When a mentee makes a contribution, their mentor receives **20%
partial credit**. This:

- Discourages senior researchers from gatekeeping
- Rewards bringing new people into the platform
- Recognizes the "I helped them get started" pattern that is
  routinely uncredited in academia

The mentor-mentee relationship is declared explicitly (not inferred)
to prevent gaming. Mentee can opt out.

## Quality multipliers

Beyond raw event counts, certain attributes multiply impact:

| Multiplier | Trigger |
|------------|---------|
| **Peer endorsement** | Curator+ marks your contribution "verified" → ×1.2 |
| **Citation/reuse** | Another Program adopts your protocol → +5 per use |
| **First-of-kind** | First contribution on a species → ×1.5 |
| **Critical species** | Working on CR/EN/VU tier → ×1.3 |
| **Underrepresented family** | Filling a sparse area → ×1.3 |
| **Cross-institutional** | Multiple-org collaboration → ×1.2 |

## Per-scope ranking

Impact is per-scope. A researcher has:

- Per-species impact (rank within all contributors to species X)
- Per-family impact (rank within family Y)
- Per-country impact (rank within country Z)
- Per-ring impact (Safeguard / Knowledge / Value)
- Global impact (rank across all species)

Different scopes serve different discovery patterns. The species page
asks "who are the top contributors for THIS species?"; the global
leaderboard asks "who are the top researchers globally?"

## Anti-gaming measures

- **Rate limits** per actor per action type
- **Validation tiers** — high-value contributions need peer or org
  rep validation
- **Decay** prevents spammy accumulation from compounding
- **Sybil protection** — one ORCID + one verified email per
  researcher
- **Transparent log** — every event publicly observable
- **Dispute mechanism** — fraudulent claims trigger penalties
- **Ban list** — repeat offenders blocked from claiming credit

## Schema (planned)

```
contribution_events
  id              uuid
  occurred_at     timestamptz
  actor_kind      researcher | organization
  actor_id        text
  event_kind      text (publication_added | protocol_committed | ...)
  currency        text (discovery | conservation | research | stewardship | network)
  base_weight     int
  multipliers     jsonb (per-multiplier breakdown)
  final_weight    int (decayed adjusted)
  scope_species_id text
  scope_family    text
  scope_genus     text
  scope_country   text
  scope_ring      text (safeguard | knowledge | value)
  evidence        jsonb
  validation      text (auto | peer_endorsed | org_validated | venn_verified)
  bucket          text (k1_historic | k2_studies | k3_programs)
  multiplier_bucket  numeric (×0.6, ×1.0, or ×1.5)

impact_scores_mv  (materialized view, refresh nightly)
  actor_kind, actor_id,
  scope_kind, scope_value,
  currency,
  total_lifetime, total_12mo, total_30d,
  rank_in_scope, percentile_in_scope
```

## RPCs (planned)

- `log_contribution(actor, event_kind, scope, evidence)`
- `validate_contribution(event_id)`
- `get_actor_impact(actor_kind, actor_id)` — full 5-currency breakdown
- `get_top_actors(scope_kind, scope_value, currency, limit)`
- `endorse_contribution(event_id)`
- `dispute_contribution(event_id, reason)`

## UI surfaces (planned)

- **Researcher profile** — 5 currency badges + total + per-scope
  rankings + activity timeline
- **Org detail** — same shape, aggregated across affiliated members
- **Species detail** — top contributors widget (5 currencies visible)
- **Family/Country detail** — same
- **Program detail** — contributors with per-program impact
- **Leaderboards route** — `/geocon/leaderboards/[scope]`
- **Badges route** — `/geocon/badges` documents how to earn each

## What to build for MVP

The minimum viable Impact Factor:

1. `contribution_events` table + 5 currency vocabulary + bucket
   multipliers
2. Triggers on existing event-producing tables (publications,
   protocols, accessions, seed lots, phenology, messages)
3. Materialized view + nightly refresh cron
4. RPCs for reading
5. Researcher profile breakdown UI
6. Species/family top-contributors widget
7. One leaderboard route (per-species)

Subsequent iterations add tiers, mentor multipliers, decay tuning,
disputes.
