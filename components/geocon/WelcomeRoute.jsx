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
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

export default function WelcomeRoute() {
  const router = useRouter();
  const { user, profile, refreshProfile, loading } = useAuthContext();

  const [orcid, setOrcid] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  // Prefill from profile if a previous attempt landed it there
  useEffect(() => {
    if (profile?.orcid && !orcid) setOrcid(profile.orcid);
  }, [profile?.orcid]);

  const step = useMemo(() => {
    if (result) return 3;
    if (preview) return 2;
    return 1;
  }, [result, preview]);

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

  if (loading) {
    return <Centered>Yükleniyor…</Centered>;
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

      {step === 1 && (
        <Step1
          orcid={orcid}
          setOrcid={setOrcid}
          onSubmit={handlePreview}
          submitting={previewing}
          err={err}
        />
      )}

      {step === 2 && preview && (
        <Step2
          preview={preview}
          onBack={() => { setPreview(null); setErr(null); }}
          onConfirm={handleImport}
          importing={importing}
          err={err}
        />
      )}

      {step === 3 && result && (
        <Step3
          result={result}
          profile={profile}
          onDone={() => router.push("/geocon")}
        />
      )}
    </div>
  );
}

/* ─── steps ────────────────────────────────────────────────── */

function Step1({ orcid, setOrcid, onSubmit, submitting, err }) {
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

function Step2({ preview, onBack, onConfirm, importing, err }) {
  return (
    <>
      <Section>
        <h1 style={h1}>{preview.name || "(isimsiz ORCID)"}</h1>
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

function Step3({ result, profile, onDone }) {
  const k1Points = (result.new_events || 0) * 5 * 0.6;
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
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gx-ink-muted)", marginBottom: 8 }}>
          Sıradaki üç adım
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <NextStep
            icon="🔬"
            title="Senin atlasına bakıyoruz"
            hint="Importer arka planda çalıştı; uzmanlık alanın ve katkın profilin üzerinde görünmeye başladı."
            href={profile?.researcher_id ? `/geocon/researchers/${profile.researcher_id}` : "/geocon"}
            ctaLabel="Profilime git"
          />
          <NextStep
            icon="🗂"
            title="Senin için Open Brief'lere bak"
            hint="Yayın geçmişine yakın açık çağrıları gör. Bir tanesine yanıt vermek K2 etkin başlatır."
            href="/geocon/briefs"
            ctaLabel="Briefs'i aç"
          />
          <NextStep
            icon="🌐"
            title="Bir Program'a katıl veya başlat"
            hint="Programlar, bir veya birden fazla türü çok yıllık iş paketine dönüştürür. K3 etkin orada birikiyor."
            href="/geocon/programs"
            ctaLabel="Programlar"
          />
        </div>
      </Section>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button onClick={onDone} style={primaryBtn}>Ana sayfaya git</button>
      </div>
    </>
  );
}

/* ─── primitives ───────────────────────────────────────────── */

function Stepper({ step }) {
  const steps = ["ORCID", "Önizleme", "İçeri al"];
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
