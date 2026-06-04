"use client";
// v4.1-a — Public community moderation route.
//
// Path: /geocon/species/<id>/edits
//
// Anyone (anonymous viewer or signed-in researcher) can browse the
// pending edit proposals for a given species, see the rationale + source,
// and vote ↑/↓ on each. Signed-in users vote with their identity; admin
// queue surfaces "+N community" so high-confidence edits float to the
// top of the review pile.
//
// Anonymous viewers can read everything but the vote buttons render as a
// disabled "Sign in to vote" affordance — friction stays behind auth, the
// affordance stays visible.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowUp, ArrowDown, ExternalLink, FileText,
  ShieldCheck, AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

const FIELD_LABEL = {
  iucn_status: "IUCN status",
  accepted_name_authority: "Authority",
  family: "Family",
  genus: "Genus",
  geophyte_type: "Geophyte type",
  endemic: "Endemic flag",
  discovery_year: "Discovery year",
  population_trend: "Population trend",
  native_countries: "Native countries",
  introduced_countries: "Introduced countries",
  other: "Other",
};

export default function SpeciesEditsRoute({ speciesId }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [species, setSpecies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [edits, speciesRow] = await Promise.all([
        supabase.rpc("list_species_pending_edits", { p_species_id: speciesId }),
        supabase.from("species").select("id, accepted_name, family")
          .eq("id", speciesId).maybeSingle(),
      ]);
      if (edits.error) throw edits.error;
      setRows(Array.isArray(edits.data) ? edits.data : []);
      setSpecies(speciesRow.data || null);
    } catch (e) {
      toast.error("Edits yüklenemedi", { detail: e?.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (speciesId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speciesId]);

  async function castVote(proposalId, currentMy, nextVote) {
    if (!user) {
      toast.warning("Önce giriş yap");
      return;
    }
    // Click same arrow again → 0 (clear vote). Otherwise → nextVote.
    const targetVote = currentMy === nextVote ? 0 : nextVote;
    setBusyId(proposalId);
    try {
      const { data, error } = await supabase.rpc("vote_species_edit_proposal", {
        p_proposal_id: proposalId,
        p_vote: targetVote,
      });
      if (error) throw error;
      // Optimistic-merge the new summary into the row
      setRows((prev) => prev.map((r) => r.id === proposalId
        ? {
            ...r,
            upvotes: data?.upvotes ?? r.upvotes,
            downvotes: data?.downvotes ?? r.downvotes,
            net: data?.net ?? r.net,
            my_vote: data?.my_vote ?? null,
          }
        : r
      ));
    } catch (e) {
      toast.error("Oy verilemedi", { detail: e?.message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main style={{
      maxWidth: 880, margin: "0 auto",
      padding: "24px 18px 80px",
      fontFamily: "var(--gx-font-body)",
      color: "var(--gx-ink)",
    }}>
      {/* Back link */}
      <Link href={`/geocon/species/${encodeURIComponent(speciesId)}`}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 11, color: "var(--gx-ink-soft)",
          textDecoration: "none", marginBottom: 14,
        }}>
        <ArrowLeft size={11} strokeWidth={2} />
        Back to species
      </Link>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        flexWrap: "wrap", gap: 8, marginBottom: 4,
      }}>
        <div>
          <div className="gx-overline">Commons moderation</div>
          <h1 style={{
            fontFamily: "var(--gx-font-display)",
            fontSize: 26, fontWeight: 700,
            letterSpacing: "-0.02em", color: "var(--gx-ink)",
            margin: "2px 0 0 0",
          }}>
            Pending edits
          </h1>
        </div>
        {species && (
          <Link href={`/geocon/species/${encodeURIComponent(speciesId)}`}
            style={{
              fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
              fontSize: 15, color: "var(--gx-ink-soft)",
              textDecoration: "none",
            }}>
            {species.accepted_name}
            {species.family && (
              <span style={{ fontStyle: "normal", color: "var(--gx-ink-muted)", marginLeft: 6, fontSize: 11 }}>
                · {species.family}
              </span>
            )}
          </Link>
        )}
      </div>

      <p style={{
        fontSize: 12, color: "var(--gx-ink-muted)",
        margin: "10px 0 22px 0", lineHeight: 1.55,
        borderLeft: "2px solid var(--gx-accent-violet)",
        paddingLeft: 10,
      }}>
        Anyone can browse pending corrections. Signed-in researchers
        vote ↑/↓ to surface the high-confidence edits to admins. Your
        vote isn't a final decision — an admin still reviews each
        proposal — but a strong community signal moves it up the queue.
      </p>

      {/* Anonymous notice */}
      {!user && (
        <div style={{
          padding: "10px 12px", marginBottom: 16,
          background: "var(--gx-surface-2)",
          border: "1px dashed var(--gx-border-soft)",
          borderRadius: 8, fontSize: 11.5,
          color: "var(--gx-ink-soft)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <AlertCircle size={13} strokeWidth={1.8} style={{ color: "var(--gx-accent-violet)" }} />
          You can read everything — sign in to cast a vote.
        </div>
      )}

      {/* Rows */}
      {loading ? (
        <div className="gx-skeleton" style={{ height: 140 }} />
      ) : rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((r) => (
            <ProposalCard key={r.id}
              row={r}
              user={user}
              busy={busyId === r.id}
              onUp={() => castVote(r.id, r.my_vote, 1)}
              onDown={() => castVote(r.id, r.my_vote, -1)}
            />
          ))}
        </div>
      )}

      {/* Footer hint */}
      <div style={{
        marginTop: 28, fontSize: 11, color: "var(--gx-ink-muted)",
        textAlign: "center", fontStyle: "italic",
      }}>
        Don't see your correction here?{" "}
        <Link href={`/geocon/species/${encodeURIComponent(speciesId)}#edit`}
          style={{ color: "var(--gx-accent-azure)", fontWeight: 600, textDecoration: "none" }}>
          Suggest one on the species page →
        </Link>
      </div>
    </main>
  );
}

function ProposalCard({ row, user, busy, onUp, onDown }) {
  const myUp = row.my_vote === 1;
  const myDown = row.my_vote === -1;
  const net = row.net || 0;

  return (
    <article style={{
      padding: 14,
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: 10,
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      gap: 14,
    }}>
      {/* Vote column */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <button onClick={onUp}
          disabled={!user || busy}
          aria-pressed={myUp}
          title={user ? "Helpful — surface this edit" : "Sign in to vote"}
          style={{
            ...voteBtn,
            background: myUp ? "var(--gx-success-soft)" : "transparent",
            color: myUp ? "var(--gx-success)" : "var(--gx-ink-soft)",
            borderColor: myUp ? "color-mix(in srgb, var(--gx-success) 35%, transparent)" : "var(--gx-border-soft)",
            opacity: !user ? 0.4 : 1,
          }}>
          <ArrowUp size={14} strokeWidth={2.3} />
        </button>
        <span title={`${row.upvotes} up · ${row.downvotes} down`}
          style={{
            fontFamily: "var(--gx-font-mono)",
            fontWeight: 700, fontSize: 13,
            color: net > 0 ? "var(--gx-success)" : net < 0 ? "var(--gx-danger)" : "var(--gx-ink-soft)",
          }}>
          {net > 0 ? `+${net}` : net}
        </span>
        <button onClick={onDown}
          disabled={!user || busy}
          aria-pressed={myDown}
          title={user ? "Not convinced — push down" : "Sign in to vote"}
          style={{
            ...voteBtn,
            background: myDown ? "var(--gx-danger-soft)" : "transparent",
            color: myDown ? "var(--gx-danger)" : "var(--gx-ink-soft)",
            borderColor: myDown ? "color-mix(in srgb, var(--gx-danger) 35%, transparent)" : "var(--gx-border-soft)",
            opacity: !user ? 0.4 : 1,
          }}>
          <ArrowDown size={14} strokeWidth={2.3} />
        </button>
      </div>

      {/* Content column */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
            padding: "2px 7px", borderRadius: 999,
            background: "var(--gx-accent-violet)", color: "#fff",
            fontFamily: "var(--gx-font-mono)",
          }}>
            {FIELD_LABEL[row.field] || row.field}
          </span>
          <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
            <FileText size={9} strokeWidth={2} style={{ verticalAlign: "middle", marginRight: 3 }} />
            {new Date(row.submitted_at).toLocaleDateString()}
          </span>
          {row.submitter_name && (
            <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
              by <strong style={{ color: "var(--gx-ink-soft)" }}>{row.submitter_name}</strong>
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 9 }}>
          <ValueBlock label="Current" tone="muted" value={row.current_value} />
          <ValueBlock label="Proposed" tone="success" value={row.proposed_value} />
        </div>

        {row.rationale && (
          <div style={{
            fontSize: 12, color: "var(--gx-ink-soft)", lineHeight: 1.55,
            padding: "8px 11px", borderRadius: 7,
            background: "var(--gx-surface-2)",
            border: "1px solid var(--gx-border-soft)",
            fontStyle: "italic", marginBottom: 8,
          }}>
            <ShieldCheck size={10} strokeWidth={2}
              style={{ verticalAlign: "middle", marginRight: 5, color: "var(--gx-accent-violet)" }} />
            {row.rationale}
          </div>
        )}

        {row.source_url && (
          <a href={row.source_url} target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 600, color: "var(--gx-accent-azure)",
              textDecoration: "none",
            }}>
            <ExternalLink size={10} strokeWidth={2.2} />
            Source
          </a>
        )}
      </div>
    </article>
  );
}

function ValueBlock({ label, value, tone }) {
  const isSuccess = tone === "success";
  return (
    <div style={{
      padding: 8, borderRadius: 6,
      background: isSuccess ? "var(--gx-success-soft)" : "var(--gx-surface-2)",
      border: `1px solid ${isSuccess
        ? "color-mix(in srgb, var(--gx-success) 30%, transparent)"
        : "var(--gx-border-soft)"}`,
    }}>
      <div className="gx-overline" style={{
        marginBottom: 4,
        color: isSuccess ? "var(--gx-success)" : "var(--gx-ink-muted)",
      }}>
        {label}
      </div>
      <code style={{
        fontFamily: "var(--gx-font-mono)", fontSize: 11,
        color: "var(--gx-ink)", whiteSpace: "pre-wrap", wordBreak: "break-word",
        fontWeight: isSuccess ? 600 : 400,
      }}>
        {value || <span style={{ opacity: 0.55, fontStyle: "italic" }}>(empty)</span>}
      </code>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      padding: 36, textAlign: "center",
      background: "var(--gx-surface-2)",
      border: "1px dashed var(--gx-border-soft)",
      borderRadius: 10,
      color: "var(--gx-ink-muted)",
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gx-ink-soft)", marginBottom: 4 }}>
        No pending edits
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.5 }}>
        Nobody has proposed a correction for this species yet.
      </div>
    </div>
  );
}

const voteBtn = {
  width: 32, height: 32,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  borderRadius: 7,
  border: "1px solid var(--gx-border-soft)",
  cursor: "pointer",
  transition: "background 120ms, color 120ms",
};
