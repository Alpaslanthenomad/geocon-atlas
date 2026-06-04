# GEOCON Atlas — v4 Roadmap

**Tarih**: 2026-06-04 · **Hedef**: 2026-Q3 (yaklaşık 6-10 hafta otonom çalışma)

Bu doküman v3.2'den sonra yapılması anlamlı olanları toplar. Önceliklendirme
4 boyut üzerinden:

- **Kullanıcı çekimi** (acquisition): yeni araştırmacılar nasıl gelir?
- **Tutuculuk** (retention): geri dönüş sebepleri
- **Yetkinlik** (capability): platformun yapabildiği yeni şeyler
- **Strateji** (positioning): IUCN re-application, BEE expansion, partner conversations

Her madde S/M/L effort + ROI tahmini taşır.

---

## 0. Şu an dorman/yapımsız bekleyenler

Foundation kuruldu ama UI eksikleri var. v4'ün ilk işi.

### 0.1 Community vote butonu (public-facing)
- **Foundation**: RPC `vote_species_edit_proposal` ✅, table `species_edit_proposal_votes` ✅, admin queue'da +N chip ✅
- **Eksik**: `/geocon/species/<id>/edits` route — public pending edits listele + ↑↓ vote buton
- **Effort**: S (1 route + 1 component)
- **ROI**: Yüksek — Wikipedia model, community quality moderation

### 0.2 Field provenance tooltip
- **Foundation**: `species_field_provenance` table ✅, `get_field_provenance` RPC ✅, trigger ✅
- **Eksik**: SpeciesDetail'da her field yanında ⓘ kaynak tooltip (Wikidata 2026-05-30, manual_edit Alpaslan 2026-06-04, …)
- **Effort**: M (her field'a render guard + popover)
- **ROI**: Orta — akademik kredibilite, IUCN application'ında transparency

### 0.3 Voice memo Whisper cron + UI
- **Foundation**: `field_observations.voice_url/_transcript/_transcribed_at` ✅, `pending_voice_transcriptions` RPC ✅
- **Eksik**: FieldRoute'a audio recorder (MediaRecorder API), Supabase Storage upload, `/api/cron/transcribe-voice` (Whisper API)
- **Effort**: M (audio recording + Whisper integration)
- **ROI**: Yüksek (saha araştırmacısı için "voice-first observation")

### 0.4 Push notifications VAPID setup
- **Foundation**: sw.js push handler + `/api/push/send` + DB trigger ✅
- **Eksik**: VAPID keys generate + Vercel env'e ekleme (kullanıcı tarafı)
- **Effort**: XS (5 dakika kullanıcı işi)
- **ROI**: Yüksek (offline notification)

### 0.5 Specimen request inbox
- **Foundation**: `specimen_pickup_requests` + `list_my_specimen_requests` RPC ✅
- **Eksik**: `/geocon/specimens/requests` veya profile'a inbox panel — request status takibi
- **Effort**: S
- **ROI**: Orta — A2 workflow tamamlanması

### 0.6 IUCN SIS export
- **Foundation**: `iucn_assessments` table workflow ✅
- **Eksik**: `/api/v1/iucn/<id>.json` SIS-compatible JSON export endpoint + assessment editor (criteria checklist, rationale markdown editör)
- **Effort**: L
- **ROI**: Çok yüksek — IUCN re-application'ın resmi köprüsü

---

## 1. Veri katmanı genişleme

### 1.1 Wikidata IUCN historical harvest cron
- **Amaç**: Time slider'ı gerçek IUCN tarihçesiyle çalıştırmak
- **Plan**: Yeni `species_iucn_history(species_id, year, status, source)` table + Wikidata SPARQL (P141 with date qualifier) cron
- **Effort**: M
- **ROI**: Yüksek — Globe v3 time-slider, "1990'da bu species LC'ydi, 2024'te CR" hikayesi

### 1.2 WorldClim/Chelsa climate harvest
- **Amaç**: Climate Vulnerability Projector (C2) gerçek data
- **Plan**: `climate_projections` table'ı doldurmak için cron (Chelsa-bioclim raster sample @ species centroid + SSP126/245/585 2050/2080 projections)
- **Effort**: L (raster işleme — Python sidecar olabilir)
- **ROI**: Çok yüksek — IUCN climate WG ile uyum

### 1.3 Grant data ingest
- **Amaç**: Conservation grants table'ını doldurmak
- **Plan**: NSF DEB, NIH Fogarty, IUCN SOS, Marie Curie API'lerden ay başı cron + admin curation UI
- **Effort**: M
- **ROI**: Orta — funding workflow eksiksiz olur

### 1.4 Pl@ntNet API entegrasyonu
- **Amaç**: Field Notebook fotodan species ID önerisi
- **Plan**: FieldRoute photo upload → Supabase Storage → Pl@ntNet API → top 3 candidate species
- **Effort**: S (Pl@ntNet API key + 1 endpoint)
- **ROI**: Çok yüksek — saha araştırmacısı için "instant ID"

### 1.5 iNaturalist bi-directional sync
- **Amaç**: Field observation'ları iNaturalist'e push + iNat'tan species-relevant observation pull
- **Plan**: OAuth bağlantısı + cron
- **Effort**: L
- **ROI**: Çok yüksek — citizen science topluluğuyla köprü, organic acquisition

### 1.6 GBIF/Index Herbariorum specimen ingest
- **Amaç**: `herbarium_specimens` table'ını doldurmak
- **Plan**: GBIF occurrence search per species + Index Herbariorum institution data + cron
- **Effort**: M
- **ROI**: Yüksek — A2 Specimen Linker'a gerçek hayat

### 1.7 ORCID auto-discovery
- **Amaç**: 3266 researcher'dan 1'inin ORCID'i var. Diğerlerini bulmak.
- **Plan**: researcher.name + email pattern → ORCID Public API search → candidate matches, admin onayı
- **Effort**: M (false-positive riskine dikkat)
- **ROI**: Orta — kişisel ORCID adoption %1 → %30 hedefi

### 1.8 Zenodo DOI minting
- **Amaç**: Data export'lara DOI ata
- **Foundation**: `data_citations` table + `register_data_citation` RPC ✅
- **Eksik**: Zenodo API entegrasyonu + admin approve + DOI back-write
- **Effort**: M
- **ROI**: Çok yüksek — citation-able dataset = academic legitimacy

---

## 2. Yetkinlik / yeni özellikler

### 2.1 Audit trail tooltip species detail'da
- **Effort**: M (her field için popover render guard)
- **ROI**: Yüksek (transparency, IUCN application)

### 2.2 Cross-vertical search (BEE-level)
- **Plan**: BEE platform layer'a search index; GEOCON Atlas + future orchid/cannabis sub-products üzerinde tek arama
- **Effort**: L (BEE outer shell gerekli, başka repo olabilir)
- **ROI**: Yüksek (multi-vertical adımı)

### 2.3 Social autopost (Bluesky/Mastodon)
- **Foundation**: D2 Discovery Feed UI ✅
- **Eksik**: Cron'da Bluesky API + Mastodon API ile autopost
- **Effort**: S
- **ROI**: Orta (community building)

### 2.4 Notion plugin
- **Plan**: Notion API'sine species blocks, /api/v1 endpoint'leri tüketen plugin
- **Effort**: M
- **ROI**: Orta (Notion-heavy researcher segmenti)

### 2.5 Telegram bot
- **Plan**: Notification subscriptions + species lookup chatbot
- **Effort**: S
- **ROI**: Orta (mobile-first researcher segmenti)

### 2.6 Slack bot (full)
- **Foundation**: Webhook channel ✅ (one-way push)
- **Eksik**: Slash command (`/geocon Allium`) ile interactive lookup
- **Effort**: M
- **ROI**: Orta

### 2.7 Real-time observation feed (community)
- **Plan**: `field_observations.visibility='community'+'public'` olan observation'ların live feed'i `/geocon/observe` route'ta
- **Effort**: S
- **ROI**: Yüksek (citizen science feel)

### 2.8 Conservation outcome timeline cross-species
- **Foundation**: SpeciesTimeline component ✅
- **Eksik**: `/geocon/outcomes/timeline` — tüm species'lerin outcome event'leri tek timeline'da
- **Effort**: S
- **ROI**: Orta

### 2.9 Saved searches + email alerts
- **Plan**: `/geocon/search` üzerinde "Save this search" → kayıtlı search'ler + weekly alert email
- **Effort**: M
- **ROI**: Yüksek (retention)

### 2.10 Markdown rendering (notes everywhere)
- **Şu an**: Notes pre-wrap (plain). markdown library yok, bundle weight için bilinçli karar.
- **v4**: `react-markdown` + sanitize-html + remark-gfm. ProgramDetail + ThesisDetail + IndigenousKnowledge use_description_md.
- **Effort**: S (lib + render component) + per-route swap
- **ROI**: Orta (akademik notlar görsel olarak doğru)

---

## 3. Görsellik / performans

### 3.1 Globe performance pass
- **Sorun**: Heat layer 47k pin'i hex'liyor → three.js sahnesi şişiyor
- **Plan**:
  - Heat hex resolution 3 → 4 (büyük hex, daha az obje)
  - Spotlight rotation 25s → 60s (RPC throttle)
  - Layer panel default: heat OFF
  - speciesPinPoints cap 5000 → 2500
  - Globe'a `enablePointerInteraction={false}` for hover-only-tooltip (re-render azaltır)
- **Effort**: S
- **ROI**: Yüksek (kullanıcı şikayet etti)

### 3.2 Mobile gesture pass for globe
- **Eksik**: Pinch-zoom + two-finger pan globe için tam optimize değil
- **Effort**: S
- **ROI**: Orta

### 3.3 Dark mode polish (audit IV.5 long-tail)
- **Eksik**: Hala bazı route'larda `#fff`/`#ece9e2` hard-coded — bulk sweep çoğunu yakaladı ama gradient'lar, IUCN spectrum, illustrations
- **Effort**: M (manuel inspection)
- **ROI**: Orta

### 3.4 Loading state'leri
- **Eksik**: Bazı route'larda hala generic "Loading…" var (skeleton primitives kullanılmamış)
- **Effort**: S
- **ROI**: Orta (perceived performance)

### 3.5 Mobile bottom nav 6 tab
- **Şu an**: 4 tab (Home/Atlas/Programs/Briefs). Watching ve Calendar mobile'da hızlı erişim ister.
- **Effort**: XS
- **ROI**: Orta

---

## 4. Strateji / pozisyonlama

### 4.1 IUCN re-application (öncelik 1)
- **Şu anki durum**: Audit IX.3'te not vardı, IUCN'in "marketplace creep" endişesi.
- **Plan**:
  - Brochure PDF (Venn BioVentures formel başvuru materyali)
  - Marketplace / commercialization framing'i tamamen kaldır (L5 outcomes'tan "recognition" dilini koru, hiçbir yerde "buy/sell" geçmesin)
  - IUCN re-application için manifesto refresh
  - Reproducibility passport + Audit trail + IUCN Assessment Hub vurgulanmalı
- **Effort**: M (içerik + formal başvuru)
- **ROI**: Çok yüksek (organizasyonel partnership)

### 4.2 IUCN Türkiye partnerlik
- **Plan**: ANG (Aegean Natural Heritage Group) veya benzer Türk botanik dernekleriyle pilot
- **Effort**: External
- **ROI**: Yüksek (yerel kullanıcı tabanı)

### 4.3 Marketing / SEO
- **Şu anki durum**: 0 organic, sitemap.xml var
- **Plan**:
  - SEO sweep: meta tags, structured data (JSON-LD), Open Graph
  - Blog/news section (`/geocon/news`) — monthly editorial
  - Backlink stratejisi: ORCID resource link, IUCN partner badge, Kew/Vienna herbarium links
- **Effort**: M
- **ROI**: Yüksek (organic acquisition)

### 4.4 BEE platform layer
- **Plan**: Vertical-management UI'ı BEE outer shell'e taşı. GEOCON Atlas → BEE'nin altındaki ilk vertical. Sonra orchids/carnivorous plants/raptors gibi vertical'lar.
- **Effort**: L (yeni Next.js project)
- **ROI**: Çok yüksek (multi-product strategy)

### 4.5 Telemetri → IA feedback loop
- **Şu anki durum**: Self-hosted analytics canlı, henüz 1 haftalık data
- **Plan**: 2-3 hafta data topla → audit IX.2'deki sorular cevaplansın (ORCID banner CTR, search zero-hit, sidebar item click distribution)
- **Effort**: S (sadece raporlama)
- **ROI**: Yüksek (data-driven IA decisions)

### 4.6 Open data license + citation policy
- **Plan**: `/geocon/about/data` route — CC-BY-4.0 license + citation guide + dataset DOI policy
- **Effort**: S
- **ROI**: Yüksek (akademik benimseme)

---

## 5. Tek-tıkla v4 paketi (öneri sırası)

Eğer bir başka otonom oturumda 4 paket halinde gitmek istersen şu sıra mantıklı:

### Paket V4.1 — Audit + community moderation (S+M)
- 0.1 Community vote butonu (public)
- 0.2 Field provenance tooltip
- 0.6 IUCN SIS export endpoint
- 2.1 (provenance tooltip ile birleşik)

### Paket V4.2 — Saha & AI (M+L)
- 1.4 Pl@ntNet entegrasyonu
- 0.3 Voice memo recorder + Whisper cron
- 1.5 iNaturalist bi-directional sync
- 1.6 GBIF/Index Herbariorum specimen ingest

### Paket V4.3 — IUCN/Conservation köprüsü tam (L)
- 1.1 Wikidata IUCN historical harvest
- 1.2 WorldClim climate harvest + Globe v3 layer
- 0.6 IUCN SIS detail editor + JSON export
- 4.1 IUCN re-application materyalleri

### Paket V4.4 — Ekosistem (M+S)
- 1.3 Grant data ingest cron
- 1.8 Zenodo DOI minting
- 2.3 Social autopost (Bluesky/Mastodon)
- 2.4 Notion plugin
- 2.5 Telegram bot

### Paket V4.5 — Görsellik & perf (S+M)
- 3.1 Globe performance pass
- 3.3 Dark mode long-tail
- 3.4 Loading skeleton primitives
- 3.5 Mobile bottom nav 6 tab

---

## 6. Tahmini toplam

Her paket: yaklaşık 2-4 günlük yoğun otonom çalışma + DB migration + UI build + test.

5 paket × ~3 gün = **15 gün** otonom çalışma + ~10 gün dış (IUCN partnerlik, marketing copy).

Önerim: **V4.1 + V4.2 önce** (3-5 gün), telemetri data'sı 2 hafta toplandıktan sonra **V4.3 + V4.4 + V4.5** kalan paketler.

---

## 7. Yapmamamız gerekenler (red flag)

- ❌ Marketplace framing (audit + IUCN re-app riski)
- ❌ Para columns (revenue tracking, escrow, broker fee, royalty splits — IUCN reddeder)
- ❌ Patent registry GEOCON'da (legal risk + IUCN concern)
- ❌ Closed-source plugins (license CC-BY-4.0/MIT kalmalı)
- ❌ Whitelabel / SaaS positioning (single research commons identity)
- ❌ Ads / advertising layer
- ❌ User data → ML training (privacy + telemetry'nin koyduğu sınır)
- ❌ Pay-to-publish outcome (anti-quality)
- ❌ Premium tier'lar (single-tier commons; eğer paywall olursa yalnız bulk export / API rate limit ileri çekme, içerik değil)

---

Son söz: **v3.2 üzerine yapılmış 50+ feature** zaten dünya çapında bir conservation atlas standardı. v4 → endüstriyel olgunluk + IUCN'le resmi köprü + saha/akademik tam entegrasyon. Bunu mevcut Venn BioVentures temposuyla 6-10 hafta otonom mümkün.

İyi yola.
</thinking>
