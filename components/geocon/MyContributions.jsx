"use client";
// MyContributions — rollup of every visible signal the signed-in user
// has left on the platform. Mounts on /geocon/profile under the
// identity card.
//
// Reads get_my_contributions (typed feed) + count_my_contributions
// (summary tile). Auto-hides on signed-out viewers.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Pencil, Award, MessageSquare, Users, Briefcase, ShieldCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const KIND_META = {
  species_edit:     { Icon: Pencil,        label: "Species edit",     tint: "var(--gx-accent-violet)" },
  outcome_endorse:  { Icon: Award,         label: "Endorsement",      tint: "var(--gx-success)" },
  commerc_credit:   { Icon: ShieldCheck,   label: "Credit",           tint: "var(--gx-info)" },
  program_comment:  { Icon: MessageSquare, label: "Program comment",  tint: "var(--gx-info)" },
  proposal_comment: { Icon: MessageSquare, label: "Proposal comment", tint: "var(--gx-info)" },
  program_member:   { Icon: Users,         label: "Joined program",   tint: "var(--gx-accent-violet)" },
};

export default function MyContributions() {
  const { user } = useAuthContext();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [listRes, countRes] = await Promise.all([
          supabase.rpc("get_my_contributions", { p_limit: 30 }),
          supabase.rpc("count_my_contributions"),
        ]);
        if (cancelled) return;
        setItems(Array.isArray(listRes.data) ? listRes.data : []);
        setCounts(countRes.data || {});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  // Sum the visible counters for the summary line.
  const total =
    (counts.species_edits || 0) +
    (counts.commerc_credits || 0) +
    (counts.program_comments || 0) +
    (counts.proposal_comments || 0) +
    (counts.programs_joined || 0);

  return (
    <section style={panel}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="gx-overline" style={{ marginBottom: 2 }}>Your trail</div>
          <h2 style={{
            fontFamily: "var(--gx-font-display)",
            fontSize: 18, fontWeight: 700, color: "var(--gx-ink)",
            margin: 0, letterSpacing: "-0.01em",
          }}>
            Contributions
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)" }}>
              {total} signal{total === 1 ? "" : "s"}
            </span>
          </h2>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        <Chip n={counts.species_edits}     accepted={counts.edits_accepted} label="Species edits" />
        <Chip n={counts.commerc_credits}                                    label="Commerc. credits" />
        <Chip n={counts.program_comments}                                   label="Program comments" />
        <Chip n={counts.proposal_comments}                                  label="Proposal comments" />
        <Chip n={counts.programs_joined}                                    label="Programs joined" />
      </div>

      {/* Feed */}
      {loading ? (
        <div className="gx-skeleton" style={{ height: 60 }} />
      ) : items.length === 0 ? (
        <div style={{
          padding: 18, textAlign: "center",
          fontSize: 12, color: "var(--gx-ink-muted)", fontStyle: "italic",
          background: "var(--gx-surface-2)", border: "1px dashed var(--gx-border-soft)",
          borderRadius: 8,
        }}>
          Henüz bir katkı yok. Bir species sayfasında "Suggest correction",
          bir outcome'da "Endorse", veya bir programda yorum bırak.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it) => <ContribRow key={`${it.kind}:${it.id}`} row={it} />)}
        </div>
      )}
    </section>
  );
}

function Chip({ n = 0, accepted, label }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 9px",
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: 999,
      fontSize: 11, color: "var(--gx-ink-soft)",
    }}>
      <strong style={{ color: "var(--gx-ink)", fontFamily: "var(--gx-font-mono)" }}>{n || 0}</strong>
      {label}
      {accepted !== undefined && accepted > 0 && (
        <span style={{ color: "var(--gx-success)", fontFamily: "var(--gx-font-mono)" }}>· {accepted} accepted</span>
      )}
    </div>
  );
}

function ContribRow({ row }) {
  const meta = KIND_META[row.kind] || { Icon: MessageSquare, label: row.kind, tint: "var(--gx-ink-muted)" };
  const Icon = meta.Icon;
  return (
    <Link href={row.url || "#"} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px",
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: 7,
      textDecoration: "none", color: "inherit",
    }}>
      <div style={{
        flexShrink: 0,
        width: 24, height: 24, borderRadius: 6,
        background: `color-mix(in srgb, ${meta.tint} 14%, transparent)`,
        color: meta.tint,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={12} strokeWidth={1.9} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
            padding: "1px 6px", borderRadius: 999,
            background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)",
            fontFamily: "var(--gx-font-mono)",
          }}>
            {meta.label}
          </span>
          <span style={{ fontSize: 12, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.title}
          </span>
        </div>
        {row.subtitle && (
          <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.subtitle}
          </div>
        )}
      </div>
      <div style={{ fontSize: 9, color: "var(--gx-ink-faint)", fontFamily: "var(--gx-font-mono)", flexShrink: 0 }}>
        {formatAgo(row.created_at)}
      </div>
    </Link>
  );
}

const panel = {
  padding: "var(--gx-card-pad)",
  marginTop: 14,
  background: "var(--gx-card-bg)",
  border: "1px solid var(--gx-card-border)",
  borderRadius: "var(--gx-card-radius)",
};

function formatAgo(at) {
  if (!at) return "";
  const d = new Date(at);
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  return d.toLocaleDateString();
}
