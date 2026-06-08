---
description: Guardrails for a Supabase database change
---
We are about to change the database (Supabase project `zzpneqfzuortavenrkki`).
Use the Supabase MCP: `apply_migration` for DDL, `execute_sql` for DML / inspection
(load via ToolSearch `select:mcp__...__apply_migration` if not already available).

Rules:
- New functions: `SECURITY DEFINER` + `set search_path = public` + `grant execute`
  to the right role (`authenticated`; `anon` only if truly public).
- Honor the firewall: zero money columns in conservation data; commerce only cites.
- Respect RLS — gate sensitive reads by viewer (`fn_program_can_see_interior`,
  `fn_is_program_owner`, owner-RLS for personal tables).
- Keep it reversible; state the rollback.
- After applying, verify there are 0 ERROR-level security advisors
  (`get_advisors` output is huge — save + parse with python for level=='ERROR').

$ARGUMENTS
