"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

import FoundationTab from "./tabs/FoundationTab";
import PathwaysTab from "./tabs/PathwaysTab";
import ContributorsTab from "./tabs/ContributorsTab";
import OutputsTab from "./tabs/OutputsTab";

/* ─────────────────────────────────────────────────────────
   ProgramDetailPanel (v3 — Constitution architecture)

   Layered architecture:
   - Hero: Program name, species, stage, gate state
   - Tabs: Foundation · Pathways · Contributors · Outputs
   - Visibility panel: 3-level (Public / Network / Workspace)

   Replaces the legacy 1100+ line panel. Each tab fetches its
   own data via a single RPC call. Owner identity flows from
   useAuth() through programs.created_by → profiles.researcher_id.
───────────────────────────────────────────────────────── */

const TABS = [
  { id: "foundation",   label: "Foundation",   icon: "🌱" },
  { id: "pathways",     label: "Pathways",     icon: "🛤" },
  { id: "contributors", label: "Contributors", icon: "👥" },
  { id: "outputs",      label: "Outputs",      icon: "📦" },
];

export default function ProgramDetailPanel({ programId, onClose, onChanged }) {
  const { profile } = useAuth();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("foundation");
  const [refreshTick, setRefreshTick] = useState(0);

  const load = useCallback(async () => {
    if (!programId) return;
    setLoading(true);
    try {
      // Light fetch for hero — heavy data is per-tab
      // Hero fetch — column names match real schema (why_this_program,
      // current_module, current_gate, risk_level, priority_score, species_id).
      // species join: tries common_name and accepted_name; fallbacks gracefully.
      const { data, error } = await supabase
        .from("programs")
        .select(`
          id, program_name, status, why_this_program, strategic_rationale,
          current_module, current_gate, risk_level, priority_score,
          created_at, created_by, entry_mode, foundation_rule_version,
          species:species_id (id, accepted_name, family, iucn_status),
          owner_researcher:researchers!created_by (id, name, email)
        `)
        .eq("id", programId)
        .maybeSingle();
      if (error) {
        console.warn("[ProgramDetailPanel] load error:", error.message);
      }
      setProgram(data || null);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => { load(); }, [load, refreshTick]);

  const handleChanged = () => {
    setRefreshTick((t) => t + 1);
    if (onChanged) onChanged();
  };

  const isOwner = !!program && !!profile?.researcher_id && program.created_by === profile.researcher_id;

  if (loading && !program) {
    return (
      <Shell onClose={onClose}>
        <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Loading program…</div>
      </Shell>
    );
  }

  if (!program) {
    return (
      <Shell onClose={onClose}>
        <div style={{ padding: 40, textAlign: "center", color: "#A32D2D" }}>
          Program not found or access denied.
        </div>
      </Shell>
    );
  }

  return (
    <Shell onClose={onClose}>
      <ProgramHero program={program} isOwner={isOwner} />

      {/* Tab strip */}
      <nav style={tabStrip}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={tabBtn(activeTab === t.id)}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div style={tabPane}>
        {activeTab === "foundation" && (
          <FoundationTab programId={programId} onChanged={handleChanged} />
        )}
        {activeTab === "pathways" && (
          <PathwaysTab programId={programId} onChanged={handleChanged} />
        )}
        {activeTab === "contributors" && (
          <ContributorsTab programId={programId} onChanged={handleChanged} />
        )}
        {activeTab === "outputs" && (
          <OutputsTab programId={programId} />
        )}
      </div>
    </Shell>
  );
}

/* ─── Shell (drawer/modal container) ─── */
function Shell({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.45)",
        zIndex: 900,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(960px, 96vw)",
          height: "100%",
          background: "#FAFAFA",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.2)",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "sticky",
            top: 0,
            alignSelf: "flex-end",
            margin: 12,
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 999,
            width: 32,
            height: 32,
            cursor: "pointer",
            fontSize: 16,
            color: "#6B7280",
            zIndex: 5,
          }}
          aria-label="Close"
        >×</button>
        {children}
      </div>
    </div>
  );
}

/* ─── Program Hero ─── */
function ProgramHero({ program, isOwner }) {
  const sp = program.species;
  const owner = program.owner_researcher;
  const stage = program.status || "designing";

  return (
    <header style={{
      padding: "0 24px 16px 24px",
    }}>
      <div style={{ fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
        Program · {program.entry_mode || "academic"}
      </div>
      <h1 style={{ margin: 0, fontSize: 24, color: "#111827", fontWeight: 700 }}>
        {program.program_name}
      </h1>

      <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
        {sp && (
          <div style={{ fontSize: 13, color: "#374151" }}>
            🌱 <em>{sp.accepted_name}</em>
            {sp.family && <span style={{ color: "#9CA3AF" }}> · {sp.family}</span>}
            {sp.iucn_status && (
              <span style={{
                marginLeft: 6,
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 4,
                background: "#F3F4F6",
                color: "#374151",
                fontWeight: 600,
              }}>{sp.iucn_status}</span>
            )}
          </div>
        )}
        <StagePill stage={stage} />
        {program.current_module && (
          <span style={{ fontSize: 11, color: "#6B7280" }}>
            {program.current_module}{program.current_gate ? ` · ${program.current_gate}` : ""}
          </span>
        )}
        {isOwner && (
          <span style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            background: "#FEF3C7",
            color: "#92400E",
            fontWeight: 600,
          }}>YOU OWN THIS</span>
        )}
      </div>

      {owner && (
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
          Owner: {owner.name}
        </div>
      )}

      {(program.why_this_program || program.strategic_rationale) && (
        <div style={{
          marginTop: 12,
          padding: 12,
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 8,
        }}>
          {program.why_this_program && (
            <div style={{ fontSize: 13, color: "#111827" }}>
              <strong style={{ color: "#374151" }}>Why this program: </strong>
              {program.why_this_program}
            </div>
          )}
          {program.strategic_rationale && (
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
              <strong>Strategic rationale: </strong>
              {program.strategic_rationale}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function StagePill({ stage }) {
  const s = (stage || "designing").toLowerCase();
  const map = {
    designing:    { bg: "#F3F4F6", color: "#6B7280", label: "Designing" },
    active:       { bg: "#DCFCE7", color: "#166534", label: "Active" },
    gate_ready:   { bg: "#FEF3C7", color: "#92400E", label: "Gate Ready" },
    producing:    { bg: "#DBEAFE", color: "#1E40AF", label: "Producing" },
    realized:     { bg: "#E0E7FF", color: "#3730A3", label: "Realized" },
    paused:       { bg: "#F3F4F6", color: "#6B7280", label: "Paused" },
    abandoned:    { bg: "#FEE2E2", color: "#991B1B", label: "Abandoned" },
  };
  const c = map[s] || map.designing;
  return (
    <span style={{
      fontSize: 11,
      padding: "3px 10px",
      borderRadius: 999,
      background: c.bg,
      color: c.color,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    }}>{c.label}</span>
  );
}

/* ─── styles ─── */
const tabStrip = {
  display: "flex",
  gap: 0,
  padding: "0 24px",
  borderBottom: "1px solid #E5E7EB",
  background: "#FFFFFF",
  position: "sticky",
  top: 0,
  zIndex: 4,
};

const tabBtn = (active) => ({
  padding: "12px 16px",
  border: "none",
  borderBottom: active ? "2px solid #0E7C66" : "2px solid transparent",
  marginBottom: -1,
  background: "transparent",
  color: active ? "#0E7C66" : "#6B7280",
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  cursor: "pointer",
  fontFamily: "inherit",
});

const tabPane = {
  padding: "20px 24px 40px 24px",
  flex: 1,
};
