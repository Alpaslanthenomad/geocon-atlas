"use client";
// LoadingTips — drop into a long-running fetch state so the user has
// something to read while waiting. Tips rotate every ~5s.

import { useEffect, useState } from "react";

const DEFAULT_TIPS = [
  "GEOCON şu an 47,000+ geofit türü kataloglar — Iridaceae'den Liliaceae'ye.",
  "ORCID'inle bağlandığında yayın geçmişin Atlas içinde tanınır — K1 başlangıç etkin oluşur.",
  "Programlar bir veya birden fazla türü çok-yıllık iş paketine dönüştürür. K3 etki orada birikir.",
  "Open Brief'ler kanıt arayan açık çağrılardır — capability'ye göre filtreleyebilirsin.",
  "Impact factor 5 currency × 3 bucket toplamıdır: Discovery, Conservation, Research, Stewardship, Network.",
  "Member Agreement'lar gizlilik korumalıdır — sadece aktif üyeler clause detayını görür.",
  "Bir türün IUCN status'ü VU/EN/CR olduğunda kart üzerinde renkli rozetle görünür.",
  "Programs analytics fleet view, blocker'ları ve stale next action'ları öne çıkarır.",
  "Researcher liderlik tablosu placeholder kayıtları (GBIF.org User vb.) gizler.",
  "Commercialization Recognition GEOCON'u marketplace değil — citation registry yapar.",
];

export default function LoadingTips({
  tips = DEFAULT_TIPS,
  intervalMs = 5000,
  prefix = "💡",
  style,
}) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * tips.length));

  useEffect(() => {
    if (tips.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % tips.length), intervalMs);
    return () => clearInterval(t);
  }, [tips, intervalMs]);

  return (
    <div
      key={idx}
      className="gx-rise"
      style={{
        fontSize: 12,
        color: "var(--gx-ink-muted)",
        fontStyle: "italic",
        lineHeight: 1.55,
        maxWidth: 520,
        margin: "0 auto",
        textAlign: "center",
        padding: "12px 16px",
        ...style,
      }}
    >
      {prefix && <span style={{ marginRight: 6 }}>{prefix}</span>}
      {tips[idx]}
    </div>
  );
}
