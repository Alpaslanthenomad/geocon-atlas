"use client";
// v5.4-c — "Today on GEOCON" Home widget.
//
// Rolling 24h activity snapshot for the Home page. Tells visitors
// (researchers + reviewers + funders) the platform is alive — not a
// static atlas. Renders 5 counter pills + top 3 "hot species today"
// hits. Silent if 24h activity is 0 (clean Home page on slow days).

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Radio, Award, FileText, BookOpen, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

const TIER_TINT = {
  CR: "#E5484D", EN: "#F76808", VU: "#F5D90A",
  NT: "#A8DDD4", LC: "#9AE6B4", DD: "#C5CDD3", NE: "#9AA5AD",
};

export default function TodayOnGeocon() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: d } = await supabase.rpc("get_today_on_geocon");
      if (!cancelled) {
        setData(d || null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return null;
  if (!data) return null;

  const totalActivity =
    (data.edits_accepted || 0) +
    (data.new_outcomes || 0) +
    (data.new_assessments || 0) +
    (data.field_observations || 0) +
    (data.inat_observations || 0) +
    (data.new_programs || 0) +
    (data.new_publications || 0);

  // Hide widget on truly silent days (no activity at all)
  if (totalActivity === 0) return null;

  const pills = [
    { label: "obs",        n: (data.field_observations || 0) + (data.inat_observations || 0), Icon: Radio, href: "/geocon/observe", tint: "var(--gx-success)" },
    { label: "outcomes",   n: data.new_outcomes,    Icon: Award,    href: "/geocon/outcomes/timeline", tint: "var(--gx-accent-violet)" },
    { label: "edits",      n: data.edits_accepted,  Icon: FileText, href: "/geocon/species", tint: "var(--gx-accent-azure)" },
    { label: "assessments",n: data.new_assessments, Icon: BookOpen, href: "/geocon/iucn",    tint: "var(--gx-warning)" },
    { label: "publications",n:data.new_publications,Icon: BookOpen, href: "/geocon/publications", tint: "var(--gx-ink-soft)" },
  ].filter((p) => (p.n || 0) > 0);

  const topSpecies = Array.isArray(data.top_species_today) ? data.top_species_today : [];

  return (
    <section style={{
      padding: 14, marginBottom: 18,
      background: "linear-gradient(135deg, color-mix(in srgb, var(--gx-accent-violet) 6%, var(--gx-card-bg)) 0%, var(--gx-card-bg) 100%)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
        <Activity size={13} strokeWidth={1.9} style={{ color: "var(--gx-accent-violet)" }} />
        <strong style={{
          fontSize: 10, color: "var(--gx-ink-soft)",
          letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700,
        }}>
          Today on GEOCON · {totalActivity} event{totalActivity === 1 ? "" : "s"}
        </strong>
        <span style={{
          marginLeft: "auto", fontSize: 9, color: "var(--gx-ink-muted)",
          fontFamily: "var(--gx-font-mono)",
        }}>
          last 24h
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {pills.map((p) => {
          const Icon = p.Icon;
          return (
            <Link key={p.label} href={p.href}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 11px",
                background: `color-mix(in srgb, ${p.tint} 14%, transparent)`,
                color: p.tint,
                border: `1px solid color-mix(in srgb, ${p.tint} 30%, transparent)`,
                borderRadius: 999,
                fontSize: 11, fontWeight: 700,
                textDecoration: "none",
              }}>
              <Icon size={10} strokeWidth={2.2} />
              <span style={{ fontFamily: "var(--gx-font-mono)" }}>{p.n}</span>
              <span style={{ opacity: 0.85 }}>{p.label}</span>
            </Link>
          );
        })}
      </div>

      {topSpecies.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 9, borderTop: "1px dashed var(--gx-border-soft)" }}>
          <div style={{
            fontSize: 9, color: "var(--gx-ink-muted)", marginBottom: 6,
            letterSpacing: 1, textTransform: "uppercase", fontWeight: 700,
          }}>
            Trending species today
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {topSpecies.map((s) => (
              <Link key={s.id} href={`/geocon/species/${encodeURIComponent(s.id)}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 10px",
                  background: "var(--gx-surface-2)",
                  border: "1px solid var(--gx-border-soft)",
                  borderRadius: 7,
                  textDecoration: "none",
                  fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
                  fontSize: 12, color: "var(--gx-ink)", fontWeight: 600,
                }}>
                {s.iucn_status && (
                  <span style={{
                    fontFamily: "var(--gx-font-mono)", fontStyle: "normal",
                    fontSize: 9, fontWeight: 700,
                    padding: "1px 5px", borderRadius: 999,
                    background: TIER_TINT[s.iucn_status] || "var(--gx-surface-3)",
                    color: "#1a1816",
                  }}>
                    {s.iucn_status}
                  </span>
                )}
                {s.accepted_name}
                <span style={{
                  fontFamily: "var(--gx-font-mono)", fontStyle: "normal",
                  fontSize: 10, color: "var(--gx-ink-muted)",
                }}>
                  ×{s.hits}
                </span>
                <ChevronRight size={9} strokeWidth={2} style={{ color: "var(--gx-ink-muted)" }} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
