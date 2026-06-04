"use client";
// U4 / E6 — Species event timeline.
//
// Vertical list of every recorded event for a species: programs,
// outcomes, publications, edit proposals, field provenance writes,
// field observations. Anything that has a timestamp + a species_id.
//
// Mounted inside SpeciesDetailRoute. Collapsible (default open).
// Each row is link-clickable to the originating entity.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase, Award, BookOpen, Pencil, Database, MapPin, Clock,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const KIND_META = {
  program_created: { Icon: Briefcase,  label: "Program",       tint: "var(--gx-success)" },
  outcome:         { Icon: Award,      label: "Outcome",       tint: "var(--gx-accent-violet)" },
  publication:     { Icon: BookOpen,   label: "Publication",   tint: "var(--gx-info)" },
  edit_accepted:   { Icon: Pencil,     label: "Edit",          tint: "var(--gx-warning)" },
  observation:     { Icon: MapPin,     label: "Observation",   tint: "var(--gx-accent-azure)" },
};

function metaFor(kind) {
  if (KIND_META[kind]) return KIND_META[kind];
  if (kind?.startsWith("source_")) {
    return { Icon: Database, label: kind.replace("source_", "Source · "), tint: "var(--gx-ink-soft)" };
  }
  return { Icon: Clock, label: kind, tint: "var(--gx-ink-muted)" };
}

export default function SpeciesTimeline({ speciesId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!speciesId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_species_timeline", {
        p_species_id: speciesId, p_limit: 80,
      });
      if (!cancelled) {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [speciesId]);

  if (loading) return null;
  if (rows.length === 0) return null;

  return (
    <section style={{
      marginTop: 18,
      padding: "var(--gx-card-pad)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
    }}>
      <button onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: "transparent", border: "none",
          color: "inherit", cursor: "pointer", padding: 0, textAlign: "left",
        }}>
        <div>
          <div className="gx-overline" style={{ marginBottom: 4 }}>Atlas timeline</div>
          <h2 style={{
            fontFamily: "var(--gx-font-display)", fontSize: 18, fontWeight: 700,
            color: "var(--gx-ink)", margin: 0, letterSpacing: "-0.01em",
          }}>
            Event history
            <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400,
                            color: "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)" }}>
              {rows.length} event{rows.length === 1 ? "" : "s"}
            </span>
          </h2>
        </div>
        {expanded ? <ChevronDown size={16} strokeWidth={1.85} /> : <ChevronRight size={16} strokeWidth={1.85} />}
      </button>

      {expanded && (
        <div style={{ marginTop: 14, position: "relative" }}>
          {/* Vertical spine */}
          <div style={{
            position: "absolute", left: 11, top: 2, bottom: 2,
            width: 2, background: "var(--gx-border-soft)",
          }} />

          {rows.map((r, i) => {
            const m = metaFor(r.kind);
            const Icon = m.Icon;
            const isLink = r.url && r.url.startsWith("/");
            const Wrap = isLink ? Link : "div";
            const wrapProps = isLink ? { href: r.url } : {};
            return (
              <Wrap key={`${r.ts}:${r.kind}:${i}`} {...wrapProps} style={{
                display: "flex", gap: 12, padding: "8px 0",
                textDecoration: "none", color: "inherit",
              }}>
                <div style={{
                  flexShrink: 0,
                  width: 24, height: 24, borderRadius: 999,
                  background: `color-mix(in srgb, ${m.tint} 14%, var(--gx-card-bg))`,
                  border: `2px solid ${m.tint}`,
                  color: m.tint,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", zIndex: 1,
                }}>
                  <Icon size={11} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
                      color: m.tint, fontFamily: "var(--gx-font-mono)",
                    }}>
                      {m.label}
                    </span>
                    <span style={{
                      fontSize: 9, color: "var(--gx-ink-faint)",
                      fontFamily: "var(--gx-font-mono)",
                    }}>
                      {new Date(r.ts).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{
                    marginTop: 3,
                    fontSize: 13, color: "var(--gx-ink)", lineHeight: 1.4,
                    fontWeight: 600,
                  }}>
                    {r.title}
                  </div>
                  {r.subtitle && (
                    <div style={{
                      marginTop: 2, fontSize: 11, color: "var(--gx-ink-muted)",
                      lineHeight: 1.5,
                    }}>
                      {r.subtitle}
                    </div>
                  )}
                  {r.actor && (
                    <div style={{
                      marginTop: 3, fontSize: 10, color: "var(--gx-ink-faint)",
                      fontStyle: "italic",
                    }}>
                      by {r.actor}
                    </div>
                  )}
                </div>
              </Wrap>
            );
          })}
        </div>
      )}
    </section>
  );
}
