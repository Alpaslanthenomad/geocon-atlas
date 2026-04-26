"use client";
import { useState } from "react";
import { S } from "../../lib/constants";

// Lens components
import SpeciesModule from "../species/SpeciesModule";
import PublicationsView from "../publications/PublicationsView";
import MetaboliteExplorer from "../metabolites/MetaboliteExplorer";
import MarketLens from "./lenses/MarketLens";
import PortfolioLens from "./lenses/PortfolioLens";

/**
 * AtlasView — Decision-oriented biological intelligence layer
 * Atlas is the single top-level view for species discovery and analysis.
 * Underneath, it has multiple "lenses" — different ways to look at the
 * same underlying species data.
 */
export default function AtlasView({
  species,
  publications,
  metabolites,
  markets,
  exp,
  setExp,
  onSpeciesClick,
}) {
  const [lens, setLens] = useState("species");

  const lenses = [
    { key: "species",      label: "Species",      icon: "🌿", count: species.length },
    { key: "publications", label: "Publications", icon: "📚", count: publications.length },
    { key: "metabolites",  label: "Compounds",    icon: "🧪", count: metabolites.length },
    { key: "market",       label: "Market",       icon: "💰", count: markets.length },
    { key: "portfolio",    label: "Portfolio",    icon: "📊", count: species.length },
  ];

  return (
    <div>
      {/* Lens switcher */}
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
        {lenses.map((l) => (
          <button
            key={l.key}
            onClick={() => setLens(l.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 12,
              background: lens === l.key ? "#f4f3ef" : "transparent",
              color: lens === l.key ? "#2c2c2a" : "#888",
              fontWeight: lens === l.key ? 600 : 400,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 13 }}>{l.icon}</span>
            {l.label}
            <span
              style={{
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 99,
                background: lens === l.key ? "#E1F5EE" : "#f4f3ef",
                color: lens === l.key ? "#085041" : "#b4b2a9",
                fontWeight: 600,
              }}
            >
              {l.count}
            </span>
          </button>
        ))}
      </div>

      {/* Lens content */}
      {lens === "species" && (
        <SpeciesModule
          species={species}
          exp={exp}
          setExp={setExp}
          onSpeciesClick={onSpeciesClick}
        />
      )}
      {lens === "publications" && <PublicationsView publications={publications} />}
      {lens === "metabolites"  && <MetaboliteExplorer metabolites={metabolites} />}
      {lens === "market"       && <MarketLens markets={markets} />}
      {lens === "portfolio"    && <PortfolioLens species={species} />}
    </div>
  );
}
