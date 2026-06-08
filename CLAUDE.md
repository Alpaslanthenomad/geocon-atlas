# CLAUDE.md — GEOCON Atlas

Project memory for Claude Code. Read this first every session. Keep it < 200 lines.
Deeper detail lives in `docs/architecture/INDEX.md`.

## What this is
GEOCON Atlas — an open conservation atlas of ~47,000 **geophyte** species (bulbs,
corms, tubers, rhizomes). Mission: connect the **conservation** of threatened
geophytes to the **full chain of value** they can yield — without letting commerce
contaminate conservation. Live at **atlas.vennbioventures.com**. Parent company:
**VENN Bioventures** (Estonia). Solo founder-researcher; cold start (~0 users).

## Stack & infra
- **Next.js 14 App Router + React 18** (mostly inline-styled `.jsx`; some Tailwind
  in `components/programs/v2/`). Deployed on **Vercel** (auto-deploys `main`).
- **Supabase** Postgres 17 — project ref **`zzpneqfzuortavenrkki`**. RLS,
  SECURITY DEFINER/INVOKER RPCs, ltree, pg_cron. Client uses the **anon** key, so
  direct `.from()` reads obey RLS; most data flows through `.rpc()`.
- Routes under `app/geocon/*`; components under `components/geocon/*` +
  `components/programs/v2/*` (the program engine) + `components/ui` (primitives).

## Non-negotiable constraints
1. **Data integrity** — never fabricate values. Everything provenance-labelled;
   inference is weighted down / capped. `[EKLE:]` / `[ADD:]` placeholders for
   missing specifics in AI drafts; never auto-save AI output as fact.
2. **IUCN / commerce firewall is STRUCTURAL** — zero money columns in conservation
   data; commerce may only *cite* conservation, one-directional, read-only.
3. **Serious tone** — no hype, no celebration, **no emojis in files/commits**
   (unless the founder asks). Turkish or English per the founder's lead.
4. **Never delete routes** — keep deep-links alive; change reach, or redirect.
5. **Privacy** — locality data is sensitivity-tiered; PII (emails/NDA/COI) is
   member-gated.

## How I work here (conventions)
- **DB changes**: use the Supabase MCP (`apply_migration` for DDL, `execute_sql`
  for DML/inspection). Load via ToolSearch `select:mcp__...__apply_migration` etc.
- **Build before commit**: `npm run build` (grep for `Compiled successfully`).
  Commit per coherent unit, build-verified. Push only `main` (auto-deploys).
- **Commit messages** end with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  GOTCHA: bash heredoc `@'...'@` breaks on apostrophes/parens — avoid them in
  commit bodies (write "founders" not "founder's").
- **LF→CRLF** git warnings on commit are benign (Windows).
- **`get_advisors`** output is huge (>600k chars) — it saves to a file; parse with
  python (`json.load(...)['result']['lints']`), filter for level=='ERROR'.
- New SECURITY DEFINER RPCs: always `set search_path = public` + grant to
  `authenticated` (and `anon` only if truly public). 0 ERROR advisors is the bar.
- **Tooling**: project commands `/orient` `/db` `/ship`; project skills
  `geocon-rpc` `geocon-feature` `geocon-ui`; built-ins `/code-review`
  `/security-review` `/verify` `/run`. Full manual: `docs/AI-WORKFLOW.md`.

## Architecture map (current, post-revert June 2026)
- **The program engine (the backbone)** — `components/programs/v2/`. A program runs
  on **tics** (verifiable state changes with evidence). The **Venn engine**:
  `tic_definitions.default_region` (7 regions: x/y/z_only, xy/xz/yz, **xyz =
  Integrated Core**; X=safeguard, Y=knowledge, Z=value) + `stage` (foundation→
  field_lab→propagation→deep_work→deployment→governance). **Gate = stage-transition
  condition** (region is value-position, never a gate; xyz is a maturity target).
  RPCs: `get_program_region_status`, `get_program_stage_status`, `apply_move`,
  `complete_program_tic` (owner OR assignee). Spec: `VENN-ENGINE-CONTRACT.md`.
- **Program visibility** — `fn_program_can_see_interior` (owner/member). Read RPCs
  redact evidence/blockers/PII/stream for non-members; public face = mission +
  team names + aggregate progress. Join door: `request_to_join_program` /
  `respond_to_join_request`.
- **Workspace** — `/geocon/workspace` (`BenchRoute.jsx`, was "bench"). Personal hub:
  assignments (`get_my_assignments`, private `program_tic_draft` → promote) +
  my programs (`get_my_programs`) + drafts + watchlist + saved searches + tools.
  `/geocon/profile` = identity/ORCID/orgs/notifications only.
- **The Chain** — a 279-node value-chain registry (`chain_link_type`, 363 rows;
  `chain_link_fact`/`chain_evidence` substrate; `get_species_chain`). **Dormant**:
  the 6-stage spine vocabulary was REJECTED (must become inclusive verticals with
  the right words). 3D tree at `/geocon/chain` (kept, to be reworked).
- Other surfaces: species pages, Explore globe (react-globe.gl), Theses, Grant
  Studio (AI drafting — `app/api/grant/draft-section`), Proposals/Briefs, IUCN Hub,
  Outcomes, Ventures, the PWA field notebook, public API, self-hosted telemetry.

## What was tried and reverted (don't re-litigate)
A large **personalization + species-claim "bench"** arc (3-axis personas, station
chip, claim-species/chain-heal) was built then REVERTED as "shallow / too radical".
Preserved on branch `backup/personalization-bench-arc`. The 6-stage chain
vocabulary is rejected. See `NORTH-STAR.md` + `north_star_and_revert` memory.

## The North-Star (check work against it)
`docs/architecture/NORTH-STAR.md` + `NORTH-STAR-ANALYSIS.md`: GEOCON is "the atlas
of what we don't yet know about saving threatened plants — the gap is the product."
The one metric that matters: an **evidenced fact in the atlas** (move it from 0).

## Docs index
`docs/architecture/INDEX.md` maps every design doc. Key: THE-CHAIN*, THE-BENCH,
PERSONALIZATION-ARCHITECTURE, NORTH-STAR(-ANALYSIS), VENN-ENGINE-CONTRACT,
WORKSPACE-ROADMAP, DATA-INTEGRITY, 01–10 architecture series.
