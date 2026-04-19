"use client";

import { useMemo, useState } from "react";
import { initProgram } from "../../lib/programs";

function riskBadgeColor(iucn) {
  if (["CR", "EN"].includes(iucn)) return { bg: "#FCEBEB", color: "#A32D2D" };
  if (iucn === "VU") return { bg: "#FAEEDA", color: "#633806" };
  return { bg: "#E1F5EE", color: "#085041" };
}

export default function StartProgramModal({ species, onClose, onSuccess }) {
  const [whyNow, setWhyNow] = useState("");
  const [firstAction, setFirstAction] = useState("");
  const [ownerName, setOwnerName] = useState("Alpaslan Acar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const risk = useMemo(
    () => riskBadgeColor(species?.iucn_status),
    [species?.iucn_status]
  );

  if (!species) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!whyNow.trim()) {
      setError("Please explain why this program should start now.");
      return;
    }

    setLoading(true);
    try {
      const program = await initProgram({
        species,
        whyNow: whyNow.trim(),
        firstAction: firstAction.trim(),
        ownerName: ownerName.trim() || "Alpaslan Acar",
      });

      if (onSuccess) onSuccess(program);
    } catch (err) {
      setError(err?.message || "Failed to start program.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 120,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 560,
          maxWidth: "94vw",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          zIndex: 121,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid #e8e6e1",
            background: "#f8f7f4",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 4,
                }}
              >
                Start GEOCON program
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#2c2c2a",
                  fontFamily: "Georgia,serif",
                  lineHeight: 1.25,
                  fontStyle: "italic",
                }}
              >
                {species.accepted_name}
              </div>

              {species.common_name && (
                <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
                  {species.common_name}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "#888",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {species.family && (
              <span
                style={{
                  fontSize: 10,
                  padding: "3px 9px",
                  borderRadius: 99,
                  background: "#f4f3ef",
                  color: "#5f5e5a",
                }}
              >
                {species.family}
              </span>
            )}

            {species.iucn_status && (
              <span
                style={{
                  fontSize: 10,
                  padding: "3px 9px",
                  borderRadius: 99,
                  background: risk.bg,
                  color: risk.color,
                  fontWeight: 600,
                }}
              >
                IUCN {species.iucn_status}
              </span>
            )}

            {species.composite_score != null && (
              <span
                style={{
                  fontSize: 10,
                  padding: "3px 9px",
                  borderRadius: 99,
                  background: "#E1F5EE",
                  color: "#085041",
                  fontWeight: 600,
                }}
              >
                Score {species.composite_score}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div
            style={{
              marginBottom: 14,
              padding: "12px 14px",
              background: "#f8f7f4",
              borderRadius: 10,
              fontSize: 12,
              color: "#5f5e5a",
              lineHeight: 1.65,
            }}
          >
            This will create:
            <div style={{ marginTop: 6 }}>
              1. a new program record
              <br />
              2. an initial story entry
              <br />
              3. an optional first action
            </div>
          </div>

          <FieldLabel>Why should this program start now? *</FieldLabel>
          <textarea
            value={whyNow}
            onChange={(e) => setWhyNow(e.target.value)}
            rows={4}
            placeholder="Describe the urgency, opportunity, conservation logic, propagation logic, or strategic rationale."
            style={textareaStyle}
          />

          <FieldLabel>First action</FieldLabel>
          <textarea
            value={firstAction}
            onChange={(e) => setFirstAction(e.target.value)}
            rows={3}
            placeholder="Example: Review all literature, define ex situ feasibility, and open the first GEOCON story entry."
            style={textareaStyle}
          />

          <FieldLabel>Owner</FieldLabel>
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Program owner"
            style={inputStyle}
          />

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#FCEBEB",
                color: "#A32D2D",
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 18,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 14px",
                borderRadius: 8,
                border: "1px solid #e8e6e1",
                background: "#fff",
                color: "#888",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "9px 16px",
                borderRadius: 8,
                border: "none",
                background: loading ? "#ccc" : "#1D9E75",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: loading ? "default" : "pointer",
              }}
            >
              {loading ? "Starting..." : "Start Program"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #e8e6e1",
  borderRadius: 8,
  fontSize: 12,
  background: "#fff",
  outline: "none",
  color: "#2c2c2a",
};

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
  marginBottom: 14,
};

function FieldLabel({ children }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 10,
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 5,
      }}
    >
      {children}
    </label>
  );
}
