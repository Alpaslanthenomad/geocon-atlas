# GEOCON Atlas — Kullanıcı Manueli

**Sürüm**: v3.2 · **Son güncelleme**: 2026-06-04 · **URL**: https://atlas.vennbioventures.com

Bu doküman GEOCON Atlas'ta bulunan **tüm** kullanıcı-yüzeyli özellikleri,
admin araçlarını, kamu API endpointlerini ve cron job'larını listeler.
Sırayla okuyabilir veya sol-side içindekiler'i kullanabilirsin.

---

## İçindekiler

1. [Mimari özeti](#mimari-özeti)
2. [Roller + erişim](#roller--erişim)
3. [Sidebar navigasyonu](#sidebar-navigasyonu)
4. [Home (`/geocon`)](#home-geocon)
5. [WORKSPACE bucket — kişisel iş alanı](#workspace-bucket)
6. [COMMONS bucket — paylaşılan veri](#commons-bucket)
7. [TOOLS bucket — keşif & yardımcı araçlar](#tools-bucket)
8. [Admin alanı](#admin-alanı)
9. [Public API + entegrasyonlar](#public-api--entegrasyonlar)
10. [Cron'lar + arka plan işler](#cronlar--arka-plan-işler)
11. [Veri katmanları + RLS özet](#veri-katmanları--rls-özet)
12. [Ortam değişkenleri + setup](#ortam-değişkenleri--setup)

---

## Mimari özeti

- **Frontend**: Next.js 14 App Router, React 18, hep "use client" şeklinde route-level component'ler
- **Veritabanı**: Supabase (Postgres 17, RLS, SECURITY DEFINER RPC'ler), pgvector, pg_cron, pg_net
- **Auth**: Supabase Auth (email/password + ORCID OAuth)
- **Deploy**: Vercel (production = `atlas.vennbioventures.com`)
- **Storage**: Supabase Storage (foto upload, env-gated)
- **3D Globe**: react-globe.gl (Three.js sarmalayıcısı)
- **AI**: Anthropic Claude (Haiku 4.5 default, env-gated)
- **Push**: Web Push API + service worker
- **Analytics**: Self-hosted (Supabase tablosu + in-house dashboard)
- **Error tracking**: Sentry (venn-bioventures org, de.sentry.io)

---

## Roller + erişim

| Rol | Erişim |
|---|---|
| **Anon** (giriş yok) | Atlas browse, search, explore globe, public profile (/r/), API |
| **Authenticated** | + Watching, Drafts, Programs/Proposals oluşturma, Field notebook, IUCN Hub, Thesis, Webhook settings |
| **Admin** | + Admin dashboard, IUCN sync, Verticals editor, Analytics, Edit queue, Accreditation queue |
| **Vertical maintainer** | Per-vertical curation (henüz BEE-level, GEOCON içinde kullanılmıyor) |

Giriş yolları:
- **Email + şifre** — kayıt + sign-in
- **ORCID OAuth** — Welcome flow'da Step 1
- **Magic link** — email ile gönderilen tek seferlik link

---

## Sidebar navigasyonu

3 bucket halinde gruplandı (lucide-react icon set):

```
WORKSPACE (9)         COMMONS (7)          TOOLS (8)
  Home                  Species              Search
  Activity              Metabolites          Ask GEOCON
  Programs              Publications         Compare
  Proposals             Specimens            Explore
  Open Briefs           Outcomes             Calendar
  IUCN Hub        🔒    Researchers          Field notebook
  Thesis          🔒    Organizations        Grants
  Watching        🔒                          Feed
  Drafts          🔒
  + Admin         🔑
```

🔒 = signed-in only · 🔑 = admin only · Mobile'da sidebar drawer, alt 4-tab nav

---

## Home (`/geocon`)

Açılış sayfası. Yukarıdan aşağıya:

1. **OrcidConnectBanner** — ORCID bağlı değilse violet gradient banner
2. **OnboardingChecklist** — Welcome 2-step bitmediyse rehber
3. **MyMissionFeed** — Welcome Step 2'de seçilen mission tag'lere göre brief + program eşleşmeleri
4. **TrustStrip** — 4 sayı: species / threatened / researchers / programs
5. **GEOCONHome** — ana içerik: species grid + 5 katman modülleri
6. **SpotlightRibbon** — editorial picks
7. **TrendingThreads** + **MyDashboard** + **LeaderboardPanel** — community signals

---

## WORKSPACE bucket

### Home — yukarıda

### Activity (`/geocon/activity`)
Platform-wide event timeline. Real-time (Supabase Realtime) ile yeni org/proposal/program girdiği zaman güncellenir. Kind filter chip'leri + "Watching only" toggle (sadece izlediğin species'lere filtrele).

### Programs (`/geocon/programs`)
5-modüllü program workflow: **Origin → Forge → Mesh → Exchange → Accord**. Her program'ın species/profil/proposal/comment/outcome ekosistemi var. Reproducibility passport: preregistration_md + lock + bronze/silver/gold badge.

### Proposals (`/geocon/proposals`)
Collaboration proposals: birinden birine ya da bir organizasyona teklif. Status: draft → sent → negotiating → accepted/declined. Open briefs (kind=research/conservation/capability/...) burada yaşar.

### Open Briefs (`/geocon/briefs`)
Proposal'ların alt filtresi — `brief_kind` set olan public ihtiyaç çağrıları. /briefs/new ile aç.

### IUCN Hub (`/geocon/iucn`) 🔒
**Red List Assessment workspace**. Bir species seç → draft assessment başlat. Status: draft → peer_review → submitted → published. Future: SIS-compatible JSON export + collaborative editing.

### Thesis (`/geocon/thesis`) 🔒
**Educational mode** (B3). MSc/PhD thesis tracker:
- Student + supervisor bağı
- Title, institution, level (undergrad/msc/phd/postdoc)
- Started + target defense date
- Status: proposal → data_collection → analysis → writing → submitted → defended
- Species set chips
- Milestone timeline (literature_review / field_work / analysis / draft / revision / defense)

### Watching (`/geocon/watch`) 🔒
Saved species watchlist. Her species kartı: thumbnail + name + family + IUCN pill + composite score + note + added date + ✕ unwatch. Sidebar badge: izlenen sayısı.

### Drafts (`/geocon/drafts`) 🔒
Tamamlanmamış proposal / brief / program drafts. Continue butonu doğru editöre yönlendirir.

### Admin (`/geocon/admin`) 🔑
[Aşağıda detay](#admin-alanı).

---

## COMMONS bucket

### Species (`/geocon/species`)
47k+ endemic geophyte. Chip-based filtering (IUCN tier, family, country, modul). Card grid + virtualized listele.

**Species detail** (`/geocon/species/<id>`):
- Hero: italic Latin name + authority + family + genus + IUCN pill + module chip + status chip + score + WatchButton
- Programs section (start-program CTA)
- Publications list + AI summary (Claude Haiku tarafından üretilen 1-paragraf özet, env-gated)
- Genus siblings
- SpeciesDomainExtras (atlas-specific fields)
- ExportButtons (CSV, BibTeX, DarwinCore)
- **SpeciesEditProposal** — "Suggest correction" panel (10 alan + Other; signed-in only)
- **SpeciesTimeline** — programs/outcomes/publications/edit_accepted/source_*/observation event'leri
- **IndigenousKnowledge** — TK Labels + community attribution + local names
- **SpecimenLinker** — herbarium specimen listele + request pickup
- **CommercializedOutcomes** — L5 endorse/credit
- **EntityDiscussion** — comment thread + reply

### Metabolites (`/geocon/metabolites`)
1,688 metabolit + 19 compound class regex auto-classify edildi. Filtre + detail.

### Publications (`/geocon/publications`)
3,071 publication. 8 kategori: Conservation, Pharmacology, Phytochemistry, Biotechnology, Ecology, Taxonomy, Agronomy, Other (%75 categorized). Detail: title + journal + year + DOI + authors + abstract + AI summary + linked species. **BibTeX export**: `/api/v1/publications/<id>/bibtex`.

### Specimens (`/geocon/specimens`)
**A2 — Herbarium/Specimen browser**. Atlas-wide filter chips (institution, country) + search (species/barcode/collector). Each row: institution + barcode (mono) + collected date + country flag. Detail per species in SpeciesDetail → SpecimenLinker (request pickup workflow).

### Outcomes (`/geocon/outcomes`)
Commercialization recognition feed. Verification ladder filter: self_declared → peer_endorsed → org_declared → venn_verified. Card grid + endorse count star.

### Researchers (`/geocon/researchers`)
3,266 researcher (1 ORCID-verified). Detail: hero + ORCID pill + publications + affiliations.

### Organizations (`/geocon/organizations`)
Accreditation status: applied → under_review → accredited (basic/partner/preferred). Detail + apply flow.

---

## TOOLS bucket

### Search (`/geocon/search`)
**Cross-entity search** (C2). Tek input, 6 entity kind: species + publications + researchers + programs + organizations + outcomes. Species FTS (ts_rank) + diğerleri ILIKE. Result grouped by kind. URL ?q= ile shareable.

### Ask GEOCON (`/geocon/ask`)
Natural-language query → Claude Haiku → structured filter spec → Supabase query → 1-sentence answer. Fallback: rule-based parser. Env-gated.

### Compare (`/geocon/compare`)
İki species'i yan yana koy: IUCN, score boyutları, native_countries, family.

### Explore (`/geocon/explore`)
**Globe v2 — 7-layer immersive**:

- **Hex bin heatmap** — density Anatolia/Med/Andes ışıl ışıl
- **CR pulse rings** — kritik hotspot nabız
- **Collaboration arcs** — country↔country
- **Per-species pins** — IUCN-renkli noktalar, hover tooltip: italic name + ↘↗→ trend + ENDEMIC chip
- **Active research glow** — programlı species'lerde yeşil halo + altitude lift
- **Discovery spotlight** — sağ üst kart, 25 sn'de random CR/EN/VU + tek paragraf hikaye
- **Radius search** — Shift+click → 50/200/500/1000km radius, panel'de listele

UI controls:
- **Sol rail**: 7-tier IUCN checkboxes + 4 preset (Threat / Evaluated / All / Diversity) + Unrated toggle + Country picker (ISO + tam isim + search + sayım)
- **Sağ chip**: Layer panel (5 toggle: pins/heat/pulse/arcs/research)
- **Family chip**: top-right (mevcut)

### Calendar (`/geocon/calendar`)
**T1 — Conservation Calendar**. 12 ay chip header, 2 kolon: "Your watchlist this month" + "Atlas-wide this month". Per row: italic name + stage (flowering/fruiting/dormancy/germination/seed_collection) + intensity dots + region.

### Field notebook (`/geocon/field`) 🔒
**T3 — Mobile-first observation capture**. GPS auto-capture (high accuracy, retry button), species search (autocomplete species table) + free-text proposed_name fallback, notes textarea, **offline queue** (localStorage gx_field_obs_queue + flush on `online` event). Last 8 submissions list. Photo upload + Pl@ntNet ID = future (stubbed).

### Grants (`/geocon/grants`)
**T4 — Conservation Grant Explorer**. Public open grant listing (NSF, IUCN Save Our Species, Marie Curie, vb.). Per card: funder + title + description + scope chips + deadline countdown + amount range + funder URL. Public API: `GET /api/v1/grants`.

### Feed (`/geocon/feed`)
**D2 — Discovery Feed**. Son 30 günün öne çıkan event'leri: IUCN status changes + peer_endorsed+ outcomes + high-citation publications + new programs + published assessments. Kind filter chips + RSS subscribe button.

API:
- `GET /api/v1/feed` — JSON (5-min cache)
- `GET /api/v1/feed.rss` — RSS 2.0
- `GET /api/v1/feed.atom` — Atom 1.0

---

## Admin alanı

`/geocon/admin` 🔑

**AdminToolbar** üst link'leri:
- 🩺 Health snapshot — sistem durumu
- 🌿 IUCN sync (Wikidata) — manuel IUCN status fetch
- 📊 Analytics — self-hosted telemetri (7d/30d window, top routes, top events, pageviews-by-day)

**AdminOpsTiles** — 7 metrik:
- IUCN coverage % (set/total + unset)
- Edit proposals pending (+ accepted + rejected)
- Accreditations pending
- ORCID adoption %
- Programs total + contribution events
- Pub categories %
- Metabolite class %

**SpeciesEditQueue** — Bekleyen species edit önerileri:
- Field + species name + community vote chip ("+3 community")
- Current/Proposed yan yana iki kart
- Rationale (italic) + submitter + source URL link
- Accept & apply (column whitelist) / Reject (sebep zorunlu)

**AccreditationQueue** — Org accreditation workflow.

`/geocon/admin/verticals` 🔑 — Vertical config editor (BEE-level concept, GEOCON içinde tek vertical: geophytes; ileride BEE outer shell'e taşınacak).

`/geocon/admin/iucn-sync` 🔑 — Manuel batch IUCN status sync via Wikidata SPARQL.

`/geocon/admin/health` 🔑 — Sistem sağlık snapshot.

---

## Public API + entegrasyonlar

**Base**: `https://atlas.vennbioventures.com/api/v1/`

| Endpoint | Method | Açıklama |
|---|---|---|
| `/spec` | GET | OpenAPI 3.0.3 JSON |
| `/publications/<id>/bibtex` | GET | BibTeX entry (24h cache, CORS open) |
| `/grants` | GET | Açık conservation grants (10min cache) |
| `/feed` | GET | Discovery feed JSON |
| `/feed.rss` | GET | RSS 2.0 |
| `/feed.atom` | GET | Atom 1.0 |

**Webhook channels** (kullanıcı tarafı):
- `/geocon/profile` → "Webhook channels" panel
- Provider: Slack / Discord / generic
- Notification fan-out: her notification per active channel POST edilir
- Cron `dispatch-webhooks` her 5 dk pending queue'yu drain eder

**Public profile (Conservation Impact Passport)**:
- `/r/<handle>` (handle = ORCID iD veya email local-part)
- Sayıların yanı sıra mission tag chips + ORCID chip
- Embed widget URL hint

**Identity tools**:
- ORCID OAuth — Welcome Step 1 (OAuth flow + verify-link)
- Public profile linkleri (orcid.org/<iD>)

---

## Cron'lar + arka plan işler

vercel.json içinde tanımlı (CRON_SECRET ile auth):

| Cron | Schedule (UTC) | İş |
|---|---|---|
| `/api/cron/iucn-sync` | 04:00 daily | Wikidata SPARQL → species.iucn_status (4 batch × 100) |
| `/api/cron/enrich-classifications` | 04:30 daily | Pub category + metabolite compound_class heuristic |
| `/api/cron/ai-summarize-publications` | 03:00 daily | Claude Haiku publication summary (max 6/gün) |
| `/api/cron/dispatch-webhooks` | every 5 min | Slack/Discord webhook delivery queue drain |
| `/api/harvest/openalex` | daily 05:00 (per day-of-week) | OpenAlex publication harvest |
| `/api/harvest/pubmed` | per-week | PubMed harvest |
| `/api/harvest/enrich` | daily 07:00 | Publication enrichment |
| `/api/harvest/backfill` | daily 08:00 | Backfill missing fields |
| `/api/harvest/gbif` | daily 09:00 | GBIF occurrence harvest |
| `/api/harvest/iucn` | monthly | Full IUCN catalog refresh |

DB triggers:
- `notifications_send_push` — INSERT notifications → web push fan-out
- `notifications_webhook_enqueue` — INSERT notifications → webhook_deliveries queue
- `species_threat_alert` — UPDATE species.iucn_status → watchers'a notification
- `program_coordination_notice` — INSERT programs → aynı species'in mevcut programları'na notification
- `species_watch_mirror` — species_watch ↔ user_watchlist mirror
- `edit_proposal_provenance` — accepted edit → species_field_provenance kayıt

---

## Veri katmanları + RLS özet

5-katmanlı GEOCON manifestiyle uyumlu:

**L1 — Species Commons**:
- `species` (47k) + `metabolites` (1.7k) + `publications` (3k) + `researchers` (3.3k) + `organizations`
- Edit proposals: `species_edit_proposals` + votes — community-driven
- Provenance: `species_field_provenance` — kim/ne zaman/hangi kaynaktan

**L2 — Programs** (5 modül):
- `programs` + `program_members` + `program_outputs` + `program_pathways` + `program_tics` + `program_story_entries`
- Reproducibility: preregistration_md + locked_at + reproducibility_badge

**L3 — Studies / Briefs**:
- `collaboration_proposals` (proposal + brief türevleri)
- `proposal_comments` + `proposal_events`

**L4 — Open Briefs** — L3'ün alt filtresi

**L5 — Commercialization Recognition**:
- `commercialized_outcomes` + `commercialization_credits`
- 4-tier verification: self_declared → peer_endorsed → org_declared → venn_verified

Plus genişleme katmanları:
- `species_watch`, `field_observations`, `species_phenology`
- `iucn_assessments` + workflow
- `conservation_grants` + `data_citations` + `climate_projections` (shell)
- `webhook_channels` + `webhook_deliveries`
- `species_edit_proposal_votes`, `indigenous_knowledge`, `species_local_names`
- `herbarium_specimens` + `specimen_pickup_requests`
- `thesis_tracks` + `thesis_milestones`
- `verticals` + `vertical_maintainers`
- `analytics_events`
- `notifications` + `push_subscriptions`

RLS özet:
- Public read (anon): species, metabolites, publications, researchers, organizations, outcomes, grants, feed, specimens, indigenous_knowledge (non-restricted)
- Self read (auth): drafts, watching, field_observations (own), thesis_tracks (student/supervisor), webhook_channels, my analytics
- Admin only: analytics_events, edit proposal queue, accreditation queue, verticals

---

## Ortam değişkenleri + setup

**Vercel env vars** (Production + Preview + Development):

| Variable | Anlamı | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon JWT | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role JWT | ✅ |
| `CRON_SECRET` | Cron Bearer auth | ✅ |
| `ANTHROPIC_API_KEY` | Claude API | Opsiyonel (AI features için) |
| `ORCID_CLIENT_ID` / `_SECRET` | ORCID OAuth | Opsiyonel |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push notifications | Opsiyonel |
| `VAPID_PRIVATE_KEY` | Push notifications | Opsiyonel |
| `VAPID_SUBJECT` | mailto: | Opsiyonel |
| `PUSH_INTERNAL_SECRET` | DB trigger → /api/push/send auth | Opsiyonel |

**Supabase Vault** (DB trigger'larının dış HTTP için):
- `geocon_site_url` = `https://atlas.vennbioventures.com`
- `push_internal_secret` = (PUSH_INTERNAL_SECRET ile aynı)

Bunlar olmadan: push trigger sessizce no-op. Hiçbir şey kırılmaz.

---

## Test akışları

### Yeni kullanıcı tek seferlik
1. `/` → "Sign in via BEE"
2. Email + şifre veya ORCID
3. `/geocon/welcome` → Step 1 (Identity — ORCID girince inline preview) → Step 2 (Mission — import summary + mission tag picker) → `/geocon`
4. Home'da MyMissionFeed senin için brief önerileri gösterir

### Araştırmacı günlük rutin
1. `/geocon` — bildirim bell + activity overview
2. `/geocon/calendar` — bu ayın fenolojisi
3. `/geocon/watch` — izlediğin species'lerin son durumu
4. `/geocon/explore` — globe ile coğrafi keşif
5. `/geocon/field` — sahada gözlem kaydı
6. `/geocon/iucn` — Red List assessment workspace

### Akademik kullanım
1. `/geocon/search?q=Allium` — cross-entity search
2. Publication detail → `/api/v1/publications/<id>/bibtex` → Zotero/Mendeley
3. Reproducibility passport: `/r/<handle>` → email signature linki
4. Thesis tracker: `/geocon/thesis` — supervisor ↔ student bağı

### Admin operasyon
1. `/geocon/admin` — 7 ops tile
2. Edit queue → community vote'lara göre prioritize, Accept & apply
3. `/geocon/admin/analytics` — kullanım datası
4. IUCN sync trigger — Wikidata SPARQL update

---

Eğer bir özellik bu manuelde yoksa — yeni shippad, sayfa cache'i temizle (Ctrl+Shift+R).
Sorun yaşarsan: Sentry → venn-bioventures org → ATLAS-* issue ID ile bana yaz.
