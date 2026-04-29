"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { MODULE_COLORS, STATUS_COLORS } from "../../lib/constants";
import {
  fetchProgramStory,
  fetchProgramActions,
  fetchProgramDecisions,
  fetchProgramMembers,
  fetchProgramPublications,
  fetchProgramSpecies,
  fetchProgramContributions,
  fetchProgramAuthority,
  updateActionStatus,
  advanceGate,
  createProgramStoryEntry,
  createProgramAction,
  createProgramDecision,
} from "../../lib/programs";

const TABS = ["overview", "roadmap", "story", "actions", "decisions", "contributions", "linked"];
const MODULE_SEQUENCE = ["Origin", "Forge", "Mesh", "Exchange", "Accord"];
const GATE_SEQUENCE = ["Selection", "Validation", "Protocol", "Deployment", "Venture", "Governance"];

const MODULE_INFO = {
  Origin: {
    icon: "🌱",
    short: "Selection & validation",
    long: "Species enters the program. Why this one? What's known? What's missing? Initial scoping and feasibility check.",
  },
  Forge: {
    icon: "⚒️",
    short: "Protocol & verification",
    long: "Science is verified, scaled, and made repeatable. Propagation protocols, pilot trials, and reproducibility evidence are built here.",
  },
  Mesh: {
    icon: "🌾",
    short: "Producer network",
    long: "The protocol meets the field. Real growers, real plots, real-world testing. Production capacity is mapped and partnerships are formed.",
  },
  Exchange: {
    icon: "💱",
    short: "Market & commercialization",
    long: "Output finds its commercial channel. Pricing, distribution, value chain integration. Demand-side actors join the program.",
  },
  Accord: {
    icon: "📜",
    short: "Governance & release",
    long: "ABS/Nagoya compliance, regulatory pathways, public release. The legitimacy layer that turns execution into market authorization.",
  },
};

const GATE_INFO = {
  Selection: "Initial taxa screening and prioritization",
  Validation: "Scientific verification of feasibility",
  Protocol: "Reproducible methods established",
  Deployment: "Field-scale testing and partnerships",
  Venture: "Commercial entity or partnership formed",
  Governance: "Regulatory and ethical clearance",
};

export default function ProgramDetailPanel({ program, onClose, onUpdate }) {
  const [tab, setTab] = useState("overview");
  const [stories, setStories] = useState([]);
  const [actions, setActions] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [members, setMembers] = useState([]);
  const [linkedPubs, setLinkedPubs] = useState([]);
  const [programSpecies, setProgramSpecies] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [authority, setAuthority] = useState([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  const [showStoryForm, setShowStoryForm] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);
  const [showDecisionForm, setShowDecisionForm] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null); // {type: 'success'|'error', message: string}
  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  const modColor = MODULE_COLORS[program?.current_module] || "#888";
  const nextGateLabel = useMemo(() => getNextGate(program), [program]);
  const isComplete = nextGateLabel === "Complete";

  // Members'tan owner+co-owner ayır, ana ekiple birleştirme — header ve formlar için
  const owners = useMemo(
    () => members.filter(m => m.role === "owner" || m.role === "co-owner")
                 .sort((a, b) => (a.role === "owner" ? -1 : 1)),
    [members]
  );
  const contributors = useMemo(
    () => members.filter(m => m.role !== "owner" && m.role !== "co-owner"),
    [members]
  );
  // Quick form'lar için varsayılan author adı: ilk owner > legacy owner_name fallback
  const primaryOwnerName = owners[0]?.researchers?.name || program?.owner_name || "";

  // Program species — Primary'i öne sırala
  const sortedSpecies = useMemo(
    () => [...programSpecies].sort((a, b) => {
      if (a.role === "Primary" && b.role !== "Primary") return -1;
      if (b.role === "Primary" && a.role !== "Primary") return 1;
      return (a.species?.accepted_name || "").localeCompare(b.species?.accepted_name || "");
    }),
    [programSpecies]
  );

  useEffect(() => {
    if (!program) return;

    let mounted = true;
    setLoading(true);
    setTab("overview");
    setShowStoryForm(false);
    setShowActionForm(false);
    setShowDecisionForm(false);

    Promise.all([
      fetchProgramStory(program.id),
      fetchProgramActions(program.id),
      fetchProgramDecisions(program.id),
      fetchProgramMembers(program.id),
      fetchProgramPublications(program.id),
      fetchProgramSpecies(program.id),
      fetchProgramContributions(program.id),
      fetchProgramAuthority(program.id),
    ])
      .then(([s, a, d, m, pp, ps, cs, au]) => {
        if (!mounted) return;
        setStories(Array.isArray(s) ? s : []);
        setActions(Array.isArray(a) ? a : []);
        setDecisions(Array.isArray(d) ? d : []);
        setMembers(Array.isArray(m) ? m : []);
        setLinkedPubs(Array.isArray(pp) ? pp : []);
        setProgramSpecies(Array.isArray(ps) ? ps : []);
        setContributions(Array.isArray(cs) ? cs : []);
        setAuthority(Array.isArray(au) ? au : []);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [program?.id]);

  async function refreshAll() {
    if (!program) return;
    const [s, a, d] = await Promise.all([
      fetchProgramStory(program.id),
      fetchProgramActions(program.id),
      fetchProgramDecisions(program.id),
    ]);
    setStories(Array.isArray(s) ? s : []);
    setActions(Array.isArray(a) ? a : []);
    setDecisions(Array.isArray(d) ? d : []);
  }

  async function handleAdvanceGate() {
    if (!program || isComplete) return;

    setAdvancing(true);
    try {
      const updated = await advanceGate(program);
      await refreshAll();
      if (onUpdate) onUpdate(updated);
    } catch (e) {
      alert(`Hata: ${e.message}`);
    } finally {
      setAdvancing(false);
    }
  }

  async function handleActionStatusChange(actionId, newStatus) {
    try {
      await updateActionStatus(actionId, newStatus);
      setActions((prev) =>
        prev.map((a) => (a.id === actionId ? { ...a, status: newStatus } : a))
      );
    } catch (e) {
      alert(`Hata: ${e.message}`);
    }
  }

  if (!program) return null;

  const openActionsCount = actions.filter(
    (a) => !["completed", "Completed"].includes(a.status)
  ).length;

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 80,
            right: 24,
            zIndex: 9999,
            padding: "12px 18px",
            borderRadius: 10,
            background: toast.type === "success" ? "#1D9E75" : "#A32D2D",
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
            minWidth: 240,
            maxWidth: 380,
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "slideInRight 0.3s ease-out",
          }}
        >
          <span style={{ fontSize: 18 }}>{toast.type === "success" ? "✓" : "✕"}</span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 16,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Back navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={onClose}
          style={{
            padding: "7px 14px",
            border: "1px solid #e8e6e1",
            borderRadius: 8,
            background: "#fff",
            cursor: "pointer",
            fontSize: 11,
            color: "#5f5e5a",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Back to programs
        </button>
        <div style={{ flex: 1, fontSize: 11, color: "#888" }}>
          <span
            style={{ color: "#1D9E75", fontWeight: 600, cursor: "pointer" }}
            onClick={onClose}
          >
            Programs
          </span>
          <span style={{ margin: "0 6px", color: "#ccc" }}>›</span>
          <span style={{ color: "#2c2c2a" }}>
            {program.program_code || program.program_name}
          </span>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e8e6e1",
          overflow: "hidden",
        }}
      >
        {/* ─── COMMAND HEADER — NEXT BEST ACTION ─── */}
        {(program.next_action || program.primary_blocker) && (
          <div
            style={{
              padding: "16px 22px",
              background: "linear-gradient(135deg,#085041 0%,#1D9E75 100%)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.85)",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  fontWeight: 700,
                }}
              >
                Next best action
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                lineHeight: 1.5,
                marginBottom: program.primary_blocker || program.next_action_due ? 10 : 0,
              }}
            >
              {program.next_action || "Define next action"}
            </div>
            {(program.primary_blocker || program.next_action_due) && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {program.primary_blocker && (
                  <div
                    style={{
                      padding: "4px 10px",
                      background: "rgba(248,113,113,0.25)",
                      border: "1px solid rgba(248,113,113,0.4)",
                      borderRadius: 99,
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    ⚠ Blocker:{" "}
                    {program.primary_blocker.length > 40
                      ? program.primary_blocker.slice(0, 40) + "..."
                      : program.primary_blocker}
                  </div>
                )}
                {!program.primary_blocker && program.next_action_due && (
                  <div
                    style={{
                      padding: "4px 10px",
                      background: "rgba(255,255,255,0.15)",
                      borderRadius: 99,
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    📅 Due: {program.next_action_due}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid #e8e6e1",
            background: "#f8f7f4",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 9,
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 4,
                }}
              >
                {program.program_type}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#2c2c2a",
                  lineHeight: 1.3,
                  fontFamily: "Georgia,serif",
                }}
              >
                {program.program_name}
              </div>
              {program.species && (
                <div style={{ fontSize: 12, fontStyle: "italic", color: "#888", marginTop: 3 }}>
                  {program.species.accepted_name}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            <span
              style={{
                fontSize: 10,
                padding: "3px 10px",
                borderRadius: 99,
                background: `${modColor}15`,
                color: modColor,
                fontWeight: 600,
              }}
            >
              {program.current_module}
            </span>

            <span
              style={{
                fontSize: 10,
                padding: "3px 10px",
                borderRadius: 99,
                background: "#f4f3ef",
                color: "#5f5e5a",
              }}
            >
              {program.current_gate}
            </span>

            <span
              style={{
                fontSize: 10,
                padding: "3px 10px",
                borderRadius: 99,
                background: `${STATUS_COLORS[program.status] || "#888"}22`,
                color: STATUS_COLORS[program.status] || "#888",
                fontWeight: 600,
              }}
            >
              {program.status}
            </span>

            {program.risk_level && (
              <span
                style={{
                  fontSize: 10,
                  padding: "3px 10px",
                  borderRadius: 99,
                  background:
                    program.risk_level === "high"
                      ? "#FCEBEB"
                      : program.risk_level === "medium"
                      ? "#FAEEDA"
                      : "#E1F5EE",
                  color:
                    program.risk_level === "high"
                      ? "#A32D2D"
                      : program.risk_level === "medium"
                      ? "#633806"
                      : "#085041",
                }}
              >
                {program.risk_level} risk
              </span>
            )}
          </div>

          {(program.readiness_score || program.confidence_score || program.priority_score) ? (
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              {[
                { l: "Readiness", v: program.readiness_score, c: "#1D9E75" },
                { l: "Confidence", v: program.confidence_score, c: "#185FA5" },
                { l: "Priority", v: program.priority_score, c: "#D85A30" },
              ].map((m) =>
                m.v ? (
                  <div
                    key={m.l}
                    style={{
                      flex: 1,
                      background: "#fff",
                      border: "1px solid #e8e6e1",
                      borderRadius: 8,
                      padding: "6px 8px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 8, color: "#999", textTransform: "uppercase", marginBottom: 2 }}>
                      {m.l}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: m.c }}>{m.v}</div>
                  </div>
                ) : null
              )}
            </div>
          ) : null}

          <button
            onClick={handleAdvanceGate}
            disabled={advancing || isComplete}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "9px 0",
              border: "none",
              borderRadius: 9,
              background:
                advancing || isComplete
                  ? "#ccc"
                  : `linear-gradient(90deg,${modColor},${modColor}cc)`,
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              cursor: advancing || isComplete ? "default" : "pointer",
            }}
          >
            {isComplete
              ? "Program complete"
              : advancing
              ? "İlerleniyor..."
              : `→ Next gate: ${nextGateLabel}`}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e8e6e1",
            flexShrink: 0,
            overflowX: "auto",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flexShrink: 0,
                padding: "10px 16px",
                border: "none",
                borderBottom: tab === t ? "2px solid #1D9E75" : "2px solid transparent",
                background: "none",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? "#1D9E75" : "#888",
                textTransform: "capitalize",
              }}
            >
              {t}
              {t === "story" && stories.length > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 99,
                    background: "#EEEDFE",
                    color: "#534AB7",
                  }}
                >
                  {stories.length}
                </span>
              )}
              {t === "actions" && actions.length > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 99,
                    background: "#E1F5EE",
                    color: "#085041",
                  }}
                >
                  {openActionsCount}
                </span>
              )}
              {t === "decisions" && decisions.length > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 99,
                    background: "#FAEEDA",
                    color: "#633806",
                  }}
                >
                  {decisions.length}
                </span>
              )}
              {t === "contributions" && contributions.length > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 99,
                    background: "#FBEAF0",
                    color: "#993556",
                  }}
                >
                  {contributions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#999" }}>Loading...</div>
          ) : (
            <>
              {tab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {program.why_this_program ? (
                    <InfoBlock color="#1D9E75" label="Why this program" text={program.why_this_program} />
                  ) : (
                    <EmptyField label="Why this program" hint="Add via Admin → Program güncelle" />
                  )}

                  {program.strategic_rationale && (
                    <InfoBlock color="#185FA5" label="Strategic rationale" text={program.strategic_rationale} />
                  )}

                  {program.next_action ? (
                    <div style={{ padding: "12px 14px", background: "#E1F5EE", borderRadius: 8 }}>
                      <div style={{ fontSize: 9, color: "#085041", textTransform: "uppercase", marginBottom: 4 }}>
                        Next action
                      </div>
                      <div style={{ fontSize: 12, color: "#085041", fontWeight: 600 }}>
                        {program.next_action}
                      </div>
                      {program.next_action_due && (
                        <div style={{ fontSize: 10, color: "#0F6E56", marginTop: 4 }}>
                          Due: {program.next_action_due}
                        </div>
                      )}
                    </div>
                  ) : (
                    <EmptyField label="Next action" hint="Define the first step for this program" />
                  )}

                  {program.primary_blocker && (
                    <div style={{ padding: "12px 14px", background: "#FCEBEB", borderRadius: 8 }}>
                      <div style={{ fontSize: 9, color: "#A32D2D", textTransform: "uppercase", marginBottom: 4 }}>
                        Primary blocker
                      </div>
                      <div style={{ fontSize: 12, color: "#A32D2D" }}>{program.primary_blocker}</div>
                    </div>
                  )}

                  {program.what_is_missing && (
                    <InfoBlock
                      color="#BA7517"
                      label="What is missing"
                      text={program.what_is_missing}
                      bg="#FAEEDA"
                    />
                  )}

                </div>
              )}

              {tab === "roadmap" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", marginBottom: 4 }}>
                    Roadmap
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 8, lineHeight: 1.5 }}>
                    Strategic structure of this program — phases, modules, and gates.
                  </div>

                  {program.recommended_pathway && (() => {
                    // Parse: "Phase 1 — Forge: ... Phase 2 — extend ... Phase 3 — Exchange: ... Phase 4 — Accord: ..."
                    const raw = program.recommended_pathway;
                    // Split on "Phase N —"  (handles em-dash, en-dash, hyphen)
                    const parts = raw.split(/\s*Phase\s+(\d+)\s*[—–-]\s*/i).filter(Boolean);
                    // After split with capturing group, parts come in pairs: [number, content, number, content, ...]
                    const phases = [];
                    for (let i = 0; i < parts.length; i += 2) {
                      const num = parts[i];
                      const content = parts[i + 1] || "";
                      // Try to extract module name: content might start with "Forge: ..." or "extend to..."
                      const moduleMatch = content.match(/^(Origin|Forge|Mesh|Exchange|Accord)\s*:\s*(.*)/i);
                      if (moduleMatch) {
                        phases.push({
                          num,
                          module: moduleMatch[1].charAt(0).toUpperCase() + moduleMatch[1].slice(1).toLowerCase(),
                          desc: moduleMatch[2].trim().replace(/[;,.]?\s*$/, "").trim(),
                        });
                      } else {
                        phases.push({
                          num,
                          module: null,
                          desc: content.trim().replace(/[;,.]?\s*$/, "").trim(),
                        });
                      }
                    }

                    if (phases.length === 0) {
                      // Fallback: show as plain text if parsing failed
                      return (
                        <div style={{ padding: "10px 14px", background: "#f8f7f4", borderRadius: 8, fontSize: 11, color: "#5f5e5a" }}>
                          <span style={{ fontSize: 9, color: "#b4b2a9", textTransform: "uppercase", marginRight: 8 }}>
                            Pathway
                          </span>
                          {raw}
                        </div>
                      );
                    }

                    return (
                      <div>
                        <div style={{ fontSize: 9, color: "#b4b2a9", textTransform: "uppercase", marginBottom: 10, letterSpacing: 0.6, fontWeight: 700 }}>
                          Pathway · {phases.length} phases
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${Math.min(phases.length, 4)}, 1fr)`,
                            gap: 8,
                          }}
                        >
                          {phases.map((p, idx) => {
                            const moduleColor = p.module ? MODULE_COLORS[p.module] || "#888" : "#888";
                            const moduleIcon = p.module ? MODULE_INFO[p.module]?.icon : null;
                            return (
                              <div
                                key={idx}
                                style={{
                                  padding: "12px 12px 14px",
                                  background: "#fcfbf9",
                                  borderRadius: 10,
                                  border: "1px solid #e8e6e1",
                                  borderTop: `3px solid ${moduleColor}`,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: moduleColor,
                                      letterSpacing: 0.4,
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    Phase {p.num}
                                  </span>
                                  {moduleIcon && (
                                    <span style={{ fontSize: 14, lineHeight: 1 }}>{moduleIcon}</span>
                                  )}
                                  {p.module && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: moduleColor,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {p.module}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 11, color: "#2c2c2a", lineHeight: 1.5 }}>
                                  {p.desc}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 9, color: "#b4b2a9", textTransform: "uppercase", marginBottom: 10, letterSpacing: 0.6, fontWeight: 700 }}>
                      GEOCON Journey
                    </div>
                    <div style={{ position: "relative", display: "flex", alignItems: "stretch", gap: 0 }}>
                      {MODULE_SEQUENCE.map((m, i) => {
                        const curIdx = MODULE_SEQUENCE.indexOf(program.current_module);
                        const isCurrent = m === program.current_module;
                        const isPast = i < curIdx;
                        const isFuture = i > curIdx;
                        const moduleColor = MODULE_COLORS[m] || "#888";
                        const info = MODULE_INFO[m];

                        return (
                          <Fragment key={m}>
                            {/* Module box */}
                            <div
                              title={info?.long || ""}
                              style={{
                                flex: 1,
                                position: "relative",
                                padding: "12px 8px 10px",
                                borderRadius: 10,
                                background: isCurrent
                                  ? moduleColor
                                  : isPast
                                  ? "#f4f3ef"
                                  : "#fafafa",
                                border: `1.5px solid ${
                                  isCurrent
                                    ? moduleColor
                                    : isPast
                                    ? "#d8d4c8"
                                    : "#f0eee8"
                                }`,
                                cursor: "help",
                                transition: "all 0.2s",
                                textAlign: "center",
                                minHeight: 76,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                gap: 4,
                                boxShadow: isCurrent ? `0 4px 12px ${moduleColor}33` : "none",
                              }}
                            >
                              <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 2, opacity: isFuture ? 0.4 : 1 }}>
                                {info?.icon || "•"}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: isCurrent ? "#fff" : isPast ? "#7a7770" : "#c4c1ba",
                                  letterSpacing: 0.3,
                                }}
                              >
                                {m}
                              </div>
                              <div
                                style={{
                                  fontSize: 9,
                                  color: isCurrent ? "rgba(255,255,255,0.85)" : isPast ? "#9a978f" : "#d0cdc6",
                                  lineHeight: 1.3,
                                  fontWeight: 500,
                                }}
                              >
                                {info?.short || ""}
                              </div>
                              {isCurrent && (
                                <div
                                  style={{
                                    fontSize: 8,
                                    color: "rgba(255,255,255,0.95)",
                                    marginTop: 4,
                                    padding: "2px 6px",
                                    background: "rgba(0,0,0,0.18)",
                                    borderRadius: 4,
                                    display: "inline-block",
                                    margin: "4px auto 0",
                                    fontWeight: 600,
                                    letterSpacing: 0.4,
                                  }}
                                >
                                  → {program.current_gate}
                                </div>
                              )}
                            </div>
                            {/* Connector */}
                            {i < MODULE_SEQUENCE.length - 1 && (
                              <div
                                style={{
                                  width: 12,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: i < curIdx ? "#a8a59c" : "#dfdcd2",
                                  fontSize: 14,
                                  fontWeight: 700,
                                }}
                              >
                                ›
                              </div>
                            )}
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gate sequence — current module's gates */}
                  <div style={{ marginTop: 16, padding: "14px 16px", background: "#fcfbf9", borderRadius: 10, border: "1px solid #e8e6e1" }}>
                    <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", marginBottom: 10, letterSpacing: 0.6, fontWeight: 700 }}>
                      Gate sequence within {program.current_module}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
                      {GATE_SEQUENCE.map((g, i) => {
                        const curGateIdx = GATE_SEQUENCE.indexOf(program.current_gate);
                        const isCurrent = g === program.current_gate;
                        const isPast = i < curGateIdx;
                        const isFuture = i > curGateIdx;
                        const moduleColor = MODULE_COLORS[program.current_module] || "#1D9E75";

                        return (
                          <Fragment key={g}>
                            <div
                              title={GATE_INFO[g] || ""}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 99,
                                background: isCurrent ? moduleColor : isPast ? "#f0eee8" : "transparent",
                                border: `1px solid ${isCurrent ? moduleColor : isPast ? "#d8d4c8" : "#e8e6e1"}`,
                                color: isCurrent ? "#fff" : isPast ? "#7a7770" : "#c4c1ba",
                                fontSize: 10,
                                fontWeight: isCurrent ? 700 : 500,
                                whiteSpace: "nowrap",
                                cursor: "help",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              {isPast && <span style={{ fontSize: 10, color: "#9a978f" }}>✓</span>}
                              {isCurrent && <span style={{ fontSize: 9, opacity: 0.85 }}>●</span>}
                              <span>{g}</span>
                            </div>
                            {i < GATE_SEQUENCE.length - 1 && (
                              <span
                                style={{
                                  color: i < curGateIdx ? "#a8a59c" : "#dfdcd2",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  margin: "0 6px",
                                }}
                              >
                                ›
                              </span>
                            )}
                          </Fragment>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 10, fontStyle: "italic", lineHeight: 1.4 }}>
                      Hover over a gate to see what it represents.
                    </div>
                  </div>
                </div>
              )}

              {tab === "story" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>Program story</div>
                    <button
                      onClick={() => setShowStoryForm(!showStoryForm)}
                      style={{
                        padding: "5px 12px",
                        border: "1px solid #534AB7",
                        borderRadius: 7,
                        background: showStoryForm ? "#534AB7" : "#fff",
                        color: showStoryForm ? "#fff" : "#534AB7",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {showStoryForm ? "✕ Cancel" : "+ Add Entry"}
                    </button>
                  </div>

                  {showStoryForm && (
                    <QuickStoryForm
                      programId={program.id}
                      ownerName={primaryOwnerName}
                      onShowToast={showToast}
                      onSave={async () => {
                        const s = await fetchProgramStory(program.id);
                        setStories(Array.isArray(s) ? s : []);
                        setShowStoryForm(false);
                      }}
                    />
                  )}

                  {stories.length === 0 ? (
                    <EmptyState
                      icon="📖"
                      title="No story entries yet"
                      hint="Start documenting what's happening in this program."
                    />
                  ) : (
                    <div style={{ position: "relative", paddingLeft: 28 }}>
                      {/* Vertical timeline line */}
                      <div
                        style={{
                          position: "absolute",
                          left: 9,
                          top: 8,
                          bottom: 8,
                          width: 2,
                          background: "linear-gradient(to bottom, #d8d4c8 0%, #d8d4c8 80%, transparent 100%)",
                        }}
                      />
                      {stories.map((s, idx) => {
                        const typeColor =
                          {
                            "Evidence Added": "#185FA5",
                            "Gate Passed": "#0F6E56",
                            "Risk Raised": "#A32D2D",
                            "Protocol Updated": "#639922",
                            "Decision Made": "#BA7517",
                            "Milestone Reached": "#1D9E75",
                            "Governance Review Opened": "#D85A30",
                            "Community Signal Added": "#534AB7",
                          }[s.entry_type] || "#888";

                        return (
                          <div key={s.id} style={{ position: "relative", marginBottom: idx === stories.length - 1 ? 0 : 14 }}>
                            {/* Timeline node */}
                            <div
                              style={{
                                position: "absolute",
                                left: -24,
                                top: 14,
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                background: typeColor,
                                border: "3px solid #fff",
                                boxShadow: `0 0 0 1.5px ${typeColor}, 0 2px 4px rgba(0,0,0,0.08)`,
                                zIndex: 1,
                              }}
                            />
                            <StoryCard entry={s} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === "actions" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>
                      Actions{" "}
                      <span style={{ fontSize: 11, color: "#888", fontWeight: 400 }}>
                        ({openActionsCount} open)
                      </span>
                    </div>
                    <button
                      onClick={() => setShowActionForm(!showActionForm)}
                      style={{
                        padding: "5px 12px",
                        border: "1px solid #1D9E75",
                        borderRadius: 7,
                        background: showActionForm ? "#1D9E75" : "#fff",
                        color: showActionForm ? "#fff" : "#1D9E75",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {showActionForm ? "✕ Cancel" : "+ Add Action"}
                    </button>
                  </div>

                  {showActionForm && (
                    <QuickActionForm
                      programId={program.id}
                      ownerName={primaryOwnerName}
                      onShowToast={showToast}
                      onSave={async () => {
                        const a = await fetchProgramActions(program.id);
                        setActions(Array.isArray(a) ? a : []);
                        setShowActionForm(false);
                      }}
                    />
                  )}

                  {actions.length === 0 ? (
                    <EmptyState
                      icon="✅"
                      title="No actions yet"
                      hint="Add the first action to get this program moving."
                    />
                  ) : (
                    actions.map((a) => (
                      <ActionCard
                        key={a.id}
                        action={a}
                        onStatusChange={handleActionStatusChange}
                      />
                    ))
                  )}
                </div>
              )}

              {tab === "decisions" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>Decision log</div>
                    <button
                      onClick={() => setShowDecisionForm(!showDecisionForm)}
                      style={{
                        padding: "5px 12px",
                        border: "1px solid #D85A30",
                        borderRadius: 7,
                        background: showDecisionForm ? "#D85A30" : "#fff",
                        color: showDecisionForm ? "#fff" : "#D85A30",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {showDecisionForm ? "✕ Cancel" : "+ Record Decision"}
                    </button>
                  </div>

                  {showDecisionForm && (
                    <QuickDecisionForm
                      programId={program.id}
                      ownerName={primaryOwnerName}
                      onShowToast={showToast}
                      onSave={async () => {
                        const d = await fetchProgramDecisions(program.id);
                        setDecisions(Array.isArray(d) ? d : []);
                        setShowDecisionForm(false);
                      }}
                    />
                  )}

                  {decisions.length === 0 ? (
                    <EmptyState
                      icon="⚖️"
                      title="No decisions recorded"
                      hint="Document key decisions to build institutional memory."
                    />
                  ) : (
                    decisions.map((d) => <DecisionCard key={d.id} decision={d} />)
                  )}
                </div>
              )}

              {tab === "contributions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* Read-only notice */}
                  <div style={{ padding: "10px 14px", background: "#FBEAF0", borderRadius: 8, fontSize: 11, color: "#72243E", lineHeight: 1.5 }}>
                    <strong>Read-only.</strong> Contribution akışı şu an seed kayıtları gösteriyor.
                    Yeni contribution ekleme ve doğrulama akışı, çoklu kullanıcı katmanı (open platform) kurulduğunda açılacak.
                  </div>

                  {/* ─── AUTHORITY LEADERBOARD ─── */}
                  {authority.length > 0 && (
                    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e6e1", padding: "16px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                        <div style={{ fontSize: 9, color: "#993556", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
                          Authority · {authority.length} {authority.length === 1 ? "researcher" : "researchers"}
                        </div>
                        <div style={{ fontSize: 9, color: "#888" }}>
                          Verified contributions only
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {authority.map((row, i) => {
                          const score = parseFloat(row.authority_score) || 0;
                          const barWidth = Math.min(100, Math.max(0, score));
                          return (
                            <div key={row.researcher_id || i} style={{ padding: "10px 12px", background: "#fcfbf9", borderRadius: 8, border: "1px solid #f4f3ef" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                                  <span style={{ fontSize: 10, color: "#888", fontWeight: 700, minWidth: 18 }}>
                                    #{i + 1}
                                  </span>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {row.researcher_name || "Unknown"}
                                    </div>
                                    <div style={{ fontSize: 10, color: "#888" }}>
                                      {row.verified_count} verified · {row.contribution_count} total
                                    </div>
                                  </div>
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: "#993556", fontFamily: "Georgia,serif", flexShrink: 0 }}>
                                  {score.toFixed(0)}
                                </div>
                              </div>
                              {/* Authority score bar */}
                              <div style={{ height: 4, background: "#f4f3ef", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                                <div style={{ height: "100%", width: `${barWidth}%`, background: "linear-gradient(90deg, #D4537E, #993556)" }} />
                              </div>
                              {/* 4-dimensional breakdown */}
                              <div style={{ display: "flex", gap: 12, fontSize: 9, color: "#888" }}>
                                <span><strong style={{ color: "#5f5e5a" }}>Contribution</strong> {row.avg_contribution || "—"}</span>
                                <span><strong style={{ color: "#5f5e5a" }}>Impact</strong> {row.avg_impact || "—"}</span>
                                <span><strong style={{ color: "#5f5e5a" }}>Reliability</strong> {row.avg_reliability || "—"}</span>
                                <span><strong style={{ color: "#5f5e5a" }}>Relevance</strong> {row.avg_relevance || "—"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #e8e6e1", fontSize: 9, color: "#b4b2a9", lineHeight: 1.5 }}>
                        Authority = 0.30·Contribution + 0.30·Impact + 0.25·Reliability + 0.15·Relevance
                      </div>
                    </div>
                  )}

                  {/* ─── CONTRIBUTION TIMELINE ─── */}
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e6e1", padding: "16px 18px" }}>
                    <div style={{ fontSize: 9, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700, marginBottom: 12 }}>
                      Contributions · {contributions.length}
                    </div>
                    {contributions.length === 0 ? (
                      <div style={{ fontSize: 12, color: "#b4b2a9", fontStyle: "italic" }}>
                        No contributions yet. Authority emerges from verified work — each contribution recorded here adds to a researcher's standing in this program.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {contributions.map((c) => <ContributionCard key={c.id} contribution={c} />)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === "linked" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* ─── LINKED SPECIES ─── */}
                  {sortedSpecies.length > 0 && (
                    <div style={{ background: "#fff", borderRadius: 12, border: "2px solid #1D9E75", padding: "16px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                        <div style={{ fontSize: 9, color: "#085041", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
                          Species in this program · {sortedSpecies.length}
                        </div>
                        {sortedSpecies.length > 1 && (
                          <div style={{ fontSize: 10, color: "#888" }}>
                            {sortedSpecies.filter(s => s.role === "Primary").length} primary · {sortedSpecies.filter(s => s.role !== "Primary").length} linked
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {sortedSpecies.map((ps) => {
                          const sp = ps.species;
                          if (!sp) return null;
                          const isPrimary = ps.role === "Primary";
                          return (
                            <div key={ps.id || sp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", background: isPrimary ? "#fcfbf9" : "transparent", borderRadius: 8, border: isPrimary ? "1px solid #1D9E7544" : "1px solid #f4f3ef" }}>
                            {sp.thumbnail_url && (
                              <img
                                src={sp.thumbnail_url}
                                alt={sp.accepted_name}
                                style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", fontStyle: "italic", fontFamily: "Georgia,serif" }}>
                                  {sp.accepted_name}
                                </span>
                                {isPrimary && (
                                  <span style={{ fontSize: 9, padding: "1px 7px", borderRadius: 99, background: "#1D9E75", color: "#fff", fontWeight: 700, letterSpacing: 0.3 }}>
                                    PRIMARY
                                  </span>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap", fontSize: 10, color: "#888" }}>
                                {sp.family && <span>{sp.family}</span>}
                                {sp.iucn_status && (
                                  <span style={{ padding: "1px 7px", borderRadius: 99, background: "#f4f3ef", fontWeight: 600 }}>
                                    IUCN: {sp.iucn_status}
                                  </span>
                                )}
                                {typeof sp.composite_score === "number" && (
                                  <span>Score: {sp.composite_score}</span>
                                )}
                              </div>
                            </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ─── TEAM (Owners + Contributors) ─── */}
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e6e1", padding: "16px 18px" }}>
                    <div style={{ fontSize: 9, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700, marginBottom: 12 }}>
                      Team · {members.length} {members.length === 1 ? "member" : "members"}
                    </div>

                    {/* Owners + co-owners (top, distinct) */}
                    {owners.length > 0 && (
                      <div style={{ marginBottom: contributors.length > 0 ? 14 : 0 }}>
                        <div style={{ fontSize: 9, color: "#888", marginBottom: 6, fontWeight: 600 }}>
                          {owners.length === 1 ? "Owner" : `Owners (${owners.length})`}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {owners.map((m) => (
                            <div key={m.id || m.researcher_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 10px", background: "#E1F5EE", borderRadius: 8, fontSize: 12, border: "1px solid #1D9E7544" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: 14 }}>★</span>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ color: "#085041", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {m.researchers?.name || "Unknown"}
                                  </div>
                                  {m.researchers?.institution && (
                                    <div style={{ fontSize: 10, color: "#0F6E56", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {m.researchers.institution}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#1D9E75", color: "#fff", fontWeight: 700, flexShrink: 0, textTransform: "uppercase", letterSpacing: 0.3 }}>
                                {m.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contributors (bottom) */}
                    {contributors.length > 0 ? (
                      <div>
                        <div style={{ fontSize: 9, color: "#888", marginBottom: 6, fontWeight: 600 }}>
                          Contributors ({contributors.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {contributors.map((m) => (
                            <div key={m.id || m.researcher_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 10px", background: "#fcfbf9", borderRadius: 8, fontSize: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: 14 }}>👤</span>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ color: "#2c2c2a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {m.researchers?.name || "Unknown researcher"}
                                  </div>
                                  {m.researchers?.institution && (
                                    <div style={{ fontSize: 10, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {m.researchers.institution}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {m.role && (
                                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#f4f3ef", color: "#5f5e5a", fontWeight: 600, flexShrink: 0 }}>
                                  {m.role}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : owners.length === 0 ? (
                      <div style={{ fontSize: 12, color: "#b4b2a9", fontStyle: "italic" }}>
                        No team members yet.
                      </div>
                    ) : null}
                  </div>

                  {/* ─── EVIDENCE (Linked publications) ─── */}
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e6e1", padding: "16px 18px" }}>
                    <div style={{ fontSize: 9, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700, marginBottom: 12 }}>
                      Evidence base · {linkedPubs.length} {linkedPubs.length === 1 ? "publication" : "publications"}
                    </div>
                    {linkedPubs.length === 0 ? (
                      <div style={{ fontSize: 12, color: "#b4b2a9", fontStyle: "italic" }}>
                        No publications linked to this program yet.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {linkedPubs.map((pp) => {
                          const p = pp.publications;
                          if (!p) return null;
                          return (
                            <div key={pp.id || p.id} style={{ padding: "10px 12px", background: "#fcfbf9", borderRadius: 8, border: "1px solid #f4f3ef" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                                {p.is_curated && (
                                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: "#E1F5EE", color: "#085041", fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                                    CURATED
                                  </span>
                                )}
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a", lineHeight: 1.4, flex: 1 }}>
                                  {p.title || "Untitled"}
                                </div>
                              </div>
                              <div style={{ fontSize: 10, color: "#888", marginLeft: p.is_curated ? 0 : 0 }}>
                                {(() => {
                                  if (!p.authors) return "Unknown author";
                                  const a = p.authors.length > 60 ? p.authors.slice(0, 60) + "..." : p.authors;
                                  return a;
                                })()}
                                {p.year && <span> · {p.year}</span>}
                                {p.journal && <span> · <em>{p.journal}</em></span>}
                              </div>
                              {p.doi && (
                                <a
                                  href={`https://doi.org/${p.doi}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: 10, color: "#1D9E75", marginTop: 4, display: "inline-block", textDecoration: "none" }}
                                >
                                  doi.org/{p.doi} →
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ─── AUDIT TRAIL ─── */}
                  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e6e1", padding: "16px 18px" }}>
                    <div style={{ fontSize: 9, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700, marginBottom: 12 }}>
                      Audit trail
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {[
                        { l: "Program code", v: program.program_code, mono: true },
                        { l: "Program ID", v: program.id, mono: true },
                        {
                          l: "Created by",
                          v: program.created_at && primaryOwnerName
                            ? `${primaryOwnerName} · ${new Date(program.created_at).toISOString().slice(0,10)}`
                            : primaryOwnerName || (program.created_at ? new Date(program.created_at).toISOString().slice(0,10) : null)
                        },
                        { l: "Status", v: program.status },
                        { l: "Module / Gate", v: `${program.current_module || "—"} / ${program.current_gate || "—"}` },
                        { l: "Last updated", v: program.updated_at ? new Date(program.updated_at).toISOString().slice(0, 10) : null },
                        { l: "Story entries", v: stories.length },
                        { l: "Actions", v: actions.length },
                        { l: "Decisions", v: decisions.length },
                      ].filter((x) => x.v !== null && x.v !== undefined && x.v !== "").map(({ l, v, mono }) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "0.5px solid #f4f3ef", fontSize: 11, gap: 12 }}>
                          <span style={{ color: "#888", flexShrink: 0 }}>{l}</span>
                          <span style={{ fontWeight: 500, color: "#2c2c2a", fontFamily: mono ? "monospace" : "inherit", fontSize: mono ? 10 : 11, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getNextGate(program) {
  if (!program) return "Complete";

  const gIdx = GATE_SEQUENCE.indexOf(program.current_gate);
  const mIdx = MODULE_SEQUENCE.indexOf(program.current_module);

  if (gIdx !== -1 && gIdx < GATE_SEQUENCE.length - 1) {
    return GATE_SEQUENCE[gIdx + 1];
  }

  if (mIdx !== -1 && mIdx < MODULE_SEQUENCE.length - 1) {
    return `${MODULE_SEQUENCE[mIdx + 1]}/Selection`;
  }

  return "Complete";
}

function InfoBlock({ color, label, text, bg }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: bg || "#f8f7f4",
        borderRadius: 8,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, color: "#2c2c2a", lineHeight: 1.7 }}>{text}</div>
    </div>
  );
}

function EmptyField({ label, hint }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: "#fafafa",
        borderRadius: 8,
        border: "1px dashed #e8e6e1",
      }}
    >
      <div style={{ fontSize: 9, color: "#b4b2a9", textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 11, color: "#b4b2a9", fontStyle: "italic" }}>{hint}</div>
    </div>
  );
}

function EmptyState({ icon, title, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#2c2c2a", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>{hint}</div>
    </div>
  );
}

function StoryCard({ entry }) {
  const typeColor =
    {
      "Evidence Added": "#185FA5",
      "Gate Passed": "#0F6E56",
      "Risk Raised": "#A32D2D",
      "Protocol Updated": "#639922",
      "Decision Made": "#BA7517",
      "Milestone Reached": "#1D9E75",
      "Governance Review Opened": "#D85A30",
      "Community Signal Added": "#534AB7",
    }[entry.entry_type] || "#888";

  return (
    <div
      style={{
        padding: "12px 14px",
        background: "#f8f7f4",
        borderRadius: 8,
        borderLeft: `3px solid ${typeColor}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a" }}>{entry.title}</span>
        <span style={{ fontSize: 9, color: "#888", flexShrink: 0, marginLeft: 8 }}>
          {entry.entry_date}
        </span>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 9,
            padding: "1px 7px",
            borderRadius: 99,
            background: `${typeColor}18`,
            color: typeColor,
            fontWeight: 600,
          }}
        >
          {entry.entry_type}
        </span>

        {entry.linked_module && (
          <span
            style={{
              fontSize: 9,
              padding: "1px 7px",
              borderRadius: 99,
              background: "#f4f3ef",
              color: "#5f5e5a",
            }}
          >
            {entry.linked_module}
          </span>
        )}

        {entry.linked_gate && (
          <span
            style={{
              fontSize: 9,
              padding: "1px 7px",
              borderRadius: 99,
              background: "#f4f3ef",
              color: "#5f5e5a",
            }}
          >
            {entry.linked_gate}
          </span>
        )}
      </div>

      {entry.summary && (
        <div style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.6 }}>{entry.summary}</div>
      )}

      {entry.author && <div style={{ fontSize: 9, color: "#b4b2a9", marginTop: 6 }}>— {entry.author}</div>}
    </div>
  );
}

function ActionCard({ action, onStatusChange }) {
  const isCompleted = ["completed", "Completed"].includes(action.status);
  const isBlocked = ["blocked", "Blocked"].includes(action.status);
  const isHigh = action.priority === "high";
  const borderColor = isCompleted ? "#1D9E75" : isBlocked ? "#A32D2D" : isHigh ? "#BA7517" : "#e8e6e1";

  return (
    <div
      style={{
        marginBottom: 8,
        padding: "12px 14px",
        background: "#f8f7f4",
        borderRadius: 8,
        borderLeft: `3px solid ${borderColor}`,
        opacity: isCompleted ? 0.6 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#2c2c2a",
              textDecoration: isCompleted ? "line-through" : "none",
            }}
          >
            {action.action_title}
          </div>

          {action.action_description && (
            <div style={{ fontSize: 11, color: "#5f5e5a", marginTop: 4 }}>
              {action.action_description}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, fontSize: 10, color: "#888", marginTop: 4, flexWrap: "wrap" }}>
            {action.action_owner && <span>👤 {action.action_owner}</span>}
            {action.due_date && <span>📅 {action.due_date}</span>}
          </div>
        </div>

        <select
          value={action.status}
          onChange={(e) => onStatusChange(action.id, e.target.value)}
          style={{
            fontSize: 10,
            padding: "3px 6px",
            border: "1px solid #e8e6e1",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <option value="open">Open</option>
          <option value="in progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
          <option value="dropped">Dropped</option>
        </select>
      </div>
    </div>
  );
}

function DecisionCard({ decision }) {
  return (
    <div
      style={{
        marginBottom: 10,
        padding: "12px 14px",
        background: "#f8f7f4",
        borderRadius: 8,
        borderLeft: "3px solid #D85A30",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a" }}>
          {decision.decision_title}
        </span>
        <span style={{ fontSize: 9, color: "#888", flexShrink: 0, marginLeft: 8 }}>
          {decision.decision_date}
        </span>
      </div>

      {decision.decision_type && (
        <span
          style={{
            fontSize: 9,
            padding: "1px 7px",
            borderRadius: 99,
            background: "#FAECE7",
            color: "#712B13",
            display: "inline-block",
            marginBottom: 6,
          }}
        >
          {decision.decision_type}
        </span>
      )}

      {decision.rationale && (
        <div style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.6, marginTop: 4 }}>
          {decision.rationale}
        </div>
      )}

      {decision.impact_summary && (
        <div style={{ fontSize: 10, color: "#888", marginTop: 6, fontStyle: "italic" }}>
          Impact: {decision.impact_summary}
        </div>
      )}

      {decision.made_by && <div style={{ fontSize: 9, color: "#b4b2a9", marginTop: 4 }}>— {decision.made_by}</div>}
    </div>
  );
}

const CONTRIBUTION_TYPE_META = {
  evidence:         { color: "#185FA5", bg: "#E6F1FB", label: "Evidence" },
  protocol:         { color: "#0F6E56", bg: "#E1F5EE", label: "Protocol" },
  analysis:         { color: "#534AB7", bg: "#EEEDFE", label: "Analysis" },
  fieldwork:        { color: "#3B6D11", bg: "#EAF3DE", label: "Fieldwork" },
  lab_work:         { color: "#993556", bg: "#FBEAF0", label: "Lab work" },
  governance:       { color: "#854F0B", bg: "#FAEEDA", label: "Governance" },
  mentorship:       { color: "#5F5E5A", bg: "#F1EFE8", label: "Mentorship" },
  curation:         { color: "#0C447C", bg: "#E6F1FB", label: "Curation" },
  review:           { color: "#444441", bg: "#F1EFE8", label: "Review" },
  program_creation: { color: "#085041", bg: "#E1F5EE", label: "Program creation" },
  other:            { color: "#5F5E5A", bg: "#F1EFE8", label: "Other" },
};

const STATUS_META = {
  verified:  { color: "#085041", bg: "#E1F5EE", label: "Verified" },
  pending:   { color: "#854F0B", bg: "#FAEEDA", label: "Pending" },
  disputed:  { color: "#A32D2D", bg: "#FCEBEB", label: "Disputed" },
  rejected:  { color: "#888780", bg: "#F1EFE8", label: "Rejected" },
  archived:  { color: "#888780", bg: "#F1EFE8", label: "Archived" },
};

function ContributionCard({ contribution }) {
  const c = contribution;
  const typeMeta   = CONTRIBUTION_TYPE_META[c.contribution_type] || CONTRIBUTION_TYPE_META.other;
  const statusMeta = STATUS_META[c.status] || STATUS_META.pending;
  const isVerified = c.status === "verified";
  // Self-verification = contributor doğrulayan kişi olarak kendisi (geçici durum, B seansında not edildi)
  const isSelfVerified = isVerified && c.contributor?.id && c.verifier?.id && c.contributor.id === c.verifier.id;

  return (
    <div
      style={{
        padding: "12px 14px",
        background: "#fcfbf9",
        borderRadius: 8,
        borderLeft: `3px solid ${typeMeta.color}`,
        opacity: c.status === "rejected" || c.status === "archived" ? 0.55 : 1,
      }}
    >
      {/* Header: type + status + date */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: typeMeta.bg, color: typeMeta.color, fontWeight: 700, letterSpacing: 0.3 }}>
          {typeMeta.label}
        </span>
        <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: statusMeta.bg, color: statusMeta.color, fontWeight: 600 }}>
          {statusMeta.label}
        </span>
        {isSelfVerified && (
          <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: "#F1EFE8", color: "#888780", fontStyle: "italic" }}>
            Self-verified
          </span>
        )}
        <span style={{ fontSize: 9, color: "#b4b2a9", marginLeft: "auto" }}>
          {c.created_at ? new Date(c.created_at).toISOString().slice(0, 10) : ""}
        </span>
      </div>

      {/* What was done */}
      {c.what_was_done && (
        <div style={{ fontSize: 12, color: "#2c2c2a", lineHeight: 1.5, marginBottom: 6, fontWeight: 500 }}>
          {c.what_was_done}
        </div>
      )}

      {/* How */}
      {c.how_it_was_done && (
        <div style={{ fontSize: 10, color: "#5f5e5a", lineHeight: 1.55, marginBottom: 6 }}>
          <span style={{ color: "#888", fontWeight: 600 }}>How:</span> {c.how_it_was_done}
        </div>
      )}

      {/* Result */}
      {c.result_summary && (
        <div style={{ fontSize: 10, color: "#5f5e5a", lineHeight: 1.55, marginBottom: 6, fontStyle: "italic" }}>
          → {c.result_summary}
        </div>
      )}

      {/* 4-dimensional scores (only if any are set) */}
      {(c.contribution_score != null || c.impact_score != null || c.reliability_score != null || c.relevance_score != null) && (
        <div style={{ display: "flex", gap: 10, fontSize: 9, color: "#888", paddingTop: 6, marginTop: 4, borderTop: "0.5px dashed #e8e6e1", flexWrap: "wrap" }}>
          {c.contribution_score != null && <span><strong style={{ color: "#5f5e5a" }}>C</strong> {c.contribution_score}</span>}
          {c.impact_score        != null && <span><strong style={{ color: "#5f5e5a" }}>I</strong> {c.impact_score}</span>}
          {c.reliability_score   != null && <span><strong style={{ color: "#5f5e5a" }}>R</strong> {c.reliability_score}</span>}
          {c.relevance_score     != null && <span><strong style={{ color: "#5f5e5a" }}>Rel</strong> {c.relevance_score}</span>}
        </div>
      )}

      {/* Footer: contributor + verifier */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 10, color: "#888" }}>
          By <strong style={{ color: "#2c2c2a" }}>{c.contributor?.name || "Unknown"}</strong>
          {c.contributor?.institution && (
            <span style={{ color: "#b4b2a9" }}> · {c.contributor.institution}</span>
          )}
        </div>
        {isVerified && c.verifier?.name && !isSelfVerified && (
          <div style={{ fontSize: 9, color: "#085041" }}>
            ✓ Verified by {c.verifier.name}
          </div>
        )}
      </div>
    </div>
  );
}

const INP = {
  padding: "8px 10px",
  border: "1px solid #e8e6e1",
  borderRadius: 6,
  fontSize: 11,
  background: "#fff",
  outline: "none",
  color: "#2c2c2a",
  width: "100%",
};

const LBL = {
  fontSize: 9,
  color: "#888",
  marginBottom: 3,
  display: "block",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const HINT = {
  fontSize: 10,
  color: "#888",
  marginTop: 4,
  fontStyle: "italic",
  lineHeight: 1.4,
};

const ERR_BOX = {
  marginBottom: 12,
  padding: "10px 12px",
  background: "#FCEBE8",
  border: "1px solid #E8B4AB",
  borderRadius: 7,
  color: "#A32D2D",
  fontSize: 11,
  lineHeight: 1.5,
};

function QuickStoryForm({ programId, ownerName, onSave, onShowToast }) {
  const [form, setForm] = useState({
    entry_type: "Evidence Added",
    title: "",
    summary: "",
    author: ownerName || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const TITLE_MIN = 5;
  const TITLE_MAX = 120;
  const SUMMARY_MAX = 500;

  const titleValid = form.title.trim().length >= TITLE_MIN && form.title.length <= TITLE_MAX;
  const canSubmit = titleValid && !loading;

  async function save() {
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (form.title.trim().length < TITLE_MIN) {
      setError(`Title must be at least ${TITLE_MIN} characters.`);
      return;
    }
    if (form.title.length > TITLE_MAX) {
      setError(`Title cannot exceed ${TITLE_MAX} characters.`);
      return;
    }
    setLoading(true);
    try {
      await createProgramStoryEntry({ ...form, program_id: programId });
      onShowToast?.("success", "Story entry added successfully.");
      await onSave();
    } catch (e) {
      setError(e.message || "Could not save. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, background: "#EEEDFE", borderRadius: 10, marginBottom: 14 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={LBL}>Entry type</label>
        <select
          value={form.entry_type}
          onChange={(e) => setForm({ ...form, entry_type: e.target.value })}
          style={INP}
        >
          {[
            "Evidence Added",
            "Gate Passed",
            "Risk Raised",
            "Protocol Updated",
            "Governance Review Opened",
            "Community Signal Added",
            "Decision Made",
            "Milestone Reached",
          ].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div style={HINT}>What kind of update is this?</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={LBL}>
          Title <span style={{ color: "#A32D2D" }}>*</span>
          <span style={{ float: "right", color: form.title.length > TITLE_MAX ? "#A32D2D" : "#888", fontSize: 10, fontWeight: 400 }}>
            {form.title.length} / {TITLE_MAX}
          </span>
        </label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          style={{ ...INP, borderColor: form.title && !titleValid ? "#A32D2D" : "#e8e6e1" }}
          placeholder="What happened?"
          maxLength={TITLE_MAX + 20}
        />
        <div style={HINT}>Short, specific. e.g. "In vitro propagation paper added (Tsaballa 2023)"</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={LBL}>
          Summary
          <span style={{ float: "right", color: form.summary.length > SUMMARY_MAX ? "#A32D2D" : "#888", fontSize: 10, fontWeight: 400 }}>
            {form.summary.length} / {SUMMARY_MAX}
          </span>
        </label>
        <textarea
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          rows={3}
          style={{ ...INP, resize: "vertical" }}
          placeholder="Optional details, context, next steps..."
          maxLength={SUMMARY_MAX + 50}
        />
        <div style={HINT}>Optional. Why does this matter for the program?</div>
      </div>

      {error && (
        <div style={ERR_BOX}>
          <span style={{ fontWeight: 600 }}>⚠ Error:</span> {error}
        </div>
      )}

      <button
        disabled={!canSubmit}
        onClick={save}
        style={{
          padding: "9px 22px",
          border: "none",
          borderRadius: 7,
          background: !canSubmit ? "#ccc" : "#534AB7",
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          cursor: !canSubmit ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
      >
        {loading ? "Saving..." : "Save Entry"}
      </button>
    </div>
  );
}

function QuickActionForm({ programId, ownerName, onSave, onShowToast }) {
  const [form, setForm] = useState({
    action_title: "",
    action_owner: ownerName || "",
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const TITLE_MIN = 5;
  const TITLE_MAX = 140;

  const titleValid = form.action_title.trim().length >= TITLE_MIN && form.action_title.length <= TITLE_MAX;
  const canSubmit = titleValid && !loading;

  async function save() {
    setError(null);
    if (!form.action_title.trim()) {
      setError("Action description is required.");
      return;
    }
    if (form.action_title.trim().length < TITLE_MIN) {
      setError(`Action must be at least ${TITLE_MIN} characters.`);
      return;
    }
    if (form.action_title.length > TITLE_MAX) {
      setError(`Action cannot exceed ${TITLE_MAX} characters.`);
      return;
    }
    setLoading(true);
    try {
      await createProgramAction({ ...form, program_id: programId });
      onShowToast?.("success", "Action added successfully.");
      await onSave();
    } catch (e) {
      setError(e.message || "Could not save. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, background: "#E1F5EE", borderRadius: 10, marginBottom: 14 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={LBL}>
          Action <span style={{ color: "#A32D2D" }}>*</span>
          <span style={{ float: "right", color: form.action_title.length > TITLE_MAX ? "#A32D2D" : "#888", fontSize: 10, fontWeight: 400 }}>
            {form.action_title.length} / {TITLE_MAX}
          </span>
        </label>
        <input
          value={form.action_title}
          onChange={(e) => setForm({ ...form, action_title: e.target.value })}
          style={{ ...INP, borderColor: form.action_title && !titleValid ? "#A32D2D" : "#e8e6e1" }}
          placeholder="What needs to be done?"
          maxLength={TITLE_MAX + 20}
        />
        <div style={HINT}>Specific, time-bound, actionable. e.g. "Map salep harvest pressure across Turkish provinces by Q3"</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={LBL}>Owner</label>
          <input
            value={form.action_owner}
            onChange={(e) => setForm({ ...form, action_owner: e.target.value })}
            style={INP}
            placeholder="Who is responsible?"
          />
          <div style={HINT}>Person accountable</div>
        </div>
        <div>
          <label style={LBL}>Priority</label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            style={INP}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <div style={HINT}>Urgency level</div>
        </div>
      </div>

      {error && (
        <div style={ERR_BOX}>
          <span style={{ fontWeight: 600 }}>⚠ Error:</span> {error}
        </div>
      )}

      <button
        disabled={!canSubmit}
        onClick={save}
        style={{
          padding: "9px 22px",
          border: "none",
          borderRadius: 7,
          background: !canSubmit ? "#ccc" : "#1D9E75",
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          cursor: !canSubmit ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
      >
        {loading ? "Saving..." : "Save Action"}
      </button>
    </div>
  );
}

function QuickDecisionForm({ programId, ownerName, onSave, onShowToast }) {
  const [form, setForm] = useState({
    decision_title: "",
    decision_type: "Gate Decision",
    rationale: "",
    made_by: ownerName || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const TITLE_MIN = 5;
  const TITLE_MAX = 120;
  const RATIONALE_MAX = 500;

  const titleValid = form.decision_title.trim().length >= TITLE_MIN && form.decision_title.length <= TITLE_MAX;
  const canSubmit = titleValid && !loading;

  async function save() {
    setError(null);
    if (!form.decision_title.trim()) {
      setError("Decision title is required.");
      return;
    }
    if (form.decision_title.trim().length < TITLE_MIN) {
      setError(`Title must be at least ${TITLE_MIN} characters.`);
      return;
    }
    if (form.decision_title.length > TITLE_MAX) {
      setError(`Title cannot exceed ${TITLE_MAX} characters.`);
      return;
    }
    setLoading(true);
    try {
      await createProgramDecision({ ...form, program_id: programId });
      onShowToast?.("success", "Decision recorded successfully.");
      await onSave();
    } catch (e) {
      setError(e.message || "Could not save. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, background: "#FAECE7", borderRadius: 10, marginBottom: 14 }}>
      <div style={{ marginBottom: 12 }}>
        <label style={LBL}>
          Decision title <span style={{ color: "#A32D2D" }}>*</span>
          <span style={{ float: "right", color: form.decision_title.length > TITLE_MAX ? "#A32D2D" : "#888", fontSize: 10, fontWeight: 400 }}>
            {form.decision_title.length} / {TITLE_MAX}
          </span>
        </label>
        <input
          value={form.decision_title}
          onChange={(e) => setForm({ ...form, decision_title: e.target.value })}
          style={{ ...INP, borderColor: form.decision_title && !titleValid ? "#A32D2D" : "#e8e6e1" }}
          placeholder="What was decided?"
          maxLength={TITLE_MAX + 20}
        />
        <div style={HINT}>State the decision clearly. e.g. "Approved Hybrid pathway for Salep program"</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={LBL}>Decision type</label>
        <select
          value={form.decision_type}
          onChange={(e) => setForm({ ...form, decision_type: e.target.value })}
          style={INP}
        >
          {[
            "Gate Decision",
            "Program Launch",
            "Risk Escalation",
            "Module Transition",
            "Governance Review",
            "Strategic Pivot",
          ].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div style={HINT}>Category of decision</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={LBL}>
          Rationale
          <span style={{ float: "right", color: form.rationale.length > RATIONALE_MAX ? "#A32D2D" : "#888", fontSize: 10, fontWeight: 400 }}>
            {form.rationale.length} / {RATIONALE_MAX}
          </span>
        </label>
        <textarea
          value={form.rationale}
          onChange={(e) => setForm({ ...form, rationale: e.target.value })}
          rows={3}
          style={{ ...INP, resize: "vertical" }}
          placeholder="Why was this decision made? What evidence supports it?"
          maxLength={RATIONALE_MAX + 50}
        />
        <div style={HINT}>Optional but recommended. Future contributors will thank you.</div>
      </div>

      {error && (
        <div style={ERR_BOX}>
          <span style={{ fontWeight: 600 }}>⚠ Error:</span> {error}
        </div>
      )}

      <button
        disabled={!canSubmit}
        onClick={save}
        style={{
          padding: "9px 22px",
          border: "none",
          borderRadius: 7,
          background: !canSubmit ? "#ccc" : "#D85A30",
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          cursor: !canSubmit ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
      >
        {loading ? "Saving..." : "Record Decision"}
      </button>
    </div>
  );
}
