---
name: geocon-rpc
description: Write or change a Supabase Postgres function / RPC for GEOCON the right way — SECURITY DEFINER, search_path, grants, the IUCN/commerce firewall, RLS viewer-gating, and a 0-ERROR advisors check. Use whenever adding or editing a database function.
---

# Writing a GEOCON RPC

Supabase project ref: `zzpneqfzuortavenrkki`. Use the Supabase MCP `apply_migration`
for DDL. The client uses the anon key, so RPCs are the main data path.

## The template
```sql
create or replace function fn_name(p_arg type, p_opt type default null)
returns <type | table(...)> language <sql|plpgsql> stable  -- stable for reads
security definer set search_path = public as $$
  -- body
$$;
grant execute on function fn_name(type, type) to authenticated;  -- anon only if truly public
```

## Rules (non-negotiable)
- **SECURITY DEFINER + `set search_path = public`** on every function. Without
  search_path it is a security finding.
- **Grant to `authenticated`** (and `anon` only when the data is genuinely public).
- **The firewall**: conservation data holds no money columns; commerce may only
  cite conservation, read-only, one-directional. Never join money into a
  conservation read.
- **Viewer gating**: a SECURITY DEFINER read computes the viewer but must USE it.
  Helpers: `fn_is_program_owner(program_id)`, `is_program_member(...)`,
  `fn_program_can_see_interior(program_id)` (owner or member). Redact evidence /
  blockers / PII for non-members (see `get_program_foundation_status` for the
  pattern: `case when v_interior then pt.evidence_link else null end`).
- **Owner-RLS personal tables**: `... using (user_id = auth.uid()) with check (...)`.
- **Data integrity**: inferred/imported evidence is capped (see `chain_strength`);
  never let a guessed value look proven.
- **pg-safeupdate**: every UPDATE/DELETE needs a WHERE (ON CONFLICT counts).

## After applying
- Run `get_advisors` (security). Output is huge — it saves to a file; parse with
  python and confirm **0 ERROR-level** lints. WARN `*_security_definer_function_executable`
  is the normal, accepted pattern.
- State the rollback. Migrations are forward-only; design reversibility in.

## Inspect first
`execute_sql` with `pg_get_functiondef(oid)` to read an existing function before
editing; `information_schema.columns` for table shapes; check CHECK constraints
before inserting new enum-like values (e.g. program_members.status).
