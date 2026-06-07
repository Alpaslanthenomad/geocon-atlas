"use client";
// Shared tab header for the platform's two chronological streams. The
// Discovery feed (curated 30-day signal) and the Activity log (live
// user-action stream) overlapped and both lived in Library under the word
// "feed". This presents them as ONE "What's new" surface with two tabs.

import Link from "next/link";

const TABS = [
  { key: "discoveries", href: "/geocon/feed",     label: "Discoveries" },
  { key: "activity",    href: "/geocon/activity", label: "Activity" },
];

export default function WhatsNewTabs({ active }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="gx-overline" style={{ marginBottom: 8 }}>What&apos;s new</div>
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
        Platformda olan biten — küratörlü keşif akışı ve canlı etkinlik günlüğü tek yerde.
      </div>
    </div>
  );
}
