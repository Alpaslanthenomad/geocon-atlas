# THE BENCH — the meaningful workspace

> Plan / design (not built). From an 11-agent bold brainstorm (2 scouts + 7
> bold lenses + a shallowness-killer + synthesis), run after the founder judged
> the first personalization build SHALLOW ("no meaningful change"). This is the
> single bold direction that survived the shallowness test. For the founder to
> react to; build on approval.

# THE BENCH — your private lab notebook that drafts the next move and heals the chain when you close it

## 1. The one-line concept

**Your personal page stops being a profile and becomes a working bench: you claim a few geophytes as *yours*, keep a private append-only lab log on the specific broken links you're closing, and every time you sit down the Bench hands you a cited, half-written Move on one of your gaps — promote a log entry to evidence and you watch that species' chain heal in front of you.**

It is one surface fusing the three things the verdict said actually ship today:
- **DRAFTS** (ai-partner) — the generative co-investigator, reusing the *exact* contract already live in `app/api/grant/draft-section/route.js`.
- **The Field Log** (desk-vs-commons) — a private, owner-RLS lab notebook keyed to a `(species, link)` claim. The one organ no other proposal had and nobody else builds.
- **Spawn binding** (canvas-not-catalogue) — every thesis/program/grant/proposal born docked to a `(scope_species, scope_link)` coordinate via FK + deep-link.

Crucially — and this is the discipline that keeps it from being shallow *again* — **none of the felt magic is gated behind `apply_move`/`link_fact`/`evidence`/the 279-node registry, all of which the docs mark "Nothing built."** The heal runs on the existing 6-spine `get_species_chain` rollup I just read. The founder feels it this week, not after L0 is rebuilt.

## 2. What the user SEES / FEELS that is unmistakably different on day one

Today, signing in changes a navbar. You open `/geocon/profile` and it greets you with your **name, email, ORCID, org cards** — a settings stack. It tells you who you are and what you already did.

The Bench greets you with **none of that.** You land on a short row of **bench cards** — the 3-12 geophytes you've claimed — and each one is the live 6-segment chain bar you already render, but *yours*: the link you're working glows, the empty link downstream of your furthest-advanced work pulses, and under each card sits **your own handwriting** — the last private log line you wrote: *"Sternbergia candida — germinated 40% at 4°C stratification, retrying at 6 weeks."*

That sentence is the tell. **The atlas has never held the messy middle of science** — that note lives in OneNote today. The instant a researcher sees their own unpublished bench note sitting *inside* the atlas, docked to the exact link it will eventually fill, they know this is a different kind of room.

Then the second beat, the one a colleague has to see: you pick a pulsing empty link, hit **"Draft this move,"** and in ~20 seconds the Bench hands you a **cited micropropagation protocol skeleton** synthesized from the congener literature on that genus — with your bench numbers left as `[EKLE: ölçülen çimlenme oranı]` blanks. *A draft that did not exist before you sat down is now in your hands.* You fill the blanks from your log, promote it, and **the chain bar on that card heals from a dashed break to a solid green segment, in the same frame.** You watch a broken link close, by your name, on your own page.

No chip, no band, no nudge does any of that. The difference is not decoration — it's that **the page produced something and changed the chain.**

## 3. The core new capability + the work-loop it creates

The capability is a **personal, append-only lab notebook bound to chain coordinates, with a generative co-investigator on top.** The loop:

1. **CLAIM** — adopt a species (or a genus / CR-endemic shortlist) onto your bench. This replaces the read-only watchlist `★`. A claim isn't a bookmark; it carries chain state and becomes your territory.
2. **LOG** — on any `(species, link)` you're working, keep a private timestamped notebook: field notes, a germination %, a photo, a failed trial. Owner-RLS only; the commons never sees it. *This is the part that changes daily behavior* — your working notes now live where the work lands.
3. **DRAFT** — when you're ready to formalize, the Bench drafts the Move for you: protocol skeleton from literature, your log numbers as `[EKLE:]` blanks, evidence-class pre-set to `literature`/`inferred` (half-weighted, capped) so **the draft physically cannot fake the chain complete.**
4. **PROMOTE** — you replace the blanks with your measured values, choose `bench_measured`, and commit. One evidence write flips that coordinate's `fill_state`. The chain bar heals; the next empty link downstream starts pulsing.
5. **SPAWN** — when the work needs a vehicle (a thesis, a program, a grant), you start it *from the link card*, pre-bound to `(this species, this link)`. The four isolated inboxes stop being four apps and become four kinds of Move on one grid.

The rhythm — **claim → log the messy middle → draft → promote → watch it heal → see what it unlocked → spawn downstream** — *is* the "new way to work." A researcher no longer hunts across four inboxes to find where their effort lands; their bench tells them where they are, what they've privately recorded, and what they're one promotion away from closing.

## 4. How it uses the chain + the user's species concretely

- **The bench card IS the chain bar.** It reuses `SpeciesChainBar`'s exact read (`get_species_chain` → `{link, label, fill_state, evidence_class, fill_strength}`) and `CLASS_COLOR` map. Heal = a `fill_state` flips from `"empty"`. No new chain infra to feel the magic.
- **The log is keyed to a coordinate.** A `bench_claim(user_id, species_id, link_kind, stance)` + `bench_log_entry(claim_id, body, evidence_class?, created_at)` — three small owner-RLS tables. `link_kind` is one of the six existing spine links, so it docks to the rollup that already exists. When the full 279-node registry lands later, `link_kind` widens to `link_type_id` with zero UX change.
- **The draft is grounded in the user's actual species.** The DRAFT endpoint forks `grant/draft-section` line-for-line: user-scoped Supabase client, an RPC pulls real context (existing protocols/accessions via `get_species_domain_extras`, `metabolites`, `publications`, IUCN status), builds the same `facts` block, runs the same `[EKLE:]`/no-fabrication system prompt through `askText`, returns the draft, **never auto-saves.** The botanical fact that makes this honest: propagation protocols generalize across congeners, so "draft a micropropagation skeleton for *Galanthus elwesii* from its genus literature" is real synthesis, not invention.
- **Spawn fixes the documented disease.** `ThesisRoute` today takes comma-separated raw species IDs with no chain meaning. Spawn adds `scope_species` + `scope_link` FKs and a deep-link mirroring the existing `?subject_kind=species&subject_id=` pattern. The thesis is now *born on the gap it closes*, and when its milestone completes it promotes evidence to that exact coordinate.

**Firewall + integrity, structurally:** the Bench reads/writes only the conservation spine. Zero money columns. The conservation-readiness rail renders as its *own* lane beside production links, never averaged in. A Move can't be promoted without an `evidence_class`, and `inferred`/`imported` are half-weighted and capped — so the bar you watch heal **cannot be faked to full.** Logs are private (owner-RLS); only the *promoted, evidenced* Move is ever public.

## 5. Why it is NOT shallow (contrast with the rejected polish)

| Rejected build (what felt shallow) | The Bench |
|---|---|
| StationChip **re-skins** a button's wording | The Bench **produces a drafted Move** that didn't exist before you sat down |
| "Your next action" band names the **atlas's** biggest gap | The Bench drafts the fill for **your** gap on **your** species |
| Watchlist = read-only follows with an unfollow button | Claim = your territory; the **private log** docks the messy middle of your science inside the atlas |
| MyContributions = a read-only **trail** of what you did | Promoting a log entry **heals the public chain** — work goes forward, not into history |
| IntentRouter = static lanes (onboarding) | Spawn = thesis/program/grant **born on the coordinate** they close |

The rejected build personalized the *entrances* to the commons. The Bench gives you a *room of your own* where the platform's core act — closing a broken link with real evidence — actually happens. The litmus test it passes that every widget fails: **after you use it, is there something in your hands that wasn't there before?** Yes — a cited draft, a healed link, a private notebook the atlas never had.

## 6. The first buildable slice — transformative at zero users

**Slice 1 (ship first, ~1-2 weeks, the wow):**
- 3 owner-RLS tables: `bench_claim`, `bench_log_entry` (+ a `promoted_evidence_ref`).
- `/bench` route replacing the primary view of `/geocon/profile`; demote identity/ORCID/orgs/API keys into a `⚙ Settings` drawer.
- Bench cards = `get_species_chain` per claimed species (reuse `SpeciesChainBar`).
- The **private Field Log** per `(species, link)` claim — write/read your own notes. This alone is defensibly his: nobody keeps lab notes in a value-chain atlas.
- The **DRAFT button** = fork `grant/draft-section` into `app/api/bench/draft-move/route.js` with a `get_bench_draft_context` RPC. Same `askText` + `facts` + `[EKLE:]` contract. Returns a cited skeleton; never saves.
- **Promote** writes evidence to one of the six spine coordinates; the card's bar heals.

At zero users this is fully valuable **solo**: one researcher, one claimed *Galanthus elwesii*, the existing ~200-species CR-endemic beachhead to work, a private notebook, and a co-investigator that hands them drafts. No network effect required. Demo it on the founder's own data: open *Galanthus elwesii*'s empty propagation link → "Draft this move" → cited micropropagation skeleton with `[EKLE: measured germination rate]` → fill from log → promote → watch propagation go green.

**Slice 2:** Spawn FKs (`scope_species`/`scope_link`) on thesis/program/grant + the deep-link — collapses the four inboxes onto the bench.

**Slice 3+ (later, underneath):** the full `link_type`/`link_fact`/`evidence` registry and `apply_move`. `link_kind` widens to `link_type_id`; the UX doesn't change. The founder feels the heal in Slice 1; the deep substrate lands invisibly.

## 7. Honest risks

1. **The promote→heal write path is genuinely net-new.** `SpeciesChainBar` is read-only today; nothing writes `get_species_chain`'s underlying fill state. Slice 1 must build one honest write — an evidence row against a spine coordinate that the rollup reads. This is the real work; budget for it explicitly and don't pretend the existing bar gives you writes for free.
2. **AI draft quality on obscure taxa.** For a CR endemic with thin congener literature, the draft may be mostly `[EKLE:]` blanks. That's *correct* behavior (no fabrication) but can feel empty. Mitigation: lead the demo with a genus that has rich literature (Galanthus/galantamine), and frame sparse drafts as "the literature gap is itself the finding."
3. **AI cost / latency.** Each draft is a real Anthropic call (`maxDuration 45`, `maxTokens 1600`). Fine at zero users; needs rate-limiting before scale. The endpoint already handles credit/rate-limit errors gracefully — reuse that.
4. **Two surfaces answering "what do I do now."** `MyDashboard` (home) already holds the proposal/TIC work queue. The Bench must either absorb it or clearly own a different question ("what am I *moving*") vs. home's "what's *inbound*." Decide this before shipping or you re-fragment.
5. **Scope creep back into the registry.** The temptation will be to "do it right" and build the 279-node model first. That is exactly the trap that made the last build feel shallow — months of plumbing, no felt change. Hold the line: ship the heal on the 6-spine rollup, prove the moment, let L0 land later.

**The one bold move, stated plainly:** Build ONE Bench that replaces ProfileRoute's primary view, and lead with the only wow that ships this week — the co-investigator that drafts a cited Move on your claimed species, backed by a private lab log the atlas has never had, healing the chain on the existing 6-spine rollup. Delete the watchlist, the next-action band, StationChip, and IntentRouter from the primary view — they *are* the rejected shallow build. Do not gate the felt difference behind the unbuilt chain registry.

**Files this stands on (all confirmed real, absolute paths):**
- `C:\Users\Alpaslan\Documents\GitHub\geocon-atlas-live\geocon-atlas\app\api\grant\draft-section\route.js` — the grounded-draft + `[EKLE:]` + never-auto-save contract to fork for DRAFT.
- `C:\Users\Alpaslan\Documents\GitHub\geocon-atlas-live\geocon-atlas\components\geocon\SpeciesChainBar.jsx` — the `get_species_chain` read + `CLASS_COLOR` heal surface; reused for bench cards.
- `C:\Users\Alpaslan\Documents\GitHub\geocon-atlas-live\geocon-atlas\components\geocon\ProfileRoute.jsx` — the page demoted to a Settings drawer.
- `C:\Users\Alpaslan\Documents\GitHub\geocon-atlas-live\geocon-atlas\components\geocon\ThesisRoute.jsx` — the form that becomes a Spawn target (`scope_species`/`scope_link` FK).
- `C:\Users\Alpaslan\Documents\GitHub\geocon-atlas-live\geocon-atlas\components\geocon\MyContributions.jsx` — the read-only trail the forward log/heal loop supersedes.
---

## Build status — SHIPPED (deepest pass, 2026-06-08)

All of the above is built, build-verified, 0 security-advisor ERRORs, committed.

- **Slice 1** — claim / private owner-RLS lab log / AI draft-move (forked from
  grant/draft-section) / promote -> heal on the 6-spine rollup. `/geocon/bench`.
- **DEEP-A** — the full registry seeded: `chain_link_type` now holds 363 link
  types (6 spine + 176 branch + 181 rail) with path/domain/firewall/sensitivity.
- **DEEP-B** — generic `apply_move(species, link, class)` with on-demand
  link_fact + rollup (a filled branch lights its spine root); `get_species_link_tree`
  drill; the bench card drills a spine link into its branch sub-tree, each fillable.
- **DEEP-C (Slice 2)** — `scope_species` + `scope_link_type_id` FKs on
  grant_proposals / collaboration_proposals / thesis_tracks (+ programs);
  `spawn_bench_grant` writes a brief born on the coordinate; the bench Spawn row.
- **DEEP-D** — `program_chain_claim` + membership-gated claim RPCs; three
  chain-derived health rings (safeguard/knowledge/value) in the program Chain tab;
  claimable matrix cells.

Known approximations (left for a refinement pass): cultivation/extraction spine
links roll up from the propagation/chemistry branch_roots (domain mapping); the
ring coverage reads near-zero today because only the spine + chemistry/metabolite
facts are backfilled — that is the honest broken chain, and it rises as the bench
fills links. The 6 spine labels stay provisional.
