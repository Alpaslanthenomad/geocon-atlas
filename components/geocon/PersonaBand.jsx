"use client";
// PersonaBand (Phase 3) — the persona-framed contribution nudge for the
// highest-leverage surface (a species). Signed-in only, subtle, LABEL-FREE
// (shows chain maturity as % + open count, never the deferred spine labels).
// It re-skins the CTA by the user's station — it never gates anything.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { getStation } from "../../lib/persona";
import ClaimToggle from "./ClaimToggle";

export default function PersonaBand({ speciesId, speciesName }) {
  const { user } = useAuthContext();
  const [chain, setChain] = useState(null);
  const [station, setStation] = useState(null);

  useEffect(() => {
    if (!user || !speciesId) return undefined;
    let on = true;
    Promise.all([
      supabase.rpc("get_species_chain", { p_species_id: speciesId }),
      supabase.rpc("get_my_station"),
    ]).then(([c, s]) => {
      if (!on) return;
      setChain(Array.isArray(c.data) ? c.data : []);
      setStation(s.data || null);
    }).catch(() => {});
    return () => { on = false; };
  }, [user, speciesId]);

  if (!user || !chain || !chain.length) return null;

  const evidenced = chain.filter((l) => l.fill_state !== "empty").length;
  const open = chain.length - evidenced;
  const pct = Math.round((evidenced / chain.length) * 100);
  const meta = getStation(station);
  const name = speciesName || "this species";

  return (
    <section style={{
      border: "1px solid var(--gx-accent-violet)", borderRadius: 12,
      background: "var(--gx-card-bg)", padding: "12px 14px",
    }}>
      <div className="gx-overline" style={{ marginBottom: 5 }}>Where you can help</div>
      <div style={{ fontSize: 12.5, color: "var(--gx-ink)", lineHeight: 1.5 }}>
        {name}&apos;s knowledge chain is <strong>{pct}%</strong> complete
        {open > 0 && <> — <strong>{open}</strong> open link{open === 1 ? "" : "s"}</>}.
      </div>
      {meta && (
        <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", marginTop: 5, lineHeight: 1.5 }}>
          As a <strong style={{ color: "var(--gx-ink-soft)" }}>{meta.label}</strong>: {meta.gain}
        </div>
      )}
      <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        <ClaimToggle speciesId={speciesId} />
        <Link href="/geocon/bench" style={{ fontSize: 11.5, color: "var(--gx-ink-muted)", textDecoration: "none" }}>
          Open your bench →
        </Link>
      </div>
    </section>
  );
}
