"use client";
// Push subscribe button — only renders when the browser supports it
// and a VAPID public key is configured via NEXT_PUBLIC_VAPID_PUBLIC_KEY.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

export default function PushSubscribeButton() {
  const { user } = useAuthContext();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);

    if (ok) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const existing = await reg.pushManager.getSubscription();
        setSubscribed(!!existing);
      }).catch(() => {});
    }
  }, []);

  if (!user || !supported || !vapidKey) return null;

  async function enable() {
    setBusy(true); setErr(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setErr("Permission denied.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON();
      const { error } = await supabase.rpc("save_push_subscription", {
        p_endpoint: json.endpoint,
        p_keys: json.keys,
        p_user_agent: navigator.userAgent || null,
      });
      if (error) throw error;
      setSubscribed(true);
    } catch (e) {
      setErr(e?.message || "Could not subscribe");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      padding: 14, background: "var(--gx-surface)",
      border: "1px solid var(--gx-border)", borderRadius: 12,
      marginTop: 14,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gx-ink)" }}>
        🔔 Push notifications
      </div>
      <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5 }}>
        {subscribed
          ? "Enabled on this device — you'll get alerts even when GEOCON isn't open."
          : "Get alerts for open calls + watched species, even when the tab is closed."}
      </div>
      {!subscribed && (
        <button
          onClick={enable}
          disabled={busy || permission === "denied"}
          style={{
            marginTop: 10,
            padding: "7px 12px", fontSize: 11, fontWeight: 700,
            background: "var(--gx-accent-violet)", color: "#fff",
            border: "none", borderRadius: 7, cursor: "pointer",
            opacity: (busy || permission === "denied") ? 0.55 : 1,
          }}
        >
          {permission === "denied" ? "Blocked in browser settings" : busy ? "Subscribing…" : "Enable push"}
        </button>
      )}
      {err && <div style={{ marginTop: 6, fontSize: 10, color: "var(--gx-accent-rose)" }}>{err}</div>}
    </div>
  );
}

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
