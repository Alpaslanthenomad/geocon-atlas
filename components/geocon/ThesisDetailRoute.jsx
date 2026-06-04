"use client";
// /geocon/thesis/[id] — single thesis track detail.
//
// Loads the parent thesis row + all its milestones (RLS enforces that
// non-participants get an empty result). Surfaces the title, institution,
// level chip, species set chips, then a milestone timeline ordered by
// due_date with a one-click "complete" toggle and an inline "add
// milestone" form. notes_md renders as a pre-wrap block — we deliberately
// don't pull a markdown lib here to keep bundle weight low; the body just
// preserves line breaks.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, GraduationCap, CalendarClock, CheckCircle2, Circle,
  Plus, BookOpen, Microscope, BarChart3, FileText, RefreshCw, Award,
} from "lucide-react";
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

const KIND_META = {
  literature_review: { label: "Literature",  Icon: BookOpen,    tint: "var(--gx-info)" },
  field_work:        { label: "Field work",  Icon: Microscope,  tint: "var(--gx-accent-bio-green)" },
  analysis:          { label: "Analysis",    Icon: BarChart3,   tint: "var(--gx-accent-violet)" },
  draft:             { label: "Draft",       Icon: FileText,    tint: "#BA7517" },
  revision:          { label: "Revision",    Icon: RefreshCw,   tint: "var(--gx-accent-azure)" },
  defense:           { label: "Defense",     Icon: Award,       tint: "var(--gx-success)" },
};

const KINDS = Object.keys(KIND_META);

export default function ThesisDetailRoute({ thesisId }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const toast = useToast();
  const [thesis, setThesis] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [completing, setCompleting] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [tRes, mRes] = await Promise.all([
        supabase.from("thesis_tracks").select("*").eq("id", thesisId).maybeSingle(),
        supabase.from("thesis_milestones").select("*").eq("thesis_id", thesisId).order("due_date", { ascending: true, nullsFirst: false }),
      ]);
      if (tRes.error) throw tRes.error;
      if (mRes.error) throw mRes.error;
      setThesis(tRes.data || null);
      setMilestones(Array.isArray(mRes.data) ? mRes.data : []);
    } catch (e) {
      toast.error("Thesis yüklenemedi", { detail: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, thesisId]);

  async function completeMilestone(id) {
    setCompleting(id);
    try {
      const { error } = await supabase.rpc("complete_thesis_milestone", { p_milestone_id: id });
      if (error) throw error;
      setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, completed_at: new Date().toISOString() } : m));
      toast.info("Milestone tamamlandı");
    } catch (e) {
      toast.error("İşlem başarısız", { detail: e?.message || String(e) });
    } finally {
      setCompleting(null);
    }
  }

  if (authLoading || loading) {
    return <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>Loading…</div>;
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", padding: 40, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: "var(--gx-card-radius)", textAlign: "center" }}>
        <GraduationCap size={28} strokeWidth={1.5} style={{ color: "var(--gx-ink-muted)", marginBottom: 8 }} />
        <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, margin: 0, color: "var(--gx-ink)" }}>Sign in to open this thesis</h1>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "8px 14px", fontSize: 12, fontWeight: 600, background: "var(--gx-success)", color: "#fff", borderRadius: 7, textDecoration: "none" }}>
          Sign in
        </Link>
      </div>
    );
  }

  if (!thesis) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 14 }}>
          <Link href="/geocon/thesis" style={{ fontSize: 11, color: "var(--gx-ink-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ArrowLeft size={11} strokeWidth={1.85} /> Thesis tracker
          </Link>
        </div>
        <EmptyState
          icon="○"
          title="Bu thesis bulunamadı"
          hint="Silinmiş ya da izinli değilsin. Yalnızca tezin öğrencisi ve danışmanı görebilir."
        />
      </div>
    );
  }

  const level  = LEVEL_META[thesis.level]  || LEVEL_META.msc;
  const status = STATUS_META[thesis.status] || STATUS_META.proposal;
  const done   = milestones.filter((m) => m.completed_at).length;
  const total  = milestones.length;
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
  const role   = thesis.student_user_id === user.id ? "student"
               : thesis.supervisor_user_id === user.id ? "supervisor"
               : null;

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", paddingBottom: 60 }}>
      <div style={{ marginBottom: 14 }}>
        <Link href="/geocon/thesis" style={{ fontSize: 11, color: "var(--gx-ink-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={11} strokeWidth={1.85} /> Thesis tracker
        </Link>
      </div>

      {/* Header */}
      <header style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
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
          {role && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              padding: "2px 7px", borderRadius: 999,
              background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)",
              fontFamily: "var(--gx-font-mono)",
            }}>
              YOU · {role}
            </span>
          )}
        </div>

        <h1 className="gx-h1" style={{ margin: 0 }}>
          {thesis.title || "Untitled thesis"}
        </h1>

        {thesis.institution && (
          <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 6 }}>
            {thesis.institution}
          </div>
        )}

        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: "var(--gx-ink-muted)", flexWrap: "wrap", fontFamily: "var(--gx-font-mono)" }}>
          {thesis.started_at && (
            <span><span style={{ color: "var(--gx-ink-faint)" }}>started</span> {new Date(thesis.started_at).toLocaleDateString()}</span>
          )}
          {thesis.target_defense_date && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <CalendarClock size={11} strokeWidth={1.85} />
              <span style={{ color: "var(--gx-ink-faint)" }}>defense</span> {new Date(thesis.target_defense_date).toLocaleDateString()}
            </span>
          )}
        </div>

        {Array.isArray(thesis.species_set) && thesis.species_set.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
            {thesis.species_set.map((s) => (
              <Link key={s} href={`/geocon/species/${encodeURIComponent(s)}`} style={{
                fontSize: 10, fontFamily: "var(--gx-font-mono)",
                padding: "3px 8px", borderRadius: 4,
                background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)",
                textDecoration: "none",
                border: "1px solid var(--gx-border-soft)",
              }}>
                {s}
              </Link>
            ))}
          </div>
        )}

        {/* Progress */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--gx-ink-muted)", marginBottom: 4, fontFamily: "var(--gx-font-mono)" }}>
            <span>Milestone progress</span>
            <span>{done}/{total} ({pct}%)</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <MiniBar value={done} max={Math.max(total, 1)} color="var(--gx-success)" h={6} />
          </div>
        </div>
      </header>

      {/* Notes */}
      {thesis.notes_md && (
        <section style={{
          padding: "var(--gx-card-pad-sm)",
          background: "var(--gx-card-bg)",
          border: "1px solid var(--gx-card-border)",
          borderRadius: "var(--gx-card-radius)",
          marginBottom: 22,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gx-ink-muted)", marginBottom: 8 }}>
            Notes
          </div>
          <p style={{
            whiteSpace: "pre-wrap", margin: 0,
            fontSize: 13, color: "var(--gx-ink-soft)", lineHeight: 1.6,
            fontFamily: "var(--gx-font-serif)",
          }}>
            {thesis.notes_md}
          </p>
        </section>
      )}

      {/* Milestones */}
      <section style={{ marginTop: 4 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 10, paddingBottom: 8,
          borderBottom: "1px solid var(--gx-border-soft)",
        }}>
          <h2 style={{
            fontFamily: "var(--gx-font-display)",
            fontSize: 14, fontWeight: 700, color: "var(--gx-ink)",
            margin: 0, letterSpacing: 0.2,
          }}>
            Milestones <span style={{ fontFamily: "var(--gx-font-mono)", fontWeight: 400, fontSize: 11, color: "var(--gx-ink-faint)" }}>· {total}</span>
          </h2>
          <button
            onClick={() => setShowAdd((v) => !v)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 11px", fontSize: 11, fontWeight: 700,
              background: showAdd ? "var(--gx-surface-2)" : "var(--gx-accent-violet)",
              color: showAdd ? "var(--gx-ink)" : "#fff",
              border: showAdd ? "1px solid var(--gx-border-soft)" : "1px solid var(--gx-accent-violet)",
              borderRadius: 7, cursor: "pointer",
            }}>
            <Plus size={11} strokeWidth={2.1} />
            {showAdd ? "Cancel" : "Add milestone"}
          </button>
        </div>

        {showAdd && (
          <AddMilestoneForm thesisId={thesisId} onDone={() => { setShowAdd(false); load(); }} />
        )}

        {total === 0 ? (
          <EmptyState
            icon="·"
            title="Henüz milestone yok"
            hint="İlk milestone'ı yukarıdan ekle. Tarih atayıp tamamlandıkça progress otomatik artar."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {milestones.map((m) => (
              <MilestoneRow
                key={m.id}
                row={m}
                busy={completing === m.id}
                onComplete={() => completeMilestone(m.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MilestoneRow({ row, busy, onComplete }) {
  const meta = KIND_META[row.kind] || KIND_META.literature_review;
  const Icon = meta.Icon;
  const done = !!row.completed_at;
  const overdue = !done && row.due_date && new Date(row.due_date) < new Date();

  return (
    <div style={{
      padding: "var(--gx-card-pad-sm)",
      background: done ? "var(--gx-surface-2)" : "var(--gx-card-bg)",
      border: `1px solid ${overdue ? "var(--gx-accent-rose)" : "var(--gx-card-border)"}`,
      borderRadius: "var(--gx-card-radius)",
      display: "flex", alignItems: "flex-start", gap: 12,
      opacity: done ? 0.7 : 1,
    }}>
      <button
        onClick={done ? undefined : onComplete}
        disabled={busy || done}
        title={done ? "Completed" : "Mark complete"}
        aria-label={done ? "Completed" : "Mark milestone complete"}
        style={{
          flexShrink: 0,
          width: 28, height: 28, borderRadius: "50%",
          background: "transparent",
          color: done ? "var(--gx-success)" : "var(--gx-ink-muted)",
          border: "none", cursor: done ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0,
        }}>
        {done
          ? <CheckCircle2 size={20} strokeWidth={2} />
          : <Circle size={20} strokeWidth={1.5} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
            padding: "2px 7px", borderRadius: 999,
            background: `color-mix(in srgb, ${meta.tint} 14%, transparent)`,
            color: meta.tint, fontFamily: "var(--gx-font-mono)",
          }}>
            <Icon size={10} strokeWidth={2} />
            {meta.label}
          </span>
          {row.due_date && (
            <span style={{
              fontSize: 9, fontFamily: "var(--gx-font-mono)",
              color: overdue ? "var(--gx-accent-rose)" : "var(--gx-ink-faint)",
            }}>
              due {new Date(row.due_date).toLocaleDateString()}{overdue ? " · overdue" : ""}
            </span>
          )}
          {done && (
            <span style={{
              fontSize: 9, fontFamily: "var(--gx-font-mono)",
              color: "var(--gx-success)",
            }}>
              done {new Date(row.completed_at).toLocaleDateString()}
            </span>
          )}
        </div>
        <div style={{
          marginTop: 4,
          fontSize: 13, fontWeight: 600, color: "var(--gx-ink)",
          textDecoration: done ? "line-through" : "none",
          textDecorationColor: "var(--gx-ink-faint)",
          lineHeight: 1.3,
        }}>
          {row.label}
        </div>
        {row.notes_md && (
          <p style={{
            marginTop: 6, fontSize: 11, color: "var(--gx-ink-soft)",
            lineHeight: 1.5, whiteSpace: "pre-wrap",
            fontFamily: "var(--gx-font-serif)",
          }}>
            {row.notes_md}
          </p>
        )}
      </div>
    </div>
  );
}

function AddMilestoneForm({ thesisId, onDone }) {
  const toast = useToast();
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState("literature_review");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!label.trim()) {
      toast.warning("Label required");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("add_thesis_milestone", {
        p_thesis_id: thesisId,
        p_label: label.trim(),
        p_due_date: dueDate || null,
        p_kind: kind,
        p_notes_md: notes.trim() || null,
      });
      if (error) throw error;
      toast.success("Milestone eklendi");
      onDone?.();
    } catch (e) {
      toast.error("Eklenemedi", { detail: e?.message || String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      padding: 14, marginBottom: 12,
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: 10,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div>
        <Label>Kind</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {KINDS.map((k) => {
            const meta = KIND_META[k];
            const Icon = meta.Icon;
            const active = kind === k;
            return (
              <button key={k} onClick={() => setKind(k)} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "5px 10px", fontSize: 10, fontWeight: 700,
                background: active ? meta.tint : "var(--gx-surface)",
                color: active ? "#fff" : "var(--gx-ink-soft)",
                border: `1px solid ${active ? meta.tint : "var(--gx-border-soft)"}`,
                borderRadius: 999, cursor: "pointer",
                fontFamily: "var(--gx-font-mono)",
              }}>
                <Icon size={10} strokeWidth={2.1} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Label</Label>
        <input value={label} onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., Draft methods chapter" style={input} />
      </div>

      <div>
        <Label>Due (optional)</Label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          style={{ ...input, maxWidth: 200 }} />
      </div>

      <div>
        <Label>Notes (markdown)</Label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          placeholder="What does done look like?"
          style={{ ...input, fontFamily: "inherit", resize: "vertical" }} />
      </div>

      <div>
        <button onClick={submit} disabled={busy} style={{
          padding: "8px 14px", fontSize: 11, fontWeight: 700,
          background: "var(--gx-accent-violet)", color: "#fff",
          border: "none", borderRadius: 7, cursor: "pointer",
          opacity: busy ? 0.6 : 1,
        }}>
          {busy ? "Adding…" : "Add milestone"}
        </button>
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

const input = {
  width: "100%",
  padding: "8px 11px",
  fontSize: 12,
  background: "var(--gx-surface)",
  color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 7,
  boxSizing: "border-box",
};
