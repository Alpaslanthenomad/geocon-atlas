"use client";
// QuickTools — a small grid of "tools you might miss" tiles for the
// home dashboard. Surfaces features that exist but live under URLs
// (Compare, IUCN sync, API keys, DarwinCore export...) so users find
// them without URL-hacking.
//
// Two tiers:
//   - public tier: visible to anyone signed in
//   - admin tier: only renders when profile.role === "admin"

import Link from "next/link";
import { useAuthContext } from "../../lib/authContext";

const PUBLIC_TOOLS = [
  { href: "/geocon/ask",      icon: "✨", title: "Ask GEOCON",     copy: "Natural-language search across the atlas" },
  { href: "/geocon/compare",  icon: "⇄",  title: "Compare species", copy: "Side-by-side comparison of any two species" },
  { href: "/geocon/observe",  icon: "📍", title: "Field log",       copy: "Capture a GPS-tagged observation" },
  { href: "/geocon/species",  icon: "💾", title: "Saved searches",  copy: "Browse the atlas, then save your filter set" },
  { href: "/geocon/profile",  icon: "🔑", title: "API keys",        copy: "Issue keys for /api/public/* endpoints" },
];

const ADMIN_TOOLS = [
  { href: "/geocon/admin/health",     icon: "🩺", title: "Health snapshot",       copy: "Per-table counts, coverage, integrity" },
  { href: "/geocon/admin/iucn-sync",  icon: "🌿", title: "IUCN sync (Wikidata)",  copy: "Backfill IUCN status from Wikidata" },
  { href: "/geocon/publications",     icon: "📚", title: "Import DOI",            copy: "Header chip on the Publications page" },
];

export default function QuickTools() {
  const { user, profile } = useAuthContext();
  if (!user) return null;
  const isAdmin = profile?.role === "admin";

  return (
    <section style={{
      marginBottom: 18,
      padding: 16,
      background: "var(--gx-surface)",
      border: "1px solid var(--gx-border)",
      borderRadius: "var(--gx-radius-4)",
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: "var(--gx-ink-muted)",
        marginBottom: 10,
      }}>
        🧰 Tools you might miss
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 10,
      }}>
        {PUBLIC_TOOLS.map((t) => <Tile key={t.href} {...t} />)}
      </div>

      {isAdmin && (
        <>
          <div style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: "var(--gx-ink-faint)",
            marginTop: 14,
            marginBottom: 8,
          }}>
            ⚙ Admin
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}>
            {ADMIN_TOOLS.map((t) => <Tile key={t.href} {...t} tone="admin" />)}
          </div>
        </>
      )}
    </section>
  );
}

function Tile({ href, icon, title, copy, tone }) {
  const bg = tone === "admin" ? "var(--gx-surface-3)" : "var(--gx-surface-2)";
  return (
    <Link
      href={href}
      className="gx-card-hover"
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 12px",
        background: bg,
        border: "1px solid var(--gx-border-soft)",
        borderRadius: 10,
        textDecoration: "none",
        color: "var(--gx-ink)",
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{
          display: "block",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--gx-ink)",
          lineHeight: 1.2,
        }}>
          {title}
        </span>
        <span style={{
          display: "block",
          fontSize: 10,
          color: "var(--gx-ink-muted)",
          marginTop: 3,
          lineHeight: 1.4,
        }}>
          {copy}
        </span>
      </span>
    </Link>
  );
}
