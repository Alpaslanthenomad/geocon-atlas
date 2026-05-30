"use client";
// ShareWidget — small "Share" popover that exposes the public /share URL
// and a one-line iframe embed snippet for an open call. Used in the
// header of /geocon/proposals/[id] when the proposal is publicly listable.

import { useEffect, useRef, useState } from "react";

export default function ShareWidget({ proposalId }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(null);
  const wrapRef = useRef(null);

  // Build URLs lazily on mount so SSR doesn't capture window.location
  const [urls, setUrls] = useState({ share: "", embed: "" });
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://geocon-atlas.vercel.app";
    setUrls({
      share: `${origin}/share/proposal/${proposalId}`,
      embed: `<iframe src="${origin}/embed/proposal/${proposalId}" width="360" height="280" style="border:0;border-radius:12px" loading="lazy" title="GEOCON open call"></iframe>`,
    });
  }, [proposalId]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function copy(label, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "9px 12px",
          fontSize: 12,
          fontWeight: 700,
          background: "#fff",
          color: "#534AB7",
          border: "1px solid #ddd5f5",
          borderRadius: 7,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        🔗 Share
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 38,
            right: 0,
            zIndex: 30,
            width: 320,
            background: "#fff",
            border: "1px solid #ece9e2",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
            padding: 14,
          }}
        >
          <Field
            label="Public link"
            value={urls.share}
            copied={copied === "link"}
            onCopy={() => copy("link", urls.share)}
          />
          <a
            href={urls.share}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              marginTop: 6,
              fontSize: 10,
              color: "#888",
              textDecoration: "none",
              letterSpacing: 0.4,
            }}
          >
            Open preview ↗
          </a>

          <div style={{ height: 1, background: "#ece9e2", margin: "12px 0" }} />

          <Field
            label="Embed (paste into HTML)"
            value={urls.embed}
            copied={copied === "embed"}
            onCopy={() => copy("embed", urls.embed)}
            mono
          />

          <div style={{ marginTop: 10, fontSize: 10, color: "#888", lineHeight: 1.5 }}>
            The public page and embed reveal title, description, type, and
            initiator name. Term sheets stay private.
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, copied, onCopy, mono }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#888", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "6px 8px",
            fontSize: 11,
            fontFamily: mono ? "monospace" : "inherit",
            border: "1px solid #e8e6e1",
            borderRadius: 6,
            background: "#fafaf7",
            color: "#2c2c2a",
          }}
        />
        <button
          onClick={onCopy}
          style={{
            padding: "0 10px",
            fontSize: 11,
            fontWeight: 700,
            background: copied ? "#E1F5EE" : "#fff",
            color: copied ? "#0F6E56" : "#534AB7",
            border: "1px solid",
            borderColor: copied ? "#bce3d3" : "#ddd5f5",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {copied ? "✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}
