# 02 — The 5 Layers

## Mental model

```
╔══════════════════════════════════════════════════════════════╗
║  L1  SPECIES COMMONS                                         ║
║      Shared facts — taxonomy, distribution, IUCN status      ║
║      Public, citable, Wikipedia-style                        ║
║      Tables: species, species_phenology (partial)            ║
╠══════════════════════════════════════════════════════════════╣
║  L2  PROGRAMS                                                ║
║      Collaborative R&D vehicles                              ║
║      N per species, team-owned, public / open / sealed       ║
║      Full pipeline: research → pilot production              ║
║      Tables: programs, program_members, program_tics,        ║
║              program_pathways, program_outputs,              ║
║              program_member_agreements                       ║
╠══════════════════════════════════════════════════════════════╣
║  L3  STUDIES (KOVA 2)                                        ║
║      Lightweight external project tracking                   ║
║      "I work on Iris off-platform; here's a stub for credit" ║
║      Tables: programs (with type="external_study")           ║
║              — modeled as a Program variant                  ║
╠══════════════════════════════════════════════════════════════╣
║  L4  OPEN BRIEFS                                             ║
║      Research demand signals (NOT a marketplace)             ║
║      7 kinds: research, conservation, capability,            ║
║               production, partner, service, idea             ║
║      Tables: collaboration_proposals.brief_kind              ║
║              + urgency + required_capabilities               ║
╠══════════════════════════════════════════════════════════════╣
║  L5  COMMERCIALIZATION RECOGNITION                           ║
║      Citation registry for downstream products               ║
║      Real commerce lives in member orgs, off-platform        ║
║      Tables: commercialized_outcomes,                        ║
║              commercialization_credits                       ║
╚══════════════════════════════════════════════════════════════╝
```

## Layer-by-layer

### L1 — Species Commons

The shared, public, citation-friendly facts about a species. Nobody
owns the commons; everyone contributes to it; everyone uses it.

**Examples of commons facts:**
- Accepted name and taxonomic synonyms
- Family, genus, country focus, native countries
- IUCN status, IUCN evaluation history
- Distribution data (from GBIF, iNaturalist)
- Common names in multiple languages
- Phenology base data
- Hero photo and gallery
- Basic morphology, life form
- Linked publications considered "general reference"

**Visibility:** Anyone can read. Authenticated users can propose edits;
high-trust users (Curator+ in the impact tier system) can validate
edits directly.

**Key design point:** When multiple Programs work on the same
species, they SHARE the commons. The commons is not owned by any one
team. This is what makes parallel programs possible without chaos
about "whose taxonomy is right."

**Where to look in code:**
- Schema: `public.species`, `public.species_phenology` (partial)
- UI: `components/geocon/SpeciesDetailRoute.jsx`
- Routes: `/geocon/species/[id]`

### L2 — Programs

Collaborative research/R&D vehicles. **A Program is a team's
territory** — they coordinate inside, they own the work product, they
decide visibility.

**Multiple programs per species are allowed.** This was a key
realization: in the real world, multiple research groups work on the
same plant in parallel, with different funders, different goals, and
no desire to share authority. The architecture must reflect that.

**Visibility modes:**
- **Public** — anyone can read, contributors require approval
- **Open** — anyone can read, anyone can contribute (Wikipedia-style)
- **Sealed** — only members read; visibility opens at graduation

**Whole research pipeline lives here**, including:
- Taxonomy clarification
- Conservation work (accessions, seed bank, protocols)
- Phytochemistry / extraction R&D
- Pre-clinical and clinical research
- Pilot production (tissue culture, cell culture)
- Cosmetic / pharmaceutical formulation R&D

**Sealed → graduation rule:** When a sealed program graduates (the
work reaches a stage worthy of public attribution), the **knowledge
contribution** becomes publicly visible. Members cannot hide knowledge
indefinitely; sealing protects work-in-progress, not eternal secrecy.

**Pathways within a Program** are axes of value (Conservation,
Phytochemistry, Cosmetic, Pharma, Production, Taxonomy). One Program
can have multiple Pathways. Different Pathways within a Program may
have different commercial trajectories — Conservation never
commercializes; Phytochemistry might.

**Where to look in code:**
- Schema: `programs`, `program_members`, `program_tics`,
  `program_pathways`, `program_outputs`, `program_member_agreements`
- UI: `components/programs/v2/*` (panel + tabs)
- Routes: `/geocon/programs`, `/geocon/programs/[id]`,
  `/geocon/programs/new`, `/geocon/programs/analytics`

### L3 — Studies (KOVA 2 — Lightweight External Project Tracking)

A researcher who has been working on Iris persica for 10 years
shouldn't have to "fit their work into our Program structure" to be
recognized. A Study is the lightweight escape hatch: declare the
work, attach linked publications and accessions, claim impact credit
at ×1.0 multiplier (vs ×1.5 for full Programs).

**Implementation choice:** rather than a separate table, Studies are
modeled as Programs with a different `entry_mode` or `type` flag.
This avoids schema sprawl and lets the same RPCs serve both. The UI
differentiates them visually but they share infrastructure.

**Upgrade path:** A Study can be promoted to a full Program at any
time, gaining the ×1.5 multiplier going forward (existing entries
keep their ×1.0 stamps for honesty).

### L4 — Open Briefs

Research demand signals from across the network. **Not a
marketplace.** No "buy now" buttons, no checkout, no payment. A Brief
is a structured request that connects someone who needs something
done (research, conservation data, lab capability, formulation
expertise) with the people who can do it.

**7 brief kinds:**

| Kind | Example |
|------|---------|
| 🧪 research_brief | "Characterize compound X from species Y" |
| 🌱 conservation_brief | "50 species need IUCN reassessment data" |
| 🛠 capability_brief | "Lab with supercritical CO2 extraction" |
| 📦 production_brief | "Pilot tissue culture partner needed" |
| 🤝 partner_brief | "Formulation expertise for cosmetic R&D" |
| 🔬 service_brief | "Run HPLC batch on these samples" |
| 💡 idea_brief | "AI suggests combining Programs A and F" |

**Who can issue briefs:**
- In-platform researchers and programs
- Organizations (academic and private)
- The system itself, via AI pattern detection
- Venn / operator

**Who can respond:**
- Existing Programs (with capability claim)
- Ad-hoc teams forming around the brief
- AI-suggested team combinations (Venn approves)

**Urgency tags:** urgent / high / normal / low — used for sorting and
notifications. Urgent briefs surface prominently and may trigger
push notifications to capability-matched members.

**Required capabilities** is a structured `text[]` field. Capability
vocabulary is shared with `organizations.rd_specializations` so an
accredited R&D lab's profile naturally matches against briefs that
need its skills.

**Why "Open Briefs" not "Marketplace":**

Alpaslan explicitly rejected "Marketplace" terminology — it implies
a shopping mall, financial transactions, commercial focus.
"Open Briefs" sits in the tradition of government tender notices, RFP
boards, and academic call-for-papers — research-coded, professional,
non-commercial in feel.

**Where to look in code:**
- Schema: `collaboration_proposals.brief_kind`, `.urgency`,
  `.required_capabilities`, `.issued_on_behalf_of_org`
- RPC: `list_open_briefs(kinds[], urgencies[], capability, limit, offset)`
- UI: `components/geocon/BriefsRoute.jsx`
- Route: `/geocon/briefs`

### L5 — Commercialization Recognition

The bridge layer. When a member organization launches a commercial
product, files a patent, signs a licensing deal, or runs a clinical
trial based on work from a GEOCON Program, **the member org declares
a Commercialization Outcome**.

This declaration:
- Lists the launching organization
- Names the originating program and/or species
- Categorizes the outcome (product / patent / license / clinical_trial
  / service / pilot_partnership / other)
- Provides an external link (product page, patent number, DOI)
- Enumerates contributor credits

**Verification ladder:**

1. **self_declared** — a contributor claims credit; lowest trust
2. **peer_endorsed** — 3 peer endorsements; promoted from self_declared
3. **org_declared** — the launching org's rep/admin declared; high trust
4. **venn_verified** — Venn admin verified; highest trust

**Dual-path origination** (per Alpaslan's "Both" decision):

- **Org-launched:** the launching org's rep declares the outcome and
  lists contributors. Auto-verification = `org_declared`.
- **Contributor-claimed:** a researcher self-declares "I contributed to
  this product"; needs peer endorsements to promote.

**No money flows through this layer.** It is a citation registry.
The launching org runs the actual commerce — pricing, sales,
distribution, royalty distribution — through its own legal and
banking infrastructure. GEOCON only records who contributed and
displays the 💎 Commercialization Recognition badge on contributor
profiles and species pages.

**Where to look in code:**
- Schema: `commercialized_outcomes`, `commercialization_credits`
- RPCs: `declare_commercialized_outcome`,
  `claim_commercialization_credit`,
  `endorse_commercialization_credit`,
  `list_commercialized_outcomes`
- UI: `components/geocon/CommercializedOutcomes.jsx`
- Mounted on: Species detail, Org detail, Researcher detail (planned)

## How the layers compose in practice

Walk through Alpaslan's reference scenario:

```
Crocus mathewii — endemic to Turkey, CR-tier

L1 Commons:
  - Family: Iridaceae
  - IUCN: CR
  - 4 contributors on taxonomy
  - 12 contributors on distribution (GBIF + iNat federated)

L2 Programs (3 active):
  A. "Anatolian Crocus Conservation"
     Members: Ada Biyoteknoloji + 4 botanic gardens
     Pathways: Conservation, Propagation
     Visibility: Public
     Member Agreement: yes (active, members-only)
  
  B. "Crocus Saffron Compound R&D"
     Members: SkinLab Türkiye + Vitalcore + 2 academic partners
     Pathways: Phytochemistry, Cosmetic
     Visibility: Sealed
     Member Agreement: yes (active, members-only)
  
  C. "Crocus Taxonomic Revision"
     Members: Prof. Atılgan (solo)
     Pathways: Taxonomy
     Visibility: Open (invites accepted)

L3 Studies:
  7 lightweight studies registered

L4 Open Briefs (active):
  - capability_brief: "GMP-grade extraction capacity" by Program B
  - conservation_brief: "Field photography in Eastern Anatolia"
    by Venn (€500 bounty)

L5 Commercialization Recognition:
  - "Mathewii Skin Serum 2027" by SkinCare Lab Inc.
    Outcome kind: product. External link: skinlab.example/serum.
    Contributors: 6 (3 researchers + 3 orgs)
    Verification: org_declared
  - "Crocus Bulb Propagation Method" patent by Botanical Holdings B.V.
    Outcome kind: patent. External link: PCT/EP2027/...
    Contributors: 4
    Verification: peer_endorsed
```

Each layer is independent but interconnected. A contributor's profile
aggregates across all 5 layers; a species page surfaces all 5; a
program page focuses on L2 with pointers outward.

---

**Next:** [03 — Programs](./03-programs.md) goes deep on how Programs
work, what their tabs do, and how the v2 panel is structured.
