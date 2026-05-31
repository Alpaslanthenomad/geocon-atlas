# 06 — Commercialization Recognition

When work that originated in a GEOCON Program reaches a commercial
endpoint — a product launches, a patent is granted, a license is
signed, a clinical trial begins — the launching organization
declares a **Commercialization Outcome**, and contributors are
credited.

This is a **citation registry**, not a transaction system. GEOCON
records who contributed; the launching organization runs the
actual commerce.

## Outcome kinds

| Kind | Symbol | Description |
|------|--------|-------------|
| `product` | 🧴 | A consumer or B2B product (cream, supplement, plant material) |
| `patent` | 📜 | A granted patent or published application |
| `license` | 🔑 | A licensing agreement signed off-platform |
| `clinical_trial` | 🧪 | A registered clinical trial commencing |
| `service` | 🔬 | A productized service or testing offering |
| `pilot_partnership` | 🤝 | A formal pilot-scale industrial partnership |
| `other` | ✦ | Anything else worth crediting |

## Verification ladder

```
self_declared      ← initial state for any non-org-rep declaration
  ↓ 3 endorsements
peer_endorsed      ← community-validated
  ↓ org rep takes ownership
org_declared       ← launching org's rep declared it
  ↓ Venn admin confirms
venn_verified      ← highest trust
```

The verification level is set automatically by the RPC based on the
caller's role:

```
caller is Venn admin?            → venn_verified
caller is rep/admin of org?      → org_declared
otherwise                        → self_declared
```

Self-declared outcomes can be promoted to peer_endorsed once 3
endorsements accumulate (see `endorse_commercialization_credit`).

## Dual-path declaration

Per [D-008](./10-decision-log.md#d-008-commercialization-recognition-dual-path-origin),
both paths are supported:

**Path A — Org-led declaration:**
The launching organization's rep / admin declares the outcome on
their org's behalf. This is the canonical path and yields
`org_declared` verification.

```javascript
await supabase.rpc("declare_commercialized_outcome", {
  p_program_id: "...",
  p_species_id: "GEO-TR-...",
  p_outcome_kind: "product",
  p_title: "Mathewii Skin Serum 2027",
  p_description: "Cosmetic cream featuring sustainably-produced ...",
  p_external_url: "https://skinlab.example/serum",
  p_launched_by_org: "<org uuid>",
  p_launched_on: "2027-03-15",
  p_initial_credits: [
    { contributor_kind: "researcher", contributor_id: "...",
      contribution_note: "propagation protocol" },
    { contributor_kind: "organization", contributor_id: "...",
      contribution_note: "pilot tissue culture" },
  ],
});
```

**Path B — Contributor self-claim:**
A researcher who contributed to a product/patent declares their
credit themselves. Initial state is `self_declared`. They can ask
peers to endorse; 3 endorsements promote.

```javascript
await supabase.rpc("claim_commercialization_credit", {
  p_outcome_id: "<existing outcome uuid>",
  p_contributor_kind: "researcher",
  p_contributor_id: "<researcher uuid>",
  p_contribution_note: "Designed the supercritical extraction protocol",
});
```

For Path B, the outcome must already exist (declared by someone — the
launching org, an admin, or another contributor). Path B does NOT
let an arbitrary person invent a new outcome out of thin air.

## Schema

```
commercialized_outcomes
  id              uuid
  program_id      uuid → programs.id  (nullable)
  species_id      text  → species.id  (nullable)
  outcome_kind    enum (see above)
  title           text
  description_md  text
  external_url    text (product page, patent number, DOI, ...)
  launched_by_org uuid → organizations.id  (nullable)
  launched_on     date
  declared_by     uuid (auth.uid)
  declared_at     timestamptz
  verification    enum (self_declared / peer_endorsed / org_declared / venn_verified)
  endorsed_at     timestamptz
  endorsement_count int

commercialization_credits
  id                  uuid
  outcome_id          uuid → commercialized_outcomes.id
  contributor_kind    researcher | organization
  contributor_id      text (researcher uuid OR org uuid)
  contribution_note   text
  origin              self_declared | org_declared | admin_added
  endorsements        int
  endorsed_by_user_ids uuid[]
  created_by          uuid
  created_at          timestamptz
  UNIQUE (outcome_id, contributor_kind, contributor_id)
```

Outcomes and credits are PUBLIC reads (anyone can see who contributed
to what); writes are gated to declared_by + org reps + admin.

## Where credits appear

- **Species detail page** — list of commercialized outcomes for this
  species, with their contributors collapsed
- **Program detail page** — outcomes that emerged from this program
- **Organization detail page** — outcomes the org launched +
  outcomes where the org is credited as contributor
- **Researcher profile page** — outcomes where the researcher is
  credited (planned)
- **Contributor's profile** displays a 💎 Commercialization
  Recognition badge cluster, one per outcome

## Anti-fraud measures

- A self-declared credit requires 3 peer endorsements to be visible
  in counts beyond a "needs review" state
- Endorsements are tracked per user (`endorsed_by_user_ids`); the same
  user cannot double-endorse
- Org rep / admin declarations are auto-verified, but their
  legitimacy is observable (anyone can see who declared what)
- Disputes can be filed (planned mechanism) and a Steward+ user can
  remove a credit

## What we explicitly DO NOT do

- ❌ Hold revenue
- ❌ Calculate payouts
- ❌ Issue royalty statements
- ❌ Mediate IP disputes
- ❌ File patents in GEOCON's name
- ❌ Sell products through GEOCON
- ❌ Take any commission

Per [D-001](./10-decision-log.md#d-001-geocon-is-research-only-commerce-is-off-platform),
those activities happen entirely in the launching organization's
domain.

## Files

- **Schema migration:** `programs_layer_foundation`
- **Backend RPCs:** `declare_commercialized_outcome`,
  `claim_commercialization_credit`,
  `endorse_commercialization_credit`,
  `list_commercialized_outcomes`
- **UI panel:** `components/geocon/CommercializedOutcomes.jsx`
- **Mounted on:** Species detail, Org detail; Researcher detail
  pending
