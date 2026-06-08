---
name: geocon-ui
description: GEOCON front-end conventions — inline styles + design tokens (var(--gx-*)), the v2 program panel (Tailwind) patterns, viewer gating, no emojis in files, serious tone. Use when writing or editing a React component.
---

# GEOCON UI conventions

Next.js 14 App Router + React 18. Components are mostly `.jsx` with **inline
styles + CSS variables**; `components/programs/v2/` uses **Tailwind**.

## Styling
- Default surface: **inline styles** reading design tokens, e.g.
  `var(--gx-ink)`, `--gx-ink-muted`, `--gx-ink-soft`, `--gx-ink-faint`,
  `--gx-card-bg`, `--gx-card-border`, `--gx-surface-2/3`, `--gx-border-soft`,
  `--gx-accent-violet`, `--gx-font-serif`, `--gx-font-mono`. Class helpers:
  `gx-h1`, `gx-overline`. These give automatic dark-mode + brand consistency —
  do NOT hardcode `#fff` / `#000` backgrounds.
- Inside `components/programs/v2/*`: **Tailwind** (`text-slate-*`, `rounded-xl`,
  etc.) — match the surrounding file.
- Reuse `components/ui` primitives (Badge, TrustStrip, Toast via `useToast()` —
  note `useToast()` returns an object: call `toast.success(msg)` / `toast.error(msg)`,
  not `toast(msg)`).
- **No emojis in files** unless the founder asks. Serious tone, no hype.

## Data + gating
- Read via `supabase.rpc(...)` (anon key; RLS applies to direct `.from()`).
- Auth: `useAuthContext()` → `{ user, profile, researcher, loading }`. The `user`
  object is identity-stable; effects can depend on `user` or `user?.id`.
- **Gate by viewer**: program reads return `is_owner` / `is_member`. Hide
  member-only sections (evidence, blockers, internal stream, PII) for non-members;
  hide owner-only actions behind `is_owner`. The public face = mission + team
  names + aggregate progress.
- Signed-in-only surfaces: return null / a sign-in prompt when `!user`.

## Routes
- Pages under `app/geocon/<x>/page.js` import a route component from
  `components/geocon/`. **Never delete a route** — redirect (`next/navigation`
  `redirect`) if renaming, to keep deep-links alive.

## Build
`npm run build` before committing; the build is the gate. LF→CRLF git warnings
are benign on Windows.
