# GEOCON Architecture Reference

> **Authority warning:** This folder contains target, transitional, legacy, historical,
> dormant, and reverted documents. **Do not treat every file here as equal authority.**

This folder captures design decisions, implementation history, and salvage material
from extended brainstorms with Alpaslan Sevket Acar (Venn BioVentures) during 2026.
It is intentionally verbose so that anyone — a future collaborator, a new engineer,
IUCN reviewers, partner organizations — can read it cold and understand context.

---

## Read first

1. [GEOCON_AI_REFERENCE_LOCK.md](./GEOCON_AI_REFERENCE_LOCK.md) — target/repo distinction, BEE layer model, current priority.
2. [GEOCON_BEE_AI_AUDIT_PROTOCOL.md](./GEOCON_BEE_AI_AUDIT_PROTOCOL.md) — cross-AI operating protocol.
3. [GEOCON_LEGACY_DOCS_SALVAGE_MAP.md](./GEOCON_LEGACY_DOCS_SALVAGE_MAP.md) — legacy doc classification and salvage mapping.
4. [INDEX.md](./INDEX.md) — classified map of all docs in this folder.

---

## Source of truth (updated)

**Architectural authority** is defined by the lock file, audit protocol, and salvage
map — plus the current-only archive baseline (`GEOCON_BEE_Current_Only_Archive_v4_5.zip`).

**Older docs in this folder** may still be useful as technical salvage (RPC names,
firewall rules, table inventories) but are not automatic target architecture.

**Code** is implementation reality — what is shipped today — not automatic proof of
what GEOCON should become. When code and target architecture diverge, prefer target
migration planning over treating shipped UI as final intent.

```text
repo reality ≠ target architecture
```

When updating docs alongside a change, distinguish whether you are documenting
target architecture, transitional implementation, or salvage notes.

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
1. Read [GEOCON_AI_REFERENCE_LOCK.md](./GEOCON_AI_REFERENCE_LOCK.md) and [GEOCON_BEE_AI_AUDIT_PROTOCOL.md](./GEOCON_BEE_AI_AUDIT_PROTOCOL.md) first.
2. Read [INDEX.md](./INDEX.md) for classified doc map.
3. Use [02 — Layers](./02-layers.md) and [03 — Programs](./03-programs.md) as **transitional repo reality** — not final target architecture (see salvage map).
4. Skim the rest as needed when touching a feature; check classification tags in INDEX.

If you're a **potential partner** (botanic garden, R&D lab, conservation NGO):
1. Read [QUICKREF](./QUICKREF.md) — **legacy/transitional** quick reference pending rewrite.
2. Read [01 — Vision & IUCN](./01-vision-and-iucn.md).
3. Skim [07 — Accredited Labs](./07-accredited-labs.md) and [06 — Recognition](./06-commercialization-recognition.md).

If you're **IUCN or another standards body** evaluating GEOCON:
1. Read [01 — Vision & IUCN](./01-vision-and-iucn.md) — section "The Research-Not-Commerce Boundary" is the headline.
2. [02 — Layers](./02-layers.md) shows where the boundary lives in the **transitional** model; revalidate against lock file for target framing.
3. The rest is implementation detail or salvage material.

If you're **Alpaslan / Venn** reviewing:
1. Read [10 — Decision Log](./10-decision-log.md) — every "we agreed to X because Y" is recorded.
2. Pending items are flagged so nothing is forgotten between sessions.

---

## Machine-readable implementation reference

These docs are the human-readable summary. Implementation reality lives in:

- **Postgres schema** — every table + RPC discussed here exists.
  Source: `supabase/` migrations (all applied via the MCP tool).
- **React components** — `components/geocon/*` and `components/programs/v2/*`.
- **Route files** — `app/geocon/*`.

If you're looking for "where is this implemented," cross-reference
the code paths called out in each section. Do not infer target architecture
from code paths alone.
