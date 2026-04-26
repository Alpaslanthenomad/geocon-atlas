"use client";
import { S } from "../../lib/constants";

/**
 * PartnersTab — Contributors içinde Institutions sekmesi
 * (eski PartnerView, misc/OtherViews.jsx'ten taşındı)
 */
export default function PartnersTab({ institutions }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 8 }}>
      {institutions.map((i) => (
        <div key={i.id} style={{ ...S.card, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{i.name}</div>
          <div style={{ fontSize: 10, color: "#888" }}>
            {i.city ? `${i.city}, ` : ""}{i.country || "—"}
          </div>
          <div style={{ fontSize: 11, color: "#5f5e5a", marginTop: 4 }}>{i.research_focus || i.focus_area || "—"}</div>
        </div>
      ))}
    </div>
  );
}
