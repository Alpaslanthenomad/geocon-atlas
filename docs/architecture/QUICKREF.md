# GEOCON Quick Reference

*One-page version of the full architecture. For partners, pitch decks,
and "what is GEOCON, really?" conversations.*

---

## What it is

**GEOCON Atlas is a collaborative research platform for endemic
geophyte plants (bulbs, corms, rhizomes, tubers).** It coordinates
scientific work — taxonomy, conservation, R&D, pilot production,
clinical research — across a global network of researchers, botanic
gardens, seed banks, accredited labs, and conservation NGOs.

**GEOCON is research, not commerce.** Member organizations operate
their own commercial activities through their own legal structures
outside the platform. GEOCON records who contributed to what; the
launching organization runs the actual product/patent/license.

This separation is intentional and structural: it keeps GEOCON
IUCN-compatible while still rewarding members whose work ultimately
generates economic value.

---

## The 5 layers

```
L1  Species Commons        Shared taxonomic / distribution / IUCN facts
                           Public, citable, like Wikipedia for geophytes

L2  Programs               Collaborative R&D vehicles
                           N per species, team-owned, public/open/sealed
                           Whole research → pilot pipeline lives here

L3  Studies                Lightweight external project tracking
                           "I work on Iris off-platform" — gets credit

L4  Open Briefs            Demand signals: research, conservation,
                           capability, production, partner, service, idea
                           NOT a marketplace — a research bulletin board

L5  Commercialization      Citation registry of products / patents /
    Recognition            licenses launched FROM platform work
                           Real commerce happens off-platform
```

Money never flows through GEOCON. Patents are never filed by GEOCON.
Products are never sold by GEOCON. Members run those activities through
their own organizations.

---

## How the layers connect

- A **researcher** joins → optionally imports their history via
  ORCID/CrossRef/iNat/GBIF (one-time historic credit at 0.6× rate).
- They **start or join Programs** (L2), or register lightweight
  **Studies** for external work (L3).
- They post or respond to **Open Briefs** (L4) — research, conservation,
  capability needs from across the network.
- When a Program produces work that becomes a **commercial product**
  (cosmetic, pharma, plant material) — outside GEOCON, in a member org —
  a **Commercialization Recognition** record (L5) cites the
  contributors, who get a 💎 badge in their profile.
- A **Member Agreement** (revenue %, IP %, role per actor) sits inside
  each Program; only members see the splits, outsiders just see "🔐
  Agreement on file."

---

## Impact Factor (5-currency reputation)

Researchers and organizations accumulate impact across **5 currencies**:

| Symbol | Currency | Driven by |
|--------|----------|-----------|
| 🔭 | Discovery | observations, photos, novel finds, GPS records |
| 🌱 | Conservation | accessions, seed bank lots, propagation protocols, IUCN reassessment data |
| 📚 | Research | publications, citations, peer-validated findings |
| 🤝 | Stewardship | validation, dispute resolution, mentorship |
| 🌐 | Network | brokering collaborations, translation, ethnobotanical knowledge |

Plus a derived **Total Impact** number (Top-3 sum) for quick
comparison. Decay is dual: lifetime + last-12-months + last-30-days.

Tiered status (Wikipedia-style): Observer → Contributor → Curator →
Steward → Fellow. Curator+ get **validation power** (delegate trust).

Mentor multiplier: when your mentee makes a contribution, you get 20%
partial credit. Discourages gatekeeping, rewards growing the
community.

---

## Three-bucket impact accumulation

| Bucket | Multiplier | Source | One-time? |
|--------|-----------|--------|-----------|
| **K1 Historic Import** | ×0.6 | ORCID, CrossRef, iNat, GBIF | Yes, at onboarding |
| **K2 Studies** (external) | ×1.0 | Self-declared, peer-validated, off-platform | Continuous |
| **K3 GEOCON-native Programs** | ×1.5 | Native programs with full structure | Continuous |

A 20-year veteran does NOT start at zero. Their ORCID work is
recognized immediately.

---

## Open Briefs (the demand board)

| Kind | What it is |
|------|-----------|
| 🧪 research_brief | "Characterize compound X from species Y" |
| 🌱 conservation_brief | "50 species need IUCN reassessment data" |
| 🛠 capability_brief | "We need a lab that does supercritical CO2 extraction" |
| 📦 production_brief | "Pilot tissue culture partner needed" |
| 🤝 partner_brief | "Formulation expertise for cosmetic R&D" |
| 🔬 service_brief | "Run HPLC batch on these samples" |
| 💡 idea_brief | "AI suggests: combine Programs A+F for synergy" |

Briefs can be issued by: in-platform researchers, organizations, the
system (AI), or Venn itself. Responses come from existing Programs,
ad-hoc teams, or AI-suggested combinations.

---

## Accredited R&D Labs

Beyond Vitalcore, **any qualified R&D lab in any country** can be
Venn-accredited and become a deep network partner. They:

- Declare `lab_country` and `rd_specializations[]` (tissue_culture,
  cell_culture, hplc, gc_ms, supercritical_extraction, formulation,
  clinical_research, propagation, etc.)
- Apply for accreditation through the existing org accreditation flow
- When accredited, become discoverable for capability_brief responses
- Can be members of multiple Programs simultaneously

---

## The IUCN compliance narrative

> GEOCON is a research and conservation coordination platform. It
> facilitates scientific collaboration, citation, and discovery for
> endemic geophyte plants. Member organizations conduct their own
> commercial activities (when any) through their own independent legal
> structures, entirely outside the platform. GEOCON does not file
> patents, sell products, hold escrow, or take commissions on member
> commerce. It maintains a citation registry of commercialization
> outcomes for proper attribution, exactly as academic publishers
> maintain citation indices.

This is true at the architectural level and enforceable at the
database level (no money columns, no escrow tables, no commission
ledger).

---

## What's built today

- Species Commons + Atlas browse
- Programs v2 (Foundation → Field & Lab → Pathways → Outputs → Stream)
- Open Briefs schema + discovery route
- Member Agreement schema + member-only RLS
- Commercialization Recognition tables + dual-path declaration
- Accredited lab schema extension
- Onboarding checklist, watchlist, saved searches
- 5-currency impact factor: **schema not yet wired** — designed
- ORCID onboarding: **planned**

---

## What's coming next

1. ORCID-driven welcome experience + AI mission discovery
2. Brief composer UI (`/geocon/briefs/new`)
3. R&D lab capability editor on org detail
4. Personal Recognition panel on researcher profile
5. 5-currency impact factor: tables + event triggers + leaderboards

See [ROADMAP](../ROADMAP.md) (TODO) for sequencing.

---

## Contacts

**Operator:** Venn BioVentures OÜ (Estonia) — Alpaslan Sevket Acar
**Technical:** see `package.json` maintainers
**Public site:** https://geocon-atlas.vercel.app
