# 05 — Member Agreements

A Member Agreement is the **private contract among program members**
that defines revenue percentages, IP shares, and roles. It is the
basis for how downstream commercialization proceeds are divided when
work matures off-platform.

## Critical positioning

- **GEOCON holds no funds**. It records the agreement text, parses
  the splits, displays them to members. It does not escrow money,
  process payments, or enforce splits.
- **The launching member organization runs the actual payout** through
  its own banking and accounting. Member Agreement is its
  pre-arranged sharing instruction.
- **Outsiders see only existence**. The pill "🔐 Agreement on file"
  appears for non-members. The splits, terms, IP clause, and dispute
  clause are visible only to active program members and the program
  owner.

## Schema

```
program_member_agreements
  id              uuid
  program_id      uuid → programs.id
  version         int (auto-incrementing per program)
  status          draft | active | superseded | dissolved
  terms_md        text (markdown)
  splits          jsonb (array of split records)
  ip_clause       text (free-form clause text)
  dispute_clause  text
  created_by      uuid (auth.uid)
  created_at      timestamptz
  activated_at    timestamptz
  superseded_at   timestamptz
```

**Splits JSON format:**

```json
[
  {
    "actor_kind": "organization" | "researcher",
    "actor_id": "<uuid or text id>",
    "actor_label": "Display label (e.g. 'Ada Biyoteknoloji')",
    "role": "lead" | "partner" | "service" | "advisor",
    "revenue_share_pct": 0-100,
    "ip_share_pct": 0-100
  },
  ...
]
```

Totals are not enforced (a draft can be at 100% allocation or 90% or
110%); the UI shows the running total for review.

## Visibility (RLS)

The Postgres Row Level Security policies enforce member-only reads:

```sql
CREATE POLICY pma_member_read ON public.program_member_agreements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.program_members pm
       WHERE pm.program_id = program_member_agreements.program_id
         AND pm.researcher_id = (
           SELECT researcher_id FROM public.profiles WHERE id = auth.uid()
         )
    )
    OR EXISTS (
      -- program owner can read even if not listed as a member
      SELECT 1 FROM public.programs p
       WHERE p.id = program_member_agreements.program_id
         AND p.created_by = (
           SELECT researcher_id::text FROM public.profiles WHERE id = auth.uid()
         )
    )
  );
```

Outsiders cannot read the row. The existence probe is exposed via a
SECURITY DEFINER RPC `program_agreement_exists()` that returns only
boolean.

## Lifecycle

```
DRAFT
  ↓ owner activates
ACTIVE  ← only one active per program at a time
  ↓ owner activates a NEW version
SUPERSEDED  (prior active becomes superseded automatically)
  ↓
DISSOLVED (terminal)
```

`upsert_program_member_agreement(p_program_id, p_terms_md, p_splits,
p_ip_clause, p_dispute_clause, p_activate)`:

- If `p_activate=true`, supersedes any current active version.
- Creates a new version row at version = max(version) + 1.

Old versions are retained for audit. They become invisible to
outsiders via the same RLS rules.

## What's in a Member Agreement (typical structure)

A practical Member Agreement document covers:

1. **Splits** — revenue % and IP % per actor, with role label
2. **Terms** — duration, scope of program (what work is in scope),
   when the agreement triggers
3. **IP clause** — what IP is in scope (knowledge, protocols, lab
   data), default ownership stance, licensing-back to member orgs
4. **Dispute clause** — how disputes are resolved, jurisdiction,
   arbitration vs court

GEOCON does not enforce any of this. Member orgs sign and execute it
under their own legal authority.

## Why we even record this

Reasons to store the agreement at all (vs leaving it entirely
off-platform):

- **Member trust** — having a member-visible agreement record
  reassures contributors that the deal is structured
- **Outsider transparency-of-existence** — "this program has agreed
  splits" signals seriousness to potential partners
- **Audit trail** — if a dispute happens later, the platform record
  shows what was active when
- **Onboarding new members** — when someone joins an existing
  program, they can read the current agreement to understand the
  arrangement before agreeing to join

## What we explicitly DO NOT do

- ❌ Hold any money
- ❌ Enforce splits at payout time
- ❌ Issue invoices
- ❌ Generate tax documents
- ❌ Sign agreements electronically on behalf of members (no e-sign)
- ❌ Mediate disputes
- ❌ Notify members of payment events

All of those happen in the launching org's domain.

## What to build next

- Pre-set template generator (lead / partner / service / advisor with
  sensible default % distribution; user adjusts)
- Member sign-on workflow (each listed member acknowledges they've
  read the active version)
- Diff view between versions
- Export to PDF for off-platform legal signing
- Webhook notifications when an agreement is activated (members get
  pinged)

## Reference UI

- **Panel:** `components/programs/v2/MemberAgreementPanel.jsx`
- **Mounted in:** `components/programs/v2/HeroPanel.jsx`
- **Outsider pill:** also rendered by `MemberAgreementPanel` based on
  the existence RPC result
