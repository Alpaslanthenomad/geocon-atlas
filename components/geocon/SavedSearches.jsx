"use client";
// SavedSearches — small chip strip + "Save current" button shown on the
// Atlas top bar. Persists to user-scoped saved_searches table. Silent for
// signed-out users (no chips, no button).

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

export default function SavedSearches({ surface, filters, sort, onApply }) {
  const { user } = useAuthContext();
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setRows([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("list_my_saved_searches", { p_surface: surface });
      if (!cancelled) setRows(Array.isArray(data) ? data : []);
    })();
    return () => { cancelled = true; };
  }, [user, surface]);

  if (!user) return null;

  async function handleSave() {
    if (saving) return;
    const defaultName = suggestName(filters);
    const name = window.prompt("Name this search:", defaultName);
    if (!name || !name.trim()) return;
    setSaving(true);
    try {
      const { data: newId, error } = await supabase.rpc("save_my_search", {
        p_surface: surface,
        p_name: name.trim(),
        p_query_json: { filters, sort },
      });
      if (error) throw error;
      // optimistic prepend
      setRows((r) => [
        { id: newId, surface, name: name.trim(), query_json: { filters, sort }, created_at: new Date().toISOString() },
        ...r,
      ]);
    } catch (e) {
      console.warn("[saved-searches] save failed:", e?.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setRows((r) => r.filter((x) => x.id !== id));
    await supabase.rpc("delete_my_saved_search", { p_id: id });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gx-ink-muted)", letterSpacing: 0.5, textTransform: "uppercase" }}>
        Saved
      </span>
      {rows.length === 0 && (
        <span style={{ fontSize: 11, color: "#a8a59c", fontStyle: "italic" }}>
          (none yet)
        </span>
      )}
      {rows.map((s) => (
        <span
          key={s.id}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 4px 3px 9px",
            background: "var(--gx-card-bg)",
            border: "1px solid var(--gx-card-border)",
            borderRadius: 999,
            fontSize: 11,
            color: "var(--gx-ink)",
          }}
        >
          <button
            onClick={() => onApply?.(s.query_json)}
            title={`Saved ${new Date(s.created_at).toLocaleDateString()}`}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              padding: 0,
            }}
          >
            {s.name}
          </button>
          <button
            onClick={() => handleDelete(s.id)}
            aria-label={`Remove ${s.name}`}
            style={{
              background: "transparent",
              border: "none",
              color: "#a8a59c",
              cursor: "pointer",
              fontSize: 11,
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </span>
      ))}
      <button
        onClick={handleSave}
        disabled={saving || isEmpty(filters)}
        style={{
          padding: "3px 9px",
          background: "transparent",
          border: "1px dashed #c2b58a",
          color: "#85651A",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          cursor: isEmpty(filters) ? "not-allowed" : "pointer",
          opacity: isEmpty(filters) ? 0.4 : 1,
        }}
      >
        {saving ? "Saving…" : "+ Save current"}
      </button>
    </div>
  );
}

function isEmpty(f) {
  if (!f) return true;
  if (f.search) return false;
  if (Array.isArray(f.families) && f.families.length > 0) return false;
  if (Array.isArray(f.iucnTiers) && f.iucnTiers.length > 0) return false;
  if (f.country) return false;
  if (f.endemicOnly || f.withImageOnly || f.hasOpenCalls) return false;
  return true;
}

function suggestName(f) {
  const parts = [];
  if (f?.iucnTiers?.length) parts.push(f.iucnTiers.join("+"));
  if (f?.families?.length === 1) parts.push(f.families[0]);
  if (f?.families?.length > 1) parts.push(`${f.families.length} families`);
  if (f?.country) parts.push(f.country);
  if (f?.endemicOnly) parts.push("endemic");
  if (f?.withImageOnly) parts.push("photo");
  if (f?.hasOpenCalls) parts.push("calls");
  if (f?.search) parts.push(`"${f.search}"`);
  return parts.join(" · ") || "My search";
}
