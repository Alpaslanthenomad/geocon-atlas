# LOCALITY-PRIVACY.md — Konum gizliliği (Constraint #5)  `[live]`

Ders notu + referans. Gözlem koordinatlarının (lat/lng) nasıl hassasiyet-katmanlı
(sensitivity-tiered) olarak gizlendiğini anlatır. Uygulanan SQL'in kanonik kaydı:
`docs/architecture/sql/2026-06-11_locality_coord_redaction.sql`. Uygulandı: 2026-06-11
(migrations `locality_coord_redaction` + `_followup`).

---

## 1. Özet (üç satır)
Tehdit altındaki (IUCN CR/EN/VU/EW/EX) ya da hassas işaretli türlerin **kesin GPS
koordinatı**, giriş yapmamış ziyaretçiye (anon) asla gitmemeli — kaçak toplama
(poaching) riski. Bunu **okuma katmanında** (RPC + RLS) çözdük: tam koordinatı yalnızca
**gözlemcinin kendisi veya admin** görür; herkes ya **~11 km'ye yuvarlanmış** ya da
**gizlenmiş** koordinat görür. Doğrulandı, 0 ERROR güvenlik denetimi, ikinci-model
kontrolü (Codex) yapıldı.

## 2. Sorun neydi (tehdit modeli)
İki ayrı sızıntı sınıfı vardı:

1. **RPC'ler.** Bir redaksiyon yardımcı fonksiyonu (`_redact_field_coord`) zaten vardı
   ve iki "saha gözlemi" RPC'sine bağlanmıştı; ama **iNaturalist** okuma yolları
   (`get_live_observation_feed`'in iNat dalı ve `list_species_inat_observations`) ham
   `lat/lng` döndürüyordu, ve `get_species_timeline` koordinatı başlık metnine ~110 m
   hassasiyetle gömüyordu.
2. **Doğrudan tablo okuması (asıl büyük açık).** `field_observations` ve
   `inat_observations` tablolarının RLS `SELECT` politikaları `USING (true)` idi —
   yani herkese açık anahtarla (anon) PostgREST üzerinden `GET /rest/v1/inat_observations?select=lat,lng`
   yapıp **ham koordinatları doğrudan** çekmek mümkündü. Bu, RPC'lerdeki tüm
   redaksiyonu anlamsız kılıyordu (redaksiyon sadece RPC'de, sütunda değil).

> Not: Her iki tablo da şu an **boş**. Açık "uyuyan" durumdaydı — saha defteri ve iNat
> senkron cron'u dolmaya başlayınca sızacaktı. Veri gelmeden kapatıldı.

## 3. Atlasın gizlilik modeli (tek doğruluk kaynağı)
İki saf yardımcı fonksiyon, mantığı tek yerde tutar:

- **`_locality_withheld(iucn, sensitivity, privileged) → bool`**
  `= NOT privileged AND (sensitivity <> 'public' OR iucn IN (CR,EN,VU,EW,EX))`
  Yani: bakan kişi yetkili değilse VE tür hassas/tehdit altındaysa → konum gizlenir.
- **`_redact_field_coord(coord, iucn, sensitivity, privileged) → coord`**
  - `coord` null ise → null
  - `privileged` ise → **tam** koordinat
  - `_locality_withheld` ise → **null** (tamamen gizli)
  - aksi halde → `round(coord, 1)` ≈ **0.1° / ~11 km** ızgara

**`privileged` (yetkili) kim?** Saha gözlemi için: kaydı giren kişi
(`field_observations.user_id = auth.uid()`) **veya** admin (`is_admin()`). iNat
kayıtlarının bizde sahibi yoktur → sadece **admin** tam görür.

**Bugünkü gerçek:** 47.413 türün tamamı `sensitivity_level = 'public'`. Yani redaksiyon
şu an pratikte **iucn_status** ile sürülüyor (CR/EN/VU... = gizle). `sensitivity_level`
ileride bir tür elle "hassas" işaretlenirse aynı mekanizmayı tetikler.

## 4. Ne değişti

| Okuma yolu | Önce | Sonra |
|---|---|---|
| `list_field_observations_for_species` | redaksiyonlu (zaten) | değişmedi |
| `get_live_observation_feed` — saha dalı | redaksiyonlu (zaten) | değişmedi |
| `get_live_observation_feed` — iNat dalı | **ham lat/lng** | redaksiyon + hassas türde satır **tamamen hariç** |
| `list_species_inat_observations` | **ham lat/lng** | redaksiyon + hassas türde satır **tamamen hariç** |
| `get_species_timeline` | başlıkta ~110 m ham | başlıkta redaksiyonlu / "location withheld" |
| `list_my_field_observations` | ham (ama sahibe özel) | değişmedi (zaten doğru) |
| `field_observations` RLS SELECT | `USING (true)` | `auth.uid()=user_id OR is_admin()` |
| `inat_observations` RLS SELECT | `USING (true)` | `is_admin()` |

`place_guess` (iNat'ın metin konumu) da gizli durumda bastırılır. RPC imzaları ve çıktı
sütunları **aynı** kaldı → derin linkler ve arayüz kırılmadı.

## 5. Neden böyle — tasarım kararları
- **Saha vs iNat asimetrisi.** Saha gözlemi GEOCON'a aittir ve dış kesin-kaynak linki
  yoktur → satırı **tutup koordinatı kabalaştırırız** (bir şey gösteririz). iNat satırı
  ise dışarıya, iNaturalist gözlem sayfasına **derin link** (`inat_id`/`observation_url`)
  taşır; orada koordinat açık olabilir. O yüzden hassas türde **iNat satırını tümden
  gizleriz** (sadece admin). Aksi halde koordinatı bizde silsek bile linkten dışarıdan
  okunurdu (Codex bu gerçek açığı yakaladı).
- **RLS kilidi neden güvenli.** Tablolar `postgres`'e ait ve `force_rls=false`; okuma
  RPC'leri `SECURITY DEFINER` (sahibi `postgres`) olduğundan **RLS'i bypass eder**. Yani
  politikayı kısmak RPC'leri etkilemez — onlar redaksiyonlu okuma yolu olarak çalışmaya
  devam eder; sadece doğrudan-okuma kapanır. Hiçbir istemci bu tabloları doğrudan
  okumuyor (sadece RPC), o yüzden kısıtlama hiçbir şeyi bozmadı.
- **Tek doğruluk kaynağı.** `_locality_withheld` hem koordinat redaksiyonunu hem
  `place_guess`/satır-hariç-tutma kararını besler → eşik mantığı bir yerde, sürüklenme
  riski yok.

## 6. Nasıl doğrulandı
DB içinde rolü taklit ederek (`set local role` + sahte JWT) anon / gözlemci / admin için
test verisi üstünde kanıtlandı:

| Bakan | saha (CR/tehdit) | saha (LC/public) | iNat (CR) | iNat (LC) | doğrudan okuma |
|---|---|---|---|---|---|
| **anon** | `null` | `39.1, 35.7` | **satır yok** | `39.1, 35.7` (link açık) | **0 satır** |
| **gözlemci** | tam (kendi kaydı) | — | satır yok (admin değil) | — | sadece kendi satırı |
| **admin** | tam | tam | tam + link | tam | hepsi |

Ek olarak: güvenlik denetimi (`get_advisors`) **0 ERROR**; 3-ajanlı saldırgan inceleme +
Codex ikinci-model kontrolü (ikisi de gerçek birer eksik buldu, düzeltildi).

## 7. Kalan riskler (bilinçli kapsam dışı — tekrar ele alınırsa)
- **Serbest metin `notes`** (saha gözlemi): her yerde redaksiyonsuz gösteriliyor. Biri
  hassas bir türün konumunu nota yazarsa orası görünür. İçeriği kesmemek için bilinçli
  bırakıldı; ileride notları tarayıp gizlemek bir geliştirme.
- **Realtime.** Tablolar `supabase_realtime` publication'ında **değil**. Eklenirse,
  realtime **ham sütunları** (lat/lng/place_guess) yalnızca RLS ile (RPC değil) süzerek
  yayar → eklemeyin ya da redaksiyonlu bir projeksiyon yayınlayın.
- **`.env.local`** içindeki `SUPABASE_SERVICE_ROLE_KEY` aslında anon anahtarının kopyası
  (gerçek servis anahtarı değil) — bu işte zarar vermedi, ayrı bir düzeltme.

## 8. Soru-Cevap

**S: Tam koordinatı kim görebiliyor?**
Saha gözleminde: kaydı giren kişi ve adminler. iNat'ta: sadece adminler. Diğer herkes
hassas türde hiç koordinat, public türde ~11 km'ye yuvarlanmış koordinat görür.

**S: Neden bazı koordinatları silip bazılarını yuvarlıyoruz?**
Tehdit altındaki / hassas tür → **sil** (kaçakçıya en küçük ipucu bile vermemek için).
Sıradan (public) tür → **yuvarla** (mahremiyet için makul, ama tamamen gizlemeye gerek
yok). Eşik: `_locality_withheld`.

**S: Bir kullanıcı kendi kaydının tam yerini görebiliyor mu?**
Evet — kendi saha gözleminin tam koordinatını görür (`user_id = auth.uid()`). Başka
birinin hassas kaydını göremez.

**S: iNaturalist'in zaten kendi koordinatını bulanıklaştırdığı doğru değil mi?**
iNat, kendi tehdit listesindeki taksonları bulanıklaştırır — ama bu liste GEOCON'un IUCN
durumuyla örtüşmeyebilir. GEOCON "tehdit altında" derken iNat "açık" diyebilir. O yüzden
**iNat'ın davranışına güvenmeyiz**; hassas türde iNat satırını tümden gizleriz.

**S: Bu değişiklik mevcut özellikleri/derin linkleri kırar mı?**
Hayır. RPC imzaları ve çıktı sütunları aynı kaldı; hiçbir rota silinmedi. Sadece
döndürülen koordinat **değerleri** kısıtlandı. Arayüz null koordinatı zaten zarif
karşılıyor (panel boşsa gizleniyor).

**S: Yarın bir türü elle "hassas" işaretlersek ne olur?**
`species.sensitivity_level`'i `'public'` dışına çekmek yeterli — `_locality_withheld`
tetiklenir ve o türün tüm koordinatları (IUCN durumu ne olursa olsun) gizlenir.

**S: Tablolar boşken bunu neden şimdi yaptık?**
Açık yapısaldı; saha defteri + iNat cron'u dolar dolmaz sızacaktı. Güvenlik açığını veri
gelmeden kapatmak doğru sıralama.

**S: Geri alma (rollback)?**
İki politikayı tekrar `USING (true)` yap ve üç fonksiyonu bu dosyanın git geçmişindeki
önceki gövdelerine döndür. Migration'lar ileri-yönlüdür; ters migration yazılır.
