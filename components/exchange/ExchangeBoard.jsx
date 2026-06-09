"use client";
// components/exchange/ExchangeBoard.jsx
//
// The investor-facing deal board — a working P4 surface you can SEE even with no
// data. It shows the REAL state (verified outputs listed, from the money-free
// stats RPC; 0 today = an honest empty state) plus a clearly-labelled EXAMPLE
// listing so the board-to-deal-room flow is visible without any fabricated data.
// Real per-listing rows + filters + the tokenized deal room arrive once there is
// at least one real verified opportunity.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const BG =
  "radial-gradient(ellipse at 12% 18%, rgba(229,114,43,0.14) 0%, transparent 45%)," +
  "radial-gradient(ellipse at 88% 82%, rgba(86,142,80,0.12) 0%, transparent 50%)," +
  "radial-gradient(ellipse at 50% 50%, #2a1240 0%, #150821 100%)";

const FILTERS = [
  { label: "Vertical", opts: ["geophytes"] },
  { label: "Stage", opts: ["idea", "prototype", "pilot", "scaling"] },
  { label: "Type", opts: ["investor", "industry"] },
];

export default function ExchangeBoard() {
  const [opp, setOpp] = useState(null);

  useEffect(() => {
    let on = true;
    supabase.rpc("get_exchange_public_stats")
      .then(({ data }) => { if (on) setOpp(data?.opportunities ?? 0); })
      .catch(() => { if (on) setOpp(0); });
    return () => { on = false; };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#f3e8d3", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: "30px 24px 64px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Link href="/exchange" style={{ fontSize: 11, color: "#FFD79B", textDecoration: "none" }}>← Venn Exchange</Link>

        <header style={{ marginTop: 18, marginBottom: 18 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, color: "#FFE6BC", letterSpacing: -0.5 }}>The deal board</h1>
          <p style={{ fontSize: 13, color: "#E7D3B3", marginTop: 6, maxWidth: 620, lineHeight: 1.5 }}>
            Verified value outputs, across every vertical. Each is an evidence-first
            brief — provenance frozen, money-free, conservation-grounded.
          </p>
        </header>

        {/* Filters (scaffold — wire to real rows once listings exist) */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18, opacity: 0.6 }}>
          {FILTERS.map((f) => (
            <div key={f.label} style={{ fontSize: 11 }}>
              <span style={{ color: "#C8B89E", marginRight: 6 }}>{f.label}:</span>
              {f.opts.map((o) => (
                <span key={o} style={{ display: "inline-block", padding: "3px 9px", borderRadius: 99, background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.18)", color: "#FFD79B", marginRight: 5, marginBottom: 4 }}>{o}</span>
              ))}
            </div>
          ))}
        </div>

        {/* Real state */}
        <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(28,12,44,0.5)", border: "1px solid rgba(245,166,35,0.18)", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 28, fontWeight: 700, color: opp == null ? "rgba(255,255,255,0.3)" : "#FFE6BC" }}>{opp == null ? "—" : opp}</span>
            <span style={{ fontSize: 12.5, color: "#C8B89E" }}>{opp === 1 ? "verified output listed" : "verified outputs listed"}</span>
          </div>
          {opp === 0 && (
            <div style={{ fontSize: 12, color: "#C8B89E", fontStyle: "italic", marginTop: 6 }}>
              No real listings yet — the board fills one curated door at a time. Below is what a listing looks like.
            </div>
          )}
        </div>

        {/* Example listing card -> example deal room */}
        <Link href="/exchange/deal/example" style={{ textDecoration: "none" }}>
          <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(245,166,35,0.45)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: "#FFF4D6", color: "#6b4e00", fontWeight: 700, letterSpacing: 0.5 }}>ÖRNEK</span>
                <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: "#EEF6F2", color: "#085041", fontWeight: 600 }}>geophytes</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#FFE6BC", marginTop: 8 }}>Örnek: doğrulanmış bir değer çıktısı</div>
              <div style={{ fontSize: 12, color: "#C8B89E", marginTop: 4 }}>Bir VC'nin göreceği kanıt-öncelikli deal-room düzenini aç →</div>
            </div>
            <span style={{ color: "#FFD15C", fontSize: 18 }}>→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
