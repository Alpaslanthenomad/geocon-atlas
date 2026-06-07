"use client";
// /geocon/library — the reference shelf. The six Library routes that used to be
// a sidebar "world" now live behind one calm shelf page, so the universal
// sidebar stays minimal. Every route still works on deep-link.

import Link from "next/link";
import { BookOpen, User, Building2, Microscope, FlaskConical, Rss } from "lucide-react";

const SHELF = [
  { href: "/geocon/publications",  label: "Publications",  icon: BookOpen,     blurb: "The literature behind the atlas." },
  { href: "/geocon/researchers",   label: "Researchers",   icon: User,         blurb: "People working on geophytes." },
  { href: "/geocon/organizations", label: "Organizations", icon: Building2,    blurb: "Institutions, gardens, labs, NGOs." },
  { href: "/geocon/specimens",     label: "Specimens",     icon: Microscope,   blurb: "Herbarium vouchers + accessions." },
  { href: "/geocon/metabolites",   label: "Metabolites",   icon: FlaskConical, blurb: "Compounds characterised from species." },
  { href: "/geocon/feed",          label: "What's new",    icon: Rss,          blurb: "Discoveries + activity across GEOCON." },
];

export default function LibraryRoute() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <div className="gx-overline">Library</div>
        <h1 className="gx-h1">The reference shelf</h1>
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 2 }}>
          Everything that supports the atlas — people, papers, specimens, compounds, and what&apos;s happening.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {SHELF.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} style={{
              display: "block", textDecoration: "none", color: "inherit",
              background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)",
              borderRadius: 12, padding: "16px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Icon size={18} strokeWidth={1.9} style={{ color: "var(--gx-accent-violet)" }} aria-hidden />
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gx-ink)" }}>{s.label}</div>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--gx-ink-muted)", lineHeight: 1.5 }}>{s.blurb}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
