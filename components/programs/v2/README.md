
# GEOCON · ProgramDetailPanel v2

**1 May 2026** — Çift çark mimarisi (Foundation tier + Field & Lab tier).

Eski 1100+ satırlık panel yerine her tab kendi component'i. DB tarafı tamamen hazır (6 migration, 3 yeni RPC, view rewrite). Bu paket sadece UI.

---

## 📁 Klasör yapısı

```
geocon-program-detail-v2/
├── ProgramDetailPanel.jsx       ← Ana entry (tab navigation)
│
├── lib/
│   ├── supabaseClient.js        ← ⚠️ PLACEHOLDER — kendi client'ınla değiştir
│   ├── programRpc.js            ← Tüm RPC wrapper'ları (10 fonksiyon)
│   ├── visibility.js            ← Public/Network/Workspace sabitleri
│   └── i18n.js                  ← TR primary, EN fallback
│
├── hooks/
│   ├── useProgramFoundation.js  ← Çift gate + tüm tic'ler
│   ├── useProgramPathways.js
│   ├── useProgramMembers.js
│   └── useProgramOutputs.js
│
├── tabs/
│   ├── FoundationTab.jsx        ← 3 tic — ön onay eşiği
│   ├── FieldLabTab.jsx          ← 9 tic — asıl iş + opsiyonel pathway-unlock
│   ├── PathwaysTab.jsx          ← Beyan + library picker + activate
│   ├── ContributorsTab.jsx      ← Read-only, role-based gruplama
│   └── OutputsTab.jsx           ← Library + custom output ekleme
│
└── components/
    ├── Modal.jsx                ← Generic modal shell
    ├── GateBanner.jsx           ← Foundation/FieldLab kapı durumu
    ├── TicCard.jsx              ← Complete/Waive/Revisit aksiyonları
    ├── PathwayCard.jsx          ← Activate butonu + friendly errors
    ├── MemberCard.jsx
    ├── OutputCard.jsx
    ├── VisibilityBadge.jsx
    ├── EvidenceModal.jsx
    ├── WaiveModal.jsx
    └── RevisitModal.jsx
```

---

## 🔌 Entegrasyon (3 adım)

### 1. Klasörü repo'ya kopyala

Önerilen konum: `app/components/program-detail-v2/` veya `components/program-detail-v2/`. Klasör adı sende, sadece importlar tutsun.

### 2. Supabase client path'ini düzelt

`lib/programRpc.js` ilk satırında:

```js
import { supabase } from './supabaseClient';   // ← bunu değiştir
```

İki seçenek:

**a)** `lib/supabaseClient.js`'i sil ve programRpc.js'teki importu kendi client'ına yönlendir:
```js
import { supabase } from '@/lib/supabase';   // ya da senin path'in
```

**b)** `lib/supabaseClient.js`'in içeriğini değiştir ve mevcut client'ı re-export et:
```js
export { supabase } from '@/lib/supabase';
```

### 3. Parent'tan çağır

`page.js` (veya program detayını gösteren her ne varsa):

```jsx
import ProgramDetailPanel from './components/program-detail-v2/ProgramDetailPanel';

// ...

<ProgramDetailPanel
  program={selectedProgram}    // { id, title, species_name?, ... }
  lang="tr"                     // 'tr' | 'en'
  onClose={() => setSelected(null)}
  initialTab="foundation"       // optional
/>
```

---

## 🎨 Bağımlılıklar

- **React** 18+ (hooks)
- **Tailwind CSS** — projede mevcut, sade utility class'lar kullanıldı
- **Supabase JS client** — projede mevcut, `supabase.rpc()` çağrılıyor
- **Yeni paket yok** — sadece var olanları kullanıyor

---

## 🔧 RPC bağlantıları

Tüm UI etkileşimleri DB'deki şu RPC'lere gider:

| RPC                                | Yer                                  |
|------------------------------------|--------------------------------------|
| `get_program_foundation_status`    | FoundationTab + FieldLabTab          |
| `get_program_pathways_with_status` | PathwaysTab                          |
| `get_program_members_full`         | ContributorsTab                      |
| `get_program_outputs`              | OutputsTab                           |
| `complete_program_tic`             | TicCard → EvidenceModal              |
| `waive_program_tic`                | TicCard → WaiveModal                 |
| `revisit_program_tic`              | TicCard → RevisitModal               |
| `declare_pathway`                  | PathwaysTab → PathwayPickerModal     |
| `activate_pathway`                 | PathwayCard                          |
| `add_program_output`               | OutputsTab → AddOutputModal          |

`is_owner` kontrolü her RPC'de yapılıyor — UI sadece backend'in döndürdüğü flag'e bakarak butonları gösteriyor/gizliyor. RLS güvenliği DB tarafında.

---

## 🧪 Test senaryoları

Backend canlıda doğrulanmış (FRIT/cons.baseline_assessment, 1 May 2026). Bu UI'yi bağladıktan sonra hızlı test:

1. **Foundation tab açılır** → 3 tic görünür, gate banner kapalı (0/3)
2. **Tic complete et** → modal aç, evidence_type seç, kaydet → tic ✓ olur, gate ilerler
3. **Field & Lab tab'a geç** → 9 tic ayrı tab'da, kendi gate banner'ı
4. **Pathways tab** → "+ Pathway ekle" butonu, kütüphaneden seç, declared olur
5. **Foundation'da revisit** → completed tic'i tekrar in_progress'a alır, audit'e yazar
6. **Outputs tab** → custom çıktı ekle, görünür

---

## 🐛 Bilinen kısıtlar

- **Pathway prerequisite rozetleri**: `prerequisite_status` field'ı RPC'den geliyor; UI gösteriyor ama hangi tic eksik detayını henüz açmıyor. Backend genişletilebilir.
- **Member yönetimi**: ContributorsTab şu an read-only. Invite/role-change UI sonraki faz.
- **Output picker**: kütüphane seçici basit (free text input). Tam picker UI sonraki iterasyon — `output_definitions` zaten DB'de seed edilmiş (19 tip).
- **Visibility downgrade**: 24h withdrawn pencere mekaniği henüz UI'da yok (sadece DB).

---

## 📝 Çift çark mimarisi özeti

**Foundation tier (3 tic, ön onay eşiği):**
- `cons.threat_analysis` — tehdit analizi
- `cons.ex_situ_strategy` — ex situ koruma stratejisi
- `sci.taxonomy_verified` — taksonomi doğrulandı

**Field & Lab tier (9 tic, asıl iş):**

Required (4):
- `cons.baseline_assessment`
- `cons.material_secured`
- `sci.specimen_documented`
- `sci.morphological_characterization`

Pathway-unlock (5, opsiyonel):
- `cons.viability_check`
- `sci.metabolite_profiling` → pharma/cosmetic
- `sci.phenology` → ornamental
- `sci.genetic` → breeding
- `sci.ecological_niche` → restoration

**Aktivasyon kuralı:** Her iki kapı da geçilmeli + pathway-spesifik prereq met olmalı. `activate_pathway` RPC bunu sırayla kontrol ediyor.

**Esnek geri dönüş:** Her tic completed/waived → in_progress'a geri açılabilir (revisit). Plan A başarısız → Plan B'ye doğal geçiş. Audit her geçişi tutar.

---

İyi entegrasyonlar 🌱
