"use client";
import { useState } from "react";
import { signUpWithEmail, signInWithPassword, signInWithMagicLink } from "../../lib/auth";

/* ── Auth Modal ──
   3 tab: Login (password) · Signup · Magic Link
   Signup sonrası approval_status='pending' (admin onayı bekliyor)
*/
export default function AuthModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (tab === "login") {
        const { error } = await signInWithPassword(email.trim(), password);
        if (error) setMsg({ ok: false, text: error.message });
        else {
          setMsg({ ok: true, text: "Logged in." });
          setTimeout(() => { onSuccess && onSuccess(); onClose && onClose(); }, 600);
        }
      } else if (tab === "signup") {
        if (password.length < 6) {
          setMsg({ ok: false, text: "Password must be at least 6 characters." });
          setBusy(false);
          return;
        }
        const { data, error } = await signUpWithEmail(email.trim(), password, fullName.trim());
        if (error) setMsg({ ok: false, text: error.message });
        else if (data.user && !data.session) {
          setMsg({ ok: true, text: "Check your email to confirm your account, then return here to log in." });
        } else if (data.session) {
          setMsg({ ok: true, text: "Account created. Awaiting admin approval." });
          setTimeout(() => { onSuccess && onSuccess(); onClose && onClose(); }, 1500);
        }
      } else if (tab === "magic") {
        const { error } = await signInWithMagicLink(email.trim());
        if (error) setMsg({ ok: false, text: error.message });
        else setMsg({ ok: true, text: "Check your email for a sign-in link." });
      }
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setBusy(false);
  };

  const inp = { padding: "8px 10px", border: "1px solid #e8e6e1", borderRadius: 6, fontSize: 13, background: "#fff", outline: "none", color: "#2c2c2a", width: "100%" };
  const lbl = { fontSize: 10, color: "#888", marginBottom: 3, display: "block", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 380, maxWidth: "92vw", background: "#fff", borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.18)", zIndex: 201, overflow: "hidden",
      }}>
        <div style={{ background: "linear-gradient(135deg, #0a4a3e 0%, #1a8a68 100%)", padding: "18px 22px", color: "#fff" }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "Georgia, serif" }}>GEOCON</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
            {tab === "signup" ? "Create your researcher account" : tab === "magic" ? "Sign in with magic link" : "Welcome back"}
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #e8e6e1" }}>
          {[{ k: "login", l: "Log in" }, { k: "signup", l: "Sign up" }, { k: "magic", l: "Magic link" }].map(t => (
            <button
              key={t.k}
              onClick={() => { setTab(t.k); setMsg(null); }}
              style={{
                flex: 1, padding: "10px 8px", border: "none", background: "none",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                color: tab === t.k ? "#0a4a3e" : "#888",
                borderBottom: tab === t.k ? "2px solid #1a8a68" : "2px solid transparent",
                marginBottom: -1,
              }}
            >{t.l}</button>
          ))}
        </div>

        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          {tab === "signup" && (
            <div>
              <label style={lbl}>Full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dr. Ada Lovelace" style={inp} />
            </div>
          )}
          <div>
            <label style={lbl}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inp} autoComplete="email" />
          </div>
          {(tab === "login" || tab === "signup") && (
            <div>
              <label style={lbl}>Password {tab === "signup" && <span style={{ color: "#999" }}>(min 6)</span>}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inp}
                autoComplete={tab === "signup" ? "new-password" : "current-password"}
                onKeyDown={e => e.key === "Enter" && submit()}
              />
            </div>
          )}

          {tab === "signup" && (
            <div style={{ fontSize: 10, color: "#888", padding: "6px 8px", background: "#f4f3ef", borderRadius: 6, lineHeight: 1.5 }}>
              ℹ Your account will be reviewed by an administrator before you can publish content. Read access is immediate.
            </div>
          )}
          {tab === "magic" && (
            <div style={{ fontSize: 10, color: "#888", padding: "6px 8px", background: "#f4f3ef", borderRadius: 6, lineHeight: 1.5 }}>
              ℹ A sign-in link will be emailed to you. No password needed.
            </div>
          )}

          {msg && (
            <div style={{
              padding: "8px 10px", borderRadius: 6, fontSize: 11,
              background: msg.ok ? "#E1F5EE" : "#FCEBEB",
              color: msg.ok ? "#085041" : "#A32D2D",
            }}>{msg.text}</div>
          )}

          <button
            onClick={submit}
            disabled={busy || !email || (tab !== "magic" && !password)}
            style={{
              padding: "10px 14px", borderRadius: 7, border: "none",
              background: (busy || !email || (tab !== "magic" && !password)) ? "#ccc" : "#0a4a3e",
              color: "#fff",
              fontSize: 13, fontWeight: 600,
              cursor: (busy || !email || (tab !== "magic" && !password)) ? "default" : "pointer",
              marginTop: 4,
            }}
          >
            {busy ? "..." : tab === "login" ? "Log in" : tab === "signup" ? "Create account" : "Send magic link"}
          </button>

          <button
            onClick={onClose}
            style={{ padding: "8px", border: "none", background: "none", color: "#888", fontSize: 11, cursor: "pointer", marginTop: -4 }}
          >Cancel</button>
        </div>
      </div>
    </>
  );
}
