"use client";
// Shared view-switcher for the species-browse surfaces. The atlas list, the
// globe (Explore) and Compare are three ways to look at the SAME species set.
// This makes Species the hub and Compare a view within it rather than a
// separate top-level destination.

import Link from "next/link";

const TABS = [
  { key: "atlas",   href: "/geocon/species", label: "Atlas" },
  { key: "globe",   href: "/geocon/explore", label: "Globe" },
  { key: "compare", href: "/geocon/compare", label: "Compare" },
];

export default function SpeciesViewTabs({ active }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="gx-overline" style={{ marginBottom: 8 }}>Browse species</div>
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
    </div>
  );
}
