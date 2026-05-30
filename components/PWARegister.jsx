"use client";
// Client-only side-effect: register the service worker and offer an
// install prompt the user can dismiss / accept.

import { useEffect, useState } from "react";

export default function PWARegister() {
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      // Ignore registration errors silently — sw is best-effort.
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvent || installed) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 14,
        bottom: 14,
        zIndex: 200,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--gx-surface, #fff)",
        border: "1px solid var(--gx-border, #ece9e2)",
        borderRadius: 12,
        boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
        maxWidth: 280,
      }}
    >
      <div style={{ fontSize: 12, color: "var(--gx-ink, #2c2c2a)" }}>
        Install GEOCON as an app on this device?
      </div>
      <button
        onClick={async () => {
          installEvent.prompt?.();
          try {
            await installEvent.userChoice;
          } catch {}
          setInstallEvent(null);
        }}
        style={{
          padding: "5px 11px",
          fontSize: 11,
          fontWeight: 700,
          background: "var(--gx-accent-bio-green, #0F6E56)",
          color: "#fff",
          border: "none",
          borderRadius: 7,
          cursor: "pointer",
        }}
      >
        Install
      </button>
      <button
        onClick={() => setInstallEvent(null)}
        aria-label="Dismiss"
        style={{
          padding: 0,
          width: 22,
          height: 22,
          fontSize: 13,
          color: "var(--gx-ink-muted, #888)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        ✕
      </button>
    </div>
  );
}
