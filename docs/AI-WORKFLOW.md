# AI workflow — how we work efficiently

The operating manual for getting the most out of Claude Code on GEOCON. The goal:
take the AI collaboration from "chat" to a structured production system — fast,
low-hallucination, repeatable.

## 1. Project Knowledge OS (set up in the repo — works automatically)
- **`CLAUDE.md`** (repo root) — read automatically every session. The < 200-line
  orientation: what GEOCON is, the stack, the non-negotiables, how we work, the
  architecture map. This is the single biggest efficiency lever (instant, accurate
  context → token savings + fewer mistakes).
- **`docs/architecture/INDEX.md`** — the knowledge backbone: every design doc
  mapped + status (live/design/dormant/reverted).
- Keep both current. When something big ships or is decided, update CLAUDE.md (and
  append to `docs/architecture/10-decision-log.md`).

## 2. Project commands (type these)
- **`/orient`** — at session start: I read CLAUDE.md + INDEX + recent git log and
  summarize where we are before touching anything.
- **`/db`** — before a database change: the Supabase guardrails (definer,
  search_path, firewall, advisors).
- **`/ship`** — build + commit + push the standard way.

## 3. Project skills (auto-trigger when relevant)
- **geocon-rpc** — writing a Supabase RPC the right way.
- **geocon-feature** — building a feature end-to-end (DB → RPC → UI → ship → verify).
- **geocon-ui** — the front-end conventions (tokens, gating, no emojis).

## 4. Built-in Claude Code skills (you already have these — no install)
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

## 5. Optional: Addy Osmani's agent-skills (install in YOUR Claude Code)
A library of 23 production-grade engineering skills (spec-driven dev, planning,
TDD, ADRs, etc.). Many overlap the built-ins above; the extra value is the
*Define/Plan* phase (interview-me, idea-refine, spec-driven-development,
planning-and-task-breakdown) and documentation-and-adrs.
Install: `/plugin marketplace add addyosmani/agent-skills` then
`/plugin install agent-skills@addy-agent-skills`.
(github.com/addyosmani/agent-skills — MIT.)

## 6. Your side (the human half)
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
Structure the knowledge (CLAUDE.md + INDEX), codify the loops (commands + skills),
review in fresh context (`/code-review`), and keep a second model for critical
checks. That is the "upper segment" — and most of it is already in this repo.
