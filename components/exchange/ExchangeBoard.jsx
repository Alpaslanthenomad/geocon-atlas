"use client";
// components/exchange/ExchangeBoard.jsx
//
// The deal board layer — its own dedicated page inside ExchangeShell. Real,
// money-free state (verified outputs listed; 0 today = honest empty) + a clearly
// labelled ORNEK listing that opens the example deal room. Real per-listing rows
// + the tokenized deal room arrive with the first real verified opportunity.

import { useEffect, useState } from "react";
import Link from "next/link";
import ExchangeShell from "./ExchangeShell";
import { supabase } from "../../lib/supabase";

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
    <ExchangeShell
      title="The Deal Board"
      tagline="Verified value outputs, across every vertical. Each is an evidence-first brief — provenance frozen, money-free, conservation-grounded."
      wide
    >
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
    </ExchangeShell>
  );
}
