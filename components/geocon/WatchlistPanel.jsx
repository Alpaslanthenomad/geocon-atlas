"use client";
// WatchlistPanel — everything you've ★-saved (species, orgs, researchers,
// proposals, families, countries), grouped by kind, with one-click unwatch.
// Extracted from ProfileRoute so it can live in the bench (the workspace hub).

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const KIND_META = {
  species:      { icon: "🌿", label: "Species",      tint: "#0F6E56" },
  organization: { icon: "🏢", label: "Organization", tint: "#185FA5" },
  researcher:   { icon: "👤", label: "Researcher",   tint: "#534AB7" },
  proposal:     { icon: "📬", label: "Proposal",     tint: "#0a4a3e" },
  family:       { icon: "🌳", label: "Family",       tint: "#85651A" },
  country:      { icon: "🗺",  label: "Country",      tint: "#BA7517" },
};
const card = { background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 14, padding: "14px 16px", marginBottom: 18 };

export default function WatchlistPanel() {
  const { user } = useAuthContext();
  const [watchlist, setWatchlist] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("get_my_watchlist", { p_kind: null, p_limit: 200 })
      .then(({ data }) => setWatchlist(Array.isArray(data) ? data : []))
      .catch(() => setWatchlist([]));
  }, [user]);

  if (!user || watchlist === null) return null;

  async function unwatch(item) {
    await supabase.rpc("toggle_watch", { p_kind: item.kind, p_entity_id: item.entity_id, p_label: item.label, p_url: item.url });
    setWatchlist((wl) => wl.filter((w) => !(w.kind === item.kind && w.entity_id === item.entity_id)));
  }

  const byKind = {};
  for (const w of watchlist) (byKind[w.kind] ??= []).push(w);

  return (
    <section style={card}>
      <div className="gx-overline" style={{ marginBottom: 8 }}>Watching ({watchlist.length})</div>
      {watchlist.length === 0 ? (
        <div style={{ padding: 16, border: "1px dashed var(--gx-border-soft)", borderRadius: 8, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12, background: "var(--gx-surface-2)" }}>
          Nothing watched yet. Use the ★ on a species, organization or proposal to keep it here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Object.entries(KIND_META).map(([kind, meta]) => {
            const arr = byKind[kind] || [];
            if (arr.length === 0) return null;
            return (
              <div key={kind}>
                <div style={{ fontSize: 10, fontWeight: 700, color: meta.tint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                  {meta.icon} {meta.label} ({arr.length})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>
                  {arr.map((w) => (
                    <div key={`${w.kind}|${w.entity_id}`} style={{ display: "flex", gap: 6, padding: "8px 10px", background: "var(--gx-surface-2)", border: "1px solid var(--gx-card-border)", borderRadius: 8 }}>
                      <Link href={w.url || "#"} style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {w.label || String(w.entity_id).slice(0, 12)}
                        </div>
                      </Link>
                      <button onClick={() => unwatch(w)} title="Stop watching"
                        style={{ background: "none", border: "none", color: "#A32D2D", cursor: "pointer", fontSize: 14, padding: 0 }}>★</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
