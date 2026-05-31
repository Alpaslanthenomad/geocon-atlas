"use client";
// K8 — ORCID welcome flow.
//
// Three steps:
//   1. Enter ORCID (manual; OAuth comes in v2)
//   2. Preview: name, works count, country — confirm
//   3. Import: shows new K1 events + 3 next-step suggestions
//
// Calls /api/orcid/lookup (preview) and /api/orcid/import (commit).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const OAUTH_ERROR_COPY = {
  not_configured: "ORCID OAuth henüz yapılandırılmadı. Lütfen manuel ORCID girişi kullan ya da admin'e haber ver.",
  state_mismatch: "Güvenlik kontrolü başarısız (state mismatch). Lütfen tekrar dene.",
  state_expired: "İmzalı state süresi doldu (10 dk). Lütfen tekrar dene.",
  token_exchange_failed: "ORCID token alışverişi başarısız oldu. Birkaç saniye sonra tekrar dene.",
  token_network_error: "ORCID sunucusuna ulaşılamadı.",
  not_signed_in: "ORCID doğrulamadan önce GEOCON'a giriş yapmış olman gerekir.",
  session_invalid: "Oturum süresi doldu. Yeniden giriş yap ve ORCID'i tekrar bağla.",
  missing_code: "ORCID auth kodu döndürmedi. Tekrar dene.",
};

export default function WelcomeRoute() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, profile, refreshProfile, loading } = useAuthContext();

  const [orcid, setOrcid] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [oauthBanner, setOauthBanner] = useState(null);

  // Prefill from profile if a previous attempt landed it there
  useEffect(() => {
    if (profile?.orcid && !orcid) setOrcid(profile.orcid);
  }, [profile?.orcid]);

  // Handle the OAuth callback return: ?orcid_oauth=verified&orcid=...
  // or ?orcid_oauth_error=... — show appropriate banner and auto-advance.
  useEffect(() => {
    if (!search) return;
    const verifiedOrcid = search.get("orcid");
    const status = search.get("orcid_oauth");
    const oauthError = search.get("orcid_oauth_error");

    if (status === "verified" && verifiedOrcid) {
      setOrcid(verifiedOrcid);
      setOauthBanner({ tone: "success", text: `ORCID doğrulandı: ${verifiedOrcid}` });
      // Stamp the verification on the profile (client-side, with the
      // live Supabase bearer token) then fetch the preview.
      (async () => {
        try {
          const { data: sess } = await supabase.auth.getSession();
          const bearer = sess?.session?.access_token;
          if (bearer) {
            await fetch("/api/orcid/verify-link", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${bearer}`,
              },
              body: JSON.stringify({ orcid: verifiedOrcid }),
            });
            try { refreshProfile?.(); } catch { /* ignore */ }
          }
        } catch { /* non-blocking */ }
        setPreviewing(true);
        try {
          const res = await fetch(`/api/orcid/lookup?orcid=${encodeURIComponent(verifiedOrcid)}`);
          const data = await res.json();
          if (res.ok) setPreview(data);
        } catch (e) {
          setErr(`ORCID lookup hatası: ${e?.message || e}`);
        } finally {
          setPreviewing(false);
        }
      })().catch(() => { /* never let an Uncaught escape */ });
    } else if (oauthError) {
      setOauthBanner({ tone: "error", text: OAUTH_ERROR_COPY[oauthError] || `OAuth hatası: ${oauthError}` });
    }
  }, [search]);

  const [missionSaved, setMissionSaved] = useState(false);
  const [stepMode, setStepMode] = useState("auto");
  // "auto"      → derived from result/preview
  // "mission"   → show step 4 form
  // "done"      → show step 5 finished card

  const step = useMemo(() => {
    if (stepMode === "done") return 5;
    if (stepMode === "mission") return 4;
    if (result) return 3;
    if (preview) return 2;
    return 1;
  }, [result, preview, stepMode]);

  async function handlePreview(e) {
    e?.preventDefault?.();
    setErr(null);
    setPreviewing(true);
    try {
      const res = await fetch(`/api/orcid/lookup?orcid=${encodeURIComponent(orcid.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        if (data?.error === "invalid_orcid") {
          setErr("ORCID format geçersiz. Şu şekilde olmalı: 0000-0000-0000-0000");
        } else if (data?.error === "orcid_not_found") {
          setErr("Bu ORCID public profile altında bulunamadı. ORCID'inin kayıtlı ve görünür olduğundan emin ol.");
        } else {
          setErr("ORCID servisinden cevap alınamadı. Birkaç saniye sonra tekrar dene.");
        }
        return;
      }
      setPreview(data);
    } catch (e2) {
      setErr(`Beklenmeyen hata: ${e2?.message || e2}`);
    } finally {
      setPreviewing(false);
    }
  }

  async function handleImport() {
    setErr(null);
    setImporting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      if (!token) {
        setErr("Oturum bilgisi bulunamadı. Lütfen yeniden giriş yap.");
        return;
      }
      const res = await fetch("/api/orcid/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orcid: orcid.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(`İçeri aktarma başarısız: ${data?.error || res.status}`);
        return;
      }
      setResult(data);
      await refreshProfile?.();
    } catch (e2) {
      setErr(`İçeri aktarma sırasında hata: ${e2?.message || e2}`);
    } finally {
      setImporting(false);
    }
  }

  // NB: we no longer block on auth `loading` — if the context takes a
  // while to resolve, we still want to show the form skeleton so the
  // user knows the page is alive. If !user (after loading is done),
  // we show the sign-in prompt; otherwise we render the steps.
  if (loading && !user) {
    return (
      <Centered>
        <div style={{ textAlign: "center", color: "var(--gx-ink-muted)" }}>
          <div className="gx-skeleton" style={{ width: 280, height: 32, marginBottom: 8 }} />
          <div className="gx-skeleton" style={{ width: 180, height: 14 }} />
        </div>
      </Centered>
    );
  }
  if (!user) {
    return (
      <Centered>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "var(--gx-ink)", marginBottom: 12 }}>
            Welcome ekranına ulaşmak için önce giriş yap.
          </div>
          <Link href="/geocon" style={primaryBtn}>← Ana sayfaya dön</Link>
        </div>
      </Centered>
    );
  }

  return (
    <div style={shell}>
      <Stepper step={step} />

      {oauthBanner && (
        <div style={{
          marginBottom: 14, padding: "10px 14px",
          background: oauthBanner.tone === "success"
            ? "rgba(15, 110, 86, 0.10)"
            : "rgba(163, 45, 45, 0.10)",
          border: `1px solid ${oauthBanner.tone === "success" ? "rgba(15, 110, 86, 0.35)" : "rgba(163, 45, 45, 0.35)"}`,
          borderRadius: 8,
          fontSize: 12,
          color: oauthBanner.tone === "success" ? "var(--gx-accent-bio-green)" : "var(--gx-accent-rose)",
        }}>
          {oauthBanner.tone === "success" ? "✓ " : "⚠ "}{oauthBanner.text}
        </div>
      )}

      {step === 1 && (
        <Step1
          orcid={orcid}
          setOrcid={setOrcid}
          onSubmit={handlePreview}
          submitting={previewing}
          err={err}
          verifiedOrcid={profile?.orcid && profile?.orcid_verified_at ? profile.orcid : null}
        />
      )}

      {step === 2 && preview && (
        <Step2
          preview={preview}
          onBack={() => { setPreview(null); setErr(null); }}
          onConfirm={handleImport}
          importing={importing}
          err={err}
          verified={!!profile?.orcid_verified_at && profile.orcid === preview.orcid}
        />
      )}

      {step === 3 && result && (
        <Step3
          result={result}
          profile={profile}
          researcherId={result?.researcher_id || profile?.researcher_id || null}
          onContinueToMission={() => setStepMode("mission")}
          onSkipToHome={() => router.push("/geocon")}
        />
      )}

      {step === 4 && (
        <Step4Mission
          initial={profile?.mission_tags || []}
          initialText={profile?.mission_text || ""}
          onSaved={() => { setMissionSaved(true); setStepMode("done"); refreshProfile?.(); }}
          onSkip={() => router.push("/geocon")}
        />
      )}

      {step === 5 && (
        <Step5Done onDone={() => router.push("/geocon")} />
      )}
    </div>
  );
}

/* ─── steps ────────────────────────────────────────────────── */

function Step1({ orcid, setOrcid, onSubmit, submitting, err, verifiedOrcid }) {
  return (
    <form onSubmit={onSubmit}>
      <Section>
        <h1 style={h1}>Hoş geldin.</h1>
        <p style={lede}>
          GEOCON, son 10–20 yıldır yaptığın çalışmaların atlas içinde tanınmasını
          ister. ORCID'inle bağlanırsan yayınlarını, başlangıç K1 etkisini ve
          uzmanlık alanını otomatik olarak içeri aktarırız.
        </p>
        <p style={subnote}>
          ORCID yoksa veya bağlanmak istemiyorsan{" "}
          <Link href="/geocon" style={linkAccent}>ana sayfaya geç</Link>;
          istediğin zaman geri dönebilirsin.
        </p>
      </Section>

      {/* OAuth path — verified ownership */}
      <Section>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px",
          background: "linear-gradient(135deg, rgba(168, 198, 57, 0.10), rgba(83, 74, 183, 0.10))",
          border: "1px solid var(--gx-border-soft)",
          borderRadius: 10,
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 22 }}>✓</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)" }}>
              ORCID hesabınla doğrulanmış giriş
            </div>
            <div style={{ fontSize: 11, color: "var(--gx-ink-soft)", marginTop: 2, lineHeight: 1.5 }}>
              Tek tıkla ORCID üzerinden doğrula — sahiplik damgan profile geçer.
              Public ORCID API zaten yetiyor ama verified olmak Venn ekibinde güven sağlar.
            </div>
          </div>
          <a href="/api/auth/orcid/authorize?next=/geocon/welcome" style={primaryBtn}>
            ORCID ile doğrula
          </a>
        </div>
        {verifiedOrcid && (
          <div style={{ fontSize: 10, color: "var(--gx-accent-bio-green)", marginTop: 4 }}>
            ✓ Halihazırda doğrulanmış: <strong style={{ fontFamily: "var(--gx-font-mono)" }}>{verifiedOrcid}</strong>
          </div>
        )}
      </Section>

      <div style={{ textAlign: "center", margin: "4px 0 16px", fontSize: 10, color: "var(--gx-ink-muted)", letterSpacing: 1.5, textTransform: "uppercase" }}>
        — veya manuel —
      </div>

      <Section>
        <label style={labelStyle}>ORCID</label>
        <input
          autoFocus
          value={orcid}
          onChange={(e) => setOrcid(e.target.value.trim())}
          placeholder="0000-0000-0000-0000"
          style={input}
          maxLength={19}
        />
        <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 6 }}>
          ORCID kaydını <a href="https://orcid.org" target="_blank" rel="noopener noreferrer" style={linkAccent}>orcid.org</a> üzerinden ücretsiz alabilirsin.
          Manuel giriş doğrulanmaz; OAuth ile yapmak daha güvenlidir.
        </div>
        {err && <ErrorMsg text={err} />}
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button type="submit" disabled={submitting || !orcid} style={primaryBtn}>
            {submitting ? "Bakıyorum…" : "ORCID'imi kontrol et"}
          </button>
          <Link href="/geocon" style={secondaryBtn}>Şimdi atla</Link>
        </div>
      </Section>
    </form>
  );
}

function Step2({ preview, onBack, onConfirm, importing, err, verified }) {
  return (
    <>
      <Section>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <h1 style={h1}>{preview.name || "(isimsiz ORCID)"}</h1>
          {verified && (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
              padding: "3px 9px", borderRadius: 999,
              background: "rgba(15, 110, 86, 0.12)",
              color: "var(--gx-accent-bio-green)",
              border: "1px solid rgba(15, 110, 86, 0.35)",
            }}>
              ✓ Verified
            </span>
          )}
        </div>
        <p style={lede}>
          {preview.country && (
            <span style={{ marginRight: 12, color: "var(--gx-ink-soft)" }}>
              📍 {preview.country}
            </span>
          )}
          <span>
            📚 {preview.works_count} yayın bulundu
          </span>
        </p>
        {preview.biography && (
          <p style={{ ...lede, fontStyle: "italic", marginTop: 8 }}>
            "{preview.biography.slice(0, 240)}{preview.biography.length > 240 ? "…" : ""}"
          </p>
        )}
        {preview.keywords?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {preview.keywords.slice(0, 10).map((k) => (
              <span key={k} style={pill}>{k}</span>
            ))}
          </div>
        )}
      </Section>

      <Section>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gx-ink-muted)", marginBottom: 8 }}>
          Aktarılacak ilk 5 yayın
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {preview.works.slice(0, 5).map((w, i) => (
            <div key={i} style={workRow}>
              <div style={{ fontSize: 12, color: "var(--gx-ink)", fontWeight: 600, lineHeight: 1.4 }}>
                {w.title || "(başlıksız çalışma)"}
              </div>
              <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 2 }}>
                {w.year ? `${w.year}` : ""}
                {w.doi ? `${w.year ? " · " : ""}DOI: ${w.doi}` : ""}
                {!w.doi && <span style={{ color: "var(--gx-accent-warm-orange)" }}>{w.year ? " · " : ""}DOI yok — bu çalışma şimdilik atlanacak</span>}
              </div>
            </div>
          ))}
          {preview.works.length > 5 && (
            <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", textAlign: "center", marginTop: 4 }}>
              +{preview.works.length - 5} çalışma daha
            </div>
          )}
          {preview.works.length === 0 && (
            <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", fontStyle: "italic", padding: 12 }}>
              ORCID profilinde public yayın bulunamadı. ORCID'inde yayınlarını "Everyone" olarak işaretlediğinden emin ol.
            </div>
          )}
        </div>

        {err && <ErrorMsg text={err} />}

        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button onClick={onConfirm} disabled={importing} style={primaryBtn}>
            {importing ? "İçeri aktarıyorum…" : "Onayla & atlasıma ekle"}
          </button>
          <button onClick={onBack} style={secondaryBtn}>Farklı ORCID dene</button>
        </div>
        <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", fontStyle: "italic", marginTop: 10, lineHeight: 1.5 }}>
          ORCID kimliği şu an manuel olarak alınıyor. Daha sonra OAuth ile doğrulanmış sahiplik eklenecek.
        </div>
      </Section>
    </>
  );
}

function Step3({ result, profile, researcherId, onContinueToMission, onSkipToHome }) {
  const k1Points = (result.new_events || 0) * 5 * 0.6;
  const [suggestions, setSuggestions] = useState(null);
  const [aiBacked, setAiBacked] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token;
        if (!token) return;
        const res = await fetch("/api/welcome/suggestions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ researcher_id: researcherId }),
        });
        const data = await res.json();
        if (cancelled) return;
        setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
        setAiBacked(!!data?.ai);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    })();
    return () => { cancelled = true; };
  }, [researcherId]);

  return (
    <>
      <Section>
        <h1 style={h1}>Atlas geçmişin canlandı.</h1>
        <div style={statsGrid}>
          <Stat label="ORCID görülen yayın" value={result.works_seen} />
          <Stat label="DOI'li (içeri alındı)" value={result.works_with_doi} />
          <Stat label="Yeni K1 event" value={result.new_events} />
          <Stat label="Başlangıç Research impact" value={k1Points.toFixed(1)} tint="#185FA5" />
        </div>
      </Section>

      <Section>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gx-ink-muted)" }}>
            Sıradaki üç adım
          </div>
          {aiBacked === true && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
              padding: "2px 8px", borderRadius: 999,
              background: "rgba(83, 74, 183, 0.10)",
              color: "var(--gx-accent-violet)",
            }}>
              ✦ Sana özel
            </span>
          )}
        </div>

        {suggestions === null ? (
          <div className="gx-skeleton" style={{ height: 180 }} />
        ) : suggestions.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", padding: 12, fontStyle: "italic" }}>
            Şu an için sana özel öneri bulamadık. Ana sayfadan keşfe başlayabilirsin.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {suggestions.map((s, i) => (
              <NextStep
                key={i}
                icon={s.icon || "✦"}
                title={s.title}
                hint={s.rationale}
                href={s.href}
                ctaLabel={s.kind === "program" ? "Programs"
                  : s.kind === "brief" ? "Brief'i aç"
                  : "Profilime git"}
              />
            ))}
          </div>
        )}
      </Section>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button onClick={onContinueToMission} style={primaryBtn}>
          Misyonumu seç →
        </button>
        <button onClick={onSkipToHome} style={secondaryBtn}>Şimdilik atla</button>
      </div>
    </>
  );
}

/* ─── Step 4 — Mission roadmap ─────────────────────────────── */

const MISSION_OPTIONS = [
  { key: "publish_specialty",        icon: "📚", label: "Uzmanlık alanımda yayın yapmak" },
  { key: "propagation_study",        icon: "🌱", label: "Çoğaltma protokolü çalışması yürütmek" },
  { key: "mentor_junior",            icon: "🤝", label: "Genç bir araştırmacıya mentorluk" },
  { key: "multi_org_collab",         icon: "🌐", label: "Çok-organizasyonlu işbirliği kurmak" },
  { key: "red_list_reassessment",    icon: "🛡",  label: "IUCN Red List değerlendirmesine katkı" },
  { key: "compound_characterization",icon: "🧪", label: "Bir bileşiği karakterize etmek" },
  { key: "field_survey",             icon: "🔭", label: "Saha araştırması / herbaryum keşfi" },
  { key: "policy_engagement",        icon: "⚖", label: "Politika / koruma yönetimi tarafında yer almak" },
];

function Step4Mission({ initial, initialText, onSaved, onSkip }) {
  const [tags, setTags] = useState(Array.isArray(initial) ? initial : []);
  const [other, setOther] = useState(initialText || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  function toggle(key) {
    setTags((arr) => arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key]);
  }

  async function save() {
    setSaving(true); setErr(null);
    try {
      const { error } = await supabase.rpc("save_my_mission", {
        p_tags: tags,
        p_text: other || null,
      });
      if (error) throw error;
      onSaved?.();
    } catch (e) {
      setErr(e?.message || "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  const empty = tags.length === 0 && !other.trim();

  return (
    <>
      <Section>
        <h1 style={h1}>Önümüzdeki 6 ay…</h1>
        <p style={lede}>
          GEOCON'da ne inşa etmek istersin? Bu seçimler özelleştirilmiş ana
          sayfanı şekillendirir — sana uygun Open Brief'leri, programları ve
          mentee fırsatlarını üst sıraya çıkarır.
        </p>
        <p style={subnote}>
          Birden fazla seçim yapabilirsin. İstediğin zaman profilinden
          güncelleyebilirsin.
        </p>
      </Section>

      <Section>
        <label style={labelStyle}>Hedefler</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          {MISSION_OPTIONS.map((o) => {
            const active = tags.includes(o.key);
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => toggle(o.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px",
                  background: active ? "rgba(83, 74, 183, 0.10)" : "var(--gx-surface-2)",
                  color: active ? "var(--gx-accent-violet)" : "var(--gx-ink)",
                  border: `1px solid ${active ? "var(--gx-accent-violet)" : "var(--gx-border-soft)"}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  transition: "background 0.15s",
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{o.icon}</span>
                <span style={{ flex: 1, lineHeight: 1.3 }}>{o.label}</span>
                {active && <span style={{ fontSize: 14, flexShrink: 0 }}>✓</span>}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Başka bir şey (opsiyonel)</label>
          <textarea
            value={other}
            onChange={(e) => setOther(e.target.value)}
            rows={2}
            placeholder="Yukarıda olmayan bir hedefin varsa kısaca yaz…"
            style={{ ...input, fontFamily: "inherit", resize: "vertical", lineHeight: 1.5 }}
          />
        </div>

        {err && <ErrorMsg text={err} />}

        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button onClick={save} disabled={saving || empty} style={primaryBtn}>
            {saving ? "Kaydediyorum…" : "Misyonumu kaydet"}
          </button>
          <button onClick={onSkip} style={secondaryBtn}>Şimdilik atla</button>
        </div>
      </Section>
    </>
  );
}

/* ─── Step 5 — Done ────────────────────────────────────────── */

function Step5Done({ onDone }) {
  return (
    <Section>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{
          fontSize: 56, marginBottom: 14, lineHeight: 1,
        }}>✓</div>
        <h1 style={{ ...h1, fontSize: 24 }}>Hazırsın.</h1>
        <p style={{ ...lede, maxWidth: 480, margin: "10px auto 24px" }}>
          Misyonun kaydedildi. Ana sayfaya döndüğünde Atlas geçmişin,
          impact factor'un ve sana özel öneriler seni bekliyor olacak.
        </p>
        <button onClick={onDone} style={primaryBtn}>
          Ana sayfaya git →
        </button>
      </div>
    </Section>
  );
}

/* ─── primitives ───────────────────────────────────────────── */

function Stepper({ step }) {
  const steps = ["ORCID", "Önizleme", "İçeri al", "Misyon", "Tamam"];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 28, alignItems: "center" }}>
      {steps.map((label, idx) => {
        const n = idx + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 22, height: 22, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
              background: done ? "var(--gx-accent-bio-green)" : active ? "var(--gx-accent-violet)" : "var(--gx-surface-3)",
              color: done || active ? "#fff" : "var(--gx-ink-muted)",
            }}>
              {done ? "✓" : n}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: active ? "var(--gx-ink)" : "var(--gx-ink-muted)",
            }}>{label}</span>
            {idx < steps.length - 1 && (
              <span style={{ width: 24, height: 1, background: "var(--gx-border-soft)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Section({ children }) {
  return (
    <section style={{
      padding: 20, marginBottom: 16,
      background: "var(--gx-surface)",
      border: "1px solid var(--gx-border)",
      borderRadius: "var(--gx-radius-4)",
    }}>{children}</section>
  );
}

function Stat({ label, value, tint }) {
  return (
    <div style={{
      padding: 14,
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: 8,
    }}>
      <div style={{
        fontFamily: "var(--gx-font-serif)", fontSize: 24, fontWeight: 700,
        color: tint || "var(--gx-ink)", lineHeight: 1,
      }}>
        {value ?? "—"}
      </div>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
        color: "var(--gx-ink-muted)", marginTop: 6,
      }}>
        {label}
      </div>
    </div>
  );
}

function NextStep({ icon, title, hint, href, ctaLabel }) {
  return (
    <Link href={href} style={nextStepBox} className="gx-card-hover">
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)" }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--gx-ink-soft)", marginTop: 2, lineHeight: 1.5 }}>{hint}</div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gx-accent-violet)" }}>
        {ctaLabel} →
      </span>
    </Link>
  );
}

function ErrorMsg({ text }) {
  return (
    <div style={{
      marginTop: 10, padding: "8px 12px",
      background: "rgba(163, 45, 45, 0.08)",
      border: "1px solid rgba(163, 45, 45, 0.25)",
      borderRadius: 6,
      fontSize: 11, color: "var(--gx-accent-rose)",
      lineHeight: 1.5,
    }}>
      {text}
    </div>
  );
}

function Centered({ children }) {
  return (
    <div style={{
      minHeight: "calc(100vh - 200px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      {children}
    </div>
  );
}

/* ─── styles ───────────────────────────────────────────────── */

const shell = { maxWidth: 720, margin: "0 auto", padding: "32px 16px 80px" };
const h1 = { fontFamily: "var(--gx-font-serif)", fontSize: 28, fontWeight: 700, color: "var(--gx-ink)", margin: 0 };
const lede = { fontSize: 13, lineHeight: 1.6, color: "var(--gx-ink-soft)", marginTop: 10 };
const subnote = { fontSize: 11, lineHeight: 1.6, color: "var(--gx-ink-muted)", marginTop: 10 };
const labelStyle = {
  fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
  textTransform: "uppercase", color: "var(--gx-ink-muted)",
  display: "block", marginBottom: 6,
};
const input = {
  width: "100%", boxSizing: "border-box",
  padding: "10px 14px", fontSize: 14,
  fontFamily: "var(--gx-font-mono)", letterSpacing: 1.2,
  background: "var(--gx-surface-2)", color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)", borderRadius: 8,
};
const primaryBtn = {
  padding: "9px 18px", fontSize: 12, fontWeight: 700,
  background: "var(--gx-accent-violet)", color: "#fff",
  border: "none", borderRadius: 8, cursor: "pointer",
  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
};
const secondaryBtn = {
  padding: "9px 18px", fontSize: 12, fontWeight: 600,
  background: "transparent", color: "var(--gx-ink-soft)",
  border: "1px solid var(--gx-border-soft)", borderRadius: 8, cursor: "pointer",
  textDecoration: "none", display: "inline-flex", alignItems: "center",
};
const linkAccent = { color: "var(--gx-accent-violet)", textDecoration: "underline" };
const pill = {
  padding: "3px 9px", fontSize: 10, fontWeight: 600,
  background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)",
  borderRadius: 999,
};
const workRow = {
  padding: "8px 12px",
  background: "var(--gx-surface-2)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 6,
};
const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 10, marginTop: 14,
};
const nextStepBox = {
  display: "flex", alignItems: "center", gap: 12,
  padding: 14,
  background: "var(--gx-surface-2)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 10,
  textDecoration: "none", color: "inherit",
};
