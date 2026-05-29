"use client";
// components/geocon/TrendingPanel.jsx
//
// "What's hot" widgets for the home page. Three compact leaderboards in
// one card row: most-watched species, top active accredited orgs, busiest
// proposals (by comment count). Public RPC — no auth needed.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const COLS = [
  { key: "most_watched_species", title: "★ Most-watched species",   icon: "🌿", tint: "#0F6E56" },
  { key: "top_active_orgs",      title: "🏢 Top active orgs",       icon: "🏢", tint: "#185FA5" },
  { key: "busiest_proposals",    title: "💬 Busiest proposals",     icon: "📬", tint: "#534AB7" },
];

export default function TrendingPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_trending", { p_limit: 5 });
      if (cancelled) return;
      if (!error) setData(data || null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Skeleton />;

  const allEmpty = COLS.every((c) => !(data?.[c.key]?.length));
  if (allEmpty) return null;

  return (
    <section style={{ marginBottom: 26 }}>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#2c2c2a", margin: "0 0 12px" }}>
        Trending on GEOCON
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {COLS.map((col) => {
          const arr = data?.[col.key] || [];
          if (arr.length === 0) return null;
          return (
            <div key={col.key} style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: col.tint, marginBottom: 8 }}>
                {col.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {arr.map((row, i) => (
                  <Link key={row.id} href={row.url || "#"}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", borderRadius: 6, textDecoration: "none", color: "inherit" }}>
                    <span style={{ fontSize: 11, color: "#888", width: 14 }}>{i + 1}.</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.label}
                      </div>
                      {row.sub && (
                        <div style={{ fontSize: 9, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.sub}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: col.tint }}>{row.cnt}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Skeleton() {
  return (
    <section style={{ marginBottom: 26 }}>
      <div style={{ height: 28, background: "#f4f3ef", borderRadius: 6, width: 200, marginBottom: 12 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {[1, 2, 3].map((i) => <div key={i} style={{ height: 180, background: "#f4f3ef", borderRadius: 10 }} />)}
      </div>
    </section>
  );
}
