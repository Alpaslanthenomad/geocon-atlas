# GEOCON Atlas — Environment Variable Reference

Authoritative map of every env var the code actually reads (grepped from
`process.env.*`), what it unlocks, and whether to set it now. Set these in
**Vercel → Settings → Environment Variables** (all environments is correct
unless noted). `.env.example` is the older template; this file supersedes it.

## ⚠️ First, verify the two keys are not swapped
The service-role fix earlier risked swapping anon ↔ service. Confirm in
Vercel against Supabase → Settings → API:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the **anon / publishable** key (safe for the browser)
- `SUPABASE_SERVICE_ROLE_KEY` = the **service_role / secret** key (SERVER-ONLY, never client)

If these are reversed the app is either broken or insecure. This is the
single most important check.

---

## 1. Required — the app will not start without these
| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (client + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser client, RLS-gated) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — server routes/crons/scripts only |
| `CRON_SECRET` | Bearer that protects harvest/cron endpoints (GitHub Actions sends it) |

## 2. Site config (used by feeds + emails)
| Var | Purpose | Needed when |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Absolute links in emails + digests | when email is on |
| `NEXT_PUBLIC_SITE_ORIGIN` | Absolute URLs in RSS/Atom feeds | low priority |

## 3. How a feature actually turns on
Three delivery types — important for "set token vs activate":
- **On-demand** — set the token → works immediately (no cron).
- **Harvest** — pulled by the GitHub Actions harvest workflow (`.github/workflows/geocon-harvest.yml`). Set the token → next harvest run uses it.
- **Cron (dormant)** — needs a scheduled job. Vercel crons were removed; these now require a **pure-DB pg_cron activation** (my work) when you set the token, so the feature isn't left half-wired.

## 4. Data fetching (the priority for you)
| Var | Unlocks | Type | Set now? |
|---|---|---|---|
| `IUCN_API_TOKEN` | Official IUCN Red List status → `/api/harvest/iucn` | Harvest | **YES** — see docs/IUCN-APPLICATION.md |
| `ANTHROPIC_API_KEY` | AI enrichment, expertise tagging, scoring, lit-review, "ask GEOCON" | Harvest + on-demand | Medium (improves harvest quality) |
| `NCBI_API_KEY` | PubMed harvest rate limit 3→10 rps | Harvest | Optional (faster only) |
| `SEMANTIC_SCHOLAR_API_KEY` | Semantic Scholar harvest quota | Harvest | Optional |

## 5. Feature tokens
| Var(s) | Unlocks | Type | Set now? (stage-gate S1) |
|---|---|---|---|
| `ZENODO_API_TOKEN` (+ `ZENODO_BASE`) | Dataset DOI minting → citable, academic legitimacy | On-demand (admin) | **YES** — strengthens IUCN application too |
| `PLANTNET_API_KEY` | Field notebook photo → species ID | On-demand | When field users arrive |
| `OPENAI_API_KEY` (+ `WHISPER_MODEL`) | Voice memo → Whisper transcript | Cron (dormant) | Later; needs pg_cron activation |
| `RESEND_API_KEY` (+ `EMAIL_FROM`) | Threat-alert + weekly digest emails — the #1 retention engine | Cron (dormant) | When you have users (S2) |
| `BSKY_HANDLE` + `BSKY_PASSWORD` | Auto-post to Bluesky | Cron (dormant) | **Wait** — social is S3→S4 |
| `MASTODON_INSTANCE` + `MASTODON_TOKEN` | Auto-post to Mastodon | Cron (dormant) | **Wait** — S3→S4 |

## 6. Push notifications
| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PUBLIC_KEY` | Web-push public key |
| `VAPID_PRIVATE_KEY` | Web-push private key (server) |
| `VAPID_SUBJECT` | mailto:/URL contact for push |
| `PUSH_INTERNAL_SECRET` | Internal auth for the push sender route |

Generate a VAPID keypair with `npx web-push generate-vapid-keys`. Low
priority until there's an audience to notify.

## 7. ORCID OAuth (researcher verification)
| Var | Purpose |
|---|---|
| `ORCID_CLIENT_ID` / `ORCID_CLIENT_SECRET` | OAuth app from orcid.org/developer-tools |
| `ORCID_REDIRECT_URI` | Must match the registered callback |
| `ORCID_ENV` | `production` or `sandbox` |

Without these the "ORCID ile doğrula" button returns 503; manual ORCID
entry still works. Medium priority (credibility for real researchers, S2).

## 8. Observability (optional)
`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
`SENTRY_PROJECT` (error tracking); `NEXT_PUBLIC_POSTHOG_KEY`,
`NEXT_PUBLIC_POSTHOG_HOST` (analytics). We also ship a self-hosted
privacy-first telemetry stack, so PostHog is optional.

---

## Recommended order for you (S1)
1. **`IUCN_API_TOKEN`** — apply today (docs/IUCN-APPLICATION.md), highest data value.
2. **`ZENODO_API_TOKEN`** — academic legitimacy, works on-demand immediately.
3. **Verify anon ↔ service keys not swapped** (section top).
4. Defer `RESEND` to S2 (users), social to S3+. Tell me when you set
   `OPENAI`/`RESEND` and I'll activate the matching cron in pure-DB so it
   isn't left half-wired.

Setting a token is cheap; wiring a dormant cron is my job — we do both
together so no feature is "half on."
