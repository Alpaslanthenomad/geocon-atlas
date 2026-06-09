"use client";
// components/geocon/ClosedGaps.jsx
//
// The credit loop, made visible: the verified, citable gaps YOU closed. Reads the
// auth-gated, money-free get_my_closed_gaps RPC. Each is a money-blind Provenance
// Receipt that flows credit back via citation. Renders nothing until you have
// closed one — not a leaderboard, just your own record.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ClosedGaps() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let on = true;
    supabase.rpc("get_my_closed_gaps")
      .then(({ data }) => { if (on) setRows(Array.isArray(data) ? data : []); })
      .catch(() => { if (on) setRows([]); });
    return () => { on = false; };
  }, []);

  if (!rows || rows.length === 0) return null;

  return (
    <section style={{ marginBottom: 18, padding: "16px 18px", borderRadius: 14, background: "var(--gx-surface)", border: "1px solid var(--gx-border-soft)", borderLeft: "3px solid var(--gx-success)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--gx-success)" }}>Verified facts you closed</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--gx-ink)" }}>{rows.length}</span>
        <span style={{ fontSize: 10.5, color: "var(--gx-ink-muted)" }}>· money-blind, citable receipts that flow credit back to you</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => (
          <a key={r.pid} href={`/receipt/${r.pid}`} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, padding: "9px 12px", borderRadius: 10, background: "var(--gx-surface-sunken, rgba(0,0,0,0.02))", border: "1px solid var(--gx-border-soft)" }}>
            <span style={{ fontSize: 13, color: "var(--gx-ink)" }}>
              <strong>{r.compound || r.node}</strong>{" "}
              <span style={{ fontStyle: "italic", color: "var(--gx-ink-muted)" }}>in {r.species}</span>
            </span>
            <span style={{ fontSize: 11, color: "var(--gx-success)", fontWeight: 600, whiteSpace: "nowrap" }}>{r.pid} →</span>
          </a>
        ))}
      </div>
    </section>
  );
}
