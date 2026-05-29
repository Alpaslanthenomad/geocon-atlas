"use client";
// components/geocon/ActivityRoute.jsx
//
// /geocon/activity — public "what's happening on the platform" timeline.
// Pulls from get_platform_activity; refreshes via Realtime subscriptions on
// the underlying tables so visitors see new orgs, proposals, accreditations
// and programs land in real time.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

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
  const { user } = useAuthContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kind, setKind] = useState("all");
  const [watchingOnly, setWatchingOnly] = useState(false);
  // Watch set keyed by "kind|entity_id" for O(1) lookup during filtering.
  const [watchSet, setWatchSet] = useState(new Set());

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

  // Fetch the user's watch set once when they sign in. Used purely to
  // filter the activity feed; no realtime needed here since adds happen
  // on detail pages and the filter is opt-in.
  useEffect(() => {
    if (!user) { setWatchSet(new Set()); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_my_watchlist", { p_kind: null, p_limit: 500 });
      if (cancelled) return;
      const s = new Set();
      for (const w of (data || [])) s.add(`${activityKindToWatchKind(w.kind) || w.kind}|${w.entity_id}`);
      setWatchSet(s);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Realtime — all five source tables are now in the supabase_realtime
  // publication, so one channel with a 500 ms tail debounce is enough; no
  // polling fallback needed.
  useEffect(() => {
    let tail = null;
    const schedule = () => { if (tail) clearTimeout(tail); tail = setTimeout(refetch, 500); };
    const channel = supabase
      .channel("activity_feed")
      .on("postgres_changes", { event: "*",      schema: "public", table: "collaboration_proposals"   }, schedule)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "org_accreditation_events" }, schedule)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "organizations"            }, schedule)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "programs"                 }, schedule)
      .subscribe();
    return () => {
      if (tail) clearTimeout(tail);
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Filter pipeline: kind selector → optional watching-only.
  const filtered = useMemo(() => {
    let arr = kind === "all" ? rows : rows.filter((r) => r.kind === kind);
    if (watchingOnly) {
      arr = arr.filter((r) => {
        // Map activity row kinds to the watch table's kinds and check the set.
        const wk = activityKindToWatchKind(r.kind);
        if (!wk) return false;
        return watchSet.has(`${wk}|${r.subject_id}`);
      });
    }
    return arr;
  }, [rows, kind, watchingOnly, watchSet]);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>Activity</h1>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
          The platform-wide pulse — orgs, accreditations, proposals, programs as they happen.
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
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
        {user && (
          <button
            onClick={() => setWatchingOnly((w) => !w)}
            style={{
              marginLeft: "auto",
              padding: "5px 10px",
              fontSize: 11,
              fontWeight: 700,
              background: watchingOnly ? "#FCE89B" : "#fff",
              color: watchingOnly ? "#85651A" : "#666",
              border: "1px solid",
              borderColor: watchingOnly ? "#E6C24A" : "#e8e6e1",
              borderRadius: 7,
              cursor: "pointer",
            }}
          >
            ★ {watchingOnly ? "Watching only" : "All activity"}
          </button>
        )}
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

// Both 'org_registered' and 'org_accredited' point at organizations rows.
// 'proposal_*' point at collaboration_proposals. 'program_created' points
// at programs (no watch kind yet — we don't let users watch programs as
// a primitive entity, only via the underlying program-organization
// relationship). Returning null suppresses the row when watching-only.
function activityKindToWatchKind(actKind) {
  if (actKind === "org_registered" || actKind === "org_accredited") return "organization";
  if (actKind === "proposal_sent" || actKind === "proposal_accepted") return "proposal";
  if (actKind === "program_created") return null;
  return null;
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
