"use client";

import { useMemo } from "react";
import { MODULE_COLORS } from "../../lib/constants";

const CARD = {
  background: "#fff",
  border: "1px solid #e8e6e1",
  borderRadius: 14,
};

function Pill({ children, bg = "#f4f3ef", color = "#5f5e5a" }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 10,
        fontWeight: 600,
        lineHeight: 1.5,
      }}
    >
      {children}
    </span>
  );
}

function Dot({ color }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

function SectionTitle({ title, sub, action, onAction }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 10,
        marginBottom: 12,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#2c2c2a",
            fontFamily: "Georgia,serif",
          }}
        >
          {title}
        </div>
        {sub && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{sub}</div>}
      </div>

      {action && (
        <button
          onClick={onAction}
          style={{
            padding: "6px 10px",
            border: "1px solid #e8e6e1",
            borderRadius: 8,
            background: "#fff",
            color: "#5f5e5a",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}

function QueueItem({ title, text, tone = "neutral", onClick }) {
  const tones = {
    high: { bg: "#FCEBEB", color: "#A32D2D", border: "#A32D2D22" },
    medium: { bg: "#FAEEDA", color: "#633806", border: "#BA751722" },
    low: { bg: "#E1F5EE", color: "#085041", border: "#1D9E7522" },
    neutral: { bg: "#f8f7f4", color: "#2c2c2a", border: "#e8e6e1" },
  };

  const t = tones[tone] || tones.neutral;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 14px",
        borderRadius: 10,
        background: t.bg,
        border: `1px solid ${t.border}`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: t.color, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.55 }}>{text}</div>
    </div>
  );
}

function ProgramMiniCard({ program }) {
  const moduleColor = MODULE_COLORS[program.current_module] || "#888";
  const riskTone =
    program.risk_level === "high"
      ? { bg: "#FCEBEB", color: "#A32D2D" }
      : program.risk_level === "medium"
      ? { bg: "#FAEEDA", color: "#633806" }
      : { bg: "#E1F5EE", color: "#085041" };

  return (
    <div
      style={{
        ...CARD,
        padding: 14,
        borderLeft: `4px solid ${moduleColor}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#2c2c2a",
              lineHeight: 1.35,
              marginBottom: 4,
            }}
          >
            {program.program_name}
          </div>
          {program.species?.accepted_name && (
            <div style={{ fontSize: 10, color: "#888", fontStyle: "italic" }}>
              {program.species.accepted_name}
            </div>
          )}
        </div>

        {program.readiness_score ? (
          <div
            style={{
              flexShrink: 0,
              textAlign: "center",
              background: "#f4f3ef",
              borderRadius: 8,
              padding: "6px 8px",
              minWidth: 52,
            }}
          >
            <div style={{ fontSize: 8, color: "#999", textTransform: "uppercase" }}>Ready</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1D9E75" }}>
              {program.readiness_score}
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <Pill bg={`${moduleColor}15`} color={moduleColor}>
          {program.current_module}
        </Pill>

        {program.current_gate && <Pill>{program.current_gate}</Pill>}

        {program.risk_level && (
          <Pill bg={riskTone.bg} color={riskTone.color}>
            {program.risk_level} risk
          </Pill>
        )}
      </div>

      {program.next_action && (
        <div
          style={{
            fontSize: 11,
            color: "#5f5e5a",
            lineHeight: 1.55,
            background: "#f8f7f4",
            borderRadius: 8,
            padding: "8px 10px",
          }}
        >
          → {program.next_action}
        </div>
      )}

      {program.primary_blocker && (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: "#A32D2D",
            lineHeight: 1.5,
            background: "#FCEBEB",
            borderRadius: 8,
            padding: "8px 10px",
          }}
        >
          ⚠ {program.primary_blocker}
        </div>
      )}
    </div>
  );
}

function StoryFeedItem({ entry }) {
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
        ...CARD,
        padding: "12px 14px",
        borderLeft: `3px solid ${typeColor}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#2c2c2a" }}>{entry.title}</div>
        <div style={{ fontSize: 9, color: "#888", flexShrink: 0 }}>
          {entry.entry_date || entry.created_at?.slice(0, 10)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
        {entry.entry_type && (
          <Pill bg={`${typeColor}18`} color={typeColor}>
            {entry.entry_type}
          </Pill>
        )}
        {entry.program_name && <Pill>{entry.program_name}</Pill>}
        {entry.linked_module && <Pill>{entry.linked_module}</Pill>}
      </div>

      {entry.summary && (
        <div style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.55 }}>{entry.summary}</div>
      )}
    </div>
  );
}

function ActionFeedItem({ action }) {
  const overdue = action.due_date && new Date(action.due_date) < new Date();
  const tone = overdue ? "high" : action.priority === "high" ? "medium" : "neutral";

  return (
    <QueueItem
      tone={tone}
      title={action.action_title}
      text={`${action.program_name ? action.program_name + " · " : ""}${action.action_owner ? "Owner: " + action.action_owner + " · " : ""}${action.due_date ? "Due: " + action.due_date : "No due date"}`}
    />
  );
}

function ModuleMap({ programs }) {
  const total = programs.length || 1;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
      {["Origin", "Forge", "Mesh", "Exchange", "Accord"].map((m) => {
        const count = programs.filter((p) => p.current_module === m).length;
        const color = MODULE_COLORS[m] || "#888";
        const pct = Math.round((count / total) * 100);

        return (
          <div
            key={m}
            style={{
              ...CARD,
              padding: "12px 10px",
              textAlign: "center",
              borderColor: `${color}33`,
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
            <div style={{ fontSize: 9, color: "#999" }}>{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

function FeaturedSpecies({ species, onSpeciesClick, onStartProgram }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
      {species.slice(0, 4).map((sp) => (
        <div key={sp.id} style={{ ...CARD, padding: 12 }}>
          <div
            onClick={() => onSpeciesClick?.(sp)}
            style={{ cursor: "pointer" }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#2c2c2a",
                marginBottom: 4,
                fontStyle: "italic",
                fontFamily: "Georgia,serif",
              }}
            >
              {sp.accepted_name}
            </div>
            <div style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>
              {sp.family || "Unknown family"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {sp.iucn_status && <Pill>{sp.iucn_status}</Pill>}
            {sp.composite_score != null && (
              <Pill bg="#E1F5EE" color="#085041">
                Score {sp.composite_score}
              </Pill>
            )}
          </div>

          <button
            onClick={() => onStartProgram?.(sp)}
            style={{
              width: "100%",
              padding: "7px 0",
              border: "1px solid #1D9E75",
              borderRadius: 8,
              background: "#fff",
              color: "#1D9E75",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Start Program
          </button>
        </div>
      ))}
    </div>
  );
}

export default function GEOCONHome({
  species = [],
  publications = [],
  metabolites = [],
  researchers = [],
  programs = [],
  user,
  setView,
  onSpeciesClick,
  onStartProgram,
}) {
  const threatenedSpecies = useMemo(
    () => species.filter((s) => ["CR", "EN", "VU"].includes(s.iucn_status)),
    [species]
  );

  const activePrograms = useMemo(
    () => programs.filter((p) => p.status === "Active"),
    [programs]
  );

  const blockedPrograms = useMemo(
    () => programs.filter((p) => p.status === "Blocked" || p.primary_blocker),
    [programs]
  );

  const draftPrograms = useMemo(
    () => programs.filter((p) => p.status === "Draft"),
    [programs]
  );

  const duePrograms = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    return programs.filter((p) => {
      if (!p.next_action_due) return false;
      return new Date(p.next_action_due) <= now;
    });
  }, [programs]);

  const ventureReadyPrograms = useMemo(
    () =>
      programs.filter(
        (p) =>
          (p.current_gate === "Venture" || p.current_module === "Exchange") &&
          p.status !== "Completed"
      ),
    [programs]
  );

  const unprogrammedPrioritySpecies = useMemo(() => {
    const programSpeciesIds = new Set(programs.map((p) => p.species_id).filter(Boolean));
    return species
      .filter((s) => !programSpeciesIds.has(s.id))
      .sort((a, b) => (b.composite_score || 0) - (a.composite_score || 0))
      .slice(0, 6);
  }, [species, programs]);

  const recentStory = useMemo(() => {
    return programs
      .flatMap((p) =>
        (p.story_entries || []).map((s) => ({
          ...s,
          program_name: p.program_name,
        }))
      )
      .sort((a, b) => {
        const aDate = a.entry_date || a.created_at || "";
        const bDate = b.entry_date || b.created_at || "";
        return bDate.localeCompare(aDate);
      })
      .slice(0, 6);
  }, [programs]);

  const dueActionFeed = useMemo(() => {
    return programs
      .filter((p) => p.next_action)
      .map((p) => ({
        id: p.id,
        action_title: p.next_action,
        action_owner: p.owner_name,
        due_date: p.next_action_due,
        priority: p.risk_level === "high" ? "high" : "medium",
        program_name: p.program_name,
      }))
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      })
      .slice(0, 6);
  }, [programs]);

  const priorityQueue = [
    blockedPrograms.length > 0
      ? {
          title: `${blockedPrograms.length} blocked program${blockedPrograms.length > 1 ? "s" : ""}`,
          text: "These programs have blockers and should be reviewed first.",
          tone: "high",
          onClick: () => setView?.("programs"),
        }
      : null,
    duePrograms.length > 0
      ? {
          title: `${duePrograms.length} due next action${duePrograms.length > 1 ? "s" : ""}`,
          text: "Some programs have overdue or due-now next actions.",
          tone: "medium",
          onClick: () => setView?.("programs"),
        }
      : null,
    ventureReadyPrograms.length > 0
      ? {
          title: `${ventureReadyPrograms.length} venture-relevant program${ventureReadyPrograms.length > 1 ? "s" : ""}`,
          text: "Programs are entering late-stage strategic or venture logic.",
          tone: "low",
          onClick: () => setView?.("programs"),
        }
      : null,
    unprogrammedPrioritySpecies.length > 0
      ? {
          title: `${unprogrammedPrioritySpecies.length} high-priority species without programs`,
          text: "These species score well but have not yet entered a GEOCON journey.",
          tone: "medium",
          onClick: () => setView?.("species"),
        }
      : null,
  ].filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...CARD, padding: 20 }}>
        <div
          style={{
            fontSize: 10,
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          GEOCON Home
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#2c2c2a",
            fontFamily: "Georgia,serif",
            marginBottom: 8,
            lineHeight: 1.15,
          }}
        >
          Program intelligence cockpit
        </div>

        <div style={{ fontSize: 13, color: "#5f5e5a", lineHeight: 1.65, maxWidth: 820 }}>
          GEOCON translates species intelligence into active programs, tracked transitions,
          action ownership, and institutional memory. ATLAS remains the intelligence layer;
          programs are the working layer.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
        <div style={{ ...CARD, padding: 16 }}>
          <SectionTitle
            title="Priority queue"
            sub="What needs attention right now"
            action="Open Programs"
            onAction={() => setView?.("programs")}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {priorityQueue.length === 0 ? (
              <QueueItem
                title="No urgent issues detected"
                text="The current operating layer looks stable. You can move to program creation, story building, or species exploration."
                tone="low"
              />
            ) : (
              priorityQueue.map((q, i) => (
                <QueueItem
                  key={i}
                  title={q.title}
                  text={q.text}
                  tone={q.tone}
                  onClick={q.onClick}
                />
              ))
            )}
          </div>
        </div>

        <div style={{ ...CARD, padding: 16 }}>
          <SectionTitle title="System snapshot" sub="Current operating state" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { l: "Programs", v: programs.length, c: "#534AB7" },
              { l: "Active", v: activePrograms.length, c: "#1D9E75" },
              { l: "Blocked", v: blockedPrograms.length, c: "#A32D2D" },
              { l: "Draft", v: draftPrograms.length, c: "#888" },
              { l: "Species", v: species.length, c: "#185FA5" },
              { l: "Threatened", v: threatenedSpecies.length, c: "#E24B4A" },
              { l: "Publications", v: publications.length, c: "#D85A30" },
              { l: "Researchers", v: researchers.length, c: "#0F6E56" },
            ].map((m) => (
              <div
                key={m.l}
                style={{
                  background: "#f8f7f4",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <div style={{ fontSize: 9, color: "#999", textTransform: "uppercase", marginBottom: 2 }}>
                  {m.l}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: m.c,
                    fontFamily: "Georgia,serif",
                  }}
                >
                  {m.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...CARD, padding: 16 }}>
        <SectionTitle
          title="Module map"
          sub="Where programs currently sit in the GEOCON journey"
          action="Programs"
          onAction={() => setView?.("programs")}
        />
        <ModuleMap programs={programs} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...CARD, padding: 16 }}>
          <SectionTitle
            title="Active programs"
            sub="Current working portfolio"
            action="See all"
            onAction={() => setView?.("programs")}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activePrograms.length === 0 ? (
              <QueueItem
                title="No active programs yet"
                text="Start from a species detail page or a featured species card below."
                tone="neutral"
              />
            ) : (
              activePrograms.slice(0, 4).map((p) => <ProgramMiniCard key={p.id} program={p} />)
            )}
          </div>
        </div>

        <div style={{ ...CARD, padding: 16 }}>
          <SectionTitle
            title="Due actions"
            sub="Immediate operational work"
            action="Open Programs"
            onAction={() => setView?.("programs")}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dueActionFeed.length === 0 ? (
              <QueueItem
                title="No due actions surfaced"
                text="Your programs do not currently expose urgent due items from next_action fields."
                tone="neutral"
              />
            ) : (
              dueActionFeed.map((a) => <ActionFeedItem key={a.id} action={a} />)
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...CARD, padding: 16 }}>
          <SectionTitle
            title="Recent story feed"
            sub="Latest program movement"
            action="Programs"
            onAction={() => setView?.("programs")}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentStory.length === 0 ? (
              <QueueItem
                title="No story entries yet"
                text="As programs begin to log milestones, evidence, and transitions, they will appear here."
                tone="neutral"
              />
            ) : (
              recentStory.map((entry, idx) => <StoryFeedItem key={entry.id || idx} entry={entry} />)
            )}
          </div>
        </div>

        <div style={{ ...CARD, padding: 16 }}>
          <SectionTitle
            title="Featured species"
            sub="High-value species ready for program initiation"
            action="Open Species"
            onAction={() => setView?.("species")}
          />

          <FeaturedSpecies
            species={unprogrammedPrioritySpecies.length > 0 ? unprogrammedPrioritySpecies : species}
            onSpeciesClick={onSpeciesClick}
            onStartProgram={onStartProgram}
          />
        </div>
      </div>

      <div style={{ ...CARD, padding: 16 }}>
        <SectionTitle title="Ask GEOCON" sub="Suggested operator questions" />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            "Which programs are blocked right now?",
            "Which species still have no active program?",
            "Which actions are overdue this week?",
            "Which programs are entering venture logic?",
            "Which module is currently overloaded?",
          ].map((q, i) => (
            <div
              key={i}
              style={{
                padding: "8px 10px",
                border: "1px solid #e8e6e1",
                borderRadius: 999,
                background: "#fff",
                fontSize: 11,
                color: "#2c2c2a",
              }}
            >
              {q}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
