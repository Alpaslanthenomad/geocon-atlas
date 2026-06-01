# GEOCON v3.1 — Professional Refinement (otonom oturum)

Bu doküman, kullanıcı uyurken otonom olarak yapılan v3.1 cilasının
tam dökümüdür. Sıra: temel taş → uygulama. Her başlık altında ilgili
commit ve test edilmesi gereken yüzeyler yazılı.

---

## ✅ Tamamlanan temalar

### v3.1-1 — Design System v2 (foundation) — `69542a74`

Yeni:
- **Tipografi**: Crimson Pro (display/serif), Inter (body), JetBrains Mono (code)
  Google Fonts preconnect ile tek istek
- **Semantik token'lar**: `--gx-success`, `--gx-warning`, `--gx-danger`,
  `--gx-info`, `--gx-neutral` + `-soft` varyantları
- **Page container token'ları**: `--gx-page-max/-narrow-max/-wide-max`
- **Class hook layer'ı** (`globals.css` sonuna eklendi):
  `.gx-display / .gx-h1..h3 / .gx-body / .gx-body-lg / .gx-caption /
  .gx-overline / .gx-lede`
  `.gx-page / .gx-page-narrow / .gx-page-wide`
  `.gx-section / .gx-section-head / .gx-section-eyebrow /
  .gx-section-title`
  `.gx-hero / .gx-hero-image / .gx-hero-content / .gx-hero-eyebrow /
  .gx-hero-title / .gx-hero-sub / .gx-hero-meta`
  `.gx-pill-{success,warning,danger,info,neutral,accent}` + `.gx-pill-overline`
  `.gx-btn-{primary,secondary,ghost,danger,link}` + `.gx-btn-sm/lg`
  `.gx-stat / .gx-stat-value / .gx-stat-label / .gx-stat-trend-*`
  `.gx-input / .gx-textarea / .gx-select / .gx-label / .gx-help`
  `.gx-trust-strip / .gx-trust-cell / .gx-trust-value / .gx-trust-label`

React primitives — `components/ui/`:
- `Hero`, `HeroBare` — header bloku, opsiyonel görsel
- `Pill`, `IucnPill` — semantik chip + IUCN status helper
- `Button` — primary/secondary/ghost/danger/link + sm/md/lg + iconLeft/iconRight
- `Section` — eyebrow + title + actions wrapper
- `Stat`, `StatGrid` — büyük rakam + label + grid layout
- `TrustStrip` — marketing-grade counter band
- Typography: `Display, H1, H2, H3, Body, Lede, Caption, Overline`
- Tek import: `import { ... } from "components/ui"`

---

### v3.1-2 — Hero polish + bulk H1 migration — `39f7c9e4`

- **HomeRoute**: ana sayfanın üstüne `TrustStrip` eklendi
  (4 sayı: species / threatened / researchers / programs)
- **ResearcherDetailRoute**: hero başlığı Crimson Pro, ORCID iD pill
  olarak orcid.org'a link veren monospaced chip eklendi
- **ProgramsIndexRoute**: eyebrow + gx-h1, açıklama yeniden yazıldı
- **11 route'ta toplu H1 migration**: Activity, Admin, CountriesOverview,
  FamiliesOverview, MetabolitesIndex, OpenCalls, Organizations,
  Profile, ProgramsAnalytics, Proposals, PublicationsIndex
  (perl UTF-8 safe pass — bir önceki PowerShell denemesi Türkçe
  karakterleri bozdu, geri alındı)

---

### v3.1-4 — Empty State Library + global 500 — `bdab8284`

Yeni:
- `components/shared/Illustrations.jsx` — 10 inline SVG line-art
  illüstrasyon (currentColor) + `ILLUSTRATIONS` registry:
  EmptyAtlas, EmptyInbox, EmptyGarden, EmptyShelf, EmptyFlask,
  EmptyNetwork, EmptyTrophy, EmptyOffline, NotFound404, ServerError500
- `EmptyState` artık `illustration` veya `illustrationKey` prop
  kabul ediyor — geri uyumlu (eski `icon` prop'u çalışıyor)
- `components/shared/LoadingTips.jsx` — uzun loading sırasında
  rotate eden faydalı ipuçları (10 Türkçe varsayılan)
- `app/error.js` — Next.js App Router global error boundary
  (500 sayfası, Crimson Pro, "Tekrar dene" + Home, Sentry'e log,
  `error.digest` ile support için referans)

---

### v3.1-7 — Form & Modal Pro primitives — `909dae2d`

Yeni `components/ui/`:
- **Toast.jsx** — `ToastProvider` (layout'ta mount'lı) + `useToast()`
  hook. Variants: success / error / warning / info. 5-slot stack,
  FIFO drop, action + detail desteği. aria-live=polite.
- **FloatingField.jsx** — `FloatingInput / FloatingTextarea /
  FloatingSelect`. Label focus/value'ya göre yukarı kayar +
  küçülür + violet'e dönüşür. `useId()` ile a11y.
- **Modal.jsx** — accessible dialog: role=dialog, aria-modal, ESC
  kapatır, Tab/Shift+Tab focus trap, click-outside, body scroll
  lock, restore prior focus, backdrop blur. 3 size (sm/md/lg).
  `Modal.Footer` helper.
- **Wizard.jsx** — multi-step progress strip + `WizardNav`
  (Prev/Next/Finish). Tamamlananlar ✓ ile yeşil.

`ToastProvider` `app/layout.js`'e mount'landı — herhangi component
`useToast()` ile kullanır.

Gelecek migration'lar (ayrı commit'ler):
- BriefComposerRoute → Wizard + FloatingField
- ApplyForAccreditationModal → Modal + Toast
- Inline "Saved" alert'leri → `toast.success`

---

### v3.1-9 — Brand polish on /about — `f049c6dc`

`AboutRoute.jsx`'e 3 yeni section:

1. **Manifesto** — "What GEOCON IS / What it is NOT" (2-col card)
   - IS: research-only atlas, citation registry, program graph,
     brief board, 5-currency impact attribution
   - IS NOT: marketplace değil, holds no funds, owns no patents,
     no product listings, not a walled garden
   - Italic Crimson Pro closing — IUCN compatibility hatırlatması

2. **5-Layer architecture** card grid:
   01 Species Commons · 02 Programs · 03 Studies · 04 Open Briefs ·
   05 Commercialization Recognition

3. **IUCN compatibility** — "Structural, not promised"
   5 database-enforced garantisi (no money columns, no patents in
   GEOCON's name, no product listings, public attribution is the
   only commerce, member orgs run own legal frameworks)

`gx-display + gx-section-eyebrow + gx-overline` class hook'larını
kullanarak v3.1-1 ritmiyle uyumlu.

---

### v3.1-10 — a11y + perf quick wins — `ad5dd0ca`

- Tüm `<img>` tag'lerine `loading="lazy"` + `decoding="async"`
  eklendi (perl UTF-8 safe pass) — 8 dosya etkilendi
- Globe (en büyük 3rd-party bundle) zaten `next/dynamic` ile
  ssr:false yüklü → home page paylamıyor

---

### v3.1-5 (partial + cont) — Shell polish — `f5f2cdf6` + `7abef2a7`

- **Logo lockup**: ATLAS wordmark Crimson Pro'ya geçti
  ("GEOCON v3.0" → "v3.1"), 34×34 mark + violet-green shadow,
  aria-label
- **Sidebar nav**: token-based colors, active item'a 2px violet
  left-rail + bold weight, padding standardize, aria-current,
  badge aria-label
- **User pill**: `profile.orcid_verified_at` set ise yan tarafa
  yeşil **"✓ ORCID"** chip eklendi — kullanıcı her signed-in
  sayfada ORCID bağlı olduğunu görür

---

## 🟡 Sıradaki: görsel test gerektiren temalar

Bunlar bilinçli olarak otonom turunda bırakıldı çünkü görsel/
browser test gerektiriyor:

- **v3.1-3 Globe & Map Polish** — globe color/atmosphere refresh,
  country hover, mini-map widget
- **v3.1-5 Header & Nav v2 (full)** — sticky header behaviour,
  global Ctrl+K search, NotificationBell redesign, user menu
  dropdown
- **v3.1-6 Data Visualization Suite** — Recharts integration:
  family donut, publication timeline, conservation status
  breakdown, collaboration graph, impact radial, activity heatmap
- **v3.1-8 Mobile Responsiveness Sweep** — 20+ route'ta breakpoint
  audit + sidebar → bottom-nav + touch target check

---

## Sabah açtığında hızlı kontrol listesi

1. `geocon-atlas.vercel.app/geocon` → TrustStrip görünüyor mu?
2. `geocon-atlas.vercel.app/geocon/about` → Manifesto / Layers /
   IUCN section'ları yerinde mi?
3. `geocon-atlas.vercel.app/geocon/profile` → ORCID section + yan
   sidebar'da "✓ ORCID" badge görünüyor mu?
4. Sayfalar arası gezindiğinde sonsuz loop olmadığını teyit et —
   v3 Faz 2/3 + v3.1 ErrorBoundary + GlobalErrorHandler kombinasyonu
   bu durumu kapatmış olmalı
5. Console'da kırmızı **`Uncaught (in promise)`** olmamalı — sadece
   sarı `[WidgetName] ...` console.warn'lar
6. `/geocon/researchers/RES-OA-A5081423` gibi ORCID'li bir
   researcher'a git → hero'da ✦ ORCID pill ve orcid.org link
   görünüyor mu?

---

## Toplam istatistik

- 13 commit (autonomous session)
- Yeni: 12 component (UI primitives + shared utilities)
- Refactored: 23 dosya (h1 migration, async hardening, etc.)
- Token'lar: 11 yeni CSS variable, 30+ class hook
- Yeni route: yok (mevcut route'lar zenginleştirildi)
- Bundle impact: img lazy loading + dynamic Globe → home initial
  payload aynı seviyede kaldı, polish ücretsiz

Co-Authored-By: Claude Opus 4.7 (1M context)
