"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithPassword,
  signUpWithEmail,
  signInWithMagicLink,
  signOut,
} from "../../lib/auth";

/**
 * BEESignInFlow — 2-step entry:
 *   1. Auth (login / signup / magic link)
 *   2. Pick destination (vertical)
 *
 * Receives auth state via props from BEEAuthBar so we don't spin up a
 * second useAuth listener. Session is global; signing in here makes
 * /geocon authenticated too.
 */

const PLATFORMS = [
  {
    key: "geocon",
    name: "GEOCON",
    tag: "Endemic geophyte intelligence",
    href: "/geocon",
    active: true,
  },
  // Placeholders for future verticals — visually communicate the
  // "BEE is a platform, GEOCON is one of many" intent.
  { key: "soon-1", name: "—", tag: "Vertical coming soon", active: false },
  { key: "soon-2", name: "—", tag: "Vertical coming soon", active: false },
];

export default function BEESignInFlow({ user, profile, researcher, loading, onClose }) {
  const router = useRouter();

  // If user is already authenticated when the flow opens, skip auth.
  const initialStep = user ? "pick" : "auth";
  const [step, setStep] = useState(initialStep);

  // When auth completes, advance to the picker.
  useEffect(() => {
    if (user && step === "auth") setStep("pick");
  }, [user, step]);

  return (
    <Backdrop onClose={onClose}>
      {step === "auth" ? (
        <AuthStep onCancel={onClose} />
      ) : (
        <PickStep
          user={user}
          profile={profile}
          researcher={researcher}
          loading={loading}
          onPick={(p) => {
            if (!p.active || !p.href) return;
            onClose?.();
            router.push(p.href);
          }}
          onSignOut={async () => {
            await signOut();
            setStep("auth");
          }}
          onClose={onClose}
        />
      )}
    </Backdrop>
  );
}

function Backdrop({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(12, 5, 22, 0.78)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background:
            "linear-gradient(160deg, #29143f 0%, #1a0c2c 100%)",
          border: "1px solid rgba(245, 166, 35, 0.22)",
          borderRadius: 18,
          padding: 28,
          color: "#f3e8d3",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          boxShadow:
            "0 20px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(245, 166, 35, 0.05)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Step 1 — Authenticate
─────────────────────────────────────────────────────────── */
function AuthStep({ onCancel }) {
  const [tab, setTab] = useState("login"); // login | signup | magic
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit() {
    setMsg(null);
    setBusy(true);
    try {
      if (tab === "login") {
        const { error } = await signInWithPassword(email.trim(), password);
        if (error) setMsg({ ok: false, text: error.message });
        else setMsg({ ok: true, text: "Welcome back." });
      } else if (tab === "signup") {
        if (password.length < 6) {
          setMsg({ ok: false, text: "Password must be at least 6 characters." });
          return;
        }
        const { data, error } = await signUpWithEmail(email.trim(), password, fullName.trim());
        if (error) setMsg({ ok: false, text: error.message });
        else if (data?.user && !data.session) {
          setMsg({ ok: true, text: "Check your email to confirm, then log in." });
        } else if (data?.session) {
          setMsg({ ok: true, text: "Account created." });
        }
      } else {
        const { error } = await signInWithMagicLink(email.trim());
        if (error) setMsg({ ok: false, text: error.message });
        else setMsg({ ok: true, text: "Magic link sent. Check your email." });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header subtitle="Step 1 — Identify yourself" />

      <div style={tabRow}>
        {[
          { k: "login",  l: "Log in" },
          { k: "signup", l: "Sign up" },
          { k: "magic",  l: "Magic link" },
        ].map((b) => (
          <button
            key={b.k}
            onClick={() => { setTab(b.k); setMsg(null); }}
            style={tabBtn(tab === b.k)}
            type="button"
          >
            {b.l}
          </button>
        ))}
      </div>

      {tab === "signup" && (
        <Field label="Full name">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="First Last"
            style={input}
          />
        </Field>
      )}

      <Field label="Email">
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.org"
          style={input}
        />
      </Field>

      {tab !== "magic" && (
        <Field label="Password">
          <input
            type="password"
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={input}
          />
        </Field>
      )}

      {msg && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 12,
            border: `1px solid ${msg.ok ? "rgba(125, 168, 111, 0.4)" : "rgba(229, 80, 80, 0.4)"}`,
            background: msg.ok ? "rgba(125, 168, 111, 0.12)" : "rgba(229, 80, 80, 0.10)",
            color: msg.ok ? "#C8E2BB" : "#FFB8B8",
          }}
        >
          {msg.text}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} disabled={busy} style={btnSecondary}>
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={busy} style={btnPrimary(busy)}>
          {busy ? "…" : tab === "login" ? "Log in" : tab === "signup" ? "Create account" : "Send magic link"}
        </button>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   Step 2 — Pick destination
─────────────────────────────────────────────────────────── */
function PickStep({ user, profile, researcher, loading, onPick, onSignOut, onClose }) {
  const displayName =
    researcher?.name ||
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <>
      <Header subtitle="Step 2 — Choose where you're going" />

      <div
        style={{
          padding: "12px 14px",
          borderRadius: 10,
          background: "rgba(245, 166, 35, 0.08)",
          border: "1px solid rgba(245, 166, 35, 0.18)",
          marginBottom: 18,
          fontSize: 12,
          color: "#FFD79B",
        }}
      >
        {loading ? "Loading account…" : (
          <>
            Welcome,{" "}
            <strong style={{ color: "#FFE6BC" }}>{displayName}</strong>
            <button
              onClick={onSignOut}
              type="button"
              style={{
                float: "right",
                background: "transparent",
                border: "none",
                color: "#FFD15C",
                fontSize: 11,
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              Sign out
            </button>
          </>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => onPick(p)}
            disabled={!p.active}
            type="button"
            style={platformBtn(p.active)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: p.active ? "#F5A623" : "rgba(160, 140, 110, 0.4)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div
                  style={{
                    fontFamily:
                      '"Arial Black", "Helvetica Neue", Helvetica, system-ui, sans-serif',
                    fontWeight: 900,
                    fontSize: 18,
                    letterSpacing: -0.6,
                    color: p.active ? "#f8eecf" : "#7a6855",
                    lineHeight: 1,
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: p.active ? "#A8C49C" : "#7a6855",
                    marginTop: 4,
                    fontStyle: "italic",
                    fontFamily: 'Georgia, "Times New Roman", serif',
                  }}
                >
                  {p.tag}
                </div>
              </div>
              {p.active && <span style={{ color: "#FFD15C", fontSize: 14 }}>→</span>}
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
        <button type="button" onClick={onClose} style={btnSecondary}>
          Close
        </button>
      </div>
    </>
  );
}

/* ── Shared bits ────────────────────────────────────────── */

function Header({ subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 22 }}>
      <div
        style={{
          fontFamily:
            '"Arial Black", "Helvetica Neue", Helvetica, system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 38,
          letterSpacing: -2,
          background:
            "linear-gradient(140deg, #FFD15C 0%, #F5A623 50%, #E5722B 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
        }}
      >
        BEE
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: "rgba(255, 215, 155, 0.7)",
          fontWeight: 600,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          color: "rgba(255, 215, 155, 0.7)",
          fontWeight: 600,
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

const tabRow = {
  display: "flex",
  gap: 0,
  marginBottom: 16,
  borderRadius: 10,
  background: "rgba(245, 166, 35, 0.06)",
  border: "1px solid rgba(245, 166, 35, 0.18)",
  padding: 3,
};

const tabBtn = (active) => ({
  flex: 1,
  padding: "8px 0",
  fontSize: 12,
  fontWeight: 600,
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
  background: active ? "rgba(245, 166, 35, 0.18)" : "transparent",
  color: active ? "#FFE6BC" : "rgba(255, 215, 155, 0.55)",
  transition: "all 0.15s",
});

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(245, 166, 35, 0.25)",
  background: "rgba(12, 5, 22, 0.55)",
  color: "#f3e8d3",
  fontSize: 13,
  fontFamily: "inherit",
  boxSizing: "border-box",
  outline: "none",
};

const btnPrimary = (busy) => ({
  padding: "10px 18px",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.4,
  color: "#1a0d2e",
  background: busy
    ? "rgba(245, 166, 35, 0.45)"
    : "linear-gradient(140deg, #FFD15C 0%, #F5A623 50%, #E5722B 100%)",
  border: "none",
  borderRadius: 8,
  cursor: busy ? "wait" : "pointer",
  boxShadow: busy ? "none" : "0 2px 12px rgba(245, 166, 35, 0.25)",
});

const btnSecondary = {
  padding: "10px 16px",
  fontSize: 12,
  fontWeight: 600,
  color: "#FFD79B",
  background: "transparent",
  border: "1px solid rgba(245, 166, 35, 0.3)",
  borderRadius: 8,
  cursor: "pointer",
};

const platformBtn = (active) => ({
  width: "100%",
  padding: "14px 16px",
  border: active
    ? "1px solid rgba(245, 166, 35, 0.4)"
    : "1px solid rgba(160, 140, 110, 0.18)",
  borderRadius: 12,
  background: active
    ? "rgba(245, 166, 35, 0.08)"
    : "rgba(255, 255, 255, 0.02)",
  cursor: active ? "pointer" : "not-allowed",
  transition: "all 0.15s",
});
