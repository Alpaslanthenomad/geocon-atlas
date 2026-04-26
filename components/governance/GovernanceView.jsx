"use client";
import { useState } from "react";

import SourcesPanel from "./SourcesPanel";

/**
 * GovernanceView — Yönetişim, veri güveni ve uyumluluk katmanı
 *
 * Şimdilik tek sekme: Sources (data trust)
 * İleride eklenecek:
 *  - Decision Logs : sistem kararlarının kaydı
 *  - ABS / Nagoya  : biyolojik materyal uyumluluğu
 *  - Permits       : toplama / araştırma izinleri
 *  - Ethics Reviews: etik kurul izleri
 */
export default function GovernanceView({ sources }) {
  const [tab, setTab] = useState("sources");

  const tabs = [
    { key: "sources", label: "Sources", icon: "🔗", count: sources.length },
    // İleride buraya: decisions, abs, permits, ethics
  ];

  return (
    <div>
      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 16,
          padding: 4,
          background: "#fff",
          border: "1px solid #e8e6e1",
          borderRadius: 10,
          overflowX: "auto",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 12,
              background: tab === t.key ? "#f4f3ef" : "transparent",
              color: tab === t.key ? "#2c2c2a" : "#888",
              fontWeight: tab === t.key ? 600 : 400,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 13 }}>{t.icon}</span>
            {t.label}
            {t.count > 0 && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 99,
                  background: tab === t.key ? "#E1F5EE" : "#f4f3ef",
                  color: tab === t.key ? "#085041" : "#b4b2a9",
                  fontWeight: 600,
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "sources" && <SourcesPanel sources={sources} />}
    </div>
  );
}
