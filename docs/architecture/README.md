# GEOCON Architecture Reference

This folder is the authoritative reference for the GEOCON platform's
design. It captures the architectural decisions made through extended
brainstorms with Alpaslan Sevket Acar (Venn BioVentures) during 2026.
It is intentionally verbose so that anyone — a future collaborator, a
new engineer, IUCN reviewers, partner organizations — can read it cold
and understand the WHY, not just the WHAT.

**If anything in this folder conflicts with code, the code wins for
implementation but this folder wins for intent.** Update the docs
alongside any architectural change.

---

## Contents

| Doc | Topic |
|-----|-------|
| [01 — Vision & IUCN positioning](./01-vision-and-iucn.md) | The mission, the IUCN-compliance strategy, the research-not-commerce boundary |
| [02 — Layers](./02-layers.md) | The 5-layer architecture: Commons / Programs / Studies / Briefs / Recognition |
| [03 — Programs](./03-programs.md) | Programs as collaborative R&D vehicles, N-per-species, sealed vs open |
| [04 — Open Briefs](./04-open-briefs.md) | Demand signals, 7 brief kinds, who can issue, who can respond |
| [05 — Member Agreements](./05-member-agreements.md) | Revenue + IP splits between program members, member-only visibility |
| [06 — Commercialization Recognition](./06-commercialization-recognition.md) | Citation registry for downstream products, dual-path verification |
| [07 — Accredited R&D Labs](./07-accredited-labs.md) | Venn-style accreditation extending to international labs |
| [08 — Impact Factor (5 Currency)](./08-impact-factor.md) | Multi-currency reputation system, 3-bucket model, tier ladder |
| [09 — Onboarding & Personalization](./09-onboarding-personalization.md) | ORCID-driven welcome, AI-mediated mission discovery |
| [10 — Decision Log](./10-decision-log.md) | Every settled/pending decision with reasoning |
| [QUICKREF — One-pager](./QUICKREF.md) | The whole thing in 2 pages for partners / pitch decks |

---

## How to read this

If you're an **engineer** joining the project:
1. Read [02 — Layers](./02-layers.md) first.
2. Then [03 — Programs](./03-programs.md) and [04 — Open Briefs](./04-open-briefs.md).
3. Skim the rest as needed when touching a feature.

If you're a **potential partner** (botanic garden, R&D lab, conservation NGO):
1. Read [QUICKREF](./QUICKREF.md).
2. Read [01 — Vision & IUCN](./01-vision-and-iucn.md).
3. Skim [07 — Accredited Labs](./07-accredited-labs.md) and [06 — Recognition](./06-commercialization-recognition.md).

If you're **IUCN or another standards body** evaluating GEOCON:
1. Read [01 — Vision & IUCN](./01-vision-and-iucn.md) — section "The Research-Not-Commerce Boundary" is the headline.
2. [02 — Layers](./02-layers.md) shows exactly where the boundary lives in the code.
3. The rest is implementation detail.

If you're **Alpaslan / Venn** reviewing:
1. Read [10 — Decision Log](./10-decision-log.md) — every "we agreed to X because Y" is recorded.
2. Pending items are flagged so nothing is forgotten between sessions.

---

## Source of truth

These docs are the human-readable summary. The machine-readable source
of truth is:

- **Postgres schema** — every table + RPC discussed here exists.
  Source: `supabase/` migrations (all applied via the MCP tool).
- **React components** — `components/geocon/*` and `components/programs/v2/*`.
- **Route files** — `app/geocon/*`.

If you're looking for "where is this implemented," cross-reference
the code paths called out in each section.
