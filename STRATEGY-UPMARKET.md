# GEOCON Atlas — Üst Segmente Çıkış Stratejisi

**Tarih:** 2026-06-06 · **Durum:** canlı (atlas.vennbioventures.com) · **Sürüm:** V5 + Bahçe Faz 0 + IA v2

> Tek cümlelik tez: **Ürünü kazandın; üst segment kanıt, kullanıcı, otorite ve
> kalıcılıkla kazanılıyor — ve sıradaki gerçek iş kod değil.**

---

## Çerçeve — "üst segment" ne demek?

GEOCON şu an: **dünya çapında bir ürün, indie-seviye bir gerçeklik.**
47 bin tür, onlarca modül, IUCN köprüsü, conservation finance bahçesi,
intent-based navigation — hepsi var. Ama:

| Boyut | Şu an |
|---|---|
| Gerçek aktif kullanıcı | ~0 |
| Kurumsal onay / otorite | yok |
| Veri güvenilirliği | 47k satırın ~423'ünde gerçek IUCN statüsü; gerisi taksonomik stub |
| Tüzel kişilik / kalıcılık | Venn resmi kurulmadı, Vercel Hobby |
| Bulunabilirlik | ~0 organik trafik |

"Üst segment" = **kanıtlanmış, güvenilen, benimsenen, kalıcı bir kurumsal
altyapı.** GBIF, iNaturalist, IUCN Red List'in oynadığı lig. O lige feature'la
değil; **veri bütünlüğü, otorite, topluluk, dağıtım ve dayanıklılıkla** çıkılır.

---

## 7 Kaldıraç

### 1. Veri bütünlüğü — kredibilitenin tabanı (EN KRİTİK)

"47.000 tür" görkemli ama bir taksonomist ilk bakışta stub'ları görür ve güveni
biter. **47k satırı 47k güvenilir kayda çevirmek** tek başına segment değiştirir.

- **Taksonomik omurga uzlaştırması**: WCVP/POWO (Kew), GBIF backbone,
  Catalogue of Life ile her türü eşleştir — kabul edilmiş ad, sinonim, otorite,
  yayın yılı bir authority'den çapalı.
- **Kayıt başına tamlık/güven skoru** — kaç alan doğrulanmış kaynaktan geliyor?
  Kullanıcı görmeli. (Provenance tooltip var → completeness dashboard'a çevir.)
- **Kaynak çatışması çözümü** — öncelik kuralı + admin hakemliği.
- **Gerçek dağılım** — globe'daki noktalar centroid-spiral; GBIF occurrence'larıyla
  gerçek dağılıma geç.
- **Dürüstlük** — stub'ları gizleme, etiketle.

> **Kuzey yıldızı metriği:** tam, doğrulanmış, atıf-edilebilir kayıt sayısı.
> Bugün ~423. 5.000'e çıkarmak 47k stub'dan değerli.

### 2. Otorite & onay — ödünç alınan güven

Kimse tek kişi + AI projesine reputation yaslamaz. **Bir kurumun adı 100
feature'dan değerli.**

- **IUCN yeniden başvurusu** (öncelik). Marketplace dili temizlendi; reproducibility
  passport + audit trail + assessment hub + SIS export'u öne koyan formal başvuru.
- **1-2 çapa kurum** — Kew/RBGE/Missouri ya da yerel (ANG, üniversite herbaryumu).
- **Bilimsel danışma kurulu** — 3-5 tanınmış isim, sitede.
- **GBIF veri yayıncısı olmak.**
- **Atıf alınmak** — DOI altyapısı (Zenodo) hazır.

### 3. Gerçek kullanıcılar — asıl moat

Kullanıcı olmadan kurulan bir kullanıcı platformu. iNaturalist/GBIF üst segment
çünkü **katkıcıları** var — feature'ları değil.

- **Beachhead** — tüm dünyayı değil, dar ve gerçek grubu hedefle: Türkiye +
  Akdeniz geofit araştırmacıları. **20-50 gerçekten aktif** kullanıcı, 50.000
  hayaletten değerli.
- **İlk 10'u elle kazan** — konferans, e-posta, birebir.
- **Tek gerçek döngü tamamlat** — araştırmacı → tür → assessment → program →
  outcome → tanınma. Bir gerçek vaka, 50 feature'dan ikna edici.
- **Katkı = düşük sürtünme** (kuruldu; şimdi tetiklemek lazım).

### 4. Dağıtım & bulunabilirlik

- **SEO + yapısal veri** — Schema.org `Taxon`/`Dataset` JSON-LD, OG, sitemap.
  47k tür sayfası = 47k landing page.
- **İçerik katmanı** — `/geocon/news`, aylık editoryal.
- **Workflow entegrasyonları** — Zotero, ORCID, Notion, embed widget.
- **Backlink** — IUCN partner badge, herbaryum linkleri, GBIF node.

### 5. Çekirdek döngüde derinlik — geniş'ten derin'e

Çok geniş gittik; üst segment derinlik ister. **GEOCON'un çekirdeği: IUCN Red List
assessment workflow.** Bir Specialist Group'un "değerlendirmelerimizi GEOCON'da
yapıyoruz" dediği araç olursa — kategori sahibi olursun. Temeli var (SIS export,
criteria checklist, peer-review thread, reproducibility).

### 6. Bahçe / conservation finance — kategori tanımlayan farklılaştırıcı

GBIF/iNaturalist veri; GEOCON **doğrulanmış koruma çıktısını fonla buluşturan
altyapı** olabilir. Boş bir kategori. Sıra: tür-veri-topluluk-otorite → outcome →
finance. Faz 0 kuruldu; Faz 1 tüzel kişiliğe bağlı.

### 7. Dayanıklılık & organizasyon

- **Venn'i resmen kur** — partnerlik, finance, DOI, sözleşmenin önündeki tek
  en büyük blocker.
- **Altyapı olgunluğu** — Vercel Pro, staging ortamı, sessizce patlamayan CI/CD,
  monitoring/alerting, SLA.
- **Bus factor** — yedekli kod/veri, 1-2 katkıcı.
- **Sürdürülebilir model** — grant + conservation finance + kurumsal lisans
  (IUCN-uyumlu).
- **Yönetişim** — CC-BY-4.0 lisans, katkı + atıf politikası, şeffaflık.

---

## Kritik yol (sıralama)

```
1. Venn'i kur (tüzel kişilik)  ──┐
                                 ├─→ partnerlik + finance + DOI mümkün olur
2. Veri bütünlüğü programı  ─────┤
   (47k → güvenilir kayıt)       ├─→ kredibilite tabanı
3. Beachhead: 20-50 gerçek    ──┤
   Türk/Akdeniz geofit kullanıcı ├─→ canlı geri besleme + ilk gerçek vaka
4. 1 çapa kurum + IUCN re-app ──┘──→ ödünç otorite → segment sıçraması
5. SEO/dağıtım + derin çekirdek (assessment) → organik büyüme
6. Bahçe Faz 1 (finance) → farklılaştırma
7. BEE multi-vertical → ancak geofit üst segmente çıkınca templatize et
```

**BEE / multi-vertical'ı erken açma.** Tek vertical (geofit) üst segmente çıkmadan
şablonlama. Tekte kazanamayan beşte dağılır.

---

## Eğer 3 bahse indirsek

1. **Gerçek kullanıcı (beachhead)** — Türk/Akdeniz geofit camiası + 1 specialist
   group. En zor, en kritik, kopyalanamaz.
2. **Veri bütünlüğü** — stub'ı provenance + güven skoru + taksonomik omurga ile
   güvenilir kayda çevir. *AI-native avantajın burada çok güçlü.*
3. **Otorite** — Venn + IUCN re-app + 1 çapa kurum.

---

## Yapmamamız gerekenler

- ❌ Boşlukta feature eklemeye devam (ürün tarafı bitti, getirisi azalan)
- ❌ Kullanıcı olmadan ölçek hayal etmek
- ❌ BEE/multi-vertical'a erken atlamak
- ❌ Marketplace diline geri kaymak (IUCN riski)
- ❌ "Demo gibi" sahte veri/aktivite

---

## AI-native avantaj — gizli koz

Tek kişi + AI zayıflık gibi görünür ama **en büyük koz.** Bir kurumun 6 ayda
yapamayacağı veri uzlaştırmasını, zenginleştirmeyi, çok-dilliliği ölçekte
yapabiliyorsun. Konumlandırma: **"AI-native conservation data infrastructure"** —
yavaş, bürokratik kurumların yapamadığını hızla yapan.

---

## İş bölümü — şu anki faz

**Senin tarafın (insan/kurum işi):**
1. Venn'i resmen kur (tüzel kişilik) — en kritik blocker
2. Programı akademisyen arkadaşlara sun → beachhead başlangıcı

**Benim tarafım (kod + AI işi):**
1. **Veri bütünlüğü programı** (başlangıç) —
   - Faz 1: tamlık/güven skoru + admin veri-kalite dashboard'u (görünürlük)
   - Faz 2: taksonomik omurga uzlaştırması (GBIF/POWO match)
   - Faz 3: yüksek-değerli kayıtların hedefli zenginleştirilmesi
2. Sonra: SEO/yapısal veri + derin assessment workflow

> Kuzey yıldızı: **tam, doğrulanmış, atıf-edilebilir kayıt sayısı** (bugün ~423).
