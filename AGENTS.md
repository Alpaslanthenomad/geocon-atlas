# AGENTS.md — operating contract for any AI agent on GEOCON

Tool-agnostic contract (Codex, Cursor, Claude Code, etc.). The full project memory
is **`CLAUDE.md`** and the knowledge map is **`docs/architecture/INDEX.md`** +
**`docs/atlas/MAP.md`** — read those first. This file is the short, non-negotiable
contract so an agent that only reads AGENTS.md still acts safely.

## What this is
GEOCON Atlas — an open conservation atlas of ~47,000 geophyte species; connects
conservation to the value chain without contaminating one with the other. Next.js
14 + Supabase (project `zzpneqfzuortavenrkki`) + Vercel. Parent: VENN Bioventures.

## Non-negotiables
1. **Data integrity** — never fabricate values; everything provenance-labelled;
   inference weighted down. AI drafts use `[EKLE:]`/`[ADD:]` placeholders and are
   never auto-saved as fact.
2. **IUCN / commerce firewall is STRUCTURAL** — zero money columns in conservation
   data; commerce may only cite conservation, read-only, one-directional.
3. **Serious tone; no emojis in files or commits** unless asked.
4. **Never delete routes** — redirect to keep deep-links alive.
5. **Privacy** — sensitivity-tier locality; member-gate PII.

## How to work
- DB: Supabase MCP `apply_migration` (DDL) / `execute_sql`. New functions:
  `SECURITY DEFINER` + `set search_path = public` + grant; 0-ERROR advisors.
- Build before commit (`npm run build` → "Compiled successfully"). Commit per
  coherent unit; reversible; message ends with the Co-Authored-By line (no
  apostrophes/parens in the body). Push `main` (auto-deploys).
- Ground before building — read the real code/DB; do not guess. Flag what is
  net-new/untested and any firewall/integrity risk. Do not add things "for the
  sake of it."

See `CLAUDE.md` for the architecture map, conventions, and project commands/skills.
