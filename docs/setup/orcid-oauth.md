# ORCID OAuth setup

GEOCON'un ORCID OAuth verification akışı (`/api/auth/orcid/*` ve
`/geocon/welcome` üzerindeki "ORCID ile doğrula" düğmesi) için ORCID
Developer Portal'da bir uygulama kaydetmen gerekiyor. Bu kayıt ücretsiz
ve birkaç dakika sürer.

**Bu doküman olmadan da sistem çalışır:** kod K9 öncesi K8 manuel
girişle tam çalışıyordu. ORCID OAuth sadece sahiplik doğrulamasını
(`orcid_verified_at` damgası) ekler. Env vars set edilmemişse "ORCID
ile doğrula" düğmesi 503 döner, manuel akış sorunsuz devam eder.

---

## Adım 1 — ORCID hesabını aç (yoksa)

1. `https://orcid.org` → **Register now**
2. Kişisel ad, e-posta, şifre — kurumsal e-posta gerekmez
3. Onay e-postası geldikten sonra giriş yap

**Kendi araştırmacı kimliğin de bu olacak.** GEOCON test ederken kendi
yayınlarını içeri alabilirsin.

---

## Adım 2 — Developer Tools'a git

1. Giriş yaptıktan sonra sağ üstte adına tıkla
2. Açılır menüden **Developer Tools** seç
3. Eğer ilk girişin ise **"Developer Tools'u aktive et"** istenir →
   kabul et

Direkt URL: `https://orcid.org/developer-tools`

---

## Adım 3 — Public API client kaydet

1. **"Register a public API client"** düğmesine bas
2. Aşağıdaki formu doldur:

| Alan | Örnek değer | Açıklama |
| --- | --- | --- |
| **Name of your application** | `GEOCON Atlas` | Kullanıcı izin ekranında görünür |
| **Your website URL** | `https://geocon.bio` | Kendi production domain'in |
| **Description** | `Conservation genomics atlas for geophyte species. Researchers verify ORCID ownership to import their publication history and unlock attributed contributions.` | İzin ekranında küçük metinle görünür |
| **Redirect URIs** | (Adım 4'te detaylı) | Critical — birebir aynı olmalı |

3. **Terms of service / Privacy policy** kutusunu işaretle (varsa
   linklerini doldur)

---

## Adım 4 — Redirect URI(ler) — KRİTİK

ORCID, callback'i sadece bu listedeki URI'lere yapar. Tam eşleşme:
büyük/küçük harf, slash, query — her şey aynı olmalı.

Vercel deploy'larına göre **2 URI ekle**:

1. **Production custom domain** (önerilen):
   `https://geocon.bio/api/auth/orcid/callback`
2. **Vercel preview / fallback**:
   `https://geocon-atlas.vercel.app/api/auth/orcid/callback`

Local dev için de eklemek istersen (opsiyonel):
`http://localhost:3000/api/auth/orcid/callback`

**Trailing slash YOK.** `…/callback/` ile `…/callback` farklı sayılır
ve `redirect_uri_mismatch` hatası alırsın.

Kayıttan sonra istediğin zaman dönüp yeni URI ekleyebilirsin.

---

## Adım 5 — Credentials'ı al

Form gönderildikten sonra ORCID sana şunları gösterir:

- **Client ID** — `APP-XXXXXXXXXXXXXXXX` formatında, public bilgi
- **Client Secret** — uzun random string, SAKLA, bir daha gösterilmez
  (kaybedersen sıfırla)

Hemen 1Password / parola yöneticisine kopyala.

---

## Adım 6 — Vercel env variables

1. Vercel dashboard → `geocon-atlas` projesi
2. **Settings → Environment Variables**
3. Şu 4 değişkeni ekle:

| Variable | Value | Environments |
| --- | --- | --- |
| `ORCID_CLIENT_ID` | Adım 5'teki Client ID | Production + Preview + Development |
| `ORCID_CLIENT_SECRET` | Adım 5'teki Client Secret | Production + Preview + Development |
| `ORCID_REDIRECT_URI` | Adım 4'te eklediğin production URI (`https://geocon.bio/api/auth/orcid/callback`) | Production |
| `ORCID_REDIRECT_URI` | Vercel preview URI (`https://geocon-atlas.vercel.app/api/auth/orcid/callback`) | Preview |
| `ORCID_ENV` | `production` | hepsi |

⚠ `ORCID_REDIRECT_URI` per-environment olabilir — production ve preview
farklı domain'lere işaret etsin. Aynı app'in iki redirect URI'sini
ORCID'e de eklediğin için her ikisi de geçerli olur.

---

## Adım 7 — Redeploy

Env var ekledikten sonra mevcut deploy bu değişiklikleri görmez. Bir
yenilemek gerekir:

- Vercel dashboard → **Deployments** → en son deploy → **"⋯" menüsü →
  Redeploy**
- VEYA herhangi bir commit pushla (otomatik tetiklenir)

30 saniye sonra canlı olur.

---

## Adım 8 — Test

1. Production'a git: `https://geocon.bio/geocon/welcome`
2. **"ORCID ile doğrula"** düğmesine bas
3. ORCID giriş ekranına yönlendirileceksin
4. Kendi ORCID kullanıcı adın/şifren ile giriş yap
5. **"Authorize"** düğmesine bas (GEOCON izin istiyor)
6. Geri yönlendirileceksin → URL'de
   `?orcid_oauth=verified&orcid=0000-0001-…` parametreleri olmalı
7. Sayfada yeşil `✓ ORCID doğrulandı: …` banner'ı + Step 2 önizleme
   açılmalı

Olmazsa hata mesajı `?orcid_oauth_error=<code>` ile döner. Olası
hatalar:

| Hata | Sebep | Çözüm |
| --- | --- | --- |
| `not_configured` | Env vars eksik | Adım 6'yı tekrar yap, redeploy |
| `redirect_uri_mismatch` (ORCID tarafı) | URI birebir aynı değil | Adım 4'e bak, slash/protokol kontrol et |
| `state_mismatch` | Cookie temizlenmiş / 10 dk geçmiş | Aynı sekmede yeniden başla |
| `not_signed_in` | Önce Supabase auth gerek | GEOCON'a önce magic link ile gir |
| `token_exchange_failed` | Client Secret yanlış | Adım 5'i tekrar yap |

---

## Sandbox vs Production

Production'a koymadan önce test etmek istersen `sandbox.orcid.org`
üzerinde tamamen ayrı bir app kaydı yapabilirsin. Sandbox'ta
istediğin kadar test ORCID açıp denersin, prod hesabını ellemezsin.

Sandbox için:
- Adım 1 → `https://sandbox.orcid.org/register`
- Adım 2 → `https://sandbox.orcid.org/developer-tools`
- Vercel env: `ORCID_ENV=sandbox`

Kod tarafı tek env var ile sandbox/prod arasında geçiş yapar.

---

## Ne zaman client secret rotate edeyim?

- Vercel env logs'a birinin eriştiğinden şüphelenirsen
- Bir önceki secret'ı .env dosyasında tutup yanlışlıkla commit'lersen
  (ki bizim `.gitignore` artık koruyor ama gözlem)
- Genelde 12 ayda bir best practice rotation

ORCID Developer Tools → app → **Regenerate secret** → yeni değeri
Vercel env'e gir → redeploy.
