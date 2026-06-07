"use client";
// Shared tab header for the collaboration-proposal family. Proposals, Open
// calls and Open briefs are three LENSES on the same collaboration_proposals
// table (one detail page) — this header makes them read as ONE surface with
// tabs instead of three separate top-level destinations.

import Link from "next/link";

const TABS = [
  { key: "proposals", href: "/geocon/proposals",      label: "Proposals" },
  { key: "open",      href: "/geocon/proposals/open", label: "Open calls" },
  { key: "briefs",    href: "/geocon/briefs",         label: "Open briefs" },
];

export default function CollabTabs({ active }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="gx-overline" style={{ marginBottom: 8 }}>Collaboration</div>
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--gx-border-soft)" }}>
        {TABS.map((t) => {
          const on = t.key === active;
          return (
            <Link key={t.key} href={t.href} style={{
              padding: "8px 14px", fontSize: 12.5, fontWeight: on ? 700 : 500,
              color: on ? "var(--gx-ink)" : "var(--gx-ink-muted)", textDecoration: "none",
              borderBottom: on ? "2px solid var(--gx-success)" : "2px solid transparent", marginBottom: -1,
            }}>
              {t.label}
            </Link>
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: "var(--gx-ink-faint)", marginTop: 6, fontStyle: "italic" }}>
        Aynı işbirliği akışının üç görünümü — sana gelen/giden öneriler, herkese açık çağrılar, ağ genelindeki brief'ler.
      </div>
    </div>
  );
}
