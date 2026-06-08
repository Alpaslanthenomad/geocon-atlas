"use client";
// VennHero (Sprint 3) — the Venn engine made visible at the top of a program.
// Three value-position axes (Biodiversity Safeguard / Applied Knowledge /
// Regenerative Value) + the Integrated Core maturity, a stage track whose gates
// are stage-transition conditions, and the next required move. Reads the v2
// engine RPCs (get_program_region_status + get_program_stage_status). Additive:
// it sits above the existing HeroPanel + tabs; nothing is removed.

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const AXES = [
  { key: "safeguard", label: "Biodiversity Safeguard", color: "#1D9E75" },
  { key: "knowledge", label: "Applied Knowledge", color: "#185FA5" },
  { key: "value", label: "Regenerative Value", color: "#BA7517" },
];
const STAGES = [
  { key: "foundation", label: "Foundation" },
  { key: "field_lab", label: "Field & Lab" },
  { key: "propagation", label: "Propagation" },
  { key: "deep_work", label: "Deep Work" },
  { key: "deployment", label: "Deployment" },
  { key: "governance", label: "Governance" },
];
const CORE_COLOR = { empty: "#CBD5E1", emerging: "#A78BFA", active: "#7C3AED", validated: "#B8860B" };
const GATE_COLOR = { passed: "#1D9E75", blocked: "#BA7517", empty: "#CBD5E1", "": "#CBD5E1" };

function pretty(s) { return (s || "").replace(/_/g, " "); }
function ticLabel(id) {
  if (!id) return null;
  const tail = String(id).includes(".") ? String(id).split(".").slice(1).join(".") : id;
  const words = tail.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default function VennHero({ programId, lang = "tr" }) {
  const [region, setRegion] = useState(null);
  const [stages, setStages] = useState(null);

  useEffect(() => {
    if (!programId) return;
    let on = true;
    Promise.all([
      supabase.rpc("get_program_region_status", { p_program_id: programId }),
      ...STAGES.map((s) => supabase.rpc("get_program_stage_status", { p_program_id: programId, p_stage: s.key })),
    ]).then(([r, ...st]) => {
      if (!on) return;
      setRegion(r.data || null);
      setStages(st.map((x, i) => ({ ...STAGES[i], ...(x.data || {}) })));
    }).catch(() => {});
    return () => { on = false; };
  }, [programId]);

  if (!region || !stages) {
    return <div className="mb-5 h-28 rounded-xl bg-slate-50 border border-slate-100 animate-pulse" />;
  }

  const core = region.integrated_core || { state: "empty", count_completed: 0 };
  // active stage = first blocked stage (the frontier); else first empty after work; else last
  const active = stages.find((s) => s.gate_status === "blocked")
    || stages.find((s) => s.gate_status === "empty" && s.required_total === 0)
    || stages[stages.length - 1];

  return (
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
      {/* three axes + integrated core */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {AXES.map((a) => {
          const d = region[a.key] || { percent: 0, state: "not_activated" };
          return (
            <div key={a.key} className="rounded-xl border border-slate-100 p-3">
              <div className="text-[11px] font-semibold text-slate-500 leading-tight">{a.label}</div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold" style={{ color: a.color }}>{d.percent}</span>
                <span className="text-xs text-slate-400">%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${d.percent}%`, background: a.color }} />
              </div>
              <div className="text-[10px] text-slate-400 mt-1.5">{pretty(d.state)}</div>
            </div>
          );
        })}
        <div className="rounded-xl border-2 p-3" style={{ borderColor: CORE_COLOR[core.state] }}>
          <div className="text-[11px] font-semibold text-slate-500 leading-tight">Integrated Core</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: CORE_COLOR[core.state] }} />
            <span className="text-sm font-bold" style={{ color: CORE_COLOR[core.state] }}>{pretty(core.state)}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5">{core.count_completed} xyz tic{core.count_completed === 1 ? "" : "s"}</div>
        </div>
      </div>

      {/* stage track */}
      <div className="flex items-center gap-1 mt-4 overflow-x-auto">
        {stages.map((s, i) => {
          const isActive = active && s.key === active.key;
          const c = GATE_COLOR[s.gate_status || ""];
          return (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center min-w-[64px]">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: c, outline: isActive ? "2px solid #3C3489" : "none", outlineOffset: 2 }}>
                  {s.gate_status === "passed" ? "✓" : i + 1}
                </div>
                <div className={`text-[9.5px] mt-1 text-center leading-tight ${isActive ? "font-bold text-slate-800" : "text-slate-400"}`}>{s.label}</div>
              </div>
              {i < stages.length - 1 && <div className="w-4 h-px bg-slate-200" />}
            </div>
          );
        })}
      </div>

      {/* next move */}
      {active && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">{active.label}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span style={{ color: GATE_COLOR[active.gate_status || ""] }}>{pretty(active.gate_status) || "—"}</span>
            <span className="text-slate-400"> ({active.required_done || 0}/{active.required_total || 0} required, {active.critical_done || 0}/{active.critical_total || 0} critical)</span>
          </div>
          {active.next_required_tic && (
            <div className="text-xs text-slate-500 whitespace-nowrap">
              Next move: <span className="font-semibold text-slate-700">{ticLabel(active.next_required_tic)}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
