"use client";
// /geocon/admin/iucn-sync — admin-only batch runner that lifts IUCN
// status from Wikidata in 100-row chunks. Visible progress, pausable.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

export default function IucnSyncRoute() {
  const { user, profile } = useAuthContext();
  const isAdmin = profile?.role === "admin";

  const [running, setRunning] = useState(false);
  const [stop, setStop] = useState(false);
  const [offset, setOffset] = useState(0);
  const [batchSize, setBatchSize] = useState(100);
  const [stats, setStats] = useState({ processed: 0, matched: 0, updated: 0, skipped: 0, batches: 0 });
  const [log, setLog] = useState([]);
  const [snapshot, setSnapshot] = useState(null);

  async function refreshSnapshot() {
    const { data } = await supabase.rpc("get_admin_health_snapshot");
    setSnapshot(data);
  }

  useEffect(() => { if (isAdmin) refreshSnapshot(); }, [isAdmin]);

  async function runOnce(currentOffset) {
    const sess = await supabase.auth.getSession();
    const token = sess?.data?.session?.access_token;
    if (!token) throw new Error("No auth session — sign in first");

    // 30 s timeout so a hung Wikidata SPARQL never freezes the run loop.
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 30_000);
    try {
      const r = await fetch("/api/admin/iucn-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ batch_size: batchSize, offset: currentOffset }),
        signal: controller.signal,
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json?.error || `HTTP ${r.status}`);
      return json;
    } catch (e) {
      if (e?.name === "AbortError") throw new Error("Batch timed out after 30s — skipping");
      throw e;
    } finally {
      clearTimeout(tid);
    }
  }

  async function start() {
    if (!isAdmin) return;
    setRunning(true); setStop(false);
    let cur = offset;
    let acc = { ...stats };
    let consecutiveErrors = 0;
    while (true) {
      if (stop) break;
      try {
        const res = await runOnce(cur);
        consecutiveErrors = 0;
        acc = {
          batches:    acc.batches + 1,
          processed:  acc.processed + (res.processed || 0),
          matched:    acc.matched   + (res.matched   || 0),
          updated:    acc.updated   + (res.updated   || 0),
          skipped:    acc.skipped   + (res.skipped   || 0),
        };
        setStats(acc);
        setLog((l) => [
          `Batch @${cur}: processed ${res.processed} · matched ${res.matched} · updated ${res.updated}`,
          ...l,
        ].slice(0, 60));

        if (res.done) break;
        cur = res.next_offset || cur + batchSize;
        setOffset(cur);
        // Polite pause — Wikidata SPARQL rate-limits at ~5 req/s.
        await new Promise((r) => setTimeout(r, 350));
      } catch (e) {
        // A single bad batch shouldn't abort the whole run. Log, skip,
        // and continue. If 5 in a row fail, bail out so the user knows.
        consecutiveErrors += 1;
        setLog((l) => [`Batch @${cur}: SKIP — ${e?.message || e}`, ...l].slice(0, 60));
        if (consecutiveErrors >= 5) {
          setLog((l) => [`STOP: 5 consecutive failures — pausing run`, ...l].slice(0, 60));
          break;
        }
        cur = cur + batchSize;
        setOffset(cur);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    setRunning(false);
    refreshSnapshot();
  }

  if (!user) return <Gate>Sign in via BEE.</Gate>;
  if (!isAdmin) return <Gate>Admin role required.</Gate>;

  const cov = snapshot?.coverage || {};
  const counts = snapshot?.counts || {};

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", paddingBottom: 60 }}>
      <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 26, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
        🩺 IUCN sync · Wikidata
      </h1>
      <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.55 }}>
        Reads species rows missing an IUCN status, asks Wikidata's SPARQL endpoint
        whether each binomial has a conservation status, and bulk-updates the matches.
        Runs in 100-row batches with a 350 ms polite delay to respect Wikidata rate limits.
      </div>

      <section style={panel}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 14 }}>
          <Stat label="Catalog total"  value={counts.species} />
          <Stat label="With IUCN"      value={cov.species_with_iucn} tint="#0F6E56" />
          <Stat label="Threat tier"    value={counts.species_threat} tint="#A32D2D" />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 11, color: "var(--gx-ink-soft)" }}>Batch size:</label>
          <input
            type="number"
            min={10} max={200}
            value={batchSize}
            onChange={(e) => setBatchSize(Math.max(10, Math.min(200, Number(e.target.value) || 100)))}
            disabled={running}
            style={input}
          />
          <label style={{ fontSize: 11, color: "var(--gx-ink-soft)" }}>Start offset:</label>
          <input
            type="number"
            min={0}
            value={offset}
            onChange={(e) => setOffset(Math.max(0, Number(e.target.value) || 0))}
            disabled={running}
            style={input}
          />
          {!running ? (
            <button onClick={start} style={btn("primary")}>▶ Start sync</button>
          ) : (
            <button onClick={() => setStop(true)} style={btn("stop")}>■ Stop after current</button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 16 }}>
          <Stat label="Batches run"  value={stats.batches} />
          <Stat label="Processed"    value={stats.processed} />
          <Stat label="Matched"      value={stats.matched} tint="#534AB7" />
          <Stat label="Updated"      value={stats.updated} tint="#0F6E56" />
          <Stat label="Skipped"      value={stats.skipped} tint="var(--gx-ink-muted)" />
        </div>
      </section>

      <section style={panel}>
        <h2 style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gx-ink-muted)", margin: "0 0 10px" }}>
          Run log (most recent first)
        </h2>
        {log.length === 0 ? (
          <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", fontStyle: "italic" }}>
            No batches yet. Press Start to begin.
          </div>
        ) : (
          <div style={{ fontFamily: "var(--gx-font-mono)", fontSize: 11, color: "var(--gx-ink)", lineHeight: 1.55, maxHeight: 320, overflow: "auto" }}>
            {log.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}
      </section>

      <div style={{ marginTop: 14, fontSize: 11, color: "var(--gx-ink-muted)" }}>
        Wikidata is community-curated and not the official IUCN feed — expect ~50-70%
        of evaluated geophytes to be covered here. For the rest, the IUCN Red List
        API (Path B) needs to be activated separately.
      </div>
    </div>
  );
}

const panel = {
  marginTop: 18,
  padding: 16,
  background: "var(--gx-surface)",
  border: "1px solid var(--gx-border)",
  borderRadius: 12,
};
const input = {
  width: 80,
  padding: "6px 9px",
  fontSize: 12,
  background: "var(--gx-surface-2)",
  color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 7,
};
function btn(kind) {
  return {
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 700,
    background: kind === "primary"
      ? "var(--gx-accent-bio-green)"
      : kind === "stop"
        ? "var(--gx-accent-rose)"
        : "var(--gx-surface)",
    color: "#fff",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
    letterSpacing: 0.3,
  };
}
function Stat({ label, value, tint }) {
  return (
    <div style={{ padding: 12, background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)", borderRadius: 10 }}>
      <div style={{
        fontFamily: "var(--gx-font-display)",
        fontSize: 22, fontWeight: 900, color: tint || "var(--gx-ink)",
        letterSpacing: -1, lineHeight: 1,
      }}>
        {value == null ? "—" : Number(value).toLocaleString()}
      </div>
      <div style={{ fontSize: 9, color: "var(--gx-ink-muted)", marginTop: 4, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}
function Gate({ children }) {
  return (
    <div style={{ maxWidth: 460, margin: "60px auto", padding: 36, background: "var(--gx-surface)", border: "1px solid var(--gx-border)", borderRadius: 12, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 13 }}>
      {children}
    </div>
  );
}
