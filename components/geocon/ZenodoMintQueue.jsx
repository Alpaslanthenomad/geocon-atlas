"use client";
// v4.3-d — Admin queue: pending data citation requests + Zenodo mint.
//
// Lists every data_citations row with status='pending' and no DOI.
// One-click "Mint via Zenodo" calls /api/admin/zenodo/mint which
// creates a deposition, sets metadata, publishes, and persists the
// DOI back. The row then disappears from the queue.

import { useEffect, useState } from "react";
import { FileCheck, Loader2, ExternalLink, Hash } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

export default function ZenodoMintQueue() {
  const { profile } = useAuthContext();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mintingId, setMintingId] = useState(null);

  const isAdmin = profile?.role === "admin";

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_pending_citation_requests", { p_limit: 50 });
      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Liste yüklenemedi", { detail: e?.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line */ }, [isAdmin]);

  async function mint(id) {
    setMintingId(id);
    try {
      const sess = (await supabase.auth.getSession()).data.session;
      if (!sess?.access_token) throw new Error("not signed in");
      const r = await fetch("/api/admin/zenodo/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.access_token}`,
        },
        body: JSON.stringify({ citation_id: id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.hint || j?.error || `HTTP ${r.status}`);
      toast.success(`DOI: ${j.doi}`);
      load();
    } catch (e) {
      toast.error("Mint başarısız", { detail: e?.message });
    } finally {
      setMintingId(null);
    }
  }

  if (!isAdmin) return null;

  return (
    <section style={{
      marginTop: 14, padding: "var(--gx-card-pad)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
        <div>
          <div className="gx-overline">Commons citation</div>
          <h2 style={{
            fontFamily: "var(--gx-font-display)",
            fontSize: 18, fontWeight: 700, color: "var(--gx-ink)",
            margin: 0, display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <FileCheck size={15} strokeWidth={1.85} style={{ color: "var(--gx-accent-violet)" }} />
            Zenodo DOI queue · {rows.length} pending
          </h2>
        </div>
        <button onClick={load} disabled={loading} style={ghostBtn}>
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="gx-skeleton" style={{ height: 60 }} />
      ) : rows.length === 0 ? (
        <div style={{
          padding: 18, textAlign: "center",
          background: "var(--gx-surface-2)",
          border: "1px dashed var(--gx-border-soft)",
          borderRadius: 8,
          color: "var(--gx-ink-muted)", fontSize: 12, fontStyle: "italic",
        }}>
          No pending DOI requests. The queue is clear.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => (
            <li key={r.id} style={{
              padding: 11,
              background: "var(--gx-surface-2)",
              border: "1px solid var(--gx-border-soft)",
              borderRadius: 9,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
                  padding: "2px 7px", borderRadius: 999,
                  background: "var(--gx-accent-azure)", color: "#fff",
                  fontFamily: "var(--gx-font-mono)",
                }}>
                  {r.kind}
                </span>
                <span style={{
                  fontSize: 10, fontFamily: "var(--gx-font-mono)", color: "var(--gx-ink-soft)",
                }}>
                  <Hash size={9} strokeWidth={2} style={{ verticalAlign: "middle" }} /> {r.reference_id}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--gx-ink-muted)" }}>
                  {new Date(r.requested_at).toLocaleDateString()} · {r.requester_name}
                </span>
              </div>
              {r.cited_text && (
                <div style={{
                  fontSize: 11, color: "var(--gx-ink-soft)", lineHeight: 1.5,
                  fontStyle: "italic", marginBottom: 8,
                  borderLeft: "2px solid var(--gx-border-soft)",
                  paddingLeft: 8,
                }}>
                  {r.cited_text.length > 200 ? r.cited_text.slice(0, 200) + "…" : r.cited_text}
                </div>
              )}
              <button onClick={() => mint(r.id)} disabled={mintingId === r.id}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "6px 12px",
                  background: "var(--gx-success)", color: "#fff",
                  fontSize: 11, fontWeight: 700,
                  border: "none", borderRadius: 7, cursor: "pointer",
                  opacity: mintingId === r.id ? 0.6 : 1,
                }}>
                {mintingId === r.id ? <Loader2 size={11} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} /> : <ExternalLink size={11} strokeWidth={2.2} />}
                {mintingId === r.id ? "Minting…" : "Mint via Zenodo"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const ghostBtn = {
  fontSize: 11, fontWeight: 700, padding: "5px 11px",
  background: "transparent", color: "var(--gx-ink-soft)",
  border: "1px solid var(--gx-border-soft)", borderRadius: 7, cursor: "pointer",
};
