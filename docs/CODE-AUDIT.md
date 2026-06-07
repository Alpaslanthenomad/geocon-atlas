# GEOCON Atlas — Prioritized Improvement Plan

From a 23-agent code-map audit (architecture · performance · simplicity /
clutter / concept-confusion). 41 findings; high-severity ones adversarially
verified. **North star: SIMPLICITY** — reduce concept confusion + visual
clutter while keeping every feature functional. Effort S/M/L · Risk low/med/high.
✅ = verified safe to act.

---

## THEME 1 — Concept Clarity & Information Architecture
*The biggest source of "kavram karmaşası". Ranked by confusion-reduction per effort.*

- **1.1 Collapse the proposal family into ONE tabbed surface.** `Proposals`,
  `Open Briefs`, `Open calls` are the SAME `collaboration_proposals` table, one
  detail page, three nouns. Make `/geocon/proposals` the single home (tabs:
  Inbound · Outbound · Open calls · Briefs · Drafts). Remove `/briefs` +
  `/proposals/open` as nav rows. M · med · Shell, ProposalsRoute, OpenCallsRoute, BriefsRoute, ProposalDetailRoute
- **1.2 Reserve "proposal" for collaboration only.** Grant Studio records are
  *applications*, not proposals. Grants → "Open grants" (find money); Grant Studio →
  "Grant applications" (write to apply). Adjacent under a "Funding" sub-header. S · low ✅
- **1.3 One name per destination across all nav surfaces.** species = "Species"/"Atlas"/"Atlas";
  calendar = "Calendar"/"Phenol". Pick one (do with 2.4 mobile-bar trim so labels fit). S · low
- **1.4 Move "Drafts" out of the entity list.** A draft is a *status*, not a peer
  of Proposals/Programs. Reframe as a personal "Continue" shortcut near Home; drop
  one of the two draft doors. S · low ✅
- **1.5 Sub-group the "Work" world** (9 flat siblings → ~5 clusters): Collaboration ·
  Projects (Programs, Thesis) · Conservation (IUCN) · Funding & impact. M · med · Shell
- **1.6 Reclaim "feed".** Three streams named feed/Live feed/Activity. Observe →
  "Observations"; merge Feed + Activity into one "What's new" with filter chips. M · med
- **1.7 Consolidate species discovery.** Species = hub; Explore (globe) + Compare =
  tabs/buttons inside it. One search affordance. Countries/families = facets. M · med
- **1.8 Clarify IUCN Hub & Thesis copy (don't merge).** Subtitle IUCN Hub
  "draft & track Red List assessments"; rename thesis status `proposal`. S · low ✅
- **1.9 Standardize Watch/Watching/Watchlist.** One verb; decide proposal-watch scope. S · low ✅
- **1.10 DEFER, don't delete, IntentRouter + persona** (verified REAL but UNSAFE to
  remove — RPCs are live). Instead make sidebar auto-expand deterministic (lock active
  world open, stop async persona re-expansion). S · low

## THEME 2 — Visual Simplicity & Clutter
*Pattern: ship 3 primitives, migrate the densest screens.*

- **2.1 Ship `<Badge>` (or adopt the unused `.gx-pill`).** `borderRadius:999` hand-built
  187× across 86 files, 7 paddings; the token-backed `.gx-pill` is used 0×. Biggest
  clutter+consistency win. L · med
- **2.2 `lib/iucn.js` (`IUCN_COLORS` + `<IucnBadge>`), delete 16 local maps.** CR renders
  as 4 different reds across screens (`#FF1744`/`#FF8B96`/`#FF6B7A`/`#E5484D`). M · med
- **2.3 Resolve 4 orphan routes** (communities, countries, families, search) —
  reachable by deep link, in no menu. Promote/demote/delete each. S · low ✅
- **2.4 Trim mobile bar to 4–5 tabs**; fix contradictory comments ("4 surfaces" but 6 tabs). S · low ✅
- **2.5 De-clutter home to ONE primary action.** ~10 widgets + competing CTAs. M · med
- **2.6 Ship `<SectionHeader>` + `<Overline>`.** uppercase rebuilt 151× across 79 files,
  drifting fontSize. M · low→med
- **2.7 Token-replace 356 hex literals that exactly equal a token.** Pixels unchanged. M · low ✅

## THEME 3 — Performance
- **3.1 Split the `ui` barrel so recharts (342 KB) stops leaking into ~24 routes.**
  `ui/index.js:13` re-exports Charts with Toast/Stat; only 2 routes chart. Move charts to
  their own module. ~90–110 KB off home/species-detail/welcome/drafts/about/field. S · low ✅
- **3.2 `dynamic(ssr:false)` the chart primitives on the 2 chart routes.** S · low ✅
- **3.3 Bound ResearchersRoute** — `fetchAllResearchers` pulls all columns of ~3,266 rows
  via paginate-everything `select('*')` on a user route. Limit it. S · low ✅
- **3.4 `experimental.optimizePackageImports: ['lucide-react']`.** S · low ✅
- **3.5 Collapse StreamTab serial round-trip** (profile→researcher → one query). S · low ✅
- **3.6 (defer) Narrow `select('*')` detail reads + batch N+1 harvest loops** (admin-only). M
- **3.7 (large, defer) Convert read-only routes to server components** (whole /geocon is `"use client"`). L

## THEME 4 — Redundancy / Dead Code  (free cleanup, verified zero-importer)
- **4.1 Delete legacy v1 program-detail subtree (9 files)** — programs/ProgramDetailPanel +
  tabs/* + modals/*. Superseded by programs/v2/. S · low ✅
- **4.2 Delete legacy ProgramsView.jsx + full-size ProgramHealthCard.jsx.** S · low ✅
- **4.3 Delete dead full-table fetch helpers** (fetchAllPublications/Metabolites/...) +
  orphaned consumers (MetaboliteExplorer, PublicationsView). S · low ✅
- **4.4 Delete orphaned components/auth/ (5 files)** — live auth is bee/AuthBar. S · med ✅
- **4.5 Delete dead admin cluster** (AdminPanel + children) — verify no mount first. S · med
- **4.6 Delete gateway/LoginScreen.jsx** — superseded by bee/EntryPanel. S · med
- **4.7 (defer) Split oversized live components** (ExploreRoute 1569, WelcomeRoute 939, …). L

## TOP QUICK WINS (do first — verified safe)
1. Split the `ui` barrel to evict recharts (3.1)
2. Delete legacy program-detail subtree + ProgramsView/HealthCard + dead fetch helpers (4.1–4.3)
3. Relabel Grants / Grant Studio; reserve "proposal" (1.2)
4. Move Drafts out of the entity list (1.4)
5. Trim mobile bar + unify labels (2.4 + 1.3)
6. Bound ResearchersRoute + optimizePackageImports lucide (3.3 + 3.4)
7. Resolve the 4 orphan routes (2.3)

Then the two keystones where felt clutter dissolves: ship `<Badge>`/`<IucnBadge>`/
`<SectionHeader>` primitives (2.1/2.2/2.6) + collapse the proposal family (1.1).

**Do NOT blindly:** delete IntentRouter / persona RPCs (live) — make expansion deterministic instead.
