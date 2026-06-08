---
name: geocon-feature
description: Build a GEOCON user-facing feature end-to-end the established way — DB migration, RPC, component, mount, build, commit, verify, advisors. Use when implementing a new capability so it is shipped consistently and reversibly.
---

# Shipping a GEOCON feature end-to-end

The order that keeps it correct and reversible:

1. **Ground first.** Read the real code + DB before writing. `execute_sql` for the
   current schema/RPCs; Grep/Read for the components and patterns. Don't guess —
   the costliest mistakes this project has made were building on assumptions.
2. **DB layer** (if needed). `apply_migration`. Follow the `geocon-rpc` skill:
   SECURITY DEFINER + search_path + grants, firewall, viewer-gating, 0-ERROR
   advisors. Inspect constraints before inserting enum-like values.
3. **Wrapper / lib** if there's a shared call pattern (see `lib/programTics.js`).
4. **Component** — follow `geocon-ui` conventions (inline styles + `var(--gx-*)`
   tokens; Tailwind only inside `components/programs/v2/`). Reuse primitives in
   `components/ui`. Gate sensitive reads/actions by `is_owner` / `is_member`.
5. **Mount + route**. Add the page under `app/geocon/*`; never delete a route —
   redirect if renaming (keep deep-links alive).
6. **Build**: `npm run build`, confirm "Compiled successfully". Fix before committing.
7. **Commit + push** (`/ship`): clear message, no apostrophes/parens in the body,
   end with the Co-Authored-By line, push `main` (auto-deploys).
8. **Verify**: think through the real user scenario; if it's risky or net-new
   (a new write path, auth, money-adjacent), say so honestly and propose how the
   founder can test it.

## Phasing
For anything larger than a single change, split into build-verified, separately-
committed phases (each reversible). Use plan mode for the founder to approve the
shape first. Prefer additive changes over editing live, founder-reviewed surfaces;
when you must touch them, say what could break.

## Honesty
Flag what is net-new and untested (I cannot drive the browser). Flag firewall or
data-integrity risk. Do not add things "for the sake of it" — every piece must
earn its place.
