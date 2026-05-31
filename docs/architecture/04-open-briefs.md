# 04 — Open Briefs

Open Briefs are **research demand signals**. They are NOT a
marketplace. No checkout, no payment, no commercial transaction
flows through them.

## Brief kinds

| Kind | Symbol | Use | Example |
|------|--------|-----|---------|
| `research_brief` | 🧪 | A research question that needs work | "Characterize the saffron pigment profile of Crocus mathewii" |
| `conservation_brief` | 🌱 | Conservation data or action needed | "Field reassessment of 50 Iridaceae taxa in Eastern Anatolia" |
| `capability_brief` | 🛠 | A specific lab capability sought | "Supercritical CO2 extraction partner for plant material" |
| `production_brief` | 📦 | Pilot or scale-up production needed | "Pilot tissue culture for 5,000 Crocus mathewii corms" |
| `partner_brief` | 🤝 | Strategic R&D partner sought | "Cosmetic formulation expertise for natural extract" |
| `service_brief` | 🔬 | One-off analytical service | "HPLC batch on 30 samples" |
| `idea_brief` | 💡 | AI-suggested synergy or opportunity | "Combine Programs A and F for Iridaceae phytochemistry sprint" |

## Who can issue a brief

- **A researcher** within a Program (proxying for that Program)
- **An organization** (issued by an org rep)
- **The AI** (Venn-approved synthesis from platform signals)
- **Venn / operator** (conservation bounties, anchor briefs)

## Who can respond

- An **existing Program** with matching capability claim
- An **ad-hoc team** that forms in response (members assemble around
  the brief)
- An **AI-suggested team** combination (Venn-approved)
- An **individual researcher** (uncommon but allowed)

## Schema

`collaboration_proposals` table (existing) extended with:

- `brief_kind text` — one of the 7 kinds; NULL for legacy proposals
- `urgency text` — low / normal / high / urgent
- `required_capabilities text[]` — vocabulary shared with
  `organizations.rd_specializations`
- `issued_on_behalf_of_org uuid` — optional org attribution

Existing proposal columns reused:
- `title`, `description`, `subject_kind`, `subject_refs`,
  `initiator_actor_kind`, `initiator_actor_id`, `created_at`,
  `expires_at`, `status`

## Lifecycle

```
DRAFT
  ↓
SENT (active brief, discoverable)
  ↓
NEGOTIATING (responses arrived, in discussion)
  ↓
ACCEPTED (a respondent selected)
  ↓ continues in Program work
```

`DECLINED`, `WITHDRAWN`, `EXPIRED` are terminal.

## Discovery

The dedicated route `/geocon/briefs` filters briefs by:

- `brief_kind` chips (multi-select)
- `urgency` tags (multi-select)
- Required capability (text search)

Briefs sort by urgency first, then `created_at desc`.

The underlying RPC is `list_open_briefs(kinds[], urgencies[],
capability, limit, offset)`. Discovery is public.

## What's still to build

- **Brief composer** (`/geocon/briefs/new`) — currently only listing,
  not creation
- **Response flow** — a structured "I/we want to take this brief"
  action with required capability disclosure
- **AI matchmaker** — suggest team combinations for a brief based on
  platform-wide capability profiles
- **Notification rules** — surface urgent briefs to capability-matched
  members
- **Conservation bounty mechanics** — briefs with a budget bound to a
  Venn-funded anchor

## Capability vocabulary (shared)

The `required_capabilities[]` field on briefs uses the same vocabulary
as `organizations.rd_specializations[]`. Capability terms include:

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

The vocabulary is intentionally small and curated. New entries should
be added via PR rather than freeform.
