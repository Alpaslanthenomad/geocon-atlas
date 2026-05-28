"use client";
import { useState } from "react";

const MODULE_COLORS = {
  Origin: "#1D9E75",
  Forge: "#BA7517",
  Mesh: "#185FA5",
  Exchange: "#D85A30",
  Accord: "#5F5E5A",
};
const STATUS_COLORS = {
  Active: "#0F6E56",
  Draft: "#888",
  Blocked: "#A32D2D",
  "On Hold": "#BA7517",
  Completed: "#185FA5",
};

const MOCK_PROGRAMS = [
  {
    id: 1,
    program_name: "Anatolian Salep Orchid Conservation & Sustainable Production Program",
    status: "Draft",
    species: "Orchis anatolica",
    program_type: "Hybrid",
    current_module: "Mesh",
    current_gate: "Protocol",
    risk_level: "high",
    readiness_score: 15,
    next_action: "Map current salep harvest pressure across Turkish provinces and identify priority districts.",
    primary_blocker: "No working in vitro propagation protocol exists at scale; symbiotic dependency unresolved.",
    owner: "Alpaslan Şevket Acar",
  },
  {
    id: 2,
    program_name: "Anatolian Endemic Fritillaria Conservation & Propagation Program",
    status: "Draft",
    species: "Fritillaria imperialis",
    program_type: "Hybrid",
    current_module: "Origin",
    current_gate: "Selection",
    risk_level: "medium",
    readiness_score: 20,
    next_action: "Compile distribution and population data for Anatolian endemic Fritillaria taxa.",
    primary_blocker: "Limited published in vitro protocols for endemic Anatolian Fritillaria species.",
    owner: "Alpaslan Şevket Acar",
  },
  {
    id: 3,
    program_name: "Cyclamen mirabile Restoration Pilot",
    status: "Active",
    species: "Cyclamen mirabile",
    program_type: "Conservation Rescue",
    current_module: "Forge",
    current_gate: "Validation",
    risk_level: "low",
    readiness_score: 62,
    next_action: "Run germination trial batch #4 with stratified seed cohorts.",
    owner: "Defne Yıldırım",
    next_action_due: "2026-06-12",
  },
  {
    id: 4,
    program_name: "Sternbergia Lycian Coastal Programme",
    status: "Blocked",
    species: "Sternbergia lutea",
    program_type: "Premium Ornamental",
    current_module: "Exchange",
    current_gate: "Venture",
    risk_level: "medium",
    readiness_score: 48,
    next_action: "Resolve CITES export classification with TR authority.",
    primary_blocker: "Regulatory blocker on bulb export pending Annex II reclassification.",
    owner: "Mert Demirel",
  },
  {
    id: 5,
    program_name: "Crocus pallasii Functional Ingredient Track",
    status: "Active",
    species: "Crocus pallasii subsp. pallasii",
    program_type: "Functional Ingredient",
    current_module: "Accord",
    current_gate: "Governance",
    risk_level: "low",
    readiness_score: 78,
    next_action: "Finalize ABS agreement draft with Ministry of Agriculture.",
    owner: "Sezen Aydın",
    next_action_due: "2026-06-02",
  },
];

const counts = {
  all: MOCK_PROGRAMS.length,
  active: MOCK_PROGRAMS.filter(p => p.status === "Active").length,
  blocked: MOCK_PROGRAMS.filter(p => p.status === "Blocked" || p.primary_blocker).length,
  draft: MOCK_PROGRAMS.filter(p => p.status === "Draft").length,
  due: MOCK_PROGRAMS.filter(p => p.next_action_due).length,
};

const moduleCounts = ["Origin", "Forge", "Mesh", "Exchange", "Accord"].reduce(
  (acc, m) => ({ ...acc, [m]: MOCK_PROGRAMS.filter(p => p.current_module === m).length }),
  {}
);

export default function MockPrograms() {
  const [view, setView] = useState("A");

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", padding: "20px 24px 60px", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Toggle header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #e8e6e1" }}>
          <div>
            <div style={{ fontSize: 11, color: "#b4b2a9", letterSpacing: 1.5, textTransform: "uppercase" }}>Mockup</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#2c2c2a", fontFamily: "Georgia,serif" }}>Programs page · redesign options</div>
            <div style={{ fontSize: 12, color: "#7d7a72", marginTop: 4 }}>Both views use the same 5-program sample data. Click cards/rows to see hover state; nothing is wired to actual data.</div>
          </div>
          <div style={{ display: "inline-flex", padding: 3, borderRadius: 10, background: "#fff", border: "1px solid #e8e6e1" }}>
            <button onClick={() => setView("A")} style={toggleBtn(view === "A")}>A · Sessiz liste</button>
            <button onClick={() => setView("C")} style={toggleBtn(view === "C")}>C · İki kolonlu</button>
          </div>
        </div>

        {view === "A" ? <MockA /> : <MockC />}

      </div>
    </div>
  );
}

function toggleBtn(active) {
  return {
    padding: "7px 14px",
    fontSize: 12,
    fontWeight: 600,
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
    background: active ? "#2c2c2a" : "transparent",
    color: active ? "#fff" : "#7d7a72",
    transition: "all 0.15s",
  };
}

/* ════════════════════════════════════════════════════════════════
   OPTION A — Sessiz liste, tek satır filtre, kompakt satır kart
═══════════════════════════════════════════════════════════════ */
function MockA() {
  return (
    <div>
      {/* Compact header — title + start button on same line */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#2c2c2a", fontFamily: "Georgia,serif" }}>GEOCON Programs</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            {counts.all} programs · {counts.active} active · {counts.blocked} blocked · {counts.due} due
          </div>
        </div>
        <button style={primaryBtn}>+ Start Program</button>
      </div>

      {/* Single compact filter row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, padding: "8px 12px", background: "#fff", border: "1px solid #ece9e2", borderRadius: 10 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { l: "All", v: counts.all, k: "all", c: "#2c2c2a" },
            { l: "Active", v: counts.active, k: "active", c: "#0F6E56" },
            { l: "Blocked", v: counts.blocked, k: "blocked", c: "#A32D2D" },
            { l: "Draft", v: counts.draft, k: "draft", c: "#888" },
            { l: "Due", v: counts.due, k: "due", c: "#BA7517" },
          ].map((s, i) => (
            <button key={s.k} style={chipBtn(i === 0, s.c)}>
              {s.l} <span style={{ marginLeft: 4, opacity: 0.7, fontWeight: 500 }}>{s.v}</span>
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 0.8 }}>Module</span>
          <select style={{ fontSize: 12, padding: "5px 8px", border: "1px solid #e8e6e1", borderRadius: 6, background: "#fff", color: "#2c2c2a", cursor: "pointer" }}>
            <option>All modules</option>
            <option>Origin (1)</option>
            <option>Forge (1)</option>
            <option>Mesh (1)</option>
            <option>Exchange (1)</option>
            <option>Accord (1)</option>
          </select>
        </div>
      </div>

      {/* Quiet rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#ece9e2", border: "1px solid #ece9e2", borderRadius: 10, overflow: "hidden" }}>
        {MOCK_PROGRAMS.map(p => <ProgramRowA key={p.id} p={p} />)}
      </div>

      <div style={{ marginTop: 14, fontSize: 10, color: "#b4b2a9", textAlign: "center" }}>
        Click a row → opens full ProgramDetailPanel (unchanged). next_action / blocker full text lives there.
      </div>
    </div>
  );
}

function ProgramRowA({ p }) {
  const modColor = MODULE_COLORS[p.current_module] || "#888";
  const stColor = STATUS_COLORS[p.status] || "#888";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "#fff", borderLeft: `3px solid ${modColor}`, cursor: "pointer" }}>
      {/* Title block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p.program_name}
        </div>
        <div style={{ fontSize: 11, color: "#9a978f", fontStyle: "italic", marginTop: 2 }}>
          {p.species} · {p.program_type}
        </div>
      </div>

      {/* Inline pills */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span style={pillSm(modColor, "#fff")}>{p.current_module}</span>
        <span style={{ fontSize: 11, color: "#9a978f" }}>·</span>
        <span style={{ fontSize: 11, color: "#5f5e5a" }}>{p.current_gate}</span>
      </div>

      {/* Blocker indicator (icon only — full text in detail panel) */}
      <div style={{ width: 18, textAlign: "center", flexShrink: 0 }}>
        {p.primary_blocker ? <span title={p.primary_blocker} style={{ color: "#A32D2D", fontSize: 13 }}>⚠</span> : <span style={{ color: "#d4d2cc" }}>·</span>}
      </div>

      {/* Readiness */}
      <div style={{ width: 50, textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: p.readiness_score >= 60 ? "#0F6E56" : p.readiness_score >= 30 ? "#BA7517" : "#A32D2D", fontFamily: "Georgia,serif", lineHeight: 1 }}>
          {p.readiness_score}
        </div>
        <div style={{ fontSize: 8, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>Ready</div>
      </div>

      {/* Status dot + label */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, width: 70, flexShrink: 0 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: stColor, display: "inline-block" }} />
        <span style={{ fontSize: 11, color: stColor, fontWeight: 500 }}>{p.status}</span>
      </div>

      <div style={{ color: "#c4c1ba", fontSize: 14, flexShrink: 0 }}>→</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   OPTION C — İki kolonlu (sticky sol filtre + sağ liste)
═══════════════════════════════════════════════════════════════ */
function MockC() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>

      {/* Sticky left sidebar */}
      <aside style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Summary card */}
        <div style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 10, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Overview</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#2c2c2a", fontFamily: "Georgia,serif", lineHeight: 1 }}>{counts.all}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>total programs</div>
          <div style={{ height: 1, background: "#ece9e2", margin: "14px 0" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <SummaryLine label="Active" value={counts.active} color="#0F6E56" />
            <SummaryLine label="Blocked" value={counts.blocked} color="#A32D2D" />
            <SummaryLine label="Draft" value={counts.draft} color="#888" />
            <SummaryLine label="Due this week" value={counts.due} color="#BA7517" />
          </div>
        </div>

        {/* Status filter */}
        <div style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Status</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { l: "All", v: counts.all, k: "all", active: true },
              { l: "Active", v: counts.active, c: "#0F6E56" },
              { l: "Blocked", v: counts.blocked, c: "#A32D2D" },
              { l: "Draft", v: counts.draft, c: "#888" },
              { l: "Due", v: counts.due, c: "#BA7517" },
            ].map(s => (
              <button key={s.l} style={sidebarItem(s.active)}>
                {s.c && <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.c }} />}
                {!s.c && <span style={{ width: 6 }} />}
                <span style={{ flex: 1, textAlign: "left" }}>{s.l}</span>
                <span style={{ fontSize: 11, color: "#9a978f" }}>{s.v}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Module filter */}
        <div style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 10, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Module</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {["Origin", "Forge", "Mesh", "Exchange", "Accord"].map(m => (
              <button key={m} style={sidebarItem(false)}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: MODULE_COLORS[m] }} />
                <span style={{ flex: 1, textAlign: "left" }}>{m}</span>
                <span style={{ fontSize: 11, color: "#9a978f" }}>{moduleCounts[m]}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Right column */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#2c2c2a", fontFamily: "Georgia,serif" }}>
            All programs <span style={{ fontSize: 13, color: "#9a978f", fontWeight: 400, marginLeft: 6 }}>({counts.all})</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Search programs…" style={{ padding: "7px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, width: 200, background: "#fff" }} />
            <button style={primaryBtn}>+ Start Program</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MOCK_PROGRAMS.map(p => <ProgramCardC key={p.id} p={p} />)}
        </div>

        <div style={{ marginTop: 14, fontSize: 10, color: "#b4b2a9", textAlign: "center" }}>
          Two-column dashboard. Sidebar stays visible while scrolling. Cards keep next_action preview.
        </div>
      </div>
    </div>
  );
}

function SummaryLine({ label, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
      <span style={{ color: "#5f5e5a", flex: 1 }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#2c2c2a" }}>{value}</span>
    </div>
  );
}

function ProgramCardC({ p }) {
  const modColor = MODULE_COLORS[p.current_module] || "#888";
  const stColor = STATUS_COLORS[p.status] || "#888";
  return (
    <div style={{ background: "#fff", border: "1px solid #ece9e2", borderLeft: `4px solid ${modColor}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{p.program_name}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: stColor }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: stColor }} />
              {p.status}
            </span>
          </div>
          <div style={{ fontSize: 11, fontStyle: "italic", color: "#9a978f", marginBottom: 6 }}>
            {p.species} · {p.program_type}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={pillSm(modColor, "#fff")}>{p.current_module}</span>
            <span style={{ fontSize: 11, color: "#9a978f" }}>·</span>
            <span style={{ fontSize: 11, color: "#5f5e5a" }}>{p.current_gate}</span>
            {p.risk_level && (
              <>
                <span style={{ fontSize: 11, color: "#9a978f" }}>·</span>
                <span style={{ fontSize: 11, color: p.risk_level === "high" ? "#A32D2D" : p.risk_level === "medium" ? "#BA7517" : "#0F6E56" }}>
                  {p.risk_level} risk
                </span>
              </>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: p.readiness_score >= 60 ? "#0F6E56" : p.readiness_score >= 30 ? "#BA7517" : "#A32D2D", fontFamily: "Georgia,serif", lineHeight: 1 }}>
            {p.readiness_score}
          </div>
          <div style={{ fontSize: 8, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 3 }}>Readiness</div>
        </div>
      </div>

      {/* Single combined hint line (next_action OR blocker, whichever is more urgent) */}
      {(p.primary_blocker || p.next_action) && (
        <div style={{ marginTop: 10, padding: "7px 10px", background: p.primary_blocker ? "#FCEBEB" : "#f4f3ef", borderRadius: 6, fontSize: 11, color: p.primary_blocker ? "#A32D2D" : "#5f5e5a", display: "flex", alignItems: "center", gap: 8 }}>
          <span>{p.primary_blocker ? "⚠" : "→"}</span>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.primary_blocker || p.next_action}
          </span>
        </div>
      )}

      {(p.owner || p.next_action_due) && (
        <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 10, color: "#b4b2a9" }}>
          {p.owner && <span>👤 {p.owner}</span>}
          {p.next_action_due && <span>📅 {p.next_action_due}</span>}
        </div>
      )}
    </div>
  );
}

/* shared styles */
const primaryBtn = {
  padding: "8px 14px",
  fontSize: 12,
  fontWeight: 600,
  background: "#1D9E75",
  color: "#fff",
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
};

function chipBtn(active, color) {
  return {
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 500,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    background: active ? "#2c2c2a" : "transparent",
    color: active ? "#fff" : color,
    transition: "all 0.15s",
  };
}

function pillSm(color, bg) {
  return {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 99,
    background: color,
    color: bg,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  };
}

function sidebarItem(active) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 8px",
    fontSize: 12,
    border: "none",
    borderRadius: 6,
    background: active ? "#f4f3ef" : "transparent",
    color: active ? "#2c2c2a" : "#5f5e5a",
    cursor: "pointer",
    fontWeight: active ? 600 : 500,
    width: "100%",
  };
}
