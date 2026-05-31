# 09 — Onboarding & Personalization

The first five minutes on GEOCON determine whether a new arrival
stays. This document captures the design for an
**ORCID-driven, AI-mediated welcome flow** that:

1. **Honors their past** — auto-imports prior work and assigns
   baseline impact
2. **Orients them quickly** — surfaces relevant programs, briefs, and
   peers
3. **Reduces loneliness** — a personalized greeting, not a blank
   dashboard
4. **Builds mission** — helps them set goals and visualize next steps

**Status:** Design agreed in 2026-05-31 session. Implementation
pending.

## Vision

> "When someone joins via ORCID, the platform should recognize them
> instantly: 'Welcome — your work on Iridaceae over the last 12 years
> is valuable. Here are three programs that would benefit from your
> expertise. Here are two briefs that match your skills. Here's
> what you might build going forward.'"

The opposite of what we want: a generic dashboard with empty tables,
no personalization, no welcome. That makes anyone — but especially
established researchers — bounce immediately.

## The flow

### Step 1: Sign in with ORCID

Replaces (or augments) email/password signup. Single click sends
the user to ORCID, returns with verified ID + email + name + employment
+ public works.

```
User clicks "Sign in with ORCID"
  → Redirect to orcid.org/oauth/authorize?...
  → User authorizes
  → Callback to /api/auth/orcid/callback
  → Server pulls profile via public API
  → Server creates/links profile row + researcher row
  → User lands on /geocon/welcome
```

### Step 2: Background enrichment

While the user is on the welcome screen, the server does in parallel:

- Pull all works from ORCID public-API (publications, presentations,
  patents)
- For each work with a DOI, fetch CrossRef metadata (title, authors,
  journal, year, abstract)
- Lookup iNaturalist username if discoverable (match on name + email
  domain hints)
- Lookup GBIF profile by ORCID
- AI synthesis: feed all data to Claude, ask for:
  - Primary specialty (e.g., "Iridaceae taxonomy in southwest Asia")
  - Secondary specialties
  - Active species (top 10 the user has worked on)
  - Career stage estimate

### Step 3: Baseline impact import (K1 bucket)

Apply the 0.6× multiplier and create `contribution_events` for:

- Each publication → 📚 Research, scope by species/genus/family
  extracted from title/abstract
- Each iNaturalist observation → 🔭 Discovery, scoped to species
- Each GBIF record → 🌱 Conservation, scoped to species/country
- Each ORCID employment → 🌐 Network (organizational affiliation)

By the time the user sees their dashboard, they have a calibrated
baseline. They are not at zero.

### Step 4: AI-mediated welcome screen

The new researcher sees a welcome that says, in their own context:

```
┌──────────────────────────────────────────────────────────────┐
│  Hoş geldin, Selçuk Atılgan.                                 │
│                                                              │
│  Your atlas history is live:                                 │
│    📚 28 publications across 23 species                      │
│    🔭 145 observations on iNaturalist                        │
│    🌱 6 herbarium accessions linked via GBIF                 │
│                                                              │
│  Starting impact:                                            │
│    Research 28 · Discovery 43 · Conservation 6               │
│    Total Impact: 79                                          │
│    You're #4 globally on Iris.                               │
│                                                              │
│  Based on your work, three matches:                          │
│                                                              │
│  [🔬 Active Program]                                          │
│  "Anatolian Crocus Conservation"                             │
│  Ada Biyoteknoloji + 4 botanic gardens                       │
│  — Your taxonomy expertise would fit Pathway 1               │
│  [Open · Join · Watch]                                       │
│                                                              │
│  [🗂 Open Brief — Urgent]                                     │
│  "Iridaceae field reassessment, Eastern Anatolia"            │
│  Conservation bounty · €5,000                                │
│  [View · Respond]                                            │
│                                                              │
│  [🤝 Potential Collaborator]                                  │
│  Prof. Ayşe Kaya — Iris persica overlap (3 shared papers)    │
│  [Open profile · Message]                                    │
│                                                              │
│  Or skip and:                                                │
│  → Start your own Program                                    │
│  → Browse the atlas                                          │
└──────────────────────────────────────────────────────────────┘
```

Every element is **specific to them**. No generic templates.

### Step 5: Mission setup

After the welcome screen, the user can optionally set their mission:

```
What do you want to build during the next 6 months?

  ☐ Publish more on my specialty
  ☐ Run a propagation protocol study
  ☐ Mentor a junior researcher
  ☐ Build a multi-org collaboration
  ☐ Contribute to a Red List reassessment
  ☐ Bring a compound to characterization
  ☐ Something else: ___________

[Save mission roadmap]
```

The selected mission becomes a **personalized dashboard tile** that
shows progress, suggests next actions, and gradually shapes the
notification and brief-discovery feed.

## The personalized home page

After onboarding, the home page is no longer generic. It shows:

```
┌──────────────────────────────────────────────────────────────┐
│  Your atlas                                                  │
│  ────────────────────────────────────────                    │
│  • 47 species you've contributed to                          │
│  • Top 3: Iris persica, Crocus mathewii, Tulipa schmidtii    │
│  • Most active scope: Iridaceae, Türkiye                     │
│                                                              │
│  Currently in progress                                       │
│  ────────────────────────────────────────                    │
│  • Program A (Co-PI) — 4 active TICs                         │
│  • Brief B (responded) — awaiting decision                   │
│  • Mission: Propagation protocol study                       │
│    [▓▓▓░░░░] 3 of 7 steps                                    │
│                                                              │
│  This week's opportunities                                   │
│  ────────────────────────────────────────                    │
│  • Brief #142 — matches your capability                      │
│  • Program X opened — invite available                       │
│  • Prof Y posted on Crocus mathewii (your watch)             │
│                                                              │
│  Trending in your specialty                                  │
│  ────────────────────────────────────────                    │
│  • 3 new publications on Iris persica this week              │
│  • Crocus genus campaign launching March 15                  │
│                                                              │
│  Mentor opportunity                                          │
│  ────────────────────────────────────────                    │
│  • 2 PhD students looking for advisors in your area          │
│    [Browse profiles]                                         │
└──────────────────────────────────────────────────────────────┘
```

Each section is personalized. AI mediates the "matches your
capability" lines.

## AI-mediated suggestions (system prompts)

The platform calls Claude with curated context about the user
(specialty, history, current programs, watched entities) to produce:

- **Welcome paragraph** — one personalized sentence per visit
- **Brief matching score** — for each open brief, why it might fit
- **Program matching score** — for each open program, why it might fit
- **Potential collaborators** — researchers with publication overlap
  or shared species
- **Next-action suggestion** — "Based on your history, consider
  contributing X to species Y"

Costs are bounded by:
- Cache the welcome paragraph for 24 hours per user
- Batch suggestions in a single Claude call per session
- Use Haiku for low-stakes ranking; reserve Sonnet for the welcome
  copy

## Privacy considerations

- ORCID import is **opt-in**: user must explicitly authorize
- We import only **public** ORCID works (the user's choice)
- iNaturalist linking requires explicit username confirmation (we
  guess, user accepts/declines)
- All AI-generated suggestions are visible to the user; they can
  flag "this isn't relevant" to improve future suggestions
- The mission roadmap is private by default

## Anti-loneliness mechanics

Beyond the welcome screen:

- **Day 1:** Welcome screen + AI-suggested first action
- **Day 3:** Email/push: "You haven't engaged yet — want a quick
  tour?"
- **Day 7:** Email: "Here's what's happened on your watched
  species this week"
- **Day 14:** If still inactive, prompt with a single low-effort
  contribution suggestion (e.g., "add a photo to a species page")
- **Day 30:** If still inactive, deliver a one-time "we miss you"
  with no further nags

Mentor matching pairs are surfaced for first-year accounts; experienced
researchers see "mentee opportunities."

## What's required to build this

- **ORCID OAuth integration** (`@orcid/openapi` or similar)
- **CrossRef bulk DOI fetch** (already partially implemented in
  `/api/admin/import-doi` — needs throttled bulk variant)
- **iNaturalist API integration** (optional; user-confirmed)
- **GBIF API integration** (optional)
- **Background enrichment job** (Vercel cron + queue)
- **AI welcome copy generator** (Claude prompt template)
- **Personalized home dashboard** (template + AI sections)
- **Mission roadmap data model** (one table) and editor UI

## Sequencing

Implementation order:

1. ORCID OAuth + identity link (1 day)
2. ORCID works import + K1 baseline impact (depends on Impact Factor MVP)
3. AI welcome copy generator (1 day)
4. Welcome screen UI (1 day)
5. Personalized home dashboard (2 days)
6. CrossRef bulk import (1 day)
7. iNaturalist + GBIF federation (2 days)
8. Mission roadmap editor (1 day)

Total: ~10 working days.

This is also dependent on the Impact Factor MVP being in place
(so K1 events have somewhere to land).
