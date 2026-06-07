"use client";
// Affiliated theses for a program (thesis↔program integration).
//
// Lists theses that opted-in to this program via link_thesis_to_program.
// Shows basic, non-private metadata only (no notes_md). Renders nothing
// when no thesis is linked, so it never clutters a program page.

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, CalendarClock, ArrowRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

const LEVEL_TINT = {
  undergrad: "var(--gx-ink-muted)", msc: "var(--gx-info)",
  phd: "var(--gx-accent-violet)", postdoc: "var(--gx-success)",
};
const STATUS_LABEL = {
  proposal: "Proposal", data_collection: "Data collection", analysis: "Analysis",
  writing: "Writing", submitted: "Submitted", defended: "Defended",
};

export default function ProgramTheses({ programId, title = "Affiliated theses" }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("list_program_theses", { p_program_id: programId });
      if (!cancelled) { setRows(Array.isArray(data) ? data : []); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [programId]);

  if (loading || rows.length === 0) return null;

  return (
    <section style={{
      marginTop: 16, padding: "var(--gx-card-pad)",
      background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <GraduationCap size={15} strokeWidth={1.85} style={{ color: "var(--gx-accent-violet)" }} />
        <h3 style={{ fontFamily: "var(--gx-font-display)", fontSize: 14, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
          {title} <span style={{ fontFamily: "var(--gx-font-mono)", fontWeight: 400, fontSize: 11, color: "var(--gx-ink-faint)" }}>· {rows.length}</span>
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((t) => {
          const pct = t.milestone_total > 0 ? Math.round((t.milestone_done / t.milestone_total) * 100) : 0;
          return (
            <Link key={t.id} href={`/geocon/thesis/${t.id}`} style={{
              display: "block", padding: "var(--gx-card-pad-sm)", textDecoration: "none",
              background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)",
              borderRadius: "var(--gx-card-radius)",
            }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", padding: "2px 7px", borderRadius: 999,
                  background: `color-mix(in srgb, ${LEVEL_TINT[t.level] || "var(--gx-ink-muted)"} 14%, transparent)`,
                  color: LEVEL_TINT[t.level] || "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)" }}>
                  {(t.level || "msc").toUpperCase()}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                  background: "var(--gx-surface)", color: "var(--gx-ink-soft)", fontFamily: "var(--gx-font-mono)" }}>
                  {STATUS_LABEL[t.status] || t.status || "—"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gx-ink)", lineHeight: 1.3 }}>
                  {t.title || "Untitled thesis"}
                </div>
                <ArrowRight size={13} strokeWidth={1.9} style={{ color: "var(--gx-ink-faint)", flexShrink: 0 }} />
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 5, fontSize: 10, color: "var(--gx-ink-muted)", flexWrap: "wrap", fontFamily: "var(--gx-font-mono)" }}>
                {t.student_name && <span>{t.student_name}{t.supervisor_name ? ` · adv. ${t.supervisor_name}` : ""}</span>}
                {t.institution && <span style={{ color: "var(--gx-ink-faint)" }}>{t.institution}</span>}
                {t.target_defense_date && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <CalendarClock size={10} strokeWidth={1.85} /> {new Date(t.target_defense_date).toLocaleDateString()}
                  </span>
                )}
                {t.milestone_total > 0 && <span>{t.milestone_done}/{t.milestone_total} ({pct}%)</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
