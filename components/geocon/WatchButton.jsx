"use client";
// Watch / unwatch toggle for a species. Drops onto SpeciesDetail.
//
// - Hides for signed-out viewers (no point — can't watch without an
//   account; the sidebar entry is also auth-gated)
// - Loads initial state via is_watching_species, optimistic flip on click

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import { track } from "../../lib/analytics";

export default function WatchButton({ speciesId, compact = false }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [watching, setWatching] = useState(null);  // null = loading
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !speciesId) { setWatching(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.rpc("is_watching_species", { p_species_id: speciesId });
        if (!cancelled) setWatching(!!data);
      } catch {
        if (!cancelled) setWatching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, speciesId]);

  if (!user) return null;

  async function toggle() {
    setBusy(true);
    const next = !watching;
    setWatching(next);  // optimistic
    try {
      if (next) {
        const { error } = await supabase.rpc("watch_species", {
          p_species_id: speciesId, p_note: null,
        });
        if (error) throw error;
        toast.success("Watchlist'e eklendi");
        track("watch_add", { payload: { species_id: speciesId } });
      } else {
        const { error } = await supabase.rpc("unwatch_species", { p_species_id: speciesId });
        if (error) throw error;
        toast.info("Watchlist'ten çıkarıldı");
        track("watch_remove", { payload: { species_id: speciesId } });
      }
    } catch (e) {
      setWatching(!next);  // rollback
      toast.error("İşlem başarısız", { detail: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  }

  const isOn = watching === true;
  const Icon = isOn ? EyeOff : Eye;
  const label = isOn ? "Unwatch" : "Watch";

  return (
    <button
      onClick={toggle}
      disabled={busy || watching === null}
      aria-label={label}
      title={isOn ? "Watchlist'ten çıkar" : "Watchlist'e ekle"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: compact ? "5px 9px" : "7px 12px",
        fontSize: 11,
        fontWeight: 700,
        background: isOn ? "var(--gx-accent-violet)" : "transparent",
        color: isOn ? "#fff" : "var(--gx-ink-soft)",
        border: `1px solid ${isOn ? "var(--gx-accent-violet)" : "var(--gx-border-soft)"}`,
        borderRadius: 7,
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.7 : 1,
        transition: "background 0.15s var(--gx-ease), color 0.15s var(--gx-ease)",
      }}
    >
      <Icon size={13} strokeWidth={1.8} />
      {label}
    </button>
  );
}
