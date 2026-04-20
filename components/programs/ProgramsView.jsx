"use client";

import { useState, useEffect, useMemo } from "react";
import { MODULE_COLORS, STATUS_COLORS } from "../../lib/constants";
import { fetchPrograms } from "../../lib/programs";
import ProgramDetailPanel from "./ProgramDetailPanel";
import { Loading } from "../shared";

const MODULES = ["Origin", "Forge", "Mesh", "Exchange", "Accord"];

export default function ProgramsView({ onStartProgram }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all"); // all | active | blocked | draft | due
  const [moduleFilter, setModuleFilter] = useState("all");

  useEffect(() => {
    let mounted = true;

    fetchPrograms()
      .then((data) => {
        if (!mounted) return;
        setPrograms(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function handleUpdate(updatedProgram) {
    setPrograms((prev) =>
      prev.map((p) => (p.id === updatedProgram.id ? { ...p, ...updatedProgram } : p))
    );
    setSelected((prev) =>
      prev?.id === updatedProgram.id ? { ...prev, ...updatedProgram } : prev
    );
  }

  const active = useMemo(
    () => programs.filter((p) => p.status === "Active"),
    [programs]
  );

  const blocked = useMemo(
    () => programs.filter((p) => p.status === "Blocked" || p.primary_blocker),
    [programs]
  );

  const draft = useMemo(
    () => programs.filter((p) => p.status === "Draft"),
    [programs]
  );

  const dueActions = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    return programs.filter((p) => {
      if (!p.next_action_due) return false;
      const due = new Date(p.next_action_due);
      return due <= now;
    });
  }, [programs]);

  const filtered = useMemo(() => {
    let base =
      filter === "all"
        ? programs
        : filter === "active"
        ? active
        : filter === "blocked"
        ? blocked
        : filter === "draft"
        ? draft
        : dueActions;

    if (moduleFilter !== "all") {
      base = base.filter((p) => p.current_module === moduleFilter);
    }

    return base;
  }, [filter, moduleFilter, programs, active, blocked, draft, dueActions]);

  if (loading) return <Loading />;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#2c2c2a",
              fontFamily: "Georgia,serif",
            }}
          >
            GEOCON Programs
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            {programs.length} programs · {active.length} active · {blocked.length} with blockers
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { l: "Active", v: active.length, c: "#1D9E75", f: "active" },
            { l: "Blocked", v: blocked.length, c: "#A32D2D", f: "blocked" },
            { l: "Draft", v: draft.length, c: "#888", f: "draft" },
            { l: "Due", v: dueActions.length, c: "#BA7517", f: "due" },
          ].map((s) => (
            <div
              key={s.l}
              onClick={() => setFilter(filter === s.f ? "all" : s.f)}
              style={{
                textAlign: "center",
                padding: "5px 10px",
                background: filter === s.f ? `${s.c}15` : "#f4f3ef",
                borderRadius: 8,
                cursor: "pointer",
                border: filter === s.f ? `1px solid ${s.c}` : "1px solid transparent",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 9, color: "#999" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 6,
          marginBottom: 16,
        }}
      >
        {MODULES.map((m) => {
          const count = programs.filter((p) => p.current_module === m).length;
          const color = MODULE_COLORS[m] || "#888";
          const isActive = moduleFilter === m;

          return (
            <div
              key={m}
              onClick={() => setModuleFilter(moduleFilter === m ? "all" : m)}
              style={{
                padding: "10px 12px",
                background: "#fff",
                borderRadius: 10,
                border: isActive ? `1px solid ${color}` : `1px solid ${color}33`,
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color }}>{m}</div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#2c2c2a",
                  margin: "4px 0",
                  fontFamily: "Georgia,serif",
                }}
              >
                {count}
              </div>
              <div style={{ fontSize: 9, color: "#999" }}>programs</div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#999" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#2c2c2a",
              marginBottom: 8,
            }}
          >
            No programs found
          </div>
          <div style={{ fontSize: 12, marginBottom: 20 }}>
            {filter === "all" && moduleFilter === "all"
              ? 'Open any species and click "+ Start Program" to begin a GEOCON journey.'
              : "No programs match the current filters."}
          </div>

          {filter === "all" && moduleFilter === "all" && onStartProgram && (
            <button
              onClick={onStartProgram}
              style={{
                padding: "8px 14px",
                border: "none",
                borderRadius: 8,
                background: "#1D9E75",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Start Program
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              isSelected={selected?.id === p.id}
              onClick={() => setSelected(p)}
            />
          ))}
        </div>
      )}

      {selected && (
        <ProgramDetailPanel
          program={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

function ProgramCard({ program, isSelected, onClick }) {
  const modColor = MODULE_COLORS[program.current_module] || "#888";
  const stColor = STATUS_COLORS[program.status] || "#888";

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: isSelected ? "2px solid #1D9E75" : "1px solid #e8e6e1",
        borderLeft: `4px solid ${modColor}`,
        borderRadius: 10,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = "#f8f7f4";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#fff";
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#2c2c2a" }}>
              {program.program_name}
            </span>
            <span
              style={{
                fontSize: 9,
                padding: "2px 8px",
                borderRadius: 99,
                background: `${stColor}22`,
                color: stColor,
                fontWeight: 600,
              }}
            >
              {program.status}
            </span>
          </div>

          {program.species && (
            <div style={{ fontSize: 11, fontStyle: "italic", color: "#888", marginBottom: 6 }}>
              {program.species.accepted_name} · {program.program_type}
            </div>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 99,
                background: `${modColor}15`,
                color: modColor,
              }}
            >
              {program.current_module}
            </span>

            {program.current_gate && (
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: "#f4f3ef",
                  color: "#5f5e5a",
                }}
              >
                {program.current_gate}
              </span>
            )}

            {program.risk_level && (
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
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
        </div>

        {program.readiness_score > 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "4px 10px",
              background: "#f4f3ef",
              borderRadius: 8,
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 7, color: "#999", textTransform: "uppercase" }}>
              Readiness
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1D9E75" }}>
              {program.readiness_score}
            </div>
          </div>
        )}
      </div>

      {program.next_action && (
        <div
          style={{
            marginTop: 8,
            padding: "6px 10px",
            background: "#f8f7f4",
            borderRadius: 6,
            fontSize: 11,
            color: "#5f5e5a",
          }}
        >
          → {program.next_action.slice(0, 80)}
          {program.next_action.length > 80 ? "..." : ""}
        </div>
      )}

      {program.primary_blocker && (
        <div
          style={{
            marginTop: 4,
            padding: "6px 10px",
            background: "#FCEBEB",
            borderRadius: 6,
            fontSize: 11,
            color: "#A32D2D",
          }}
        >
          ⚠ {program.primary_blocker.slice(0, 70)}
          {program.primary_blocker.length > 70 ? "..." : ""}
        </div>
      )}

      {(program.owner_name || program.next_action_due) && (
        <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, color: "#b4b2a9" }}>
          {program.owner_name && <span>👤 {program.owner_name}</span>}
          {program.next_action_due && <span>📅 {program.next_action_due}</span>}
        </div>
      )}
    </div>
  );
}
