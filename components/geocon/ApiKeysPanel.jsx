"use client";
// Issue + manage API keys for the signed-in user.
// Org-scoped keys are out of scope for the profile page; that lives
// in the org detail "Settings" tab (not yet built).

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

export default function ApiKeysPanel() {
  const { user } = useAuthContext();
  const [rows, setRows] = useState([]);
  const [issuing, setIssuing] = useState(false);
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState(null);
  const [err, setErr] = useState(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("api_keys")
      .select("id, name, prefix, scopes, active, last_used_at, request_count, created_at, organization_id")
      .is("organization_id", null)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  async function issue() {
    if (!name.trim()) return;
    setIssuing(true); setErr(null);
    try {
      const { data, error } = await supabase.rpc("issue_api_key", { p_name: name.trim(), p_org: null });
      if (error) throw error;
      setRevealed(data); // { id, secret, prefix }
      setName("");
      await load();
    } catch (e) {
      setErr(e?.message || "Could not issue key");
    } finally {
      setIssuing(false);
    }
  }

  async function revoke(id) {
    if (!confirm("Revoke this key permanently?")) return;
    await supabase.rpc("revoke_api_key", { p_id: id });
    await load();
  }

  if (!user) return null;

  return (
    <section style={{
      marginTop: 14, padding: 16,
      background: "var(--gx-surface)", border: "1px solid var(--gx-border)",
      borderRadius: 12,
    }}>
      <h2 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 18, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
        API keys
      </h2>
      <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", marginTop: 4 }}>
        Use these to call <code style={{ fontFamily: "var(--gx-font-mono)" }}>/api/public/*</code> with attribution. Keep them secret.
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this key (e.g. 'Botanic blog widget')"
          style={{ flex: 1, minWidth: 200, padding: "8px 10px", fontSize: 12, background: "var(--gx-surface-2)", color: "var(--gx-ink)", border: "1px solid var(--gx-border-soft)", borderRadius: 7 }}
        />
        <button
          onClick={issue}
          disabled={issuing || !name.trim()}
          style={{
            padding: "8px 12px", fontSize: 11, fontWeight: 700,
            background: "var(--gx-accent-violet)", color: "#fff",
            border: "none", borderRadius: 7, cursor: issuing ? "default" : "pointer",
            opacity: (issuing || !name.trim()) ? 0.55 : 1,
          }}
        >
          {issuing ? "Issuing…" : "Issue key"}
        </button>
      </div>
      {err && <div style={{ marginTop: 6, fontSize: 11, color: "var(--gx-accent-rose)" }}>{err}</div>}

      {revealed && (
        <div style={{
          marginTop: 12, padding: 12,
          background: "#FFF9E5", border: "1px solid #E6C24A",
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#85651A", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>
            ⚠ Copy this secret now — you won&apos;t see it again
          </div>
          <input
            readOnly
            value={revealed.secret}
            onFocus={(e) => e.target.select()}
            style={{ width: "100%", padding: "8px 10px", fontFamily: "var(--gx-font-mono)", fontSize: 12, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 6, boxSizing: "border-box" }}
          />
          <button
            onClick={() => setRevealed(null)}
            style={{ marginTop: 8, padding: "4px 10px", fontSize: 10, color: "#85651A", background: "transparent", border: "1px solid #E6C24A", borderRadius: 6, cursor: "pointer" }}
          >
            I've stored it
          </button>
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((k) => (
            <div key={k.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px",
              background: "var(--gx-surface-2)",
              border: "1px solid var(--gx-border-soft)",
              borderRadius: 8,
              fontSize: 11,
              opacity: k.active ? 1 : 0.55,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "var(--gx-ink)" }}>{k.name}</div>
                <div style={{ fontFamily: "var(--gx-font-mono)", fontSize: 10, color: "var(--gx-ink-muted)" }}>
                  {k.prefix}… · {k.scopes?.join(",")} · {k.request_count || 0} req
                </div>
              </div>
              {k.active ? (
                <button
                  onClick={() => revoke(k.id)}
                  style={{ padding: "4px 8px", fontSize: 10, color: "#A32D2D", background: "transparent", border: "1px solid #FCEBEB", borderRadius: 6, cursor: "pointer" }}
                >
                  Revoke
                </button>
              ) : (
                <span style={{ fontSize: 9, color: "var(--gx-ink-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Revoked</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
