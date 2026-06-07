# GEOCON Atlas — Aşama-Geçiş (Stage-Gate) Diyagramı

**Amaç:** Lineer "to-do" yerine **koşula bağlı** ilerleme. Her işin/segmentin
bir **kapısı (gate)** var: o koşullar gerçekleşmeden o aşamaya geçme. Bu sayede
"X'i ne zaman yapmalıyım?" sorusunun cevabı net — bir koşul.

> Okuma kuralı: bir aşamada **odaklan**, kapı koşulları **✓** olunca bir sonrakine geç.
> Erken atlama = kaynak israfı (örn. kullanıcı yokken SEO, tek vertical kanıtlanmadan BEE).

---

## Ana akış

```
 S0  İNDIE ÜRÜN  ──gate──▶  S1  GÜVENİLİR TEMEL ──gate──▶  S2  KANITLI BEACHHEAD
 (şu an)                    (şu an aktif)                  (gerçek kullanıcılar)
   feature tam               veri + tüzel kişilik             20-50 aktif + 1 gerçek vaka
   ~0 kullanıcı                                                      │
   stub veri                                                        gate
                                                                     ▼
 S5  KATEGORİ ◀──gate── S4  DAĞITIM ◀──gate── S3  ONAYLI / OTORİTE
 conservation finance    SEO + entegrasyon       IUCN + 1 çapa kurum
 + BEE multi-vertical    + ISO dönüşümü           + danışma kurulu
```

---

## S0 → S1 · GÜVENİLİR TEMEL  *(şu an buradayız)*

**Bu aşamada odak:**
- Veri bütünlüğü: POWO native bölgeler, completeness skoru, provenance
- **Venn'i resmen kur** (insan/kurum işi)
- Dayanıklılık: Vercel Pro + staging + pg_cron

**S2'ye GEÇİŞ KAPISI — hepsi ✓ olmalı:**
- [ ] Venn **legally established**
- [ ] Kuzey yıldızı (curated ≥70 kayıt) **381 → ≥1.500**
- [ ] POWO native bölgeler corpus'un **çoğunluğunda** içe alınmış
- [ ] Deploy/altyapı güvenilir (auto-deploy ✓, monitoring)

---

## S1 → S2 · KANITLI BEACHHEAD

**Bu aşamada odak:**
- **20-50 gerçek aktif kullanıcı** (Türkiye/Akdeniz geofit camiası)
- **1 tam gerçek vaka:** araştırmacı → tür → assessment → program → outcome (sahte demo YOK)
- İlk gerçek IUCN değerlendirmesi Assessment Hub'da taslak

**S3'e GEÇİŞ KAPISI:**
- [ ] **≥20 aktif katkıcı** (sadece kayıtlı değil, katkı veren)
- [ ] **≥1 tam gerçek vaka** tamamlanmış
- [ ] **≥1 gerçek IUCN assessment** Hub'da hazırlanmış

---

## S2 → S3 · ONAYLI / OTORİTE

**Bu aşamada odak:**
- **IUCN yeniden başvurusu**
- **1 çapa kurum** partnerliği (Kew/RBGE/yerel herbaryum/specialist group)
- Bilimsel danışma kurulu (3-5 isim)

**S4'e GEÇİŞ KAPISI:**
- [ ] IUCN re-app **kabul** OR 1 specialist group GEOCON kullanıyor
- [ ] **1 çapa kurum** anlaşması

---

## S3 → S4 · DAĞITIM

**Bu aşamada odak:**
- SEO + yapısal veri (47k tür sayfası = landing page)
- **★ ISO dönüşümü (TDWG → ISO2)** — globe/dağılım UX'i artık önemli
- Entegrasyonlar (Zotero, ORCID, Notion, embed)
- `/geocon/news` içerik
- GBIF veri yayıncısı

**S5'e GEÇİŞ KAPISI:**
- [ ] Organik trafik eşiği aşıldı
- [ ] ≥3 makalede atıf / otorite tarafından referans

---

## S4 → S5 · KATEGORİ-TANIMLAYAN

**Bu aşamada odak:**
- **Bahçe Faz 1** (conservation finance, yatırımcı dealflow)
- **BEE multi-vertical** (orkide, etobur, raptor… şablonla)

Bu, endgame. Buraya geofit vertical'ı **S3'ü geçtikten sonra** gelinir.

---

## Koşula bağlı tetikleyiciler (asıl istediğin tablo)

Bir işi **ne zaman** yapacağın = hangi koşul:

| Ertelenen iş | YAP — şu koşul gerçekleşince |
|---|---|
| **★ ISO dönüşümü (TDWG→ISO2)** | POWO native bölgeler çoğunlukta içe alındı **VE** doğrulanmış WGSRPD→ISO crosswalk elde edildi **VE** S4'e (dağıtım/globe UX) geçildi |
| pg_cron migrasyonu | **Şimdi-ish** — Supabase'e `CRON_SECRET` eklenince (Hobby'de otomasyonu geri getirir) |
| Vercel Pro upgrade | Gerçek kullanıcılar uptime'a bağımlı olunca (S2 başı) OR ölçekte cron gerekince |
| Whisper / Pl@ntNet / Resend / Zenodo aktivasyonu | İlgili API key env'e eklenince (her an) |
| Wikidata-IUCN ölçekleme | **ASLA** — proof 0/24 yield verdi; gerçek IUCN sadece gerçek değerlendirmeyle (Hub + partnerlik) büyür |
| Bilimsel danışma kurulu | S2→S3 (beachhead sonrası, IUCN re-app ile birlikte) |
| SEO / news içerik | S3→S4 (kredibilite kurulduktan SONRA; kullanıcı yokken SEO israf) |
| **BEE multi-vertical** | Geofit vertical S3'ü (onaylı) geçince — ASLA daha önce |
| **Bahçe Faz 1** (yatırımcı erişimi) | Venn kuruldu **VE** hukuki/menkul-kıymet incelemesi yapıldı **VE** ≥1 venn_verified outcome var |
| Climate raster (WorldClim, Python sidecar) | Dış servis kurulunca + veri ekibi/zamanı olunca (düşük öncelik) |

---

## Şu anki konum

```
S0 ✅  →  S1 ⬅ ŞU AN  →  S2  →  S3  →  S4  →  S5
              │
              ├─ Veri bütünlüğü: genus %100, completeness+dashboard ✓,
              │  geophyte_type inferred ✓, POWO native (DI-6) başlıyor
              ├─ Venn: SENİN tarafın (kuruluyor)
              └─ Dayanıklılık: auto-deploy ✓, pg_cron bekliyor (CRON_SECRET)
```

S1 kapısının 4 koşulu açıldığında S2'ye (gerçek kullanıcı) geçiyoruz. ISO
dönüşümü S4 kapısında — POWO bölgeleri + crosswalk hazır olunca. Unutulmayacak,
çünkü tabloda gate'li duruyor.
