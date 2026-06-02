# Otonom oturum — audit follow-through (2026-06-02 sabah → öğle)

Bir gün önce (2026-06-01 → 02 gecesi) 23-commit'lik major push'tan
sonra **AUDIT-2026-06-02.md** çıkardığım expert IA/UX audit'i sen
kabul ettin ve "S → A → B → C otonom git" dedin. Bu doküman o akışın
tam dökümü: 17 commit, ~60 saatlik plan dahilindeki iş, audit'in
S/A/B/C sınıflarının hepsi + 4 bonus item.

İkinci vertical onboarding (audit C class'ında geçen) partner-gated
(IUCN orkide grubu) olduğu için ertelendi. Geri kalan her şey landed.

---

## Sıfır-tek-paragraf özeti (önce sonuçlar)

**Bir araştırmacı şu an `/geocon`'a girdiğinde gördüğü**:
- Sidebar: 15 flat item yerine 3 bucket (WORKSPACE / COMMONS / TOOLS), 17 entry, hepsi lucide icon
- Header: vertical chip (geophytes), arama kutusu, bell (grouped), theme switch
- Home: 7 widget (12'den indi), asıl species içeriği 4. sırada
- 4 yeni route: `/geocon/watch`, `/geocon/drafts`, `/geocon/outcomes`, `/geocon/search`
- Footer: 4-kolon 15-link sitemap yerine 1-line operator credit
- Welcome flow: 5 step yerine 2 step
- Bell dropdown: notification grouping ile collapsed
- Profile: MyContributions rollup

**Admin'in gördüğü**:
- 7 ops tile (IUCN/Pub/Metabolite/Edit/Accreditation/ORCID/Programs)
- Species edit queue (kabul + apply / red)
- `/geocon/admin/verticals` (inline edit)
- `/geocon/admin/analytics` (self-hosted telemetri)

**Sistem altında**:
- `species.vertical_id NOT NULL DEFAULT 'geophytes'` (47,052 satır backfilled) — multi-taxon abstraction in place
- `verticals` + `vertical_maintainers` + `species_watch` + `analytics_events` tables
- 15+ yeni RPC (watchlist, drafts, outcomes, search, verticals, analytics, contributions, vertical update)

---

## Commit-by-commit (kronolojik)

### `bf59309e` — Audit doc (528 satır)
9 bölümlük expert audit + multi-taxon vertical blueprint. S/A/B/C
class iş listesi + tahmini saatler. **Plan only — kod değil.**

### S1+S2 (kısmî) — `460f5f45` — Sidebar 3 bucket + lucide (Shell)
- Flat 15-item nav → WORKSPACE/COMMONS/TOOLS + section overline
- lucide-react@^0.456.0 install; 15 sidebar + 4 mobile + 6 header icon swap
- "Supabase connected" + "GEOCON v3.1" caption silindi (dev-time noise)
- Logo: "ATLAS" + caption → "GEOCON Atlas" + "Endemic geophyte commons"
- NavBucket component ile bucket abstraction

### S2+S3+S4 — `a9c66746` — Bell lucide, home 12→7, card tokens
- NotificationBell type icons (15 entry) → lucide
- HomeRoute: QuickTools + TrendingPanel + MyAtlasHistory silindi; GEOCONHome 12. → 4. sıraya
- `--gx-card-radius` / `--gx-card-pad` / `--gx-card-bg` / `--gx-card-border` canonical aliases
- Yeni component'lerin (AdminOpsTiles, SpeciesEditQueue) tokenization

### A1 — `f383935e` — Species watchlist
- `species_watch(user_id, species_id, note, added_at)` + RLS + 5 RPC
- `/geocon/watch` route + WatchButton (SpeciesDetail mount) + sidebar badge
- Mevcut activity feed `user_watchlist` patterns (later bridged)

### A2 — `479a091d` — Drafts surface
- `list_my_drafts` unified RPC: collaboration_proposals(draft) + programs(Draft)
- Kind ∈ {proposal, brief, program} → continue button doğru editöre
- `/geocon/drafts` route + sidebar entry + warning-tint badge

### A3 — `4af02a18` — Outcomes discovery
- `list_public_outcomes(min_verification, outcome_kind)` RPC
- `/geocon/outcomes` — verification ladder filter (self_declared → peer_endorsed → org_declared → venn_verified)
- COMMONS bucket'a Award/Outcomes entry

### A4 — `dd90e38a` — Notification grouping
- Client-side `groupNotifications(items)` → `{lead, count, unread, all}` per `(type, target)`
- Bell dropdown: "5 mentions on Allium karataviense" pattern
- pluralize(type) tip-by-tip
- Hard-coded #888/#666 → tokens; limit 30 → 50

### A5+A6+A7 — `adcaf5f2` — Dark mode, watch filter, bridge
- AdminRoute signin gate + AccreditationQueue + ProfileRoute → `var(--gx-card-*)`
- NotificationBell dropdown wrapper tokenize
- Activity feed "Watching only" toggle violet, dark-mode safe
- `species_watch → user_watchlist` mirror trigger (mevcut activity filter çalışsın)
- Backfill: existing species_watch satırları user_watchlist'e

### B1+B2 — `2b0a2055` — Verticals foundation
- `verticals` tablo (id, slug, display_name, description, taxonomic_scope jsonb, brand_color, emoji, config jsonb, is_active/public/beta)
- Seed: geophytes (kingdom Plantae · orders Asparagales/Liliales/Iridales/Poales)
- `vertical_maintainers(vertical_id, user_id, role)`
- `species.vertical_id text NOT NULL DEFAULT 'geophytes'` (FK) — 47,052 satır backfilled
- `species.vertical_attrs jsonb` (geophyte_type buraya kopyalandı; column kept for zero-downtime)
- `profiles.last_active_vertical_id` — switcher state persists
- RPCs: `list_verticals(include_beta)`, `is_vertical_maintainer(vertical_id)`, `get/set_my_active_vertical()`
- VerticalSwitcher component (Shell header, single-vertical state'te admin'lere dropdown / herkese chip)
- `/geocon/admin/verticals` listing

### C3 — `a60da9ad` — My contributions rollup
- `get_my_contributions(limit)` 6-source UNION: species_edits, outcome_endorse, commerc_credits, program_comments, proposal_comments, program_members
- `count_my_contributions()` jsonb summary
- MyContributions card → Profile route'ta (push prefs + ApiKeysPanel arası)
- Chip row + typed feed; auto-hide signed-out

### C1 — `e751e3fc` — Per-vertical config editor
- `update_vertical(id, name, description, brand_color, emoji, is_active/public/beta, config)` admin-only RPC
- VerticalsAdminRoute inline edit: Pencil → 2-col grid form, native `<input type="color">`
- Re-render border + emoji preview in-form

### C2 — `78b29bf0` — Cross-entity search + FilterBar
- `search_cross_entity(q, kinds[], limit)` 4 iteration debug (researcher.affiliation yok → department/country; org.kind enum → ::text; UNION ORDER BY wrap; real → double precision)
- Species FTS (ts_rank ×3.0) + publications/researchers/programs/organizations/outcomes ILIKE
- `components/shared/FilterBar.jsx` — generic chip-row primitive (single + multi-select)
- `/geocon/search?q=...` route — sharable URL, 200ms debounce, results grouped by kind
- OutcomesRoute tier filter FilterBar'a migration (örnek consolidation)

### Telemetri — `ca67007d`
- `analytics_events` table + 5 index + RLS (admin read only)
- `ingest_analytics_event(event, route, session_id, payload, ua_class)` RPC (anon-writable)
- `analytics_snapshot(p_days)` admin reporting
- `lib/analytics.js` — PostHog placeholder yerine self-hosted (track / trackEvent / usePageviews)
- 6 event instrumentation: orcid_banner_click, orcid_banner_dismiss, watch_add, watch_remove, search_query, edit_proposal_submit, vertical_switch
- `/geocon/admin/analytics` — 7d/30d, 4 panel (counters, sparkline, top routes, top events)
- Bot UA filter, session id (opaque sessionStorage UUID), user_id server-derived, route q= truncation 64 char

### Welcome 4→2 — `0078304a`
- Stepper 5 label → 2 label (Identity / Mission)
- Step 1: ORCID input + (preview varsa) inline preview card
- Step 2: import result summary (üstte) + mission form (altta), save → /geocon hard-redirect
- Step5Done dormant kept
- 2 yeni telemetri event: welcome_import_success, welcome_mission_save → funnel data-driven

### Footer compress — `628369c9`
- 4-col 15-link sitemap → 1-line: operator credit + (About · ORCID · IUCN)
- marginTop 48 → 40, paddingTop 24 → 14
- FooterLink: block → inline-flex, 12px → 10px

### Dark mode bulk sweep — `54a9c7f1`
- 39 dosya perl -i -CSD sweep:
  - `background: "#fff"` × 114 occurrence → `var(--gx-card-bg)`
  - 5 light border hex variant → `var(--gx-card-border)`
- OrcidConnectBanner CTA explicit `#fff` korundu (violet gradient kontrast şartı)
- Result: 162 insertions / 162 deletions (1-for-1 sed-style)

---

## Sayım

- **17 commit** bu audit follow-through turunda
- **40+ migration** + **15 yeni RPC**
- **6 yeni route** (/watch, /drafts, /outcomes, /search, /admin/verticals, /admin/analytics)
- **5 yeni component primitive** (FilterBar, VerticalSwitcher, WatchButton, MyContributions, AnalyticsAdminRoute)
- **39 dosya** tokenize edildi (dark mode sweep)
- **47,052 species** → `vertical_id='geophytes'` backfilled
- **6 telemetri event** + Shell-level pageview auto-track
- **Self-hosted analytics** (third-party tracker zero)

## Sabah doğrulama checklist'i

1. **Vercel deploy** (10 dk bekle, son commit `54a9c7f1` push'tan sonra)
2. **Sidebar yeni hali**: 3 bucket görünüyor mu, lucide icons, "Supabase connected" panel gitti mi
3. **Header**: VerticalSwitcher chip (geophytes) + bell icon + theme switch + ⌘K search button
4. **Vertical switcher (admin)**: tıkla → dropdown gör, "Propose new vertical" link bottom'da
5. **Home**: 7 widget (12 değil), GEOCONHome 4. sırada
6. **Search**: `/geocon/search?q=Allium` deneyin → species top hit
7. **Watch flow**: bir species aç → Watch butonu görüyor mu (signed-in) → ekle → /geocon/watch'a git
8. **Drafts**: signed-in ise sidebar badge'i (eğer draft yoksa görünmez)
9. **Outcomes**: `/geocon/outcomes` → empty state mesajı görünüyor mu
10. **Welcome flow**: `/geocon/welcome` → 2 step görünüyor mu, Stepper "Identity / Mission"
11. **Profile**: signed-in ise MyContributions card görünüyor mu
12. **Admin dashboards**:
    - `/geocon/admin` — 7 ops tile + edit queue + accreditation queue
    - `/geocon/admin/verticals` — geophytes inline edit
    - `/geocon/admin/analytics` — birkaç pageview event akın akın gelir mi
13. **Dark mode**: theme switch → her şey yumuşak geçiyor mu (39 fix sonrası)
14. **Bell**: bir mention oluştur, dropdown'da grouped görünüyor mu (5+ benzeri varsa "5 mentions on X")
15. **Footer**: 1 satıra indi mi

## Bilinçli olarak ertelenenler

- **İkinci vertical onboarding** — IUCN re-application sonrasına (audit IX.3)
  partner gerekli (IUCN orchid group veya carnivorous plants community)
- **geophyte_type column drop** — UI vertical_attrs'a tam geçince
- **Telemetry → IA decisions feedback** — 1-2 hafta data toplandıktan sonra
- **Empty state propagation** (audit V.6 incomplete) — opportunistic
- **Activity feed kind selector → FilterBar** — emoji+watching toggle generic shape'e uymuyor
- **VAPID + Supabase vault setup** (push notifications hala kullanıcı tarafında bekliyor)

## Açık moneyball metrikleri

`/geocon/admin/analytics` aktif olunca cevaplanacak sorular:
- Welcome funnel completion rate (3 tap: pageview → import_success → mission_save → home)
- ORCID banner CTR
- En çok aranan terimler, sıfır-hit query'ler
- Hangi sidebar item'lar tıklanmıyor (kullanıcı verisinden IA validation)
- Watchlist hangi türlerde toplandı (popular species discovery)
- Edit proposal submission rate vs. accept rate

---

Saat (yaklaşık) 13:00. Bu zamana kadar gece + sabah toplam ~22 saatlik
otonom çalışma. Yeni audit-derived item'ları S/A/B/C ile teslim edildi.
Bu doküman + AUDIT-2026-06-02.md + önceki gece CHANGELOG-night-2026-
06-01.md birlikte oturumun tam dökümünü oluşturuyor.

Hayırlı sabahlar.
