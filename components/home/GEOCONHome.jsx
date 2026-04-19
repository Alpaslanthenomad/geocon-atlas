"use client";
import { useState, useEffect } from "react";
import { ROLES, S, MODULE_COLORS, MODULE_DESC } from "../../lib/constants";
import { iucnC, iucnBg } from "../../lib/helpers";
import {
  fetchRecentStoryEntries,
  fetchDueActions,
  fetchRecentDecisions,
} from "../../lib/programs";

/* ─ helpers ─ */

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function daysLabel(d) {
  if (d === null) return null;
  if (d < 0) return { text: `${Math.abs(d)}d overdue`, color: "#A32D2D", bg: "#FCEBEB" };
  if (d === 0) return { text: "Due today", color: "#A32D2D", bg: "#FCEBEB" };
  if (d <= 3) return { text: `${d}d left`, color: "#BA7517", bg: "#FAEEDA" };
  if (d <= 7) return { text: `${d}d left`, color: "#639922", bg: "#EAF3DE" };
  return null;
}

const ENTRY_COLOR = (t) =>
  ({
    "Evidence Added": "#185FA5",
    "Gate Passed": "#0F6E56",
    "Risk Raised": "#A32D2D",
    "Protocol Updated": "#639922",
    "Decision Made": "#BA7517",
    "Milestone Reached": "#1D9E75",
    "Governance Review Opened": "#D85A30",
    "Community Signal Added": "#534AB7",
  }[t] || "#888");

const DEC_TYPE_COLOR = (t) =>
  ({
    "Gate Decision": "#1D9E75",
    "Program Launch": "#185FA5",
    "Risk Escalation": "#A32D2D",
    "Module Transition": "#BA7517",
    "Governance Review": "#D85A30",
    "Strategic Pivot": "#534AB7",
  }[t] || "#888");

const MODULES = ["Origin", "Forge", "Mesh", "Exchange", "Accord"];

/* ═══════════════════════════════════════════ */

export default function GEOCONHome({
  species,
  publications,
  programs,
  user,
  setView,
  onSpeciesClick,
}) {
  const [storyFeed, setStoryFeed] = useState([]);
  const [dueActions, setDueActions] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchRecentStoryEntries(6),
      fetchDueActions(8),
      fetchRecentDecisions(6),
    ])
      .then(([s, a, d]) => {
        setStoryFeed(s || []);
        setDueActions(a || []);
        setDecisions(d || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* metrics */
  const threatened = species.filter((s) =>
    ["CR", "EN", "VU"].includes(s.iucn_status)
  ).length;

  const active = programs.filter((p) => p.status === "Active");
  const blocked = programs.filter(
    (p) => p.status === "Blocked" || p.primary_blocker
  );

  const moduleData = MODULES.map((m) => {
    const list = programs.filter((p) => p.current_module === m);
    return { name: m, count: list.length, programs: list };
  });

  const urgentActions = dueActions
    .map((a) => ({ ...a, days: daysUntil(a.due_date) }))
    .filter((a) => a.days !== null && a.days <= 7)
    .sort((a, b) => a.days - b.days);

  return (
    <div>

      {/* HERO */}
      <div style={{ ...S.card, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>
          GEOCON HOME
        </div>

        <h2 style={{ fontSize: 24, marginBottom: 6 }}>
          Program intelligence for species that need action
        </h2>

        <div style={{ fontSize: 13, color: "#666" }}>
          Welcome {ROLES[user.role]?.label}
        </div>

        {/* METRICS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 16 }}>
          <Metric label="Active programs" value={active.length} />
          <Metric label="Blocked" value={blocked.length} color="#A32D2D" />
          <Metric label="Due actions" value={dueActions.length} color="#BA7517" />
          <Metric label="Threatened" value={threatened} color="#E24B4A" />
        </div>
      </div>

      {/* ACTIVE PROGRAMS */}
      <Section title="Active programs">
        {active.length === 0 ? (
          <Empty text="No active programs" />
        ) : (
          active.slice(0, 5).map((p) => (
            <ProgramCard key={p.id} p={p} />
          ))
        )}
      </Section>

      {/* STORY FEED */}
      <Section title="Story feed">
        {loading ? (
          <Empty text="Loading..." />
        ) : storyFeed.length === 0 ? (
          <Empty text="No story yet" />
        ) : (
          storyFeed.map((e, i) => (
            <StoryCard key={i} e={e} />
          ))
        )}
      </Section>

      {/* MODULE FLOW */}
      <Section title="Module movement">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
          {moduleData.map((m) => (
            <div key={m.name} style={{ ...S.card, padding: 10, textAlign: "center" }}>
              <div>{m.name}</div>
              <div style={{ fontSize: 20 }}>{m.count}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* DEADLINES */}
      <Section title="Deadlines">
        {urgentActions.length === 0 ? (
          <Empty text="No urgent deadlines" />
        ) : (
          urgentActions.map((a) => (
            <ActionCard key={a.id} a={a} />
          ))
        )}
      </Section>

      {/* DECISIONS */}
      <Section title="Recent decisions">
        {decisions.length === 0 ? (
          <Empty text="No decisions yet" />
        ) : (
          decisions.map((d) => (
            <DecisionCard key={d.id} d={d} />
          ))
        )}
      </Section>

      {/* FEATURED SPECIES */}
      <Section title="Featured species">
        {species.slice(0, 6).map((s) => (
          <div key={s.id} onClick={() => onSpeciesClick(s)}>
            {s.accepted_name}
          </div>
        ))}
      </Section>

    </div>
  );
}

/* ─ components ─ */

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Metric({ label, value, color = "#1D9E75" }) {
  return (
    <div style={{ background: "#f4f3ef", padding: 10 }}>
      <div style={{ fontSize: 10 }}>{label}</div>
      <div style={{ fontSize: 20, color }}>{value}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ color: "#999" }}>{text}</div>;
}

function ProgramCard({ p }) {
  return (
    <div style={{ padding: 10, border: "1px solid #eee", marginBottom: 6 }}>
      <strong>{p.program_name}</strong>
      <div>{p.current_module}</div>
      {p.next_action && <div>→ {p.next_action}</div>}
    </div>
  );
}

function StoryCard({ e }) {
  return (
    <div style={{ padding: 10, border: "1px solid #eee", marginBottom: 6 }}>
      <strong>{e.title}</strong>
      <div>{e.summary}</div>
    </div>
  );
}

function ActionCard({ a }) {
  const dl = daysLabel(a.days);
  return (
    <div style={{ padding: 10, background: dl?.bg }}>
      {a.action_title} ({dl?.text})
    </div>
  );
}

function DecisionCard({ d }) {
  return (
    <div style={{ padding: 10, border: "1px solid #eee" }}>
      {d.decision_title}
    </div>
  );
}
