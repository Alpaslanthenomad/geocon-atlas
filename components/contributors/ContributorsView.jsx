"use client";
import { useState } from "react";

// Tab components — mevcut yerlerinden çağrılıyor
import ResearchersView from "../researchers/ResearchersView";
import CommunitiesView from "../communities/CommunitiesView";
import { PartnerView } from "../misc/OtherViews";

/**
 * ContributorsView — People, groups, and institutions in the GEOCON network
 *
 * Three sub-views:
 *  - Researchers   : individual experts (h-index, focus areas)
 *  - Communities   : informal groups, networks, projects
 *  - Institutions  : universities, labs, partner organizations
 */
export default function ContributorsView({ species, researchers, institutions }) {
  const [tab, setTab] = useState("researchers");

  const tabs = [
    { key: "researchers",  label: "Researchers",  icon: "👨‍🔬", count: researchers.length },
    { key: "communities",  label: "Communities",  icon: "🤝",   count: 0 },
    { key: "institutions", label: "Institutions", icon: "🏛",   count: institutions.length },
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
      {tab === "researchers"  && <ResearchersView researchers={researchers} />}
      {tab === "communities"  && <CommunitiesView species={species} researchers={researchers} />}
      {tab === "institutions" && <PartnerView institutions={institutions} />}
    </div>
  );
}
