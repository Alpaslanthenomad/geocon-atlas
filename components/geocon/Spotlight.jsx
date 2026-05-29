"use client";
// components/geocon/Spotlight.jsx
//
// Cmd+K / Ctrl+K global search palette. Lives in the GEOCON shell so it's
// available on every /geocon/* route. Backed by the universal_search RPC.
//
// Keyboard:
//   Cmd/Ctrl+K      → toggle open
//   Esc             → close
//   ↑ / ↓           → move selection across the flat result list
//   Enter           → navigate to selection

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const GROUPS = [
  { key: "species",       label: "Species",       icon: "🌿", tint: "#0F6E56" },
  { key: "organizations", label: "Organizations", icon: "🏢", tint: "#185FA5" },
  { key: "researchers",   label: "Researchers",   icon: "👤", tint: "#534AB7" },
  { key: "proposals",     label: "Proposals",     icon: "📬", tint: "#0a4a3e" },
];

export default function Spotlight() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();

  // Global Cmd/Ctrl+K
  useEffect(() => {
    function onKey(e) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus input on open + reset state on close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery("");
      setResults(null);
      setSelectedIdx(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) { setResults(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setBusy(true);
      const { data } = await supabase.rpc("universal_search", {
        p_query: query.trim(),
        p_per_kind: 5,
      });
      if (cancelled) return;
      setResults(data || null);
      setSelectedIdx(0);
      setBusy(false);
    }, 180);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, open]);

  // Flatten results in the order they appear so arrow keys can move across
  // groups seamlessly.
  const flat = useMemo(() => {
    if (!results) return [];
    const out = [];
    for (const g of GROUPS) {
      const arr = Array.isArray(results[g.key]) ? results[g.key] : [];
      for (const item of arr) out.push({ ...item, groupKey: g.key });
    }
    return out;
  }, [results]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function onNav(e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, Math.max(0, flat.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const sel = flat[selectedIdx];
        if (sel?.url) {
          router.push(sel.url);
          setOpen(false);
        }
      }
    }
    document.addEventListener("keydown", onNav);
    return () => document.removeEventListener("keydown", onNav);
  }, [open, flat, selectedIdx, router]);

  const go = useCallback((url) => {
    if (!url) return;
    router.push(url);
    setOpen(false);
  }, [router]);

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 15, 15, 0.55)",
        zIndex: 500,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(680px, 92vw)",
          maxHeight: "70vh",
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #eee" }}>
          <span style={{ fontSize: 16, marginRight: 10 }}>🔎</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search species, organizations, researchers, proposals…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 14,
              background: "transparent",
              color: "#2c2c2a",
            }}
          />
          {busy && <span style={{ fontSize: 10, color: "#888", marginLeft: 8 }}>…</span>}
          <kbd style={{ marginLeft: 10, fontSize: 9, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 4, color: "#888" }}>ESC</kbd>
        </div>

        <div style={{ overflow: "auto", padding: "6px 0" }}>
          {!results && query.trim().length < 2 && (
            <div style={{ padding: 30, textAlign: "center", color: "#888", fontSize: 12 }}>
              Type at least 2 characters to search.
            </div>
          )}
          {results && flat.length === 0 && !busy && (
            <div style={{ padding: 30, textAlign: "center", color: "#888", fontSize: 12 }}>
              No matches for <strong>{query}</strong>.
            </div>
          )}
          {results && flat.length > 0 && GROUPS.map((g) => {
            const arr = results[g.key] || [];
            if (arr.length === 0) return null;
            return (
              <div key={g.key} style={{ padding: "4px 12px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 1, padding: "8px 4px 4px" }}>
                  <span style={{ marginRight: 5 }}>{g.icon}</span>{g.label}
                </div>
                {arr.map((item) => {
                  const flatIndex = flat.findIndex((f) => f.id === item.id && f.groupKey === g.key);
                  const isSel = flatIndex === selectedIdx;
                  return (
                    <button
                      key={`${g.key}|${item.id}`}
                      onClick={() => go(item.url)}
                      onMouseEnter={() => setSelectedIdx(flatIndex)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "8px 10px",
                        border: "none",
                        textAlign: "left",
                        background: isSel ? g.tint + "1a" : "transparent",
                        cursor: "pointer",
                        borderRadius: 8,
                      }}
                    >
                      <span style={{ flexShrink: 0, fontSize: 12, color: g.tint }}>{g.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.label}
                        </div>
                        {item.sub && (
                          <div style={{ fontSize: 10, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.sub}
                          </div>
                        )}
                      </div>
                      {isSel && <kbd style={{ fontSize: 9, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 4, color: "#888" }}>↵</kbd>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "8px 12px", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", fontSize: 9, color: "#aaa" }}>
          <span>
            <kbd style={kbdStyle}>↑↓</kbd> navigate&nbsp;&nbsp;
            <kbd style={kbdStyle}>↵</kbd> open
          </span>
          <span>
            <kbd style={kbdStyle}>⌘K</kbd> toggle
          </span>
        </div>
      </div>
    </div>
  );
}

const kbdStyle = {
  display: "inline-block",
  padding: "1px 5px",
  border: "1px solid #ddd",
  borderRadius: 3,
  fontSize: 9,
  color: "#888",
  background: "#fafafa",
};
