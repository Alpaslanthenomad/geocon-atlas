# GEOCON Atlas — Deploy & operations

Sıfırdan production deploy + env vars + day-2 ops referansı. Yeni bir
ortam (staging, fork, başka bir Vercel projesi) ayağa kaldırırken
buraya bak.

---

## Sistem mimarisi tek bakışta

```
Browser (Next.js App Router)
   ↓ Supabase JS (anon key)
   ↓ /api/* route handlers (service role for writes)
   ↓
Supabase Postgres 17  ← all data + RLS + SECURITY DEFINER RPCs
   ↑
   Vercel Cron → /api/harvest/* (secret-gated)
   ↑
   Anthropic Claude (AI enrichment + welcome suggestions)
   ↑
   ORCID public API + OAuth (welcome flow)
```

---

## Önkoşullar

| Hesap / araç | Niçin |
| --- | --- |
| GitHub | Source (private repo) |
| Vercel | Hosting + cron + env vars |
| Supabase | Postgres + Auth + Storage |
| ORCID Developer | OAuth verification (K9) — opsiyonel |
| Anthropic Console | Claude API key — opsiyonel |
| Sentry / PostHog | Observability — opsiyonel |

Node 18+ ve npm/pnpm yerel geliştirme için.

---

## 1) Supabase setup (REQUIRED)

1. `https://supabase.com/dashboard` → **New project**
2. Region: kullanıcılara en yakın (geocon.bio için `eu-north-1`)
3. Database password kaydet
4. Proje ayağa kalkınca **Settings → API**'den 3 değeri al:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only!)

### Şema ve migration'lar

Bu repo'daki migration'lar şu şekilde uygulandı:
- Production'da Supabase MCP (Claude Code) üzerinden direkt
- Geliştirici tarafında `npx supabase db reset` veya
  `apply_migration` benzeri araçlarla

Yeni bir Supabase projesine baştan kurulum gerekirse, bu repo'daki
tüm `mcp__supabase__apply_migration` çağrılarının SQL'ini sırayla
çalıştırmak gerekir. Migration history'si Supabase'in
`supabase_migrations` schema'sında saklanır.

### Storage

`avatars`, `species-photos`, `documents` bucket'larını oluştur (RLS
politikaları `policies/storage-*.sql` altında). İlk deploy sonrası
admin paneli üzerinden yüklenebilir.

---

## 2) Vercel deploy

1. `https://vercel.com/new` → GitHub repo'yu import et
2. Framework: **Next.js** (otomatik algılar)
3. Build command: `next build` (default)
4. Output directory: `.next` (default)
5. **Environment Variables**: bir sonraki bölümden gelen tüm değerleri
   yapıştır (Production + Preview ortamlarına ekle)
6. **Deploy**

Custom domain (geocon.bio gibi):
- Vercel → Project → Settings → Domains → Add
- DNS: A `76.76.21.21` veya CNAME `cname.vercel-dns.com`

---

## 3) Environment variables

Tüm env vars'ın açıklamalı listesi `.env.example` dosyasında. Buradaki
checklist Vercel dashboard'a kopyalarken kullanılır.

### Required (eksik olursa app çalışmaz)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Recommended (önemli özellikler için)

- [ ] `ANTHROPIC_API_KEY` — K10 welcome AI, harvest enrichment
- [ ] `CRON_SECRET` — harvest endpoint koruması
- [ ] `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` — error tracking

### Optional

- [ ] `ORCID_CLIENT_ID`, `ORCID_CLIENT_SECRET`, `ORCID_REDIRECT_URI`,
      `ORCID_ENV` — K9 OAuth (manuel akış env yoksa da çalışır)
      → bkz. `docs/setup/orcid-oauth.md`
- [ ] `IUCN_API_TOKEN` — IUCN sync (manual fallback'i var)
      → bkz. `docs/iucn-api-reapplication.md`
- [ ] `NCBI_API_KEY` — PubMed rate limit yükseltir
- [ ] `SEMANTIC_SCHOLAR_API_KEY` — opsiyonel quota
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` — product
      analytics
- [ ] `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` — source map
      upload (build-time)

---

## 4) ORCID OAuth setup (K9)

Detaylı walkthrough: **`docs/setup/orcid-oauth.md`**

Özet:
1. `orcid.org/developer-tools` → "Register a public API client"
2. Redirect URI: `https://<your-domain>/api/auth/orcid/callback`
3. Client ID + Secret'ı Vercel env vars'a yapıştır
4. Redeploy
5. `/geocon/welcome` → "ORCID ile doğrula"

OAuth yokken `/api/auth/orcid/authorize` 503 döner, manuel ORCID
girişi (K8) sorunsuz çalışmaya devam eder.

---

## 5) Cron jobs (harvest)

Vercel Cron Free planda yetersiz olabilir. Önerilen yaklaşımlar:

- **Vercel Pro + Cron**: `vercel.json` içine schedule ekle
  ```json
  { "crons": [
    { "path": "/api/harvest/openalex?secret=…", "schedule": "0 3 * * *" }
  ]}
  ```
- **External cron** (cron-job.org, EasyCron, GitHub Actions): HTTP GET
  ile `Authorization: Bearer $CRON_SECRET` veya `?secret=$CRON_SECRET`

Harvest endpoints `CRON_SECRET`'i kontrol eder; eksik olursa 401.

Tipik bir takvim:
| Cron | Sıklık | Endpoint |
| --- | --- | --- |
| OpenAlex publications harvest | nightly | `/api/harvest/openalex` |
| PubMed publications | nightly | `/api/harvest/pubmed` |
| Species enrichment (AI) | weekly | `/api/harvest/enrichment` |
| Researcher scoring | weekly | `/api/harvest/score-researchers` |
| GBIF observations | weekly | `/api/harvest/gbif` |
| Photo sync | weekly | `/api/harvest/photos` |
| IUCN sync (if token set) | monthly | `/api/harvest/iucn` |

---

## 6) Database operations

### Backfills

K1–K11 backfill'leri sırasıyla:
- Contribution events (K5): `publication_researchers` + `program_members`
  birleşik INSERT … SELECT
- Placeholder flagging (K7): `UPDATE researchers SET is_placeholder=true
  WHERE LOWER(name) = 'gbif.org user'`
- ORCID import (K8): per-user, kullanıcı `/geocon/welcome` üzerinden
  tetikler

Detaylar her migration commit'inin body'sinde.

### Yeni migration nasıl yazılır?

1. Yerelde gerekirse `supabase migration new <name>` (CLI varsa)
2. SQL'i yaz, **idempotent olduğundan emin ol** (`IF NOT EXISTS`,
   `ON CONFLICT DO NOTHING`)
3. Production'a uygulamak için Claude Code MCP veya Supabase Studio →
   SQL Editor
4. Migration body'sini commit message'a koy (ileride okunabilsin)

### RLS politikaları

Repo'daki tüm tablolar RLS açık. Public okunabilir verilere
`USING (true)` policy, üye-only verilere `program_members` JOIN
policy'si. Yeni tablo eklerken **mutlaka** RLS aç ve uygun policy
yaz.

---

## 7) Observability

### Sentry

`sentry.client.config.js`, `sentry.server.config.js`,
`sentry.edge.config.js`, `instrumentation.js` zaten ayarlı.
`NEXT_PUBLIC_SENTRY_DSN` ve `SENTRY_DSN` set ediliyse otomatik.

Source map upload (production-only) için:
- `SENTRY_AUTH_TOKEN` — Sentry → Auth Tokens
- `SENTRY_ORG` — slug (örn. `geocon`)
- `SENTRY_PROJECT` — slug (örn. `geocon-atlas`)

### PostHog

`lib/analytics.js` event tracking. `NEXT_PUBLIC_POSTHOG_KEY` set
ediliyse Pageview + custom event'ler yollanır. EU instance kullan:
`https://eu.posthog.com`.

### Admin health page

`/geocon/admin/health` — env vars sanity check, Supabase ping, Sentry
test event. Sadece `profile.role = 'admin'` görür.

---

## 8) Day-2 ops

### Vercel deploy bozulursa

1. Vercel → Deployments → en son commit'in build log'una bak
2. "Failed to compile" → genelde missing env var veya import path hatası
3. **Instant rollback**: önceki deploy'a "Promote to Production" tıkla
4. Local'de `npx next build` ile aynı hatayı tekrarla, fix'le, push

### Supabase ana sayfası out of date görünüyorsa

- `get_home_metrics` RPC cache'i — Supabase Studio → SQL Editor →
  `SELECT pg_reload_conf();` veya RPC'yi tekrar çağır
- Eğer counters tamamen yanlış → veri tarafı problem, `contributions`
  / `program_members` audit log'larına bak

### "GBIF.org User" liderlik tablosunda görünüyor

- `is_placeholder` flag'i set olmamış → manuel:
  ```sql
  UPDATE researchers SET is_placeholder=true
  WHERE LOWER(name) IN ('gbif.org user','gbif.org','unknown author','anonymous','n/a');
  ```
- Bir sonraki harvest auto-flag'leyecek (K7 trigger)

### ORCID OAuth callback 503 dönüyor

- Env vars eksik → bkz. madde 4
- Redirect URI mismatch → ORCID developer tools → app → URI'leri
  birebir aynı olarak gir (trailing slash YOK)

### Vercel rate limit

- Free tier'da serverless function execution limiti var. Harvest cron
  job'larını external cron'a taşı (cron-job.org gibi)
- Veya Pro tier'a geç

---

## 9) Disaster recovery

- **Supabase**: daily backup otomatik (Pro plan), Project Settings →
  Database → Backups
- **Vercel**: her commit zaten kalıcı bir deploy snapshot'ı; promote
  ile geri dön
- **GitHub repo**: private, ama bir mirror için `git clone --mirror`
  + harici bir Git host (Codeberg vs.)
- **Anthropic / ORCID credentials**: 1Password / Bitwarden, rotate
  prosedürü için bkz. ilgili setup doc'u

---

## 10) Geliştirme

```bash
cp .env.example .env.local        # ve env vars'ı doldur
npm install
npx next dev                       # http://localhost:3000
```

Test komutları (varsa):
```bash
npx next lint
npx next build                     # production build sanity
```

Pull request açarken:
- Migration'lar için ayrı bir commit ve mesajda SQL özeti
- Schema değişikliği = RLS gözden geçir
- Yeni env var = `.env.example` ve `DEPLOY.md`'yi güncelle

---

## Referanslar

- Mimari: `docs/architecture/README.md` ve oradan zincirlenen 10 belge
- Onboarding & personalization: `docs/architecture/09-onboarding-personalization.md`
- ORCID OAuth setup: `docs/setup/orcid-oauth.md`
- IUCN reapplication: `docs/iucn-api-reapplication.md`
- Decision log: `docs/architecture/10-decision-log.md`
- Quick reference: `docs/architecture/QUICKREF.md`
