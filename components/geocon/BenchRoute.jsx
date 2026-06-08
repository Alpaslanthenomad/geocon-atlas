"use client";
// Your bench — the personal working room. Your projects, assignments and drafts
// at hand. Project-centric (NOT the reverted species-claim/chain-heal bench):
// the programs you own or are in, the tics assigned to you (draft -> promote),
// and a door to your drafts.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { Loading } from "../shared";
import MyAssignments from "./MyAssignments";

const STAGE_PILL = {
  designing: "#6B7280", draft: "#6B7280", active: "#166534",
  gate_ready: "#92400E", producing: "#1E40AF", realized: "#3730A3",
  paused: "#6B7280", abandoned: "#991B1B",
};
const card = { border: "1px solid var(--gx-card-border)", borderRadius: 14, background: "var(--gx-card-bg)", padding: "14px 16px", marginBottom: 18 };

export default function BenchRoute() {
  const { user, loading: authLoading } = useAuthContext();
  const [programs, setPrograms] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("get_my_programs").then(({ data }) => setPrograms(Array.isArray(data) ? data : [])).catch(() => setPrograms([]));
  }, [user]);

  if (authLoading) return <Loading />;
  if (!user) {
    return (
      <div style={{ maxWidth: 560, margin: "40px auto", textAlign: "center" }}>
        <h1 className="gx-h1">Your bench</h1>
        <p style={{ fontSize: 13, color: "var(--gx-ink-muted)", marginTop: 8 }}>Sign in to see your projects and work.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <div className="gx-overline">The bench</div>
        <h1 className="gx-h1">Your bench</h1>
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 2 }}>
          Your programs, assignments and drafts — at hand.
        </div>
      </div>

      {/* Your assignments (the work loop — hidden when none) */}
      <MyAssignments />

      {/* Your programs */}
      <section style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <div className="gx-overline">Your programs</div>
          <Link href="/geocon/programs/new" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--gx-success, #1D9E75)", textDecoration: "none" }}>+ Start a program</Link>
        </div>
        {programs === null ? (
          <div style={{ fontSize: 12, color: "var(--gx-ink-muted)" }}>Loading…</div>
        ) : programs.length === 0 ? (
          <div style={{ border: "1px dashed var(--gx-card-border)", borderRadius: 10, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gx-ink)" }}>You are not in any program yet</div>
            <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 5 }}>
              Start one, or <Link href="/geocon/programs" style={{ color: "var(--gx-ink-soft)" }}>browse programs</Link> and request to join.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {programs.map((p) => (
              <Link key={p.id} href={`/geocon/programs/${p.id}`}
                style={{ display: "block", textDecoration: "none", border: "1px solid var(--gx-card-border)", borderRadius: 10, padding: "11px 12px", background: "var(--gx-surface-2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: STAGE_PILL[(p.status || "").toLowerCase()] || "#6B7280" }} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: p.is_owner ? "#0a4a3e" : "var(--gx-ink-muted)" }}>
                    {p.is_owner ? "Owner" : (p.my_role || "member")}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gx-ink)", lineHeight: 1.3 }}>{p.program_name || "Untitled program"}</div>
                {p.species_name && <div style={{ fontSize: 11, fontStyle: "italic", color: "var(--gx-ink-muted)", marginTop: 2 }}>{p.species_name}</div>}
                <div style={{ fontSize: 10, color: "var(--gx-ink-faint)", marginTop: 5 }}>{p.member_count} member{p.member_count === 1 ? "" : "s"}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Drafts door */}
      <section style={card}>
        <div className="gx-overline" style={{ marginBottom: 6 }}>Your drafts</div>
        <Link href="/geocon/drafts" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--gx-ink-soft)", textDecoration: "none" }}>
          Open your drafts — proposals, grants, briefs in progress →
        </Link>
      </section>
    </div>
  );
}
