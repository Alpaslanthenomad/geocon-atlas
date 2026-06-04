"use client";
// Admin review queue for species_edit_proposals.
// Mounted inside AdminRoute. Admin-only RPCs; the panel auto-hides
// for non-admin viewers.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

export default function SpeciesEditQueue() {
  const { profile } = useAuthContext();
  const isAdmin = profile?.role === "admin";
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_pending_species_edit_proposals", { p_limit: 50, p_offset: 0 });
      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Edit queue yüklenemedi", { detail: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function accept(id) {
    setActingId(id);
    const note = window.prompt("Reviewer note (optional)") || null;
    try {
      const { data, error } = await supabase.rpc("accept_species_edit_proposal", { p_id: id, p_reviewer_note: note });
      if (error) throw error;
      if (data?.applied > 0) {
        toast.success("Öneri kabul edildi, species'a uygulandı", { detail: `Field: ${data.field}` });
      } else {
        toast.warning("Kabul edildi ama field whitelist dışında — manuel uygula", { detail: `Field: ${data?.field}` });
      }
      await load();
    } catch (e) {
      toast.error("Kabul başarısız", { detail: e?.message || String(e) });
    } finally {
      setActingId(null);
    }
  }

  async function reject(id) {
    setActingId(id);
    const note = window.prompt("Reddetme nedeni") || null;
    if (!note) { setActingId(null); return; }
    try {
      const { error } = await supabase.rpc("reject_species_edit_proposal", { p_id: id, p_reviewer_note: note });
      if (error) throw error;
      toast.info("Reddedildi");
      await load();
    } catch (e) {
      toast.error("Reddetme başarısız", { detail: e?.message || String(e) });
    } finally {
      setActingId(null);
    }
  }

  if (!isAdmin) return null;

  return (
    <section style={panel}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="gx-overline">Commons review</div>
          <h2 style={{
            fontFamily: "var(--gx-font-display)",
            fontSize: 18, fontWeight: 700, color: "var(--gx-ink)",
            margin: 0, letterSpacing: "-0.01em",
          }}>
            ✎ Species edit proposals · {rows.length} pending
          </h2>
        </div>
        <button onClick={load} disabled={loading} className="gx-btn" style={btnGhost}>
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="gx-skeleton" style={{ height: 80 }} />
      ) : rows.length === 0 ? (
        <div style={{
          padding: 18, textAlign: "center",
          fontSize: 12, color: "var(--gx-ink-muted)", fontStyle: "italic",
          background: "var(--gx-surface-2)", border: "1px dashed var(--gx-border)",
          borderRadius: 8,
        }}>
          No pending proposals. The commons queue is clean.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => (
            <ProposalRow
              key={r.id}
              row={r}
              busy={actingId === r.id}
              onAccept={() => accept(r.id)}
              onReject={() => reject(r.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProposalRow({ row, busy, onAccept, onReject }) {
  const [voteSum, setVoteSum] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_proposal_vote_summary", { p_proposal_id: row.id });
      if (!cancelled) setVoteSum(data || null);
    })();
    return () => { cancelled = true; };
  }, [row.id]);

  const net = voteSum?.net || 0;
  const showVotes = (voteSum?.upvotes || 0) + (voteSum?.downvotes || 0) > 0;

  return (
    <div style={{
      padding: 12,
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: 10,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <Link href={`/geocon/species/${encodeURIComponent(row.species_id)}`}
          style={{
            fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
            fontSize: 14, fontWeight: 700, color: "var(--gx-ink)",
            textDecoration: "none",
          }}>
          {row.species_name || row.species_id}
        </Link>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
          padding: "2px 7px", borderRadius: 999,
          background: "var(--gx-accent-violet)", color: "#fff",
          fontFamily: "var(--gx-font-mono)",
        }}>
          {row.field}
        </span>
        {showVotes && (
          <span title={`${voteSum.upvotes} up · ${voteSum.downvotes} down`}
            style={{
              fontSize: 10, fontWeight: 700,
              padding: "2px 8px", borderRadius: 999,
              background: net > 0 ? "var(--gx-success-soft)"
                         : net < 0 ? "var(--gx-danger-soft)"
                                   : "var(--gx-surface-3)",
              color: net > 0 ? "var(--gx-success)"
                    : net < 0 ? "var(--gx-danger)"
                              : "var(--gx-ink-muted)",
              fontFamily: "var(--gx-font-mono)",
            }}>
            {net > 0 ? `+${net}` : net} community
          </span>
        )}
        <span style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginLeft: "auto" }}>
          {new Date(row.submitted_at).toLocaleString()}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
        <div style={{
          padding: 8, borderRadius: 6,
          background: "var(--gx-surface-3)",
          border: "1px solid var(--gx-border-soft)",
        }}>
          <div className="gx-overline" style={{ marginBottom: 4 }}>Current</div>
          <code style={{
            fontFamily: "var(--gx-font-mono)", fontSize: 11,
            color: "var(--gx-ink-soft)", whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {row.current_value || <span style={{ opacity: 0.6, fontStyle: "italic" }}>(empty)</span>}
          </code>
        </div>
        <div style={{
          padding: 8, borderRadius: 6,
          background: "var(--gx-success-soft)",
          border: "1px solid color-mix(in srgb, var(--gx-success) 30%, transparent)",
        }}>
          <div className="gx-overline" style={{ color: "var(--gx-success)", marginBottom: 4 }}>Proposed</div>
          <code style={{
            fontFamily: "var(--gx-font-mono)", fontSize: 11,
            color: "var(--gx-ink)", whiteSpace: "pre-wrap", wordBreak: "break-word", fontWeight: 600,
          }}>
            {row.proposed_value}
          </code>
        </div>
      </div>

      {row.rationale && (
        <div style={{
          fontSize: 11, color: "var(--gx-ink-soft)", lineHeight: 1.5,
          padding: "6px 0", fontStyle: "italic",
        }}>
          “{row.rationale}”
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
          by <strong style={{ color: "var(--gx-ink-soft)" }}>{row.submitter_name || row.submitter_email || row.submitted_by}</strong>
        </span>
        {row.source_url && (
          <a href={row.source_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: "var(--gx-accent-azure)", fontWeight: 600, textDecoration: "none" }}>
            🔗 Source
          </a>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button onClick={onReject} disabled={busy} className="gx-btn"
            style={{ ...btnGhost, color: "var(--gx-danger)" }}>
            {busy ? "…" : "✕ Reject"}
          </button>
          <button onClick={onAccept} disabled={busy} className="gx-btn"
            style={btnPrimary}>
            {busy ? "Applying…" : "✓ Accept & apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

const panel = {
  padding: "var(--gx-card-pad)", marginTop: 14,
  background: "var(--gx-card-bg)",
  border: "1px solid var(--gx-card-border)",
  borderRadius: "var(--gx-card-radius)",
};
const btnGhost = {
  fontSize: 11, fontWeight: 700, padding: "6px 12px",
  background: "transparent", color: "var(--gx-ink-soft)",
  border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer",
};
const btnPrimary = {
  fontSize: 11, fontWeight: 700, padding: "6px 12px",
  background: "var(--gx-success)", color: "#fff",
  border: "none", borderRadius: 7, cursor: "pointer",
};
