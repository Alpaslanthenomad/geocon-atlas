"use client";
// v4.4-b — Save search button for the cross-entity search page.
//
// Sits next to the search input. One-click "Save" stores the current
// query string + optional kind filter in saved_searches. Signed-out
// users see a disabled affordance.

import { useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

export default function SaveSearchButton({ query, kinds = null }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;
  if (!query || !query.trim()) return null;

  async function save() {
    setSaving(true);
    try {
      const label = query.trim().slice(0, 60);
      const { error } = await supabase.rpc("save_search", {
        p_name: label,
        p_query: query.trim(),
        p_kinds: kinds,
      });
      if (error) throw error;
      setSaved(true);
      toast.success("Aramayı kaydettim", { detail: "Yeni eşleşmeler için haftalık özet alacaksın." });
    } catch (e) {
      toast.error("Kaydedilemedi", { detail: e?.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <button onClick={save} disabled={saving || saved}
      title={saved ? "Saved" : "Save this search · weekly digest of new matches"}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "6px 11px",
        background: saved ? "var(--gx-success-soft)" : "transparent",
        color: saved ? "var(--gx-success)" : "var(--gx-ink-soft)",
        fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
        border: `1px solid ${saved ? "color-mix(in srgb, var(--gx-success) 30%, transparent)" : "var(--gx-border-soft)"}`,
        borderRadius: 7,
        cursor: saved ? "default" : "pointer",
        opacity: saving ? 0.6 : 1,
      }}>
      {saving ? <Loader2 size={11} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} />
       : saved ? <BookmarkCheck size={11} strokeWidth={2.2} />
       : <Bookmark size={11} strokeWidth={2.2} />}
      {saved ? "Saved" : "Save search"}
    </button>
  );
}
