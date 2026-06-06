"use client";
// T2.c — Conservation Impact Passport (public profile).
//
// /r/<handle> — handle is either an ORCID iD (0000-0001-2345-678X) or
// the email local-part (alpaslansevket). Renders a public-facing
// summary card with the researcher's GEOCON Atlas contributions —
// the kind of page that can sit in an email signature, university
// bio, ORCID resource link.
//
// No auth required; respects the data as-public principle (only
// contribution counts + mission tags, no PII beyond what the user
// already chose to publish via their profile).

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Leaf, Briefcase, Eye, Edit, ShieldCheck, Activity, Radio, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ResearcherPassportRoute({ handle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!handle) return;
    let cancelled = false;
    (async () => {
      const { data: row } = await supabase.rpc("get_public_researcher_passport",
        { p_handle: handle });
      if (cancelled) return;
      if (!row) setNotFound(true); else setData(row);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [handle]);

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center", color: "var(--gx-ink-muted)" }}>Loading…</div>;
  }
  if (notFound) {
    return (
      <div style={{ maxWidth: 540, margin: "80px auto", padding: 40, textAlign: "center",
                    background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)",
                    borderRadius: "var(--gx-card-radius)" }}>
        <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, color: "var(--gx-ink)" }}>
          No passport here yet
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 8, lineHeight: 1.6 }}>
          The handle <code style={{ fontFamily: "var(--gx-font-mono)" }}>{handle}</code> hasn't
          published a GEOCON profile yet. If this is you, sign in and let your contributions
          accrue — your card will populate automatically.
        </p>
        <Link href="/geocon" style={{
          display: "inline-block", marginTop: 18, padding: "9px 16px",
          fontSize: 12, fontWeight: 700,
          background: "var(--gx-accent-violet)", color: "#fff",
          borderRadius: 8, textDecoration: "none",
        }}>
          Open GEOCON Atlas →
        </Link>
      </div>
    );
  }

  const c = data.counts || {};

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: "0 16px" }}>
      <div style={{
        padding: 28,
        background: "linear-gradient(135deg, color-mix(in srgb, var(--gx-accent-violet) 14%, var(--gx-card-bg)) 0%, var(--gx-card-bg) 70%)",
        border: "1px solid var(--gx-card-border)",
        borderRadius: 16,
      }}>
        <div className="gx-overline" style={{ marginBottom: 6 }}>
          Conservation Impact Passport
        </div>
        <h1 style={{
          fontFamily: "var(--gx-font-display)", fontWeight: 700,
          fontSize: 32, letterSpacing: -0.5,
          color: "var(--gx-ink)", margin: 0,
        }}>
          {data.full_name || "Researcher"}
        </h1>
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {data.orcid_verified && data.orcid && (
            <a href={`https://orcid.org/${data.orcid}`} target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 700,
                padding: "3px 9px", borderRadius: 999,
                background: "var(--gx-success-soft)", color: "var(--gx-success)",
                border: "1px solid color-mix(in srgb, var(--gx-success) 35%, transparent)",
                textDecoration: "none", fontFamily: "var(--gx-font-mono)",
              }}>
              <ShieldCheck size={11} strokeWidth={2.2} />
              ORCID {data.orcid}
            </a>
          )}
          {data.joined_at && (
            <span style={{ fontSize: 11, color: "var(--gx-ink-muted)", alignSelf: "center" }}>
              Joined GEOCON {new Date(data.joined_at).toLocaleDateString(undefined, { year: "numeric", month: "short" })}
            </span>
          )}
        </div>

        {data.mission_text && (
          <p style={{
            marginTop: 16, fontSize: 14, lineHeight: 1.55,
            fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
            color: "var(--gx-ink-soft)",
          }}>
            "{data.mission_text}"
          </p>
        )}

        {/* Counter grid */}
        <div style={{
          marginTop: 22,
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 12,
        }}>
          <CountTile Icon={Edit}    label="Edits accepted"   value={c.species_edits_accepted} />
          <CountTile Icon={Briefcase} label="Programs joined" value={c.programs_member} />
          <CountTile Icon={Award}   label="Programs created"  value={c.programs_created} />
          <CountTile Icon={ShieldCheck} label="Commerc. credits" value={c.commerc_credits} />
          <CountTile Icon={Eye}     label="Watching"          value={c.watching} />
        </div>

        {/* Mission tag chips */}
        {Array.isArray(data.mission_tags) && data.mission_tags.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div className="gx-overline" style={{ marginBottom: 8, color: "var(--gx-accent-violet)" }}>
              Mission tags
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {data.mission_tags.map((t) => (
                <span key={t} style={{
                  fontSize: 11, fontWeight: 600,
                  padding: "4px 10px", borderRadius: 999,
                  background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)",
                  border: "1px solid var(--gx-border-soft)",
                  fontFamily: "var(--gx-font-mono)",
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{
          marginTop: 22, paddingTop: 14,
          borderTop: "1px solid var(--gx-border-soft)",
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
          fontSize: 11, color: "var(--gx-ink-muted)",
        }}>
          <span>
            <Leaf size={11} strokeWidth={1.85} style={{ display: "inline", verticalAlign: -1 }} />
            {" "}GEOCON Atlas · Endemic geophyte commons
          </span>
          <Link href="/geocon" style={{ color: "var(--gx-accent-violet)", textDecoration: "none", fontWeight: 600 }}>
            Open atlas →
          </Link>
        </div>
      </div>

      {/* v5.4-e — 30-day activity feed */}
      <ActivityFeed data={data.activity_30d} />

      <div style={{
        marginTop: 14, padding: "12px 16px",
        background: "var(--gx-surface-2)",
        border: "1px dashed var(--gx-border-soft)",
        borderRadius: 10,
        fontSize: 11, color: "var(--gx-ink-muted)", lineHeight: 1.6,
      }}>
        💡 Bu kartı blogunda, email imzanda veya CV'nde göstermek için linkle:
        <code style={{ display: "block", marginTop: 4, fontFamily: "var(--gx-font-mono)", color: "var(--gx-ink)" }}>
          https://atlas.vennbioventures.com/r/{handle}
        </code>
      </div>
    </div>
  );
}

function ActivityFeed({ data }) {
  if (!data) return null;
  const events = Array.isArray(data.recent_events) ? data.recent_events : [];
  const totalLast30 = (data.edits_accepted || 0) +
                      (data.observations || 0) +
                      (data.outcomes_declared || 0) +
                      (data.programs_started || 0);
  if (totalLast30 === 0 && events.length === 0) return null;

  return (
    <div style={{
      marginTop: 14, padding: 16,
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <Activity size={13} strokeWidth={1.9} style={{ color: "var(--gx-accent-violet)" }} />
        <strong style={{
          fontSize: 10, color: "var(--gx-ink-soft)",
          letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700,
        }}>
          Last 30 days · {totalLast30} contribution{totalLast30 === 1 ? "" : "s"}
        </strong>
      </div>

      {/* Mini counters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {data.edits_accepted > 0 && <Pill Icon={Edit} n={data.edits_accepted} label="edits accepted" tint="var(--gx-success)" />}
        {data.edits_pending > 0 && <Pill Icon={Edit} n={data.edits_pending} label="pending review" tint="var(--gx-warning)" />}
        {data.observations > 0 && <Pill Icon={Radio} n={data.observations} label="field obs" tint="var(--gx-success)" />}
        {data.outcomes_declared > 0 && <Pill Icon={Award} n={data.outcomes_declared} label="outcomes" tint="var(--gx-accent-violet)" />}
        {data.programs_started > 0 && <Pill Icon={Briefcase} n={data.programs_started} label="programs" tint="var(--gx-accent-azure)" />}
      </div>

      {/* Event timeline */}
      {events.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {events.map((ev) => <EventRow key={`${ev.kind}:${ev.id}`} ev={ev} />)}
        </ul>
      )}
    </div>
  );
}

function Pill({ Icon, n, label, tint }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 999,
      background: `color-mix(in srgb, ${tint} 14%, transparent)`,
      color: tint,
      border: `1px solid color-mix(in srgb, ${tint} 28%, transparent)`,
      fontSize: 11, fontWeight: 700,
    }}>
      <Icon size={10} strokeWidth={2.2} />
      <span style={{ fontFamily: "var(--gx-font-mono)" }}>{n}</span>
      <span style={{ opacity: 0.85, fontWeight: 600 }}>{label}</span>
    </span>
  );
}

function EventRow({ ev }) {
  const dt = ev.at ? new Date(ev.at) : null;
  const ago = dt ? niceAgo(dt) : "";
  const ICONS = { edit: Edit, observation: Radio, outcome: Award };
  const TINT  = { edit: "var(--gx-success)", observation: "var(--gx-success)", outcome: "var(--gx-accent-violet)" };
  const Icon = ICONS[ev.kind] || Activity;
  const KIND_LABEL = { edit: "Edit accepted", observation: "Field observation", outcome: "Outcome declared" };
  return (
    <li style={{
      padding: "7px 10px",
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: 7,
      display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
    }}>
      <Icon size={11} strokeWidth={2} style={{ color: TINT[ev.kind] || "var(--gx-ink-soft)", flexShrink: 0 }} />
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
        color: TINT[ev.kind] || "var(--gx-ink-soft)",
        textTransform: "uppercase",
        fontFamily: "var(--gx-font-mono)",
      }}>
        {KIND_LABEL[ev.kind] || ev.kind}
      </span>
      {ev.detail && (
        <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
          · {ev.detail}
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        {ev.subject_id ? (
          <Link href={`/geocon/species/${encodeURIComponent(ev.subject_id)}`}
            style={{
              fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
              fontSize: 12, fontWeight: 600, color: "var(--gx-ink)",
              textDecoration: "none",
            }}>
            {ev.subject || "(unknown)"}
          </Link>
        ) : (
          <span style={{ fontSize: 12, color: "var(--gx-ink-soft)" }}>
            {ev.subject || "(unknown)"}
          </span>
        )}
      </span>
      <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>{ago}</span>
    </li>
  );
}

function niceAgo(dt) {
  const diff = (Date.now() - dt.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.round(diff / 60) + "m ago";
  if (diff < 86400) return Math.round(diff / 3600) + "h ago";
  return Math.round(diff / 86400) + "d ago";
}

function CountTile({ Icon, label, value }) {
  return (
    <div style={{
      padding: 12,
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: 10,
      textAlign: "center",
    }}>
      <Icon size={14} strokeWidth={1.85} style={{ color: "var(--gx-accent-violet)" }} />
      <div style={{
        fontFamily: "var(--gx-font-display)",
        fontSize: 22, fontWeight: 700, color: "var(--gx-ink)",
        marginTop: 4, lineHeight: 1, letterSpacing: -0.02,
      }}>
        {(value || 0).toLocaleString()}
      </div>
      <div style={{ fontSize: 9, color: "var(--gx-ink-muted)", marginTop: 4, letterSpacing: 0.3, textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}
