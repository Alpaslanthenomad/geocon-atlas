"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAuth,
  signInWithPassword,
  signUpWithEmail,
  signInWithMagicLink,
  signOut,
} from "../../lib/auth";

const PLATFORMS = [
  {
    key: "geocon",
    name: "GEOCON",
    tag: "Endemic geophyte intelligence · global atlas",
    href: "/geocon",
    active: true,
  },
  { key: "soon-1", name: "—", tag: "Vertical coming soon", active: false },
  { key: "soon-2", name: "—", tag: "Vertical coming soon", active: false },
];

/**
 * Inline center panel for BEE landing.
 * - Logged out: 3-tab auth form (login / signup / magic link).
 * - Logged in: platform picker. Top-right pill in AuthBar shows the user.
 */
export default function BEEEntryPanel() {
  const { user, profile, researcher, loading } = useAuth();
  const router = useRouter();

  if (loading) return <SkeletonPanel />;
  return user ? (
    <PickerPanel
      user={user}
      profile={profile}
      researcher={researcher}
      onPick={(p) => p.active && p.href && router.push(p.href)}
      onSignOut={async () => { await signOut(); }}
    />
  ) : (
    <AuthPanel />
  );
}

/* ─────────────────────────────────────────────────────────
   Auth panel (logged out)
───────────────────────────────────────────────────────── */
function AuthPanel() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e?.preventDefault?.();
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
        else if (data?.user && !data.session) setMsg({ ok: true, text: "Check your email to confirm, then log in." });
        else if (data?.session) setMsg({ ok: true, text: "Account created." });
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
    <form onSubmit={submit} style={panelShell}>
      <div style={tabRow}>
        {[
          { k: "login",  l: "Log in" },
          { k: "signup", l: "Sign up" },
          { k: "magic",  l: "Magic link" },
        ].map((b) => (
          <button
            key={b.k}
            type="button"
            onClick={() => { setTab(b.k); setMsg(null); }}
            style={tabBtn(tab === b.k)}
          >
            {b.l}
          </button>
        ))}
      </div>

      {tab === "signup" && (
        <Field label="Full name">
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="First Last" style={input} />
        </Field>
      )}

      <Field label="Email">
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.org" style={input} />
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
            marginTop: 6,
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

      <button type="submit" disabled={busy} style={ctaBtn(busy)}>
        {busy ? "…" : tab === "login" ? "Log in →" : tab === "signup" ? "Create account →" : "Send magic link →"}
      </button>

      <div style={{ fontSize: 10, color: "#8a6f56", textAlign: "center", marginTop: 4, letterSpacing: 0.4 }}>
        Identity check, then choose where you're going.
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────
   Picker panel (logged in)
───────────────────────────────────────────────────────── */
function PickerPanel({ user, profile, researcher, onPick, onSignOut }) {
  const displayName =
    researcher?.name ||
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div style={panelShell}>
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(245, 166, 35, 0.08)",
          border: "1px solid rgba(245, 166, 35, 0.18)",
          fontSize: 12,
          color: "#FFD79B",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span>
          Welcome,{" "}
          <strong style={{ color: "#FFE6BC" }}>{displayName}</strong>
        </span>
        <button
          onClick={onSignOut}
          type="button"
          style={{
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
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onPick(p)}
            disabled={!p.active}
            style={platformBtn(p.active)}
          >
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
                  fontFamily: '"Arial Black", "Helvetica Neue", Helvetica, system-ui, sans-serif',
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
          </button>
        ))}
      </div>
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div style={{ ...panelShell, alignItems: "center", justifyContent: "center", minHeight: 180 }}>
      <div style={{ fontSize: 11, color: "rgba(255, 215, 155, 0.55)", letterSpacing: 1, textTransform: "uppercase" }}>
        loading…
      </div>
    </div>
  );
}

/* ── Shared bits ─────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
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

const panelShell = {
  width: "100%",
  maxWidth: 460,
  margin: "0 auto",
  padding: "22px 26px",
  border: "1px solid rgba(245, 166, 35, 0.25)",
  borderRadius: 18,
  background: "rgba(28, 12, 44, 0.65)",
  backdropFilter: "blur(10px)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
  boxSizing: "border-box",
};

const tabRow = {
  display: "flex",
  gap: 0,
  borderRadius: 10,
  background: "rgba(245, 166, 35, 0.06)",
  border: "1px solid rgba(245, 166, 35, 0.18)",
  padding: 3,
};

const tabBtn = (active) => ({
  flex: 1,
  padding: "7px 0",
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

const ctaBtn = (busy) => ({
  marginTop: 4,
  padding: "11px 18px",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.5,
  color: "#1a0d2e",
  background: busy
    ? "rgba(245, 166, 35, 0.45)"
    : "linear-gradient(140deg, #FFD15C 0%, #F5A623 50%, #E5722B 100%)",
  border: "none",
  borderRadius: 10,
  cursor: busy ? "wait" : "pointer",
  boxShadow: busy ? "none" : "0 2px 12px rgba(245, 166, 35, 0.25)",
});

const platformBtn = (active) => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "12px 14px",
  border: active
    ? "1px solid rgba(245, 166, 35, 0.4)"
    : "1px solid rgba(160, 140, 110, 0.18)",
  borderRadius: 12,
  background: active ? "rgba(245, 166, 35, 0.08)" : "rgba(255, 255, 255, 0.02)",
  cursor: active ? "pointer" : "not-allowed",
  transition: "all 0.15s",
  textAlign: "left",
});
