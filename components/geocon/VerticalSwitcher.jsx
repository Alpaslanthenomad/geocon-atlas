"use client";
// VerticalSwitcher — Slack-workspace-style dropdown in the header that
// lets a user pick which taxonomic vertical they're working in.
//
// Behavior during the geophytes-only era (right now):
//   - For everyone, shows the active vertical as a static chip next to
//     the breadcrumb (low visual weight, just brand reinforcement).
//   - For admin users, the chip becomes a dropdown that lists other
//     active verticals (currently none — list_verticals returns just
//     geophytes) + a "Propose new vertical" link.
//
// When the second vertical lands the public sees the dropdown too.
//
// Reads get_my_active_vertical on mount; writes set_my_active_vertical
// on pick. Re-routes to /geocon so vertical-scoped landing pages
// refresh.

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { track } from "../../lib/analytics";
import { clearActiveVerticalCache } from "../../lib/atlas/activeVertical";

export default function VerticalSwitcher() {
  const { profile } = useAuthContext();
  const router = useRouter();
  const isAdmin = profile?.role === "admin";
  const [active, setActive] = useState(null);
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: actv }, { data: vs }] = await Promise.all([
        supabase.rpc("get_my_active_vertical"),
        supabase.rpc("list_verticals", { p_include_beta: true }),
      ]);
      if (cancelled) return;
      setActive(actv || null);
      setList(Array.isArray(vs) ? vs : []);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function pick(id) {
    if (id === active?.id) { setOpen(false); return; }
    try {
      await supabase.rpc("set_my_active_vertical", { p_vertical_id: id });
      track("vertical_switch", { payload: { from: active?.id, to: id } });
    } catch { /* fallthrough — UI will re-fetch on next mount */ }
    clearActiveVerticalCache(); // GATE-0: next atlas read re-scopes to the new vertical
    setOpen(false);
    router.push("/geocon");
    router.refresh?.();
  }

  if (!active) return null;

  // Single-vertical case: render as a static chip for everyone,
  // dropdown only for admins (so they can see the future shape).
  const onlyOne = list.length <= 1;
  if (onlyOne && !isAdmin) {
    return <VerticalChip active={active} />;
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 9px",
          background: "var(--gx-surface-2)",
          border: "1px solid var(--gx-border-soft)",
          borderRadius: 7,
          color: "var(--gx-ink-soft)",
          fontSize: 11, fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--gx-font-body)",
        }}
      >
        <span aria-hidden style={{ fontSize: 13 }}>{active.emoji || "✦"}</span>
        <span style={{ color: "var(--gx-ink)" }}>{active.display_name}</span>
        {active.is_beta && (
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5,
                          padding: "1px 5px", borderRadius: 999,
                          background: "var(--gx-warning-soft)", color: "var(--gx-warning)",
                          fontFamily: "var(--gx-font-mono)" }}>BETA</span>
        )}
        <ChevronDown size={11} strokeWidth={1.85} style={{ marginLeft: 2, opacity: 0.7 }} />
      </button>

      {open && (
        <div role="listbox"
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0,
            zIndex: 40, minWidth: 240,
            background: "var(--gx-card-bg)",
            border: "1px solid var(--gx-card-border)",
            borderRadius: "var(--gx-card-radius)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
            padding: 6,
            display: "flex", flexDirection: "column", gap: 2,
          }}>
          {list.map((v) => {
            const isActive = v.id === active.id;
            return (
              <button
                key={v.id}
                role="option"
                aria-selected={isActive}
                onClick={() => pick(v.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", textAlign: "left",
                  padding: "8px 10px", borderRadius: 7,
                  background: isActive ? "var(--gx-surface-3)" : "transparent",
                  border: "none", cursor: "pointer",
                  fontSize: 12,
                  color: isActive ? "var(--gx-ink)" : "var(--gx-ink-soft)",
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: "var(--gx-font-body)",
                }}
              >
                <span aria-hidden style={{ fontSize: 14, opacity: 0.85 }}>{v.emoji || "✦"}</span>
                <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {v.display_name}
                  {v.is_beta && (
                    <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5,
                                    padding: "1px 5px", borderRadius: 999,
                                    background: "var(--gx-warning-soft)", color: "var(--gx-warning)",
                                    fontFamily: "var(--gx-font-mono)" }}>BETA</span>
                  )}
                </span>
                <span style={{ fontSize: 10, color: "var(--gx-ink-faint)", fontFamily: "var(--gx-font-mono)" }}>
                  {v.species_count?.toLocaleString?.() || 0}
                </span>
                {isActive && <span style={{ color: "var(--gx-success)", fontSize: 11, fontWeight: 700 }}>✓</span>}
              </button>
            );
          })}
          {isAdmin && (
            <Link href="/geocon/admin/verticals"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 10px", marginTop: 4,
                borderTop: "1px solid var(--gx-border-soft)",
                fontSize: 11, fontWeight: 600,
                color: "var(--gx-accent-violet)",
                textDecoration: "none",
              }}>
              <Plus size={12} strokeWidth={2} />
              Propose new vertical
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function VerticalChip({ active }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 8px",
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: 7,
      color: "var(--gx-ink-soft)",
      fontSize: 11, fontWeight: 600,
      fontFamily: "var(--gx-font-body)",
    }}>
      <span aria-hidden style={{ fontSize: 12 }}>{active.emoji || "✦"}</span>
      <span style={{ color: "var(--gx-ink)" }}>{active.display_name}</span>
    </span>
  );
}
