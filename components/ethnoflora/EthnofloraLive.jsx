"use client";
// components/ethnoflora/EthnofloraLive.jsx
//
// The live face of the now-real ETHNOFLORA atlas. Reads the money-blind
// get_ethnoflora_overview() RPC (real counts + threatened sample) and links into the
// real species pages. No fabricated numbers -- every figure is a live count.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const GREEN = "#138A6E", DEEP = "#0C5E4C", INK = "#10302A", BODY = "#3E5852", MUT = "#75918A", LINE = "#D8E9E3";
const IUCN_COLOR = { CR: "#B71C1C", EN: "#E65100", VU: "#F9A825" };

export default function EthnofloraLive() {
  const [o, setO] = useState(undefined);
  useEffect(() => {
    supabase.rpc("get_ethnoflora_overview").then(({ data }) => setO(data || null)).catch(() => setO(null));
  }, []);

  if (o === undefined) return <div style={{ padding: 24, color: MUT, fontSize: 13 }}>atlas yükleniyor…</div>;
  if (!o || !o.total) return null;

  const stats = [
    { n: o.total, l: "medicinal species" },
    { n: o.iucn_assessed, l: "IUCN-assessed" },
    { n: o.threatened, l: "threatened (CR/EN/VU)" },
    { n: o.families, l: "plant families" },
  ];

  return (
    <section style={{ marginTop: 30 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: DEEP, fontWeight: 700, margin: 0 }}>The atlas is live — real data, v1</h2>
        <span style={{ fontSize: 11, color: MUT }}>verified {o.as_of}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        {stats.map((s) => (
          <div key={s.l} style={{ padding: "16px 18px", borderRadius: 14, background: "#fff", border: "1px solid " + LINE }}>
            <div style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 30, fontWeight: 800, color: INK, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 11.5, color: BODY, marginTop: 6 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: BODY, lineHeight: 1.65, marginBottom: 14, maxWidth: 720 }}>
        Each species is a real plant that is the botanical source of a medication, drawn from Wikidata (CC0) and
        normalised through GBIF (CC-BY) — provenance-labelled, never fabricated. Distribution data is honestly flagged
        where GBIF is incomplete. The Anatolian-endemic deepening and consent-gated ethnobotanical use-facts are the
        next enrichment — the gap is the product.
      </div>

      <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: DEEP, fontWeight: 700, marginBottom: 10 }}>Threatened medicinal plants in the atlas</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {(o.threatened_sample || []).map((s) => (
          <a key={s.id} href={"/geocon/species/" + s.id} style={{ textDecoration: "none", padding: "12px 14px", borderRadius: 12, background: "#fff", border: "1px solid " + LINE, display: "block" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: IUCN_COLOR[s.iucn] || MUT, padding: "2px 6px", borderRadius: 5, letterSpacing: 0.5 }}>{s.iucn}</span>
              <span style={{ fontStyle: "italic", fontSize: 14, fontWeight: 600, color: INK }}>{s.name}</span>
            </div>
            <div style={{ fontSize: 11, color: MUT, marginTop: 5 }}>{s.family}{s.medications?.length ? " · source of " + s.medications.slice(0, 2).join(", ") : ""}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
