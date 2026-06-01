# Otonom oturum — gece 2026-06-01 → 2026-06-02

Saat 16:00 → 06:30 (~14.5 saat). 22 commit. Saat 03:00'da görsel test'ten
back-end derinleştirmesine geçildi. Bu doküman: o gece atılan her commit'in
ne yaptığı, sabah eğer açıp bakmak istersen nereden başlayacağın, ve hangi
kurulum adımları senin tarafına kaldığı.

---

## Sıra-bağımsız özet (önce sonuçlar)

Bu oturumdan sonra GEOCON:

- **L1 Commons** — herhangi bir signed-in kullanıcı species kaydında düzeltme önerebilir
- **L3 Studies** — programs içinde 5 entry mode (research / capability / partner / external_study + mevcut conservation)
- **L5 Endorsement** — outcome'lara X/3 peer endorsement progress + endorse butonu
- **Mission-driven feed** — Welcome Step 4'te seçilen 8 misyon tag'i artık personalized home feed sürüyor
- **Admin dashboard** — 7 ops tile (IUCN/Pub cat/Metabolite class/Edit proposals/Accreditations/ORCID/Programs) + edit queue + accreditation queue
- **2 yeni cron** — IUCN sync (Wikidata) günlük 04:00, enrichment (pub category + metabolite class) günlük 04:30
- **Real-time bell + push notifications** — Supabase Realtime + service worker + DB trigger + web-push fan-out

Senin tarafına kalan tek setup adımı: VAPID keys + Supabase vault secrets (aşağıda
"Aktivasyon" bölümünde). O olmadan push trigger sessizce no-op olur, başka
hiçbir şey kırılmaz.

---

## Commit-by-commit

Yeniden okurken sırayla geç. Eski → yeni:

### `f95d2bb1` — Home loop fix (auth identity stabilization)
Supabase'in onAuthStateChange'i her TOKEN_REFRESHED'da yeni bir user
object reference döndürüyordu → cascade refetch loop. lib/auth.js'te
id-based equality + TOKEN_REFRESHED skip eklendi. Bu olmadan hiçbir
şey çalışmıyordu.

### `b2c492dd` — Publications + Metabolites: chip-based categorization
Chip-based filtering ve display.

### `21b4ea0d` — v3.1 morning checklist
Önceki gece pass'ının özeti.

### `c61e6e39` — P1: 6 flow fixes
Audit'ten gelen P1 paketi. loadWithToast helper'ı eklendi (try/catch +
toast.error wrapping). 7 index route useEffect'i bu helper'a geçirildi.

### `440d6c8f` — P0: Welcome funnel + DB hygiene
5 migration:
- Welcomed_at stamp'i Step 2'den Step 4'e taşındı (banner mission set
  edilene kadar görünür kalsın)
- 280 advisor finding kapatıldı (search_path, RLS, FK indexes)
- OrcidConnectBanner mission_set_at de kontrol eder

### `4dd7b9c6` — P2: code + visual cleanup
- 7 hex pattern → token migration (43 dosya, perl -i -CSD UTF-8 safe)
- Dead UI primitives silindi (Modal, Wizard, FloatingField, Hero, Pill,
  Button, Section, Typography — components/ui/ altı)
- PhaseStub.jsx, lib/dashboard.js silindi

### `51a6bc9e` — P3: test scaffolding
Vitest + Playwright iskeleti kuruldu. Tek smoke test ile başlıyor.
GitHub Actions wiring sonraya bırakıldı (commit message'ında not edildi).

### `571a0c93` — L3 Studies surfacing
ProgramsIndexRoute'ta ENTRY_META palette 5 mode'la genişletildi
(external_study eklendi). ProgramCreateRoute ENTRY_MODES 3→5.

### `afe8ecc4` — L5 Peer endorsement UI
CommercializedOutcomes.jsx'te:
- OutcomeRow expand
- CreditRow X/3 progress pill + Endorse buton
- list_outcome_credits + endorse_commercialization_credit RPC'leri

### `6aaa97c2` — P3-tail (3 işin paketi)
- IUCN cron: /api/cron/iucn-sync, Wikidata SPARQL, vercel.json 04:00
- Mobile bottom nav: Shell.jsx içinde MobileBottomNav (4 tab, safe-area)
- L1 Commons: SpeciesEditProposal.jsx mounted SpeciesDetailRoute'a

### `7a516fa3` — Mission-driven home feed
- MyMissionFeed.jsx (Welcome Step 4 tag mapping → brief_kind/program entry_mode)
- get_my_mission_matches RPC
- HomeRoute'a OrcidConnectBanner ile OnboardingChecklist arasına mount

### `9f4e0063` — Admin review queue
- SpeciesEditQueue.jsx: pending listele, two-column current/proposed, Accept (apply
  to species via column whitelist) / Reject
- AdminOpsTiles.jsx: 5 tile
- 3 admin RPC: list_pending / accept (column whitelist) / reject
- get_admin_ops_snapshot RPC

### `ab2e3039` — Enrichment cron
- enrich_publications_categorize_batch: 3-tier (primary_topic regex → s2 array → title)
  Test: 96/100 hit rate
- enrich_metabolites_classify_batch: 19 regex pattern + "Flavanoid" → "Flavonoid" typo fix
  Test run: 33 typo normalize, %56 strong label oranı
- /api/cron/enrich-classifications: Bearer auth, sequential phases
- vercel.json: günlük 04:30
- AdminOpsTiles +2 tile: Pub categories + Metabolite class coverage

### `58d63325` — Web push (bu gecenin son commit'i)
- public/sw.js: push + notificationclick + pushsubscriptionchange (v1 → v2)
- /api/push/send: Bearer-auth web-push fan-out + 410 prune
- notifications_send_push trigger: AFTER INSERT → pg_net.http_post (async)
  Vault'tan geocon_site_url + push_internal_secret okur; eksikse silently no-op
- PushSubscribeButton: NotificationBell'in prefs paneline mount
- scripts/gen-vapid.js: VAPID key + env var instructions
- web-push@^3.6.7 dep

---

## Sabah doğrulama checklist

### 1. Smoke test — açıp tıkla (10 dk)

- [ ] `/geocon` — home loop yok mu? (loading sonsuz dönmüyor)
- [ ] Mission feed üstte gözüküyor mu? Welcome'da seçtiğin tag'lerle match var mı?
- [ ] OrcidConnectBanner görünüyor mu / Connect ORCID iki yönlü çalışıyor mu?
- [ ] Bell badge — başka bir tab'da mention oluştur, anında badge artıyor mu?
  (Realtime test)
- [ ] Bell → ⚙ Prefs → 🔔 Push notifications butonu görünüyor mu?
  (VAPID public key set edilmediyse görünmez)

### 2. Admin dashboard (5 dk)

- [ ] `/geocon/admin` — 7 ops tile görünüyor mu?
- [ ] IUCN coverage % gösteriyor mu? Edit proposals pending count?
- [ ] Bir test edit proposal yarat → admin'de queue'da görünüyor mu?
- [ ] Accept & apply → species kaydı update oluyor mu?

### 3. Species detail (5 dk)

- [ ] `/geocon/species/<bir id>` — "Suggest correction" panel görünüyor mu?
- [ ] Form submit edince pending count badge artıyor mu?

### 4. Cron manuel test (3 dk)

```bash
# CRON_SECRET'i Vercel env'den al
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://geocon-atlas.vercel.app/api/cron/enrich-classifications?batch_size=50&max_batches=1

curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://geocon-atlas.vercel.app/api/cron/iucn-sync?batch_size=50&max_batches=1
```

Beklenen response: `{ ok: true, publications: {...}, metabolites: {...} }`

---

## Aktivasyon — senin tarafına kalan tek adım

Push notifications inert şu an. Aktive etmek için:

### a. VAPID key üret

```bash
node scripts/gen-vapid.js
```

Çıktıda public/private key + env var rehberi var.

### b. Vercel env vars

Project → Settings → Environment Variables (production + preview):

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY = <yukarıdaki public>
VAPID_PRIVATE_KEY            = <yukarıdaki private>
VAPID_SUBJECT                = mailto:alpaslansevket@gmail.com
PUSH_INTERNAL_SECRET         = <openssl rand -hex 32>
```

Redeploy gerekli (env değişikliği).

### c. Supabase vault secrets

Dashboard → Project Settings → Vault → New Secret:

```
geocon_site_url        = https://geocon-atlas.vercel.app
push_internal_secret   = <PUSH_INTERNAL_SECRET ile aynı değer>
```

### d. Test

1. /geocon → bell → ⚙ Prefs → "Enable push"
2. Browser permission prompt → Allow
3. Başka bir tab/incognito'da seni mention'la
4. Notification banner çıkmalı (tab kapalı bile olsa)

Bu üç adım bitmeden push gönderilmez ama hiçbir şey kırılmaz —
trigger SQL try/except ile sarılı, eksik secret'ta silently no-op olur.

---

## Bilinçli olarak ertelenenler

- **GitHub Actions test wiring** — Vitest + Playwright var ama CI'a bağlanmadı.
  `npm run test` lokal çalışır.
- **RPC contract tests** — gerçek Supabase against. Test scaffolding commit'inde
  not edildi.
- **Metabolite long tail** — CAS numarası + tek-örnek isim ~700 satır. Name-only
  heuristic'le çözülmez. L1 Commons edit flow (artık var) ya da Knapsack/Lotus
  re-ingest gerekir.
- **ORCID auto-discovery** — researcher.email pattern'inden ORCID public API
  search. Kesin değil, yanlış attribution riski yüksek. Bilinçli olarak
  atlandı. Mevcut ORCID adoption %0.03 (1/3266). ORCID Connect banner ile
  self-claim primary path.

---

## Mevcut durum sayıları (gece sonu)

```
Species:              47,066 total · 1,820 IUCN set (%3.9)
Publications:         3,071 total · 2,307 categorized (%75.1)
Metabolites:          1,688 total · 947 strong-classed (%56.1)
Researchers:          3,266 total · 1 ORCID
Programs:             21 total
Edit proposals:       0 pending
Accreditations:       0 pending
```

Cron'lar günlük çalıştıkça:
- IUCN: ~400 species/gün → 100 gün'de tüm 47k
- Pub category: ~800/gün → 1-2 gece içinde tamamen kapanır
- Metabolite class: %56 tavanı yakaladık zaten; geri kalan long tail

---

Saat 06:33. İyi sabahlar.
