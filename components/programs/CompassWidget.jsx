"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const STATUS_COLORS = {
  on_track:        { color: "#5DCAA5", bg: "rgba(93, 202, 165, 0.12)", label: "On Track" },
  needs_attention: { color: "#FCDE5A", bg: "rgba(252, 222, 90, 0.12)", label: "Needs Attention" },
  at_risk:         { color: "#ED827E", bg: "rgba(237, 130, 126, 0.12)", label: "At Risk" },
};

const SERIF = "Georgia, 'Times New Roman', serif";

const QUESTIONS = [
  {
    title: "What am I looking at?",
    sub: "In plain language.",
    body: "Twelve actions the program is committing to, each placed in one of seven regions of a Venn diagram. The region tells you which value axes the action advances; the priority weight (CRIT/HIGH/SUP) tells you how heavily it counts.",
    pull: "An action's region is its meaning. Its weight is its urgency.",
  },
  {
    title: "How is this program doing?",
    sub: "An honest read.",
    live: true,
  },
  {
    title: "Why does it matter?",
    sub: "For this program, today.",
    body: "The breakdown reveals where the program's attention is. Most tics live in Knowledge-backed Safeguard (X∩Y) — meaning the science directly serves conservation. The empty Pure Value (Z) and Integrated Core are the program's future, not its absence.",
    pull: "A program is not penalized for an empty core — it's invited toward it.",
  },
  {
    title: "Why is the Integrated Core empty?",
    sub: "Specific to this screen.",
    body: "The Integrated Core is reachable only through actions that serve all three axes at once. For Fritillaria, the most likely first xyz action is in vitro protocol validation — which unlocks after the Field & Lab gate.",
    accent: "purple",
  },
];

export default function CompassWidget({ programId }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(1); // Q2 expanded by default
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(null);

  // ESC closes the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Fetch health assessment when panel opens (and Q2 is the live one)
  useEffect(() => {
    if (!open || !programId) return;
    let cancelled = false;
    setHealthLoading(true);
    setHealthError(null);
    (async () => {
      const { data, error } = await supabase.rpc(
        "get_program_health_assessment",
        { p_program_id: programId }
      );
      if (cancelled) return;
      if (error) setHealthError(error);
      else setHealth(data);
      setHealthLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, programId]);

  return (
    <>
      {/* Pulse keyframes (scoped via unique class names) */}
      <style>{`
        @keyframes compass-pulse {
          0%   { transform: scale(1);   opacity: 0.55; }
          70%  { transform: scale(1.9); opacity: 0;    }
          100% { transform: scale(1.9); opacity: 0;    }
        }
        @keyframes compass-glow {
          0%, 100% { box-shadow: 0 0 18px rgba(252, 222, 90, 0.45); }
          50%      { box-shadow: 0 0 28px rgba(252, 222, 90, 0.7);  }
        }
      `}</style>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Compass"
          style={{
            position: "fixed",
            bottom: 84,
            right: 20,
            width: 380,
            maxHeight: 600,
            overflowY: "auto",
            background:
              "linear-gradient(180deg, rgba(30, 42, 55, 0.97) 0%, rgba(20, 28, 38, 0.99) 100%)",
            border: "0.5px solid rgba(252, 222, 90, 0.3)",
            borderRadius: 14,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
            color: "#e8e6e1",
            zIndex: 9998,
            fontFamily:
              "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* A — Header */}
          <div
            style={{
              padding: "16px 18px 14px",
              borderBottom: "0.5px solid rgba(252, 222, 90, 0.15)",
              position: "relative",
            }}
          >
            <div
              style={{
                color: "#FCDE5A",
                fontSize: 10,
                letterSpacing: 3,
                fontWeight: 700,
              }}
            >
              COMPASS
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "#9aa6ad",
                fontStyle: "italic",
                fontFamily: SERIF,
                paddingRight: 24,
              }}
            >
              You are looking at Fritillaria imperialis.
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close compass"
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 24,
                height: 24,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: "#9aa6ad",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>

          {/* B — Question cards */}
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {QUESTIONS.map((q, i) => {
              const isOpen = expanded === i;
              const isPurple = q.accent === "purple";
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 10,
                    background: isPurple
                      ? "rgba(175, 169, 236, 0.06)"
                      : "rgba(255, 255, 255, 0.025)",
                    border: isPurple
                      ? "0.5px solid rgba(175, 169, 236, 0.2)"
                      : "0.5px solid rgba(255, 255, 255, 0.06)",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setExpanded(isOpen ? -1 : i)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#FCDE5A",
                        color: "#1a1f24",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "#e8e6e1",
                        }}
                      >
                        {q.title}
                      </div>
                      <div
                        style={{
                          fontSize: 10.5,
                          color: "#7a858d",
                          marginTop: 1,
                        }}
                      >
                        {q.sub}
                      </div>
                    </span>
                    <span
                      style={{
                        color: "#7a858d",
                        fontSize: 11,
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.18s ease",
                      }}
                    >
                      ▾
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: "0 14px 14px 42px",
                        fontSize: 12.5,
                        lineHeight: 1.6,
                        color: "#c9cfd4",
                      }}
                    >
                      {q.live ? (
                        <LiveAssessment
                          loading={healthLoading}
                          error={healthError}
                          data={health}
                          hasProgramId={Boolean(programId)}
                        />
                      ) : (
                        <>
                          <div>{q.body}</div>
                          {q.pull && (
                            <div
                              style={{
                                marginTop: 10,
                                padding: "8px 10px",
                                borderLeft: "1.5px solid #FCDE5A",
                                fontStyle: "italic",
                                fontFamily: SERIF,
                                color: "#FCDE5A",
                                fontSize: 12.5,
                                lineHeight: 1.5,
                              }}
                            >
                              {q.pull}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* C — Footer */}
          <div
            style={{
              padding: "10px 16px 12px",
              borderTop: "0.5px solid rgba(252, 222, 90, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 10.5,
            }}
          >
            <button
              onClick={() => console.log("[Compass] Glossary clicked")}
              style={{
                background: "transparent",
                border: "none",
                color: "#FCDE5A",
                cursor: "pointer",
                fontSize: 10.5,
                padding: 0,
              }}
            >
              Glossary
            </button>
            <span style={{ color: "#5a656d", letterSpacing: 1.5 }}>
              VIEWING AS OBSERVER
            </span>
            <button
              onClick={() => console.log("[Compass] Switch view clicked")}
              style={{
                background: "transparent",
                border: "none",
                color: "#FCDE5A",
                cursor: "pointer",
                fontSize: 10.5,
                padding: 0,
              }}
            >
              Switch view
            </button>
          </div>
        </div>
      )}

      {/* Orb */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close compass" : "Open compass"}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          padding: 0,
          background:
            "radial-gradient(circle at 32% 30%, #fff3a8 0%, #FCDE5A 45%, #c79c1a 100%)",
          animation: "compass-glow 2.6s ease-in-out infinite",
          zIndex: 9999,
        }}
      >
        {/* Pulse halo */}
        {!open && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: "2px solid rgba(252, 222, 90, 0.55)",
              animation: "compass-pulse 2.2s ease-out infinite",
              pointerEvents: "none",
            }}
          />
        )}
      </button>
    </>
  );
}

function LiveAssessment({ loading, error, data, hasProgramId }) {
  if (!hasProgramId) {
    return (
      <div style={{ color: "#7a858d", fontStyle: "italic" }}>
        No program selected.
      </div>
    );
  }
  if (loading) {
    return (
      <div style={{ color: "#7a858d", fontStyle: "italic" }}>Loading...</div>
    );
  }
  if (error) {
    return (
      <div style={{ color: "#ED827E" }}>Could not load assessment</div>
    );
  }
  if (!data) return null;

  const status = STATUS_COLORS[data.status];
  const signals = (Array.isArray(data.signals) ? data.signals : []).slice(0, 3);
  const watch = (Array.isArray(data.watch) ? data.watch : []).slice(0, 3);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {status && (
          <span
            style={{
              padding: "3px 8px",
              borderRadius: 6,
              background: status.bg,
              color: status.color,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {status.label}
          </span>
        )}
        {data.summary && (
          <span style={{ color: "#9aa6ad", fontSize: 12 }}>{data.summary}</span>
        )}
      </div>

      {signals.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              fontSize: 9.5,
              color: "#5DCAA5",
              letterSpacing: 1.5,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            SIGNALS
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {signals.map((s, i) => (
              <li key={i} style={{ fontSize: 12, color: "#c9cfd4", marginBottom: 2 }}>
                <span style={{ color: "#5DCAA5" }}>•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {watch.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              fontSize: 9.5,
              color: "#FCDE5A",
              letterSpacing: 1.5,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            WATCH
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {watch.map((w, i) => (
              <li key={i} style={{ fontSize: 12, color: "#c9cfd4", marginBottom: 2 }}>
                <span style={{ color: "#FCDE5A" }}>•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
