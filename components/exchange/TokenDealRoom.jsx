"use client";
// components/exchange/TokenDealRoom.jsx
//
// The tokenized, no-login VC deal room. A per-link token renders the frozen
// evidence one-pager via the anon get_deal_room RPC (PII-free by allowlist) and
// logs a curator-side view event. The VC never signs up; a forwarded token still
// reveals zero contact/pipeline data. Renders the same DealRoom layout.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import DealRoom from "./DealRoom";

export default function TokenDealRoom({ token }) {
  const [room, setRoom] = useState(undefined); // undefined = loading, null = invalid

  useEffect(() => {
    let on = true;
    const t0 = Date.now();
    supabase.rpc("get_deal_room", { p_token: token })
      .then(({ data }) => {
        if (!on) return;
        setRoom(data || null);
        if (data) supabase.rpc("log_deal_link_event", { p_token: token, p_event: "open" }).catch(() => {});
      })
      .catch(() => { if (on) setRoom(null); });
    return () => {
      on = false;
      // soft dwell signal (best-effort; never a public number)
      supabase.rpc("log_deal_link_event", { p_token: token, p_event: "dwell", p_dwell: Date.now() - t0 }).catch(() => {});
    };
  }, [token]);

  if (room === undefined) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f5f7", color: "#5f6675", fontSize: 14 }}>Yükleniyor…</div>;
  }
  if (room === null) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#f4f5f7", color: "#5f6675", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#1f2430" }}>Bağlantı geçersiz veya süresi dolmuş</div>
        <div style={{ fontSize: 13 }}>This deal-room link is no longer active. Ask VENN for a fresh link.</div>
      </div>
    );
  }
  return <DealRoom payload={room} example={!!room.is_example} />;
}
