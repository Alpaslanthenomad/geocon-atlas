"use client";
// TrendingThreads — chip strip pulling top discussion threads from the
// last 7 days. Self-hides when there's no signal yet.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const KIND_HREF = {
  species:      (k) => `/geocon/species/${k}`,
  family:       (k) => `/geocon/families/${encodeURIComponent(k)}`,
  country:      (k) => `/geocon/countries/${k}`,
  organization: (k) => `/geocon/organizations/${k}`,
  researcher:   (k) => `/geocon/researchers/${k}`,
  metabolite:   (k) => `/geocon/metabolites/${k}`,
  genus:        (k) => `/geocon/species?q=${encodeURIComponent(k)}`,
};

const KIND_ICON = {
  species: "🌿", family: "🪴", country: "🗺", organization: "🏢", researcher: "👤", metabolite: "🧪", genus: "🌱",
};

export default function TrendingThreads() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_trending_threads", { p_days: 7, p_limit: 8 });
      if (!cancelled) setRows(Array.isArray(data) ? data : []);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!rows || rows.length === 0) return null;

  return (
    <section style={{
      marginBottom: 18,
      padding: "10px 14px",
      background: "var(--gx-surface)",
      border: "1px solid var(--gx-border)",
      borderRadius: "var(--gx-radius-4)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
        textTransform: "uppercase", color: "var(--gx-ink-muted)",
        flexShrink: 0,
      }}>
        🔥 Trending discussions
      </span>
      {rows.map((r) => {
        const href = KIND_HREF[r.kind]?.(r.key);
        if (!href) return null;
        return (
          <Link key={r.kind + r.key} href={href} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            background: "var(--gx-surface-2)",
            border: "1px solid var(--gx-border-soft)",
            borderRadius: 999,
            fontSize: 11,
            color: "var(--gx-ink)",
            textDecoration: "none",
            fontWeight: 600,
          }}>
            <span>{KIND_ICON[r.kind] || "•"}</span>
            <span>{r.key}</span>
            <span style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginLeft: 2 }}>
              · {r.msg_count}
            </span>
          </Link>
        );
      })}
    </section>
  );
}
