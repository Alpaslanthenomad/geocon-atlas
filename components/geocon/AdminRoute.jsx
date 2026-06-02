"use client";
// components/geocon/AdminRoute.jsx
//
// /geocon/admin — Venn admin landing. Currently surfaces the pending
// organization-accreditation queue. Future admin tools (program approvals,
// dispute resolution, etc.) will appear as additional sections here.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { countryName } from "../../lib/countryNames";
import { flag } from "../../lib/atlas/format";
import { EmptyState } from "../shared";
import AdminOpsTiles from "./AdminOpsTiles";
import SpeciesEditQueue from "./SpeciesEditQueue";

export default function AdminRoute() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuthContext();
  const isAdmin = profile?.role === "admin";

  if (authLoading) return <Loading />;

  if (!user || !isAdmin) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", padding: 40, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: "var(--gx-card-radius)", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 22, margin: 0, color: "var(--gx-ink)" }}>Venn admin only</h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 8, lineHeight: 1.6 }}>
          This area is reserved for Venn BioVentures administrators.
          {!user && " Sign in via BEE first."}
        </p>
        <Link href={user ? "/geocon" : "/"} style={{ display: "inline-block", marginTop: 16, padding: "8px 14px", fontSize: 12, fontWeight: 600, background: "#0a4a3e", color: "#fff", borderRadius: 7, textDecoration: "none" }}>
          {user ? "Back to GEOCON" : "Sign in via BEE"}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 className="gx-h1">
          Venn admin
        </h1>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
          Approve organizations, manage the network, resolve disputes.
        </div>
      </div>

      <AdminToolbar />
      <AdminOpsTiles />
      <SpeciesEditQueue />
      <AccreditationQueue />
    </div>
  );
}

function AdminToolbar() {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
      <Link href="/geocon/admin/health" style={toolBtn}>🩺 Health snapshot</Link>
      <Link href="/geocon/admin/iucn-sync" style={toolBtn}>🌿 IUCN sync (Wikidata)</Link>
      <Link href="/geocon/admin/verticals" style={toolBtn}>✦ Verticals</Link>
    </div>
  );
}

const toolBtn = {
  padding: "7px 13px",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--gx-ink)",
  background: "#fff",
  border: "1px solid #ece9e2",
  borderRadius: 8,
  textDecoration: "none",
  letterSpacing: 0.2,
};

function AccreditationQueue() {
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setError(null);
    // Mark queue as empty array on every retry so the "Loading…" state
    // doesn't get stuck if the RPC errors out (was a recurring bug —
    // the gate showed 'Loading' forever because queue stayed null
    // while error was set; render preferred the queue==null branch).
    try {
      const { data, error: rpcErr } = await supabase.rpc("list_pending_org_accreditations");
      if (rpcErr) {
        setError(rpcErr.message);
        setQueue([]);
        return;
      }
      setQueue(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Could not load queue");
      setQueue([]);
    }
  }
  useEffect(() => { load(); }, []);

  async function startReview(orgId) {
    setBusyId(orgId);
    const { error: e } = await supabase.rpc("mark_org_accreditation_under_review", { p_org_id: orgId, p_internal_note: null });
    setBusyId(null);
    if (e) { alert(e.message); return; }
    load();
  }
  async function accredit(orgId) {
    const level = window.prompt("Level? (basic | partner | preferred)", "basic");
    if (!level) return;
    const publicNote = window.prompt("Public note (optional):", "") || null;
    setBusyId(orgId);
    const { error: e } = await supabase.rpc("accredit_organization", {
      p_org_id: orgId,
      p_level: level.trim().toLowerCase(),
      p_scope: null,
      p_public_note: publicNote,
      p_internal_note: null,
    });
    setBusyId(null);
    if (e) { alert(e.message); return; }
    load();
  }
  async function reject(orgId) {
    const reason = window.prompt("Public note explaining the rejection:", "");
    if (!reason) return;
    setBusyId(orgId);
    const { error: e } = await supabase.rpc("reject_org_accreditation", {
      p_org_id: orgId, p_public_note: reason, p_internal_note: null,
    });
    setBusyId(null);
    if (e) { alert(e.message); return; }
    load();
  }

  return (
    <section style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: "var(--gx-card-radius)", padding: "var(--gx-card-pad)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 18, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
          Accreditation queue
        </h2>
        <span style={{ fontSize: 11, color: "#888" }}>
          {queue == null ? "" : `${queue.length} pending`}
        </span>
      </div>

      {error && (
        <div style={{ padding: 10, background: "#fdecec", border: "1px solid #fcc", borderRadius: 6, fontSize: 11, color: "#A32D2D", marginBottom: 12 }}>
          {error}
        </div>
      )}

      {queue == null ? (
        <div style={{ padding: 20, textAlign: "center", color: "#888", fontSize: 12 }}>Loading…</div>
      ) : queue.length === 0 ? (
        <EmptyState
          icon="✓"
          title="No pending applications"
          hint="Accreditation requests will appear here for review. The queue refreshes automatically."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {queue.map((row) => (
            <PendingRow
              key={row.id}
              row={row}
              busy={busyId === row.id}
              onStartReview={() => startReview(row.id)}
              onAccredit={() => accredit(row.id)}
              onReject={() => reject(row.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PendingRow({ row, busy, onStartReview, onAccredit, onReject }) {
  const isUnderReview = row.status === "under_review";
  return (
    <div style={{ background: "var(--gx-surface-2)", border: "1px solid #ece9e2", borderRadius: 10, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Link href={`/geocon/organizations/${row.id}`} style={{ fontSize: 14, fontWeight: 700, color: "#0a4a3e", textDecoration: "none" }}>
              {row.name}
            </Link>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: isUnderReview ? "#EEEDFE" : "#E6F1FB", color: isUnderReview ? "#534AB7" : "#185FA5", fontWeight: 700 }}>
              {isUnderReview ? "under review" : "applied"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>
            {row.kind}
            {row.industry && ` · ${row.industry}`}
            {row.country && <> · {flag(row.country)} {countryName(row.country) || row.country}</>}
          </div>
          {row.applicant_note && (
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 11, color: "var(--gx-ink-soft)", lineHeight: 1.5, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 6, padding: "8px 10px" }}>
              {row.applicant_note}
            </p>
          )}
          {Array.isArray(row.scope) && row.scope.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
              {row.scope.map((s) => (
                <span key={s} style={{ fontSize: 10, padding: "3px 7px", borderRadius: 999, background: "#fff", border: "1px solid #ece9e2", color: "#444" }}>
                  {s}
                </span>
              ))}
            </div>
          )}
          {Array.isArray(row.evidence) && row.evidence.length > 0 && (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
              {row.evidence.map((ev, i) => (
                <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#185FA5", textDecoration: "none" }}>
                  ↗ {ev.title || ev.url}
                </a>
              ))}
            </div>
          )}
          {row.applied_at && (
            <div style={{ marginTop: 6, fontSize: 9, color: "#aaa" }}>
              Applied {new Date(row.applied_at).toLocaleString()}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 140 }}>
          {!isUnderReview && (
            <button onClick={onStartReview} disabled={busy} style={btnSecondary}>
              Start review
            </button>
          )}
          <button onClick={onAccredit} disabled={busy} style={btnPrimary}>
            Accredit
          </button>
          <button onClick={onReject} disabled={busy} style={btnDanger}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

const btnPrimary = {
  fontSize: 11, fontWeight: 700, padding: "7px 10px", background: "#0a4a3e",
  color: "#fff", border: "none", borderRadius: 6, cursor: "pointer",
};
const btnSecondary = {
  fontSize: 11, fontWeight: 600, padding: "7px 10px", background: "#fff",
  color: "#185FA5", border: "1px solid #185FA5", borderRadius: 6, cursor: "pointer",
};
const btnDanger = {
  fontSize: 11, fontWeight: 600, padding: "7px 10px", background: "#fff",
  color: "#A32D2D", border: "1px solid #fcc", borderRadius: 6, cursor: "pointer",
};

function Loading() {
  return <div style={{ padding: 30, textAlign: "center", color: "#888", fontSize: 12 }}>Loading…</div>;
}
