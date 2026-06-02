"use client";
// /geocon/drafts — unified drafts surface.
//
// Reads list_my_drafts which folds collaboration_proposals(status='draft')
// rows (both brief and proposal flavor) + programs(status='Draft') rows
// into one list ordered by updated_at DESC. The "Continue" link points
// at the right editor based on the row's kind.

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Inbox, Briefcase, FolderOpen } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import { EmptyState } from "../shared";

const KIND_META = {
  proposal: { Icon: Inbox,      label: "Proposal", tint: "var(--gx-info)" },
  brief:    { Icon: FolderOpen, label: "Brief",    tint: "var(--gx-accent-violet)" },
  program:  { Icon: Briefcase,  label: "Program",  tint: "var(--gx-success)" },
};

export default function DraftsRoute() {
  const { user, loading: authLoading } = useAuthContext();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_my_drafts");
      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Drafts yüklenemedi", { detail: e?.message || String(e) });
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
        <FileText size={28} strokeWidth={1.5} style={{ color: "var(--gx-ink-muted)", marginBottom: 8 }} />
        <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, margin: 0, color: "var(--gx-ink)" }}>Sign in to see your drafts</h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 8, lineHeight: 1.6 }}>
          Drafts kişisel — sadece sahibi görür. ORCID veya BEE üzerinden gir.
        </p>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "8px 14px", fontSize: 12, fontWeight: 600, background: "var(--gx-success)", color: "#fff", borderRadius: 7, textDecoration: "none" }}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <div className="gx-overline" style={{ marginBottom: 4 }}>Workspace</div>
        <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          Drafts
          <span style={{ fontSize: 13, color: "var(--gx-ink-muted)", fontWeight: 400, fontFamily: "var(--gx-font-mono)" }}>
            {rows.length} unsent
          </span>
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 640 }}>
          Henüz publish edilmemiş proposals, briefs ve programs. "Continue"
          ile editörü açıp tamamlayabilirsin.
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon="○"
          title="Draft kalmadı"
          hint="Bir proposal/brief/program editöründe başlayıp kaydetmeden çıkınca buraya iner."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => (
            <DraftRow key={`${r.kind}:${r.id}`} row={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function DraftRow({ row }) {
  const meta = KIND_META[row.kind] || KIND_META.proposal;
  const Icon = meta.Icon;
  return (
    <div style={{
      padding: "var(--gx-card-pad-sm)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        flexShrink: 0,
        width: 36, height: 36, borderRadius: 8,
        background: `color-mix(in srgb, ${meta.tint} 14%, transparent)`,
        color: meta.tint,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={16} strokeWidth={1.85} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
            textTransform: "uppercase",
            padding: "2px 7px", borderRadius: 999,
            background: `color-mix(in srgb, ${meta.tint} 14%, transparent)`,
            color: meta.tint,
            fontFamily: "var(--gx-font-mono)",
          }}>
            {meta.label}
          </span>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.title}
          </div>
        </div>
        {row.subtitle && (
          <div style={{ marginTop: 3, fontSize: 11, color: "var(--gx-ink-muted)" }}>
            {row.subtitle}
          </div>
        )}
        <div style={{ marginTop: 3, fontSize: 9, color: "var(--gx-ink-faint)" }}>
          updated {formatAgo(row.updated_at || row.created_at)}
        </div>
      </div>
      <Link href={row.edit_url || "#"}
        style={{
          flexShrink: 0,
          fontSize: 11, fontWeight: 700,
          padding: "7px 12px", borderRadius: 7,
          background: "var(--gx-accent-violet)", color: "#fff",
          textDecoration: "none",
        }}>
        Continue →
      </Link>
    </div>
  );
}

function formatAgo(at) {
  if (!at) return "";
  const d = new Date(at);
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString();
}
