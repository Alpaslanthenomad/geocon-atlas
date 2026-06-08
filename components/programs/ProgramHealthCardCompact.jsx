"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const STATUS_PILL = {
  on_track:        { color: "#2D8B6E", bg: "rgba(93, 202, 165, 0.15)",  label: "ON TRACK" },
  needs_attention: { color: "#8B6F00", bg: "rgba(252, 222, 90, 0.18)",  label: "NEEDS ATTENTION" },
  at_risk:         { color: "#C9554F", bg: "rgba(237, 130, 126, 0.15)", label: "AT RISK" },
  unknown:         { color: "#6B6B6B", bg: "rgba(154, 166, 173, 0.18)", label: "UNKNOWN" },
};

const RING_COLOR = { x: "#2D8B6E", y: "#6B5FBF", z: "#B8860B" };
const RING_SHORT = { x: "SAFEGUARD", y: "KNOWLEDGE", z: "VALUE" };
const RING_KEYS = ["x", "y", "z"];

const SERIF = "Georgia, 'Times New Roman', serif";

export default function ProgramHealthCardCompact({ programId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!programId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data: result, error: rpcError } = await supabase.rpc(
        "get_program_health_assessment",
        { p_program_id: programId }
      );
      if (cancelled) return;
      if (rpcError) setError(rpcError);
      else setData(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [programId]);

  if (loading) {
    return (
      <div style={containerStyle(false)}>
        <span style={{ fontSize: 12, fontStyle: "italic", color: "#6B6B6B" }}>
          Loading…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle(false)}>
        <span style={{ fontSize: 12, color: "#C9554F" }}>Could not load</span>
      </div>
    );
  }

  if (!data) return null;
  // Non-members get a redacted health read — hide the card entirely rather than
  // show an empty "UNKNOWN" shell. The program's public face carries progress.
  if (data.status === "restricted") return null;

  const statusKey = STATUS_PILL[data.status] ? data.status : "unknown";
  const pill = STATUS_PILL[statusKey];
  const rings = data.metrics?.rings ?? {};
  const signals = Array.isArray(data.signals) ? data.signals : [];
  const watch = Array.isArray(data.watch) ? data.watch : [];

  return (
    <div>
      {/* Hover styling for the collapsed bar */}
      <style>{`
        .geocon-phcc-bar:hover {
          background: #FAFAF5 !important;
          border-color: rgba(252,222,90,0.5) !important;
        }
      `}</style>

      {/* Collapsed bar */}
      <div
        className="geocon-phcc-bar"
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        style={containerStyle(expanded)}
      >
        {/* Status pill */}
        <span
          style={{
            flexShrink: 0,
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 10,
            letterSpacing: 1.5,
            fontWeight: 700,
            background: pill.bg,
            color: pill.color,
            whiteSpace: "nowrap",
          }}
        >
          {pill.label}
        </span>

        {/* Summary */}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            color: "#2A2A2A",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {data.summary || ""}
        </span>

        {/* Mini rings */}
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          {RING_KEYS.map((k) => {
            const ring = rings[k];
            if (!ring) return null;
            return (
              <div
                key={k}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  lineHeight: 1.1,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: RING_COLOR[k] }}>
                  {ring.pct}%
                </span>
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: 1,
                    marginTop: 2,
                    color: "#6B6B6B",
                  }}
                >
                  {RING_SHORT[k]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Chevron */}
        <span
          style={{
            flexShrink: 0,
            fontSize: 14,
            color: expanded ? "#B8860B" : "#6B6B6B",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.25s, color 0.25s",
          }}
        >
          ›
        </span>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div
          style={{
            background: "#FAFAF5",
            border: "1px solid #E5E5E0",
            borderTop: "none",
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            padding: "16px 18px",
            marginTop: -8,
          }}
        >
          {/* Signals + Watch */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={listHeading("#2D8B6E")}>SIGNALS</div>
              <BulletList items={signals} />
            </div>
            <div>
              <div style={listHeading("#B8860B")}>WATCH</div>
              <BulletList items={watch} />
            </div>
          </div>

          {/* Separator */}
          <div
            style={{
              borderTop: "1px solid #E5E5E0",
              paddingTop: 10,
              marginTop: 14,
            }}
          >
            {/* 3 ring detail cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
              }}
            >
              {RING_KEYS.map((k) => {
                const ring = rings[k];
                if (!ring) return null;
                const color = RING_COLOR[k];
                return (
                  <div
                    key={k}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E5E5E0",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: 1.2,
                        fontWeight: 500,
                        color,
                        textTransform: "uppercase",
                      }}
                    >
                      {ring.short}
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color,
                        marginTop: 4,
                        lineHeight: 1.1,
                      }}
                    >
                      {ring.pct}%
                    </div>
                    {ring.state && (
                      <div
                        style={{
                          fontSize: 11,
                          fontStyle: "italic",
                          fontFamily: SERIF,
                          marginTop: 2,
                          color: "#6B6B6B",
                        }}
                      >
                        {ring.state}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 10,
                        marginTop: 4,
                        color: "#8E8E8E",
                      }}
                    >
                      {ring.done} / {ring.total} tics complete
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function containerStyle(expanded) {
  return {
    background: "#ffffff",
    border: "1px solid #E5E5E0",
    borderRadius: 12,
    borderBottomLeftRadius: expanded ? 0 : 12,
    borderBottomRightRadius: expanded ? 0 : 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    cursor: "pointer",
    transition: "all 0.25s",
    color: "#2A2A2A",
  };
}

function listHeading(color) {
  return {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: 500,
    color,
    marginBottom: 6,
  };
}

function BulletList({ items }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ fontSize: 11.5, color: "#8E8E8E" }}>—</div>
    );
  }
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {items.map((s, i) => (
        <li
          key={i}
          style={{
            fontSize: 11.5,
            lineHeight: 1.5,
            color: "#2A2A2A",
            paddingLeft: 12,
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              color: "#6B6B6B",
            }}
          >
            •
          </span>
          {s}
        </li>
      ))}
    </ul>
  );
}
