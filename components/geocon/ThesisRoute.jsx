"use client";
// /geocon/thesis — Educational mode workspace.
//
// Reads list_my_theses (which folds both as-student and as-supervisor
// rows into one list with a `role` chip). The route splits them into
// two columns so a researcher who's a student here and a supervisor
// there sees both stacks at a glance. Each card shows a progress bar
// derived from milestone_done / milestone_total + the next due date.
//
// A small "start new thesis" inline form lives at the bottom for
// students kicking off and for supervisors registering a track on
// behalf of a student that's already in the system.

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, UserCog, Plus, CalendarClock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import { EmptyState, MiniBar } from "../shared";

const LEVEL_META = {
  undergrad: { label: "Undergrad", tint: "var(--gx-ink-muted)" },
  msc:       { label: "MSc",       tint: "var(--gx-info)" },
  phd:       { label: "PhD",       tint: "var(--gx-accent-violet)" },
  postdoc:   { label: "Postdoc",   tint: "var(--gx-success)" },
};

const STATUS_META = {
  proposal:        { label: "Proposal",        tint: "var(--gx-ink-muted)" },
  data_collection: { label: "Data collection", tint: "var(--gx-info)" },
  analysis:        { label: "Analysis",        tint: "var(--gx-accent-violet)" },
  writing:         { label: "Writing",         tint: "#BA7517" },
  submitted:       { label: "Submitted",       tint: "var(--gx-accent-azure)" },
  defended:        { label: "Defended",        tint: "var(--gx-success)" },
};

const STATUS_ORDER = ["proposal","data_collection","analysis","writing","submitted","defended"];

const LEVELS = [
  { key: "undergrad", label: "Undergrad" },
  { key: "msc",       label: "MSc" },
  { key: "phd",       label: "PhD" },
  { key: "postdoc",   label: "Postdoc" },
];

export default function ThesisRoute() {
  const { user, loading: authLoading } = useAuthContext();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_my_theses");
      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Thesis tracks yüklenemedi", { detail: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  if (authLoading || loading) {
    return <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>Loading…</div>;
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", padding: 40, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: "var(--gx-card-radius)", textAlign: "center" }}>
        <GraduationCap size={28} strokeWidth={1.5} style={{ color: "var(--gx-ink-muted)", marginBottom: 8 }} />
        <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, margin: 0, color: "var(--gx-ink)" }}>Sign in for the Educational mode</h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 8, lineHeight: 1.6 }}>
          Thesis tracker yalnızca student/supervisor çiftine açık. ORCID veya BEE üzerinden gir.
        </p>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "8px 14px", fontSize: 12, fontWeight: 600, background: "var(--gx-success)", color: "#fff", borderRadius: 7, textDecoration: "none" }}>
          Sign in
        </Link>
      </div>
    );
  }

  const asStudent    = rows.filter((r) => r.role === "student");
  const asSupervisor = rows.filter((r) => r.role === "supervisor");

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <div className="gx-overline" style={{ marginBottom: 4 }}>Workspace · Education</div>
        <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          Thesis tracker
          <span style={{ fontSize: 13, color: "var(--gx-ink-muted)", fontWeight: 400, fontFamily: "var(--gx-font-mono)" }}>
            {rows.length} active
          </span>
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 720 }}>
          Lisans / yüksek lisans / doktora / post-doc süreçleri için iki rollü
          (öğrenci · danışman) çalışma alanı. Milestones kanban olarak akar; her
          adımı işaretledikçe tezin durumu otomatik ilerler.
        </p>
        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", fontSize: 12, fontWeight: 700,
              background: showForm ? "var(--gx-surface-2)" : "var(--gx-accent-violet)",
              color: showForm ? "var(--gx-ink)" : "#fff",
              border: showForm ? "1px solid var(--gx-border-soft)" : "1px solid var(--gx-accent-violet)",
              borderRadius: 8, cursor: "pointer",
            }}>
            <Plus size={13} strokeWidth={2} />
            {showForm ? "Cancel" : "Start new thesis"}
          </button>
        </div>
      </header>

      {showForm && (
        <StartThesisForm
          currentUserId={user.id}
          onDone={() => { setShowForm(false); load(); }}
        />
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="Henüz bir thesis track yok"
          hint="Üstteki 'Start new thesis' düğmesi ile öğrenci olarak veya danışman olarak ilk tezi kaydet."
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 22 }}>
          <Column
            icon={<GraduationCap size={14} strokeWidth={1.85} />}
            title="As student"
            empty="Öğrenci olarak kayıtlı bir tez yok."
            rows={asStudent}
          />
          <Column
            icon={<UserCog size={14} strokeWidth={1.85} />}
            title="As supervisor"
            empty="Danışman olarak kayıtlı bir tez yok."
            rows={asSupervisor}
          />
        </div>
      )}
    </div>
  );
}

function Column({ icon, title, empty, rows }) {
  return (
    <section>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 10, paddingBottom: 8,
        borderBottom: "1px solid var(--gx-border-soft)",
      }}>
        <span style={{ color: "var(--gx-ink-soft)" }}>{icon}</span>
        <h2 style={{
          fontFamily: "var(--gx-font-display)",
          fontSize: 14, fontWeight: 700, color: "var(--gx-ink)",
          margin: 0, letterSpacing: 0.2,
        }}>
          {title}
        </h2>
        <span style={{
          fontSize: 10, fontFamily: "var(--gx-font-mono)",
          color: "var(--gx-ink-faint)",
        }}>
          {rows.length}
        </span>
      </div>
      {rows.length === 0 ? (
        <div style={{
          padding: 18, textAlign: "center", fontSize: 11,
          color: "var(--gx-ink-muted)",
          background: "var(--gx-surface-2)",
          border: "1px dashed var(--gx-border-soft)",
          borderRadius: 10,
        }}>
          {empty}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((r) => <ThesisCard key={r.id} row={r} />)}
        </div>
      )}
    </section>
  );
}

function ThesisCard({ row }) {
  const level  = LEVEL_META[row.level] || LEVEL_META.msc;
  const status = STATUS_META[row.status] || STATUS_META.proposal;
  const total  = Number(row.milestone_total) || 0;
  const done   = Number(row.milestone_done) || 0;
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
  const stepIdx = STATUS_ORDER.indexOf(row.status);
  const stepPct = stepIdx >= 0 ? Math.round(((stepIdx + 1) / STATUS_ORDER.length) * 100) : 0;

  return (
    <Link href={`/geocon/thesis/${encodeURIComponent(row.id)}`} style={{
      textDecoration: "none", color: "inherit",
      padding: "var(--gx-card-pad-sm)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
          padding: "2px 7px", borderRadius: 999,
          background: `color-mix(in srgb, ${level.tint} 14%, transparent)`,
          color: level.tint, fontFamily: "var(--gx-font-mono)",
        }}>{level.label}</span>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
          padding: "2px 7px", borderRadius: 999,
          background: `color-mix(in srgb, ${status.tint} 14%, transparent)`,
          color: status.tint, fontFamily: "var(--gx-font-mono)",
        }}>{status.label}</span>
        {row.target_defense_date && (
          <span title="Target defense" style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 9, color: "var(--gx-ink-faint)",
            fontFamily: "var(--gx-font-mono)",
          }}>
            <CalendarClock size={10} strokeWidth={1.85} />
            {new Date(row.target_defense_date).toLocaleDateString()}
          </span>
        )}
      </div>

      <h3 style={{
        fontFamily: "var(--gx-font-display)",
        fontSize: 15, fontWeight: 700, color: "var(--gx-ink)",
        margin: 0, lineHeight: 1.3,
      }}>
        {row.title || "Untitled thesis"}
      </h3>

      {row.institution && (
        <div style={{ fontSize: 11, color: "var(--gx-ink-muted)" }}>
          {row.institution}
        </div>
      )}

      {Array.isArray(row.species_set) && row.species_set.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {row.species_set.slice(0, 4).map((s) => (
            <span key={s} style={{
              fontSize: 9, fontFamily: "var(--gx-font-mono)",
              padding: "2px 6px", borderRadius: 4,
              background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)",
            }}>{s}</span>
          ))}
          {row.species_set.length > 4 && (
            <span style={{ fontSize: 9, color: "var(--gx-ink-faint)" }}>
              +{row.species_set.length - 4} more
            </span>
          )}
        </div>
      )}

      <div style={{ marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--gx-ink-muted)", marginBottom: 4, fontFamily: "var(--gx-font-mono)" }}>
          <span>Milestones</span>
          <span>{done}/{total} ({pct}%)</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <MiniBar value={done} max={Math.max(total, 1)} color="var(--gx-success)" h={5} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--gx-ink-muted)", margin: "8px 0 4px", fontFamily: "var(--gx-font-mono)" }}>
          <span>Stage</span>
          <span>{stepPct}%</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <MiniBar value={Math.max(stepIdx + 1, 0)} max={STATUS_ORDER.length} color={status.tint} h={5} />
        </div>
      </div>

      {row.next_due_at && (
        <div style={{
          marginTop: 2, fontSize: 10, color: "var(--gx-ink-muted)",
          fontFamily: "var(--gx-font-mono)",
        }}>
          next due {new Date(row.next_due_at).toLocaleDateString()}
        </div>
      )}
    </Link>
  );
}

function StartThesisForm({ currentUserId, onDone }) {
  const toast = useToast();
  const [role, setRole] = useState("student"); // 'student' | 'supervisor'
  const [counterpartId, setCounterpartId] = useState("");
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [level, setLevel] = useState("msc");
  const [startedAt, setStartedAt] = useState("");
  const [targetDefense, setTargetDefense] = useState("");
  const [speciesText, setSpeciesText] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) {
      toast.warning("Title required");
      return;
    }
    if (!counterpartId.trim()) {
      toast.warning(role === "student" ? "Supervisor user id gerekli" : "Student user id gerekli");
      return;
    }
    const student    = role === "student"    ? currentUserId  : counterpartId.trim();
    const supervisor = role === "supervisor" ? currentUserId  : counterpartId.trim();
    const speciesSet = speciesText.split(",").map((s) => s.trim()).filter(Boolean);

    setBusy(true);
    try {
      const { error } = await supabase.rpc("start_thesis_track", {
        p_student_user_id: student,
        p_supervisor_user_id: supervisor,
        p_title: title.trim(),
        p_institution: institution.trim() || null,
        p_level: level,
        p_started_at: startedAt || null,
        p_target_defense_date: targetDefense || null,
        p_species_set: speciesSet,
        p_notes_md: notes.trim() || null,
      });
      if (error) throw error;
      toast.success("Thesis track opened");
      onDone?.();
    } catch (e) {
      toast.error("Açılamadı", { detail: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      padding: 18, marginBottom: 22,
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gx-ink-muted)" }}>
        Start new thesis
      </div>

      <div>
        <Label>You are the…</Label>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { k: "student",    label: "Student"    },
            { k: "supervisor", label: "Supervisor" },
          ].map((r) => {
            const active = role === r.k;
            return (
              <button key={r.k} onClick={() => setRole(r.k)} style={{
                padding: "6px 12px", fontSize: 11, fontWeight: 700,
                background: active ? "var(--gx-accent-violet)" : "var(--gx-surface)",
                color: active ? "#fff" : "var(--gx-ink-soft)",
                border: `1px solid ${active ? "var(--gx-accent-violet)" : "var(--gx-border-soft)"}`,
                borderRadius: 999, cursor: "pointer",
              }}>{r.label}</button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>{role === "student" ? "Supervisor user id" : "Student user id"}</Label>
        <input value={counterpartId} onChange={(e) => setCounterpartId(e.target.value)}
          placeholder="auth.users.id (uuid)" style={{ ...input, fontFamily: "var(--gx-font-mono)", fontSize: 11 }} />
        <Hint>
          Counterpart Supabase user id (uuid). Profile picker buraya entegre
          edilecek — şimdilik manuel id girilir.
        </Hint>
      </div>

      <div>
        <Label>Title</Label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Anatolian Crocus pigment chemistry under drought" style={input} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>Institution</Label>
          <input value={institution} onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g., Ege Üniversitesi" style={input} />
        </div>
        <div>
          <Label>Level</Label>
          <select value={level} onChange={(e) => setLevel(e.target.value)} style={input}>
            {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>Started</Label>
          <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} style={input} />
        </div>
        <div>
          <Label>Target defense</Label>
          <input type="date" value={targetDefense} onChange={(e) => setTargetDefense(e.target.value)} style={input} />
        </div>
      </div>

      <div>
        <Label>Species set</Label>
        <input value={speciesText} onChange={(e) => setSpeciesText(e.target.value)}
          placeholder="GEO-TR-Crocus-mathewii, GEO-TR-Salvia-fruticosa"
          style={{ ...input, fontFamily: "var(--gx-font-mono)", fontSize: 11 }} />
        <Hint>Comma-separated species ids. Optional.</Hint>
      </div>

      <div>
        <Label>Notes (markdown)</Label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
          placeholder="Scope, hypotheses, expected outputs…"
          style={{ ...input, fontFamily: "inherit", resize: "vertical" }} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={submit} disabled={busy} style={{
          padding: "9px 16px", fontSize: 12, fontWeight: 700,
          background: "var(--gx-accent-violet)", color: "#fff",
          border: "none", borderRadius: 8, cursor: "pointer",
          opacity: busy ? 0.6 : 1,
        }}>
          {busy ? "Opening…" : "Open thesis track →"}
        </button>
        <div style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
          Sadece sen ve karşı tarafın erişebilir (RLS).
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--gx-ink-muted)", marginBottom: 5 }}>
      {children}
    </div>
  );
}

function Hint({ children }) {
  return (
    <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

const input = {
  width: "100%",
  padding: "8px 11px",
  fontSize: 12,
  background: "var(--gx-surface-2)",
  color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 7,
  boxSizing: "border-box",
};
