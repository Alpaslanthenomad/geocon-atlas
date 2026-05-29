"use client";
// components/geocon/ActivityRoute.jsx
//
// /geocon/activity — public "what's happening on the platform" timeline.
// Pulls from get_platform_activity; refreshes via Realtime subscriptions on
// the underlying tables so visitors see new orgs, proposals, accreditations
// and programs land in real time.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const KIND_META = {
  org_registered: {
    icon: "🏢",
    tint: "#185FA5",
    verb: "registered as a new organization",
  },
  org_accredited: {
    icon: "✓",
    tint: "#0F6E56",
    verb: "was Venn-accredited",
  },
  proposal_sent: {
    icon: "📬",
    tint: "#185FA5",
    verb: "sent a proposal",
  },
  proposal_accepted: {
    icon: "🤝",
    tint: "#0F6E56",
    verb: "accepted a proposal",
  },
  program_created: {
    icon: "🌱",
    tint: "#1D9E75",
    verb: "started a program",
  },
};

const FILTERS = [
  { key: "all",               label: "Everything" },
  { key: "org_registered",    label: "🏢 New orgs" },
  { key: "org_accredited",    label: "✓ Accreditations" },
  { key: "proposal_sent",     label: "📬 Proposals" },
  { key: "proposal_accepted", label: "🤝 Accepts" },
  { key: "program_created",   label: "🌱 Programs" },
];

export default function ActivityRoute() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kind, setKind] = useState("all");

  const refetch = useCallback(async () => {
    const { data, error: e } = await supabase.rpc("get_platform_activity", { p_limit: 80 });
    if (e) { setError(e.message); return; }
    setRows(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      await refetch();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [refetch]);

  // Realtime — any change on any of the source tables debounces a refetch.
  // collaboration_proposals + org_accreditation_events are already in the
  // realtime publication; organizations and programs are not (yet), so we
  // listen to those via the same channel and poll if needed. For now we
  // subscribe to the published ones and accept that org_registered events
  // may take a 60 s polling interval to surface.
  useEffect(() => {
    let tail = null;
    const schedule = () => { if (tail) clearTimeout(tail); tail = setTimeout(refetch, 500); };
    const channel = supabase
      .channel("activity_feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "collaboration_proposals" }, schedule)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "org_accreditation_events" }, schedule)
      .subscribe();

    // Cheap polling fallback for tables not in the publication.
    const poll = setInterval(refetch, 60_000);
    return () => {
      if (tail) clearTimeout(tail);
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const filtered = kind === "all" ? rows : rows.filter((r) => r.kind === kind);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>Activity</h1>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
          The platform-wide pulse — orgs, accreditations, proposals, programs as they happen.
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setKind(f.key)}
            style={{
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 600,
              background: kind === f.key ? "#0a4a3e" : "#fff",
              color: kind === f.key ? "#fff" : "#666",
              border: "1px solid",
              borderColor: kind === f.key ? "#0a4a3e" : "#e8e6e1",
              borderRadius: 7,
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: 10, background: "#fdecec", border: "1px solid #fcc", borderRadius: 6, fontSize: 11, color: "#A32D2D", marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((r, i) => <Row key={`${r.kind}|${r.subject_id}|${r.at}|${i}`} row={r} />)}
        </div>
      )}
    </div>
  );
}

function Row({ row }) {
  const meta = KIND_META[row.kind] || { icon: "•", tint: "#888780", verb: row.kind };
  return (
    <Link
      href={row.url || "#"}
      style={{
        display: "flex",
        gap: 12,
        background: "#fff",
        border: "1px solid #ece9e2",
        borderRadius: 10,
        padding: "12px 14px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{
        flexShrink: 0,
        width: 32, height: 32, borderRadius: 8,
        background: meta.tint + "22", color: meta.tint,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700,
      }}>
        {meta.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "#444", lineHeight: 1.45 }}>
          {row.actor_label && <strong style={{ color: "#2c2c2a" }}>{row.actor_label}</strong>}
          {row.actor_label && " "}{meta.verb}
          {!row.actor_label && row.subject_label && (
            <> <strong style={{ color: "#2c2c2a" }}>{row.subject_label}</strong></>
          )}
        </div>
        {row.actor_label && row.subject_label && (
          <div style={{ marginTop: 2, fontSize: 13, fontWeight: 700, color: "#0a4a3e" }}>
            {row.subject_label}
          </div>
        )}
        {row.subject_sub && (
          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
            {row.subject_sub}
          </div>
        )}
      </div>
      <div style={{ fontSize: 10, color: "#aaa", flexShrink: 0, alignSelf: "flex-start" }}>
        {formatAgo(row.at)}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: 60, textAlign: "center", color: "#888", fontSize: 12, border: "1px dashed #ece9e2", borderRadius: 12, background: "#fafaf7" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
      <div>No activity yet — be the first to register an organization or send a proposal.</div>
    </div>
  );
}

function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 2, 3, 4].map((i) => <div key={i} style={{ height: 56, background: "#f4f3ef", borderRadius: 10 }} />)}
    </div>
  );
}

function formatAgo(at) {
  if (!at) return "";
  const d = new Date(at);
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}
