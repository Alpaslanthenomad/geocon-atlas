# AI workflow — how we work efficiently

The operating manual for getting the most out of Claude Code on GEOCON. The goal:
take the AI collaboration from "chat" to a structured production system — fast,
low-hallucination, repeatable.

```text
repo reality ≠ target architecture
```

## 1. Required startup order (every session)

Before proposing code or treating repo docs as architecture truth, read in order:

1. **`docs/architecture/GEOCON_AI_REFERENCE_LOCK.md`** — target/repo distinction, BEE layer model, current priority.
2. **`docs/architecture/GEOCON_BEE_AI_AUDIT_PROTOCOL.md`** — cross-AI audit protocol, five startup questions, forbidden scope.
3. **`docs/architecture/GEOCON_LEGACY_DOCS_SALVAGE_MAP.md`** — legacy doc classification and salvage mapping.
4. **`CLAUDE.md`** (repo root) — stack, non-negotiables, conventions, transitional repo map.
5. **`docs/architecture/INDEX.md`** — deeper doc map with authority/classification tags.

Then use older repo docs only as transitional repo reality, technical salvage,
historical strategy, or deprecated/reverted material — per the salvage map.

### Before proposing code — answer these five questions

1. Which **layer** is this task? (GEOCON / DeepTech / Exchange)
2. Is this **target migration**, repo patching, separate-layer prototyping, documentation, or technical salvage?
3. Which docs are **target authority**?
4. Which repo docs are **implementation reality only**?
5. What **must not be built** in this sprint?

If you cannot answer all five, do not write code.

## 2. Project Knowledge OS (set up in the repo — works automatically)
- **`CLAUDE.md`** — orientation after the three authority files above.
- **`docs/architecture/INDEX.md`** — classified doc map (not equal authority for every file).
- Keep both current. When something big ships or is decided, update CLAUDE.md (and
  append to `docs/architecture/10-decision-log.md`).

## 3. Project commands (type these)
- **`/orient`** — at session start: read lock + audit protocol + salvage map + CLAUDE.md + INDEX + recent git log; summarize where we are before touching anything.
- **`/db`** — before a database change: the Supabase guardrails (definer,
  search_path, firewall, advisors).
- **`/ship`** — build + commit + push the standard way.

## 4. Project skills (auto-trigger when relevant)
- **geocon-rpc** — writing a Supabase RPC the right way.
- **geocon-feature** — building a feature end-to-end (DB → RPC → UI → ship → verify).
- **geocon-ui** — the front-end conventions (tokens, gating, no emojis).

## 5. Built-in Claude Code skills (you already have these — no install)
Most of what the "Claude Code best practices" posts recommend ships in the box:
- **`/code-review`** — review the diff in fresh context (catches bugs the building
  context missed). Use before shipping anything non-trivial.
- **`/security-review`** — security pass on pending changes.
- **`/simplify`** — apply reuse/simplification/efficiency cleanups.
- **`/verify`** — run the app and confirm a change actually works.
- **`/run`** — launch and drive the app.
- **`/deep-research`** — multi-source, fact-checked research report.
- **`/loop`** — run a task on an interval. **`/schedule`** — scheduled agents.
- Plan mode, AskUserQuestion, Git Worktrees, background tasks — already in use.

## 6. Optional: Addy Osmani's agent-skills (install in YOUR Claude Code)
A library of 23 production-grade engineering skills (spec-driven dev, planning,
TDD, ADRs, etc.). Many overlap the built-ins above; the extra value is the
*Define/Plan* phase (interview-me, idea-refine, spec-driven-development,
planning-and-task-breakdown) and documentation-and-adrs.
Install: `/plugin marketplace add addyosmani/agent-skills` then
`/plugin install agent-skills@addy-agent-skills`.
(github.com/addyosmani/agent-skills — MIT.)

## 7. Your side (the human half)
- **Plan mode** for anything non-trivial — approve the shape before I build.
- **Cross-model validation** — for critical or security-sensitive code, run it
  past a second model (Codex / GPT) as a sanity check. Two models rarely make the
  same mistake.
- **LibreChat** (optional) — a self-hosted, multi-model chat cockpit with MCP
  support (ChatGPT/Claude/Gemini/DeepSeek in one private interface). Good as your
  personal AI hub separate from coding. github.com/danny-avila/LibreChat.
- **Daily habits**: keep Claude Code updated; skim the changelog; start sessions
  with `/orient`; end work with `/ship`.

## The through-line
Structure the knowledge (lock + audit protocol + salvage map → CLAUDE.md + INDEX),
answer the five audit questions before code, codify the loops (commands + skills),
review in fresh context (`/code-review`), and keep a second model for critical
checks. That is the "upper segment" — and most of it is already in this repo.
