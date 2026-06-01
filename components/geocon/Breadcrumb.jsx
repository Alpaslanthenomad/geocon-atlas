"use client";
// Smart breadcrumb — auto-built from the current pathname.
//
// Drops anywhere inside /geocon/* and renders a sequence like:
//
//   Home › Species › Crocus mathewii
//
// Detail routes with id segments ([id], [name], [code]) call useEffect
// to swap the raw id for a human-readable label when the surrounding
// page has loaded the entity. Until then, the id is shown verbatim so
// the bar never flashes empty.

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";

// Pretty labels per top-level segment. Anything not in this map gets a
// title-cased fallback. Stays in sync with the sidebar nav copy.
const SEGMENT_LABEL = {
  geocon:        "Atlas",
  species:       "Species",
  families:      "Families",
  family:        "Family",
  countries:     "Countries",
  country:       "Country",
  metabolites:   "Metabolites",
  publications:  "Publications",
  researchers:   "Researchers",
  organizations: "Organizations",
  programs:      "Programs",
  proposals:     "Proposals",
  briefs:        "Open Briefs",
  about:         "About",
  ask:           "Ask GEOCON",
  explore:       "Explore",
  activity:      "Activity",
  observe:       "Observe",
  compare:       "Compare",
  shortcuts:     "Shortcuts",
  profile:       "My profile",
  admin:         "Admin",
  analytics:     "Analytics",
  health:        "Health",
  welcome:       "Welcome",
  communities:   "Communities",
  new:           "New",
};

function prettifyId(seg) {
  if (!seg) return seg;
  // ORCID-style id, UUID, or RES-* — show abbreviated form
  if (/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(seg)) return seg;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)) {
    return seg.slice(0, 8) + "…";
  }
  // Try decode (e.g. "Iris%20persica")
  try {
    const decoded = decodeURIComponent(seg);
    if (decoded !== seg) return decoded;
  } catch { /* ignore */ }
  return seg;
}

function looksLikeId(seg) {
  if (!seg) return false;
  if (/^[0-9a-f]{8}-/i.test(seg)) return true;        // UUID prefix
  if (/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(seg)) return true; // ORCID
  if (/^RES-/.test(seg)) return true;                  // researcher id
  if (/^PROG-/.test(seg)) return true;
  if (/^PROP-/.test(seg)) return true;
  if (/^METAB-/.test(seg)) return true;
  if (/^IUCN-/.test(seg)) return true;
  return false;
}

export default function Breadcrumb({ labels = {}, hideOnHome = true }) {
  const pathname = usePathname() || "/";

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    // Build progressive hrefs
    const out = [];
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i];
      acc += "/" + seg;
      // Override map (caller-provided labels override the default)
      const overrideKey = parts.slice(0, i + 1).join("/");
      const label =
        labels[overrideKey] ||
        labels[seg] ||
        SEGMENT_LABEL[seg.toLowerCase()] ||
        (looksLikeId(seg) ? prettifyId(seg) : seg.charAt(0).toUpperCase() + seg.slice(1));
      out.push({ href: acc, label });
    }
    return out;
  }, [pathname, labels]);

  // On the GEOCON home route the breadcrumb is just "Atlas" — usually
  // not worth rendering; let the caller opt out.
  if (hideOnHome && crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11,
      color: "var(--gx-ink-muted)",
      overflow: "hidden",
      flexWrap: "wrap",
      minWidth: 0,
    }}>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={c.href} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
          }}>
            {i > 0 && (
              <span aria-hidden style={{
                color: "var(--gx-ink-faint)",
                fontSize: 11,
                lineHeight: 1,
              }}>›</span>
            )}
            {isLast ? (
              <span style={{
                color: "var(--gx-ink)",
                fontWeight: 600,
                maxWidth: 280,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>{c.label}</span>
            ) : (
              <Link
                href={c.href}
                style={{
                  color: "var(--gx-ink-muted)",
                  textDecoration: "none",
                  maxWidth: 220,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  transition: "color 120ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--gx-accent-violet)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--gx-ink-muted)"; }}
              >
                {c.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
