"use client";
// CompassWidget — Compass v1 (Sprint 4). Context-aware in-place help.
// Inputs: programId (+ screen, programName). It reads the live Venn engine
// (get_program_region_status + get_program_stage_status) and answers three
// questions from STATE, not hardcoded text:
//   WHERE  — where the program stands (active stage + region snapshot)
//   NEXT   — the rule-engine next move (gate + next required tic)
//   WHAT   — a static template explaining the model for this screen
// WHY is left as an LLM-ready stub (rule engine now, reasoning later).

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const SERIF = "Georgia, 'Times New Roman', serif";
const STAGES = [
  { key: "foundation", label: "Foundation" },
  { key: "field_lab", label: "Field & Lab" },
  { key: "propagation", label: "Propagation" },
  { key: "deep_work", label: "Deep Work" },
  { key: "deployment", label: "Deployment" },
  { key: "governance", label: "Governance" },
];
const AXES = [
  { key: "safeguard", label: "Safeguard", color: "#5DCAA5" },
  { key: "knowledge", label: "Knowledge", color: "#7CB3F0" },
  { key: "value", label: "Value", color: "#E8B45A" },
];

function ticLabel(id) {
  if (!id) return null;
  const tail = String(id).includes(".") ? String(id).split(".").slice(1).join(".") : id;
  const w = tail.replace(/_/g, " ");
  return w.charAt(0).toUpperCase() + w.slice(1);
}

// the NEXT rule engine — deterministic, from state
function computeNext(region, active) {
  if (!active) return "Open a program to get guidance.";
  if (active.gate_status === "empty") return `No tics are defined for ${active.label} yet.`;
  if (active.gate_status === "blocked" && active.block_reason === "evidence_weak")
    return `${active.label} tics are done, but the evidence is weak (avg < 0.4). Strengthen the evidence to pass the gate.`;
  if (active.gate_status === "blocked")
    return `Complete "${ticLabel(active.next_required_tic) || "the next required tic"}" to pass the ${active.label} gate (${active.required_done || 0}/${active.required_total || 0} required).`;
  if (active.gate_status === "passed") return `${active.label} gate passed — the next stage is open.`;
  return "On track.";
}

function computeCoreHint(region) {
  const c = region?.integrated_core;
  if (!c || c.state !== "empty") return null;
  if ((region.safeguard?.percent || 0) >= 30 && (region.knowledge?.percent || 0) >= 30)
    return "You have Safeguard + Knowledge momentum — an Integrated Core (xyz) move would compound them into value. It is a maturity target, never a gate.";
  return null;
}

export default function CompassWidget({ programId, programName, screen = "program" }) {
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState(null);
  const [stages, setStages] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !programId) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      supabase.rpc("get_program_region_status", { p_program_id: programId }),
      ...STAGES.map((s) => supabase.rpc("get_program_stage_status", { p_program_id: programId, p_stage: s.key })),
    ]).then(([r, ...st]) => {
      if (cancelled) return;
      setRegion(r.data || null);
      setStages(st.map((x, i) => ({ ...STAGES[i], ...(x.data || {}) })));
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, programId]);

  const active = stages
    ? (stages.find((s) => s.gate_status === "blocked")
       || stages.find((s) => s.gate_status === "empty" && (s.required_total || 0) === 0)
       || stages[stages.length - 1])
    : null;
  const next = region && active ? computeNext(region, active) : null;
  const coreHint = region ? computeCoreHint(region) : null;

  return (
    <>
      <style>{`
        @keyframes compass-pulse { 0%{transform:scale(1);opacity:.55} 70%,100%{transform:scale(1.9);opacity:0} }
        @keyframes compass-glow { 0%,100%{box-shadow:0 0 18px rgba(252,222,90,.45)} 50%{box-shadow:0 0 28px rgba(252,222,90,.7)} }
      `}</style>

      {open && (
        <div role="dialog" aria-label="Compass" style={{
          position: "fixed", bottom: 84, right: 20, width: 380, maxHeight: 600, overflowY: "auto",
          background: "linear-gradient(180deg, rgba(30,42,55,.97) 0%, rgba(20,28,38,.99) 100%)",
          border: "0.5px solid rgba(252,222,90,.3)", borderRadius: 14, backdropFilter: "blur(12px)",
          boxShadow: "0 24px 60px rgba(0,0,0,.6)", color: "#e8e6e1", zIndex: 9998,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}>
          <div style={{ padding: "16px 18px 14px", borderBottom: "0.5px solid rgba(252,222,90,.15)", position: "relative" }}>
            <div style={{ color: "#FCDE5A", fontSize: 10, letterSpacing: 3, fontWeight: 700 }}>COMPASS</div>
            <div style={{ marginTop: 4, fontSize: 13, color: "#9aa6ad", fontStyle: "italic", fontFamily: SERIF, paddingRight: 24 }}>
              {programName ? `Guiding: ${programName}` : "Program guidance, from live state."}
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close compass" style={{
              position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: 6, border: "none",
              background: "transparent", color: "#9aa6ad", fontSize: 14, cursor: "pointer",
            }}>×</button>
          </div>

          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {!programId && <div style={{ color: "#7a858d", fontStyle: "italic", fontSize: 12.5 }}>No program selected.</div>}
            {programId && loading && <div style={{ color: "#7a858d", fontStyle: "italic", fontSize: 12.5 }}>Reading live state…</div>}

            {programId && !loading && region && (
              <>
                {/* WHERE */}
                <Card accent="#5DCAA5" kicker="WHERE YOU ARE">
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    {AXES.map((a) => {
                      const d = region[a.key] || { percent: 0 };
                      return (
                        <div key={a.key} style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: "#9aa6ad" }}>{a.label}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: a.color }}>{d.percent}%</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 12, color: "#c9cfd4" }}>
                    Active stage: <strong style={{ color: "#e8e6e1" }}>{active?.label}</strong>
                    {" · "}<span style={{ color: active?.gate_status === "passed" ? "#5DCAA5" : "#FCDE5A" }}>{(active?.gate_status || "—").replace(/_/g, " ")}</span>
                  </div>
                </Card>

                {/* NEXT */}
                <Card accent="#FCDE5A" kicker="DO NEXT">
                  <div style={{ fontSize: 12.5, color: "#e8e6e1", lineHeight: 1.55 }}>{next}</div>
                  {coreHint && (
                    <div style={{ marginTop: 8, paddingLeft: 10, borderLeft: "1.5px solid #AFA9EC", fontStyle: "italic", fontFamily: SERIF, color: "#AFA9EC", fontSize: 12, lineHeight: 1.5 }}>
                      {coreHint}
                    </div>
                  )}
                </Card>

                {/* WHAT */}
                <Card accent="#7CB3F0" kicker="WHAT IS THIS">
                  <div style={{ fontSize: 12.5, color: "#c9cfd4", lineHeight: 1.6 }}>
                    A program is read on two grammars. <strong style={{ color: "#e8e6e1" }}>Stage</strong> is operational
                    time — what to do next, gated step by step. <strong style={{ color: "#e8e6e1" }}>Region</strong> is
                    value position — which of the three axes (Safeguard, Knowledge, Value) each action advances. The
                    Integrated Core (all three at once) is a maturity target, never a gate.
                  </div>
                </Card>

                {/* WHY — LLM-ready stub */}
                <div style={{ fontSize: 10.5, color: "#5a656d", textAlign: "center", paddingTop: 2 }}>
                  Deeper reasoning (WHY) arrives with the reasoning layer.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <button onClick={() => setOpen((v) => !v)} aria-label={open ? "Close compass" : "Open compass"} style={{
        position: "fixed", bottom: 20, right: 20, width: 48, height: 48, borderRadius: "50%", border: "none",
        cursor: "pointer", padding: 0,
        background: "radial-gradient(circle at 32% 30%, #fff3a8 0%, #FCDE5A 45%, #c79c1a 100%)",
        animation: "compass-glow 2.6s ease-in-out infinite", zIndex: 9999,
      }}>
        {!open && <span aria-hidden style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: "50%",
          border: "2px solid rgba(252,222,90,.55)", animation: "compass-pulse 2.2s ease-out infinite", pointerEvents: "none",
        }} />}
      </button>
    </>
  );
}

function Card({ accent, kicker, children }) {
  return (
    <div style={{ borderRadius: 10, background: "rgba(255,255,255,.025)", border: "0.5px solid rgba(255,255,255,.06)", padding: "11px 13px" }}>
      <div style={{ fontSize: 9.5, letterSpacing: 1.5, fontWeight: 700, color: accent, marginBottom: 6 }}>{kicker}</div>
      {children}
    </div>
  );
}
