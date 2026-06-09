"use client";
// components/exchange/ExchangeBoard.jsx
//
// The deal board layer — its own page inside ExchangeShell. Real money-free state
// (verified outputs listed; 0 today = honest empty) + a clearly labelled ORNEK
// listing that opens the example deal room. Light biotech-venture skin.

import { useEffect, useState } from "react";
import Link from "next/link";
import ExchangeShell from "./ExchangeShell";
import { supabase } from "../../lib/supabase";
import { T } from "./theme";

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
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 18, opacity: 0.65 }}>
        {FILTERS.map((f) => (
          <div key={f.label} style={{ fontSize: 11 }}>
            <span style={{ color: T.muted, marginRight: 6 }}>{f.label}:</span>
            {f.opts.map((o) => (
              <span key={o} style={{ display: "inline-block", padding: "3px 9px", borderRadius: 99, background: "rgba(14,156,138,0.08)", border: "1px solid " + T.line2, color: T.tealDeep, marginRight: 5, marginBottom: 4 }}>{o}</span>
            ))}
          </div>
        ))}
      </div>

      <div style={{ padding: "16px 20px", borderRadius: 12, background: T.surface, border: "1px solid " + T.line, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 28, fontWeight: 700, color: opp == null ? T.faint : T.ink }}>{opp == null ? "—" : opp}</span>
          <span style={{ fontSize: 12.5, color: T.body }}>{opp === 1 ? "verified output listed" : "verified outputs listed"}</span>
        </div>
        {opp === 0 && (
          <div style={{ fontSize: 12, color: T.muted, fontStyle: "italic", marginTop: 6 }}>
            No real listings yet — the board fills one curated door at a time. Below is what a listing looks like.
          </div>
        )}
      </div>

      <a href="/exchange/deal/demo-galanthus-elwesii" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <div style={{ padding: "16px 20px", borderRadius: 12, background: T.surfaceAlt, border: "1px dashed " + T.teal, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: "#FBEFD6", color: "#7a5713", fontWeight: 700, letterSpacing: 0.5 }}>ÖRNEK</span>
              <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: "rgba(29,158,117,0.12)", color: T.emerald, fontWeight: 600 }}>tokenlı deal-room</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, marginTop: 8 }}>Örnek: Galanthus elwesii — galantamine</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Bir VC'ye gönderilen giriş-gerektirmeyen, tokenlı deal-room'u aç → (PII'siz, görüntüleme loglanır)</div>
          </div>
          <span style={{ color: T.teal, fontSize: 18 }}>→</span>
        </div>
      </a>
    </ExchangeShell>
  );
}
