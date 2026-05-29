"use client";
// components/geocon/ActorPicker.jsx
//
// Typeahead actor picker backed by the search_actors RPC.
// Value shape: { actor_kind, actor_id, actor_name, country, affiliation_label, verified }

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

const KIND_LABEL = { researcher: "Researcher", organization: "Organization" };

export default function ActorPicker({ value, onChange, placeholder = "Search actors…", kind = null }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setBusy(true);
      const { data } = await supabase.rpc("search_actors", {
        p_query: query || "",
        p_limit: 12,
        p_kind: kind || null,
      });
      if (cancelled) return;
      setResults(Array.isArray(data) ? data : []);
      setBusy(false);
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, open, kind]);

  if (value) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, border: "1px solid #e8e6e1", borderRadius: 7, background: "#fafaf7" }}>
        <div style={{ width: 30, height: 30, borderRadius: 6, background: value.actor_kind === "organization" ? "#185FA522" : "#534AB722", color: value.actor_kind === "organization" ? "#185FA5" : "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
          {value.actor_kind === "organization" ? "🏢" : "👤"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {value.actor_name}
          </div>
          <div style={{ fontSize: 10, color: "#888" }}>
            {KIND_LABEL[value.actor_kind]}{value.actor_subkind && ` · ${value.actor_subkind}`}{value.country && ` · ${value.country}`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{ fontSize: 11, color: "#A32D2D", background: "none", border: "1px solid #fcc", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, background: "#fff" }}
      />
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #ece9e2", borderRadius: 8, boxShadow: "0 8px 20px rgba(0,0,0,0.08)", maxHeight: 320, overflow: "auto", zIndex: 20 }}>
          {busy && <div style={{ padding: 10, fontSize: 11, color: "#888", textAlign: "center" }}>Searching…</div>}
          {!busy && results.length === 0 && (
            <div style={{ padding: 14, fontSize: 11, color: "#888", textAlign: "center" }}>
              {query ? "No matches." : "Type to search researchers and organizations."}
            </div>
          )}
          {!busy && results.map((r) => (
            <button
              key={`${r.actor_kind}|${r.actor_id}`}
              type="button"
              onClick={() => { onChange(r); setOpen(false); setQuery(""); }}
              style={{ display: "flex", gap: 10, width: "100%", padding: "8px 12px", background: "none", border: "none", borderBottom: "1px solid #f5f3ec", textAlign: "left", cursor: "pointer" }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 6, background: r.actor_kind === "organization" ? "#185FA522" : "#534AB722", color: r.actor_kind === "organization" ? "#185FA5" : "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {r.actor_kind === "organization" ? "🏢" : "👤"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.actor_name}
                </div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {KIND_LABEL[r.actor_kind]}
                  {r.actor_subkind && ` · ${r.actor_subkind}`}
                  {r.country && ` · ${r.country}`}
                  {r.affiliation_label && ` · ${r.affiliation_label.slice(0, 40)}`}
                </div>
              </div>
              {r.verified === "verified" && <span style={{ fontSize: 11, color: "#0F6E56" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
