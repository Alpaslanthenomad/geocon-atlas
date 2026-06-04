# GEOCON Atlas — v5 Ekosistem Genişleme Paketi

**Başlangıç tarihi**: 2026-06-04 (V4 tamamlandıktan sonra)
**Hedef**: ~6-8 hafta otonom çalışma + 2 hafta dış müzakere
**Felsefe**: V3 = ürün, V4 = saha + IUCN köprüsü, **V5 = ekosistem + bileşen olarak başkalarının kullandığı altyapı**

---

## Kategoriler (öncelik sırası)

```
V5.1 — UI/UX completion           [hızlı, kod-only, env beklemez] ★★★
V5.2 — Saved search digest        [hızlı, kod-only, env beklemez] ★★★
V5.3 — Ekosistem köprüleri        [orta, env gerekli]              ★★
V5.4 — Community living feed      [orta, kod-only]                 ★★
V5.5 — Üçüncü-parti entegrasyon   [orta, env + OAuth]              ★★
V5.6 — Klimatoloji raster pipe    [büyük, Python sidecar]          ★
V5.7 — Strateji + pozisyon        [manuel, dış iş]                 ★★★★
```

★ = etki, sıralama önem değil

---

## V5.1 — UI/UX completion

Ürünün bittiğini hissettirecek tamamlama paketi. Hiçbiri env beklemez,
hiçbiri yeni servis çağırmaz.

### V5.1-a · Markdown component swap (3 saat)
`<Markdown />` yazıldı ama 5 yerde hâlâ pre-wrap metin var:
- **ProgramDetail** → preregistration_md
- **ThesisDetail** → milestone notes
- **IndigenousKnowledge** → use_description_md
- **IucnAssessmentEditor** → "Preview" tab (yeni)
- **CommercializedOutcomes** → outcome rationale

Pattern: import `<Markdown />`, `<pre>{text}</pre>` → `<Markdown>{text}</Markdown>`.
- **Etki**: Akademik notlar düzgün başlık + liste + link render eder
- **ROI**: Yüksek (akademik kredibilite)

### V5.1-b · Dark mode long-tail sweep round 2 (4 saat)
- Hâlâ hard-coded `#fff`, `#ece9e2`, `rgba(0,0,0,…)` olan yerleri tara
- IUCN spectrum gradient'leri kontrol et (light/dark uyumu)
- Globe atmosfere kadar (white-out riskli)
- TrustStrip, LeaderboardPanel illustrations
- **ROI**: Orta (perceived quality)

### V5.1-c · Loading skeleton primitives (2 saat)
- `<Skeleton variant="card|line|circle" />` standardı
- `gx-skeleton` class'ını CSS'ten kaldırıp component'e çevir
- Sweep: Search, Atlas, Programs, IUCN Hub'da "Loading…" → skeleton
- **ROI**: Orta (perceived performance)

### V5.1-d · Globe mobile gesture pass (3 saat)
- Pinch-zoom resmî two-finger gesture handler
- Tek parmak pan (şu an iki parmak istiyor)
- Tooltip mobile'da tap (hover yok)
- Layer panel sağ chip pozisyonu mobile small (≤375px)
- **ROI**: Yüksek (mobile-first hedefi)

### V5.1-e · Toast position + a11y (1 saat)
- Toast bottom-right, mobile'da bottom-center
- ARIA `role="status"` + `aria-live="polite"`
- **ROI**: Düşük (zaten kabul edilebilir)

**V5.1 toplam**: ~13 saat, tek otonom oturum
**Env**: yok
**Yeni table**: yok

---

## V5.2 — Saved search digest

`saved_searches` infrastructure V4.4-b'de hazır. Email pipeline gerek.

### V5.2-a · Resend email entegrasyonu (3 saat)
- `RESEND_API_KEY` env
- `lib/email.js` wrapper — `sendEmail({ to, subject, html, text })`
- Template: minimal HTML (text-mostly), brand renkleri
- **Env**: `RESEND_API_KEY`, `EMAIL_FROM` = `geocon@vennbioventures.com`

### V5.2-b · Saved search digest cron (4 saat)
- `/api/cron/saved-search-digest`
- Haftalık (Pazartesi 09:00 UTC)
- Her aktif saved_search için:
  - Cross-entity search RPC çağır
  - `last_count`'ı karşılaştır, yeni sayıyı bul
  - Yeni varsa email gönder
  - `last_run_at` + `last_count` update
- Email içerik: top 5 yeni eşleşme + "View all" link
- **ROI**: Yüksek (retention)

### V5.2-c · Threat alert email (mevcut DB trigger'a hookla) (2 saat)
- `species_threat_alert` trigger şu an notification yaratıyor
- Yeni: trigger içinde `notify_email_queue` table'a da yaz
- Her 10dk cron drain
- Email subject: `[GEOCON] Allium karataviense → CR (was EN)`
- **ROI**: Çok yüksek (gerçek conservation use case)

### V5.2-d · "Saved searches" management panel (2 saat)
- `/geocon/profile` → yeni "Saved searches" section
- List + delete + pause/resume + "preview matches now"
- **ROI**: Orta

**V5.2 toplam**: ~11 saat
**Env**: `RESEND_API_KEY`, `EMAIL_FROM`
**Yeni table**: `notify_email_queue` (kısa)

---

## V5.3 — Ekosistem köprüleri

Dış kaynaklara karşılıklı bağlantı. Her biri kullanıcı tabanı çekiyor.

### V5.3-a · iNaturalist bidirectional push (6 saat)
- V4.2-d'de read-only sync vardı, push henüz yok
- OAuth flow: kullanıcı iNat'a authorize et
- `inat_oauth_tokens(user_id, access_token, refresh_token)` table
- `/api/inat/push` — `field_observations.visibility='public'` olanları iNat'a post
- Cron daily: yeni public field_observation'ları iNat'a push
- **Env**: `INAT_OAUTH_CLIENT_ID` + `_SECRET`
- **ROI**: Çok yüksek (citizen science ekosistemi)

### V5.3-b · ORCID auto-discovery cron (4 saat)
- 3266 researcher'dan 1'i ORCID-bound
- Cron: name + (institution OR last publication) match
- ORCID Public API search
- Match'i `researcher_orcid_candidates(researcher_id, orcid, confidence, suggested_at)` table'a yaz
- Admin queue: tek tek onay (false-positive yüksek olabilir)
- **ROI**: Orta (kişisel ORCID adoption %1 → %30 hedefi)

### V5.3-c · Grant data ingest cron (4 saat)
- `conservation_grants` table manuel veriyle dolu
- NSF DEB API + IUCN SOS API + Marie Curie API
- Cron daily her birinden yeni grant'leri çek
- `funder_source` + `funder_url` ile kaynak göster
- **ROI**: Yüksek (funding workflow)

### V5.3-d · Catalogue of Life sync (3 saat)
- Taxonomic backbone authority
- Family + genus revision'larını CoL'den senkronize et
- `species_taxonomy_history(species_id, change, source, date)` log
- **ROI**: Orta (akademik kredibilite)

### V5.3-e · Sentry → Github issues automation (2 saat)
- Yüksek-frekans Sentry issue → otomatik GitHub issue
- Reaper: aynı stack trace 3+ session → issue
- **ROI**: Düşük-orta (bug triyaj)

**V5.3 toplam**: ~19 saat
**Env**: `INAT_OAUTH_CLIENT_ID`/`_SECRET`, NSF/IUCN SOS keys (opsiyonel)
**Yeni table**: 3 yeni table

---

## V5.4 — Community living feed

GEOCON'u "statik atlas" yerine "yaşayan araştırmacı topluluğu" gibi göstermek.

### V5.4-a · `/geocon/observe` real-time live feed (5 saat)
- field_observations.visibility='community'+'public' + inat_observations
- Realtime postgres_changes subscription
- Sol kolon: yeni 10 gözlem (canlı)
- Sağ kolon: harita üzerinde aynı 10 nokta
- Click → species detail
- Top filter chips: family + IUCN tier + my watchlist only
- **ROI**: Yüksek (citizen science feel)

### V5.4-b · Cross-species outcome timeline (3 saat)
- `/geocon/outcomes/timeline`
- Tüm species'lerin outcome event'leri tek timeline
- Grup: month + verification tier
- **ROI**: Orta

### V5.4-c · "Today on GEOCON" Home widget (2 saat)
- Home sayfasına: "Bugün platformda" mini-feed
- Yeni edit kabul, yeni outcome, yeni IUCN assessment, yeni field observation
- Telemetri tabanlı (analytics_events'tan canlı sayım)
- **ROI**: Orta (retention)

### V5.4-d · Discussion threads cross-entity (4 saat)
- `EntityDiscussion` zaten species'e var
- Aynısı: program, proposal, IUCN assessment, outcome
- Tek `discussions(entity_kind, entity_id, ...)` table
- **ROI**: Orta (collaboration)

### V5.4-e · Researcher activity profile (`/r/<handle>` zenginleştirme) (3 saat)
- Mevcut: name + mission tags + ORCID + count'lar
- V5: son 30 günde ne yapmış (edit, outcome, observation, comment)
- Email signature linki olarak güçlü
- **ROI**: Yüksek (akademik personal brand)

**V5.4 toplam**: ~17 saat
**Env**: yok
**Yeni table**: `discussions` (genişletilmiş EntityDiscussion)

---

## V5.5 — Üçüncü-parti entegrasyon (klient SDK'lar + bot'lar)

Diğer platformların GEOCON verisini tüketmesini kolaylaştırmak.

### V5.5-a · Slack interactive bot (4 saat)
- Mevcut: outbound webhook (sadece push)
- Yeni: Slack slash command `/geocon Allium`
- `/api/slack/command` endpoint — Slack signing secret doğrulaması
- Response: ephemeral species card (name + IUCN + composite_score + link)
- `/geocon watch Allium` → watching ekle (bağlı kullanıcı için)
- **Env**: `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`
- **ROI**: Orta (Slack-heavy lablar)

### V5.5-b · Telegram bot (3 saat)
- `@geocon_atlas_bot` (Telegram BotFather)
- Long-polling worker (Vercel'in cron'unda runaway sorun, ayrı service)
- Veya webhook-based + Vercel route
- Inline mode: `@geocon_atlas_bot allium` → species suggestion
- **Env**: `TELEGRAM_BOT_TOKEN`
- **ROI**: Orta (mobile-first segmenti)

### V5.5-c · Notion plugin (4 saat)
- Notion API'ye blok ekleyen entegrasyon
- "Insert GEOCON species block" → species card
- OAuth flow
- **Env**: `NOTION_CLIENT_ID` + `_SECRET`
- **ROI**: Orta (Notion-heavy lablar)

### V5.5-d · Public JavaScript SDK (4 saat)
- `npm i @geocon/atlas-client`
- TypeScript-first thin wrapper around `/api/v1/`
- Pre-built React components: `<SpeciesCard id="..." />`, `<IucnBadge id="..." />`
- **ROI**: Yüksek (developer adoption → embed everywhere)

### V5.5-e · Embed widget (3 saat)
- Mevcut: `/embed/...` route
- Yeni: copy-paste iframe + responsive
- Species card, threat alert badge, BibTeX button
- **ROI**: Orta-yüksek (blog/article embed)

### V5.5-f · Cross-vertical search (BEE-level) (büyük — V5.7'ye bırak)
- BEE platform layer şart, GEOCON içine girmemeli
- Burada list referansı için

**V5.5 toplam**: ~18 saat
**Env**: 4 farklı (Slack, Telegram, Notion + opsiyonel)
**Yeni table**: minimal — bot kullanıcı state mappings

---

## V5.6 — Klimatoloji raster pipe (heavy)

V4.3-b'de UI stub bıraktık. Gerçek data için Python worker gerekli.

### V5.6-a · WorldClim/Chelsa bioclim layer ingest (8 saat)
- Python service (Vercel'in dışı — Render/Railway/AWS Lambda)
- Per species: native_countries centroid'ten bioclim sample
- 19 bioclim variable (BIO1-BIO19)
- Insert `species_bioclim(species_id, bio1, ..., bio19, sampled_at)`

### V5.6-b · Climate Vulnerability MaxEnt projection (12 saat)
- Per species, scenario × year:
  - SSP126 / SSP245 / SSP585 × 2050 / 2080
- Range size km² + centroid shift + refugia polygon
- `climate_projections` (zaten var) doldur
- **ROI**: Çok yüksek (IUCN climate WG ile uyum)

### V5.6-c · Globe v3: climate layer (4 saat)
- Yeni layer panel toggle: "Climate vulnerability"
- Species pin'leri SSP585-2080'deki range_centroid'e doğru ok
- "Migration arrows" görseli
- **ROI**: Çok yüksek (görsel hikaye)

**V5.6 toplam**: ~24 saat + Python infrastructure setup
**Env**: yok (sidecar dış servis)
**Yeni table**: `species_bioclim`
**Dependency**: Python service (raster processing)

---

## V5.7 — Strateji + pozisyon (manuel iş + dış müzakere)

Kod yazmıyoruz; dış dünya ile bağlantı.

### V5.7-a · IUCN re-application (kritik öncelik)
- Brochure PDF (Venn BioVentures formel başvuru)
- Marketplace/commercialization framing kaldır
- Manifesto refresh
- Reproducibility passport + Audit trail + IUCN Hub vurgu
- Türk endemic'lere odaklan (use case)
- **Effort**: 1 hafta yoğun
- **ROI**: Çok yüksek (organizasyonel partnership)

### V5.7-b · IUCN Türkiye partnerlik (ANG, BOTGEN, Doğa Derneği)
- 3-4 dernekle pilot
- ANG (Aegean Natural Heritage Group) öncelikli
- "Türkiye endemic geophytes Red List update" workshop
- **Effort**: 2 hafta görüşme
- **ROI**: Yüksek (yerel kullanıcı tabanı)

### V5.7-c · CC-BY-4.0 license + citation policy page
- `/geocon/about/data` route
- License explainer + citation guide + dataset DOI policy + opening hours
- Open data badge
- **Effort**: 4 saat (kod) + 2 saat (içerik yazımı)
- **ROI**: Yüksek (akademik benimseme)

### V5.7-d · Marketing/SEO sweep
- Meta tags + structured data (JSON-LD Schema.org/Dataset)
- Open Graph + Twitter card her route'ta
- `/geocon/news` blog/editorial (monthly)
- Backlink stratejisi: ORCID resource link, IUCN partner badge, Kew/Vienna herbarium links
- **Effort**: 2 hafta
- **ROI**: Yüksek (organic acquisition)

### V5.7-e · BEE platform layer (multi-product shell)
- Yeni Next.js project
- GEOCON Atlas → BEE'nin ilk vertical'ı
- Sonra orchids/carnivorous plants/raptors gibi vertical'lar
- Cross-vertical search BEE level
- Tek auth + tek profil + tek API key
- **Effort**: 3 hafta + 1 hafta migration
- **ROI**: Çok yüksek (multi-product strategy)

### V5.7-f · Funder partnership conversations
- NSF DEB outreach
- IUCN SOS
- Marie Curie (Türkiye'nin Horizon Europe pozisyonu)
- **Effort**: 4 hafta ağ
- **ROI**: Belirsiz

### V5.7-g · Telemetri → IA feedback loop
- 4-6 hafta data toplandıktan sonra:
  - Sidebar item click distribution → reorder
  - Search zero-hit terms → cron'a feed
  - ORCID banner CTR → onboard flow tune
  - Mobile vs desktop kullanım split → mobil deep-dive
- **Effort**: 1 hafta analiz + iterasyon
- **ROI**: Yüksek (data-driven IA decisions)

**V5.7 toplam**: ~8 hafta paralel external work

---

## Önerilen paket sırası (gerçek otonom oturum sırası)

### Sprint 1 (1-2 gün otonom): V5.1 + V5.2
- UI completion (markdown, dark mode, skeleton, mobile gesture)
- Saved search digest + threat alert email
- Hiç env beklemez (sadece Resend bir tane gerekli)
- Hemen bitirilebilir, ürün hissi bitiş

### Sprint 2 (3-4 gün otonom): V5.3 + V5.4
- Ekosistem köprüleri (iNat push, ORCID, Grant ingest)
- Community living feed (real-time observe, today on GEOCON)
- iNat OAuth + Slack signing secret env'leri gerek

### Sprint 3 (3 gün otonom): V5.5
- Üçüncü-parti SDK + Slack bot + Telegram bot + Notion
- Çoklu OAuth/secret env gerek
- Embed widget = blog adoption

### Sprint 4 (1 hafta + dış service): V5.6
- Python sidecar setup
- WorldClim/Chelsa ingest
- Globe v3 climate layer
- ÖNCESİNDE: Render/Railway hesabı + Python service deploy

### Sprint 5 (8 hafta paralel): V5.7
- IUCN re-application sürerken kod sıfır blocker
- BEE platform layer paralel
- Blog/news içerik yazımı paralel

---

## Toplam tahmin

| Sprint | Kod-saat | Env iş | Dış iş |
|---|---|---|---|
| Sprint 1 | ~24 | 1 (Resend) | — |
| Sprint 2 | ~36 | 3 (iNat OAuth, NSF/IUCN SOS) | — |
| Sprint 3 | ~18 | 4-5 (Slack, Telegram, Notion + auth) | — |
| Sprint 4 | ~24 | — | 1 (Python service) |
| Sprint 5 | sıfır | — | 8 hafta |

**Toplam otonom çalışma**: ~102 saat (~3-4 hafta yoğun gün)
**Toplam env setup**: ~10 farklı key (kullanıcı işi, ~2 saat)
**Toplam dış iş**: 8-10 hafta (IUCN, BEE, Python service, marketing)

---

## Yapmamamız gerekenler (red flag — V4'ten taşındı)

❌ Marketplace framing (audit + IUCN re-app riski)
❌ Para columns (revenue tracking, escrow, broker fee)
❌ Patent registry GEOCON'da (legal risk)
❌ Closed-source plugins
❌ Whitelabel / SaaS positioning
❌ Ads / advertising layer
❌ User data → ML training
❌ Pay-to-publish outcome
❌ Premium tier'lar (single-tier commons)

---

## Sprint 1 hemen başlayabilir

İzin verirsen **Sprint 1 (V5.1 + V5.2)** otonom başlatırım — 1-2 günde biter,
env beklemez (Resend hariç, o da silent no-op olur eklenmeden), ürün hissi
bitiş.

Sprint 2 başlamadan önce:
- iNat OAuth keys gerek
- NSF DEB / IUCN SOS API key gerek (opsiyonel, manuel data ile başlanabilir)

Sprint 3 başlamadan önce:
- Slack signing secret + bot token
- Telegram BotFather
- Notion OAuth app

Sprint 4 başlamadan önce:
- Python service ile Render/Railway hesabı

Sprint 5 = paralel, kodla bağımsız.

---

Söyle: hangi sprint'le başlayayım?
