"use client";
// components/geocon/OnboardingChecklist.jsx
//
// First-five-minutes guide for a freshly signed-in user. Mounts at the top of
// the home page (above MyDashboard). Auto-hides when all four steps are
// complete or the user dismisses it. Step state is computed server-side via
// get_my_onboarding_status so a refresh always reflects current truth.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const STEPS = [
  {
    key: "has_watch",
    title: "Watch your first species or organization",
    body: "Hit the ☆ button on any species, org or proposal page to follow it. Saved items appear on your home dashboard.",
    cta: "Browse the Atlas →",
    href: "/geocon/species",
  },
  {
    key: "has_org_membership",
    title: "Join or register an organization",
    body: "Find your institution / R&D firm and request to join, or register a new one. Accreditation unlocks proposals and program participation.",
    cta: "Open Organizations →",
    href: "/geocon/organizations",
  },
  {
    key: "has_proposal_draft",
    title: "Draft your first proposal",
    body: "Open the compose flow — pick a recipient, fill the term sheet, save as draft. You can polish before sending.",
    cta: "Start a proposal →",
    href: "/geocon/proposals/new",
  },
  {
    key: "has_sent_proposal",
    title: "Send a proposal to a real actor",
    body: "Once you're ready, hit Send. The recipient gets a bell notification; you can negotiate in the thread.",
    cta: "View your proposals →",
    href: "/geocon/proposals",
  },
];

export default function OnboardingChecklist() {
  const { user } = useAuthContext();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hidingForSession, setHidingForSession] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.rpc("get_my_onboarding_status");
        if (cancelled) return;
        setStatus(data || null);
      } catch (e) {
        if (!cancelled) console.warn("[OnboardingChecklist]", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })().catch(() => { /* swallow */ });
    return () => { cancelled = true; };
  }, [user]);

  if (!user || loading || hidingForSession) return null;
  if (!status) return null;
  if (status.dismissed_at) return null;

  const done = STEPS.filter((s) => !!status[s.key]).length;
  const total = STEPS.length;
  // If everything is already true, don't pester the user.
  if (done === total) return null;

  async function dismiss() {
    setHidingForSession(true);
    await supabase.rpc("dismiss_my_onboarding");
  }

  const pct = Math.round((done / total) * 100);

  return (
    <section style={{
      background: "linear-gradient(135deg, #0a4a3e 0%, #1D9E75 60%, #FFD15C 130%)",
      borderRadius: 14,
      padding: "18px 22px",
      marginBottom: 22,
      color: "#fff",
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Get started · {done} of {total} done
          </div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            Your first 5 minutes on GEOCON
          </h2>
        </div>
        <button
          onClick={dismiss}
          style={{
            fontSize: 10,
            background: "rgba(255,255,255,0.15)",
            color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontWeight: 600,
          }}
        >
          Dismiss
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 999, marginBottom: 16, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#fff", transition: "width 0.3s" }} />
      </div>

      {/* Steps */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
        {STEPS.map((step, i) => {
          const isDone = !!status[step.key];
          return (
            <div key={step.key} style={{
              background: isDone ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.95)",
              color: isDone ? "rgba(255,255,255,0.75)" : "#2c2c2a",
              borderRadius: 10,
              padding: 14,
              border: "1px solid rgba(255,255,255,0.25)",
              opacity: isDone ? 0.85 : 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22, height: 22, borderRadius: 999,
                  background: isDone ? "#0F6E56" : "#0a4a3e",
                  color: "#fff",
                  fontSize: 11, fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {isDone ? "✓" : i + 1}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
                  {step.title}
                </span>
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.5, marginBottom: 8, opacity: isDone ? 0.8 : 0.85 }}>
                {step.body}
              </div>
              {!isDone && (
                <Link
                  href={step.href}
                  style={{
                    display: "inline-block",
                    fontSize: 11, fontWeight: 700,
                    padding: "6px 12px",
                    background: "#0a4a3e", color: "#fff",
                    borderRadius: 6, textDecoration: "none",
                  }}
                >
                  {step.cta}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
