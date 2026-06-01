"use client";
// components/geocon/WatchToggle.jsx
//
// Reusable star button that adds/removes the current entity from the
// signed-in user's watch list. Decoupled from any surface: pass kind +
// entity_id + label + url and the button manages its own state.
//
// Signed-out viewers see nothing (auth-gated at render).

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

export default function WatchToggle({ kind, entityId, label, url, size = "md" }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [watching, setWatching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !kind || !entityId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_watchlist")
        .select("entity_id")
        .eq("user_id", user.id)
        .eq("kind", kind)
        .eq("entity_id", String(entityId))
        .maybeSingle();
      if (cancelled) return;
      setWatching(!!data && !error);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, kind, entityId]);

  if (!user) return null;
  if (loading) return null;

  async function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const optimistic = !watching;
    setWatching(optimistic);
    const { data, error } = await supabase.rpc("toggle_watch", {
      p_kind: kind,
      p_entity_id: String(entityId),
      p_label: label || null,
      p_url:   url || null,
    });
    setBusy(false);
    if (error) {
      setWatching(!optimistic);
      console.warn("[watch] toggle error:", error.message);
      toast.error("Watch toggle başarısız", { detail: error.message });
      return;
    }
    if (typeof data === "boolean") setWatching(data);
  }

  const isLarge = size === "lg";
  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={watching ? "Stop watching" : "Watch"}
      style={{
        background: watching ? "#FCE89B" : "transparent",
        color: watching ? "#85651A" : "#888",
        border: `1px solid ${watching ? "#E6C24A" : "#e8e6e1"}`,
        borderRadius: 7,
        padding: isLarge ? "7px 12px" : "5px 10px",
        cursor: busy ? "wait" : "pointer",
        fontSize: isLarge ? 13 : 11,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: isLarge ? 14 : 12 }}>{watching ? "★" : "☆"}</span>
      {watching ? "Watching" : "Watch"}
    </button>
  );
}
