"use client";
// components/geocon/RelatedOpenCalls.jsx
//
// Reusable "Related open calls" panel embedded on Species, Country and
// Family detail pages. Pass the right RPC name + arg and it does the
// fetching, compact card rendering, and empty/loading states.
//
// The compact card is a stripped variant of OpenCallsRoute's full card —
// we don't need search/filters here, just a quick "what's bubbling around
// this entity" surface.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const TYPE_LABEL = {
  research_collaboration: "Research collab",
  rd_partnership:         "R&D partnership",
  licensing:              "Licensing",
  feedstock_supply:       "Feedstock supply",
  propagation_service:    "Propagation",
  knowledge_transfer:     "Knowledge transfer",
  joint_venture:          "Joint venture",
  sponsorship:            "Sponsorship",
};

const STATUS_TINT = { sent: "#185FA5", negotiating: "#534AB7" };

export default function RelatedOpenCalls({ rpcName, rpcArgs, title = "Related open calls", limit = 6, browseHref = "/geocon/proposals/open" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error: e } = await supabase.rpc(rpcName, { ...rpcArgs, p_limit: limit + 1 });
      if (cancelled) return;
      if (e) setError(e.message);
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rpcName, JSON.stringify(rpcArgs), limit]);

  // Hide the section entirely when there's nothing to show — keeps detail
  // pages quiet for entities that aren't getting proposal traffic yet.
  if (!loading && rows.length === 0) return null;

  const visible = rows.slice(0, limit);
  const hasMore = rows.length > limit;

  return (
    <section style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 10, padding: 16, marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h2 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 15, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
          📬 {title}
        </h2>
        <Link href={browseHref} style={{ fontSize: 11, color: "#0a4a3e", textDecoration: "none", fontWeight: 600 }}>
          Browse all →
        </Link>
      </div>

      {error && (
        <div style={{ padding: 8, background: "#fdecec", border: "1px solid #fcc", borderRadius: 6, fontSize: 11, color: "#A32D2D", marginBottom: 8 }}>
          {error}
        </div>
      )}

      {loading ? (
        <Skeleton />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visible.map((r) => <Row key={r.id} row={r} />)}
          {hasMore && (
            <Link href={browseHref} style={{ marginTop: 4, fontSize: 11, color: "#888", textDecoration: "none", textAlign: "center" }}>
              + {rows.length - limit} more →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function Row({ row }) {
  const tint = STATUS_TINT[row.status] || "var(--gx-ink-muted)";
  return (
    <Link
      href={`/geocon/proposals/${row.id}`}
      style={{
        display: "block",
        background: "var(--gx-surface-2)",
        border: "1px solid #ece9e2",
        borderLeft: `3px solid ${tint}`,
        borderRadius: 8,
        padding: "10px 12px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 9, fontFamily: "monospace", color: "#aaa", letterSpacing: 0.6 }}>{row.proposal_code}</span>
        <span style={{ fontSize: 9, padding: "1px 7px", borderRadius: 999, background: tint + "22", color: tint, fontWeight: 700, textTransform: "uppercase" }}>
          {row.status}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)", marginTop: 3, lineHeight: 1.3 }}>
        {row.title}
      </div>
      <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
        {TYPE_LABEL[row.proposal_type] || row.proposal_type}
        {row.initiator_actor_name && (
          <> · by <strong style={{ color: "#0a4a3e" }}>{row.initiator_actor_name}</strong></>
        )}
        {row.initiator_country && <> · {row.initiator_country}</>}
      </div>
    </Link>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 2, 3].map((i) => <div key={i} style={{ height: 70, background: "var(--gx-surface-3)", borderRadius: 8 }} />)}
    </div>
  );
}
