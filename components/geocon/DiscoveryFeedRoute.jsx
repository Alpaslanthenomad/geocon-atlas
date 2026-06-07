"use client";
// D2 — /geocon/feed — Discovery feed UI.
//
// Public chronological list of the last 30 days of platform-wide signal:
//   • IUCN status changes (logged via species_field_provenance)
//   • Peer-endorsed+ commercialized outcomes
//   • High-citation publications (>=50 cites, year >= 2024)
//   • Programs entering Develop/Steward modules
//   • IUCN assessments hitting published state
//
// One source of truth — server-side view v_discovery_feed (RPC
// get_discovery_feed). Anonymous-readable; no writes. RSS/Atom
// subscribe endpoints live at /api/v1/feed.rss + /api/v1/feed.atom.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Briefcase,
  Rss,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { EmptyState } from "../shared";
import WhatsNewTabs from "./WhatsNewTabs";
import FilterBar from "../shared/FilterBar";
import { useToast } from "../ui";

const KIND_META = {
  iucn_status_change: {
    label: "IUCN status",
    short: "IUCN",
    Icon: ShieldAlert,
    tint: "var(--gx-iucn-en, #B14B3B)",
  },
  outcome_endorsed: {
    label: "Outcome",
    short: "Outcome",
    Icon: Award,
    tint: "var(--gx-accent-violet, #6B5BD7)",
  },
  publication_high_citation: {
    label: "Publication",
    short: "Pub",
    Icon: BookOpen,
    tint: "var(--gx-accent-azure, #185FA5)",
  },
  program_active: {
    label: "Program",
    short: "Program",
    Icon: Briefcase,
    tint: "var(--gx-success, #1D9E75)",
  },
  iucn_published: {
    label: "IUCN published",
    short: "Pub-IUCN",
    Icon: ShieldCheck,
    tint: "var(--gx-info, #185FA5)",
  },
};

const KIND_OPTIONS = Object.entries(KIND_META).map(([key, m]) => ({
  key,
  label: m.label,
  tint: m.tint,
}));

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function DiscoveryFeedRoute() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState(null); // null = all

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("get_discovery_feed", { p_limit: 100 });
      if (cancelled) return;
      if (error) {
        toast.error("Feed yüklenemedi", { detail: error.message });
        setRows([]);
      } else {
        setRows(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!kind) return rows;
    return rows.filter((r) => r.kind === kind);
  }, [rows, kind]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <WhatsNewTabs active="discoveries" />
      <header style={{ marginBottom: 18 }}>
        <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          Discovery feed
          <span style={{
            fontSize: 13, color: "var(--gx-ink-muted)", fontWeight: 400,
            fontFamily: "var(--gx-font-mono)",
          }}>
            {loading ? "…" : `${filtered.length}/${rows.length}`}
          </span>
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 680 }}>
          Son 30 günün toplu sinyali: IUCN statü değişiklikleri, peer-endorsed+
          outcome'lar, yüksek atıflı yayınlar, Develop/Steward modülüne giren
          programlar. Düzenli abonelik için RSS / Atom feed'i kullanabilirsin.
        </p>

        <div style={{
          marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10,
          alignItems: "center", justifyContent: "space-between",
        }}>
          <FilterBar
            allLabel="All kinds"
            value={kind}
            onChange={setKind}
            options={KIND_OPTIONS}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href="/api/v1/feed.rss"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 7,
                background: "var(--gx-accent-amber, #C97A2B)",
                color: "#fff",
                fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
                textDecoration: "none",
                border: "1px solid transparent",
              }}
            >
              <Rss size={12} strokeWidth={2.2} /> RSS
            </a>
            <a
              href="/api/v1/feed.atom"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 7,
                background: "transparent",
                color: "var(--gx-ink-soft)",
                fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
                textDecoration: "none",
                border: "1px solid var(--gx-border-soft)",
              }}
            >
              Atom
            </a>
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="○"
          title={kind ? "Bu kategoride son 30 günde aktivite yok" : "Son 30 günde aktivite yok"}
          hint="Yeni IUCN değişiklikleri, endorsed outcome'lar, yayınlar ve programlar buraya akacak."
        />
      ) : (
        <ol style={{
          listStyle: "none", padding: 0, margin: 0,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {filtered.map((r, i) => (
            <FeedRow key={`${r.kind}:${r.url}:${r.ts}:${i}`} row={r} />
          ))}
        </ol>
      )}
    </div>
  );
}

function FeedRow({ row }) {
  const meta = KIND_META[row.kind] || {
    label: row.kind, short: row.kind, Icon: BookOpen, tint: "var(--gx-ink-muted)",
  };
  const Icon = meta.Icon;
  const isInternal = typeof row.url === "string" && row.url.startsWith("/");

  const titleNode = (
    <span style={{
      fontFamily: "var(--gx-font-display)",
      fontSize: 14, fontWeight: 700, color: "var(--gx-ink)",
      lineHeight: 1.35,
    }}>
      {row.title}
    </span>
  );

  return (
    <li style={{
      padding: "var(--gx-card-pad-sm)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <div style={{
        flexShrink: 0,
        width: 32, height: 32, borderRadius: 8,
        background: `color-mix(in srgb, ${meta.tint} 14%, transparent)`,
        color: meta.tint,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={16} strokeWidth={1.9} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
            padding: "2px 7px", borderRadius: 999,
            background: `color-mix(in srgb, ${meta.tint} 14%, transparent)`,
            color: meta.tint,
            fontFamily: "var(--gx-font-mono)",
          }}>
            {meta.label}
          </span>
          <span style={{ fontSize: 10, color: "var(--gx-ink-faint)", fontFamily: "var(--gx-font-mono)" }}>
            {timeAgo(row.ts)}
          </span>
        </div>
        {row.url ? (
          isInternal ? (
            <Link href={row.url} style={{ textDecoration: "none" }}>
              {titleNode}
            </Link>
          ) : (
            <a href={row.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              {titleNode}
            </a>
          )
        ) : titleNode}
        {row.summary && (
          <p style={{
            margin: "4px 0 0",
            fontSize: 12, color: "var(--gx-ink-soft)",
            lineHeight: 1.5,
            overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {row.summary}
          </p>
        )}
      </div>
    </li>
  );
}
