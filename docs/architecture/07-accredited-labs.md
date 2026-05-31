# 07 — Accredited R&D Labs

Beyond Vitalcore (Venn's primary R&D engine), **any qualified
research-and-development lab in any country** can be accredited by
Venn BioVentures. Accredited labs become deep network partners,
participating as members in multiple Programs and responding to
capability briefs across the platform.

## What accreditation is

Accreditation is a **Venn-issued recognition** that a lab:

1. Has documented R&D capabilities in specific domains
2. Operates under transparent governance
3. Agrees to a baseline set of conduct standards (ethics, quality,
   non-disclosure where appropriate, conservation alignment)
4. Will participate honestly in the GEOCON impact and recognition
   system

It is **NOT** a commercial relationship. Accreditation does not pay
Venn anything; Venn does not pay the lab. Both parties commit to the
accreditation standard as a precondition for participating as an
accredited lab.

## What accreditation enables

An accredited lab can:

- Declare its `rd_specializations` and be discoverable by capability
  searches
- Respond to capability_brief / production_brief / service_brief
  briefs with elevated trust signaling
- Be cited in Member Agreements with confidence (the badge means
  something)
- Receive direct invitations from Venn for anchor projects
- Use the platform's standardized contributor agreement templates
- Participate in cross-lab consortia for large briefs

## How it works in the schema

We leverage the existing org accreditation flow ([Sprint E1](#)). The
key columns:

```
organizations
  ...
  tier                   text   ← free | accredited | premium | steward
  accreditation_status   enum   ← applied | under_review | accredited | declined | revoked
  accreditation_level    enum   ← basic | partner | preferred
  accreditation_scope    text[] ← scope tags
  accreditation_evidence jsonb
  accreditation_notes    text
  accreditation_applied_at        timestamptz
  accreditation_reviewed_at       timestamptz
  accreditation_reviewed_by       uuid
  accreditation_internal_notes    text
  ...
```

New columns added in `programs_layer_foundation`:

```
organizations
  lab_country         text         ← ISO-3166-1 alpha-2 where the lab operates
  rd_specializations  text[]       ← capability vocabulary
```

## Accreditation levels

- **basic** — verified existence, declared capabilities, basic conduct
  agreement
- **partner** — sustained activity, multiple successful brief
  responses, peer-validated
- **preferred** — long-standing relationship with Venn, anchor-grade
  reliability

## Capability vocabulary

The `rd_specializations[]` column uses the same vocabulary as
`collaboration_proposals.required_capabilities[]`. Current vocabulary:

- tissue_culture
- cell_culture
- supercritical_extraction
- solvent_extraction
- hplc
- gc_ms
- nmr
- pilot_production
- clinical_research
- formulation
- propagation
- field_survey
- taxonomy_revision
- herbarium_archival
- iucn_assessment
- seed_storage
- cryopreservation
- patent_drafting
- translation_botanical

New entries are added via PR.

## The accreditation flow

```
1. Org rep registers organization on GEOCON (existing flow)
2. Org rep fills lab_country and rd_specializations
3. Org rep applies for accreditation via apply_for_org_accreditation
   - Provides evidence (lab profile, equipment list, prior work)
4. accreditation_status = 'applied'
5. Venn admin reviews via /geocon/admin (AccreditationQueue)
6. Admin marks under_review or proceeds to decision
7. accredit_organization or reject_org_accreditation
8. Accredited lab now visible in capability searches with trust badge
```

## Country distribution

The `lab_country` column lets the platform answer questions like:

- "What accredited tissue culture labs are in Turkey?"
- "How many accredited labs are in Iran?"
- "Which countries are underrepresented in our network?"

This supports both partner discovery and Venn's strategic decisions
about where to seek new accreditations.

## Reference UI

- **Org detail accreditation status banner:** `components/geocon/AccreditationBanner.jsx`
- **Apply flow modal:** `components/geocon/ApplyForAccreditationModal.jsx`
- **Admin review queue:** in `AdminRoute.jsx`
- **R&D capability editor:** planned (see backlog)

## What's missing

- **R&D lab capability editor** on org detail page — currently
  capabilities can only be set via admin SQL; needs an org-rep-facing
  UI to declare specializations
- **Capability search route** — accredited labs aren't yet listed by
  capability in a discoverable way
- **Accreditation standard document** — the actual standard text
  needs to be published (in `docs/standards/accreditation.md`)
- **Standardized accreditation review checklist** — for the Venn
  admin to use consistently
