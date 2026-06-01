"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Breadcrumb from "./Breadcrumb";
import { usePathname, useRouter } from "next/navigation";
import { ROLES } from "../../lib/constants";
import { useAuthContext } from "../../lib/authContext";
import { signOut } from "../../lib/auth";
import { useTheme } from "../../lib/themeContext";
import { Dot } from "../shared";
import NotificationBell from "./NotificationBell";
import Spotlight from "./Spotlight";
import { supabase } from "../../lib/supabase";

/**
 * /geocon shell — sidebar, auth indicator, footer. Renders the active route
 * page via {children}. Replaces the inline sidebar from the old single-file
 * orchestrator.
 */

const NAV = [
  { href: "/geocon",             label: "Home",         icon: "🏠", match: "exact" },
  { href: "/geocon/ask",         label: "Ask GEOCON",   icon: "✨" },
  { href: "/geocon/compare",     label: "Compare",      icon: "⇄"  },
  { href: "/geocon/observe",     label: "Field log",    icon: "📍" },
  { href: "/geocon/activity",    label: "Activity",     icon: "⚡" },
  { href: "/geocon/explore",     label: "Explore",      icon: "🌍" },
  { href: "/geocon/programs",    label: "Programs",     icon: "📋" },
  { href: "/geocon/species",     label: "ATLAS",        icon: "🌿" },
  { href: "/geocon/metabolites", label: "Metabolites",  icon: "🧪" },
  { href: "/geocon/publications",label: "Publications", icon: "📚" },
  { href: "/geocon/researchers", label: "Researchers",  icon: "👨‍🔬" },
  { href: "/geocon/organizations", label: "Organizations", icon: "🏢" },
  { href: "/geocon/proposals",   label: "Proposals",    icon: "📬" },
  { href: "/geocon/briefs",      label: "Open Briefs",  icon: "🗂" },
  { href: "/geocon/communities", label: "Communities",  icon: "🤝" },
];

const ADMIN_NAV = { href: "/geocon/admin", label: "Admin", icon: "⚙️" };

function isActive(pathname, item) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function ThemeSwitch() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light" : "Switch to dark"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="gx-btn"
      style={{
        fontSize: 14,
        padding: "8px 10px",
        background: "var(--gx-surface)",
        color: "var(--gx-ink-muted)",
        border: "1px solid var(--gx-border-soft)",
        borderRadius: 8,
        cursor: "pointer",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 40,
        minHeight: 40,
      }}
    >
      {isDark ? "☀" : "☾"}
    </button>
  );
}

export default function GeoconShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, researcher } = useAuthContext();
  const [side, setSide] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Default-collapse the sidebar on phones, default-expand on laptops.
  // Re-runs on resize so rotating a tablet doesn't strand the user.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => {
      setIsMobile(mq.matches);
      setSide(!mq.matches);
    };
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const userRole = profile?.role || "observer";
  const role = ROLES[userRole] || { label: "Observer", color: "var(--gx-ink-muted)", ic: "O", accent: "var(--gx-surface-3)" };
  const isAdminUser = userRole === "admin";
  const navItems = isAdminUser ? [...NAV, ADMIN_NAV] : NAV;

  // Sidebar nav badges (recent activity 24h + my inbound pending proposals
  // + programs I'm a member of).
  const [recentActivity, setRecentActivity] = useState(0);
  const [inboundPending, setInboundPending] = useState(0);
  const [myProgramCount, setMyProgramCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const calls = [supabase.rpc("count_recent_activity", { p_since: new Date(Date.now() - 86_400_000).toISOString() })];
      if (user) {
        calls.push(supabase.rpc("count_my_inbound_pending"));
        calls.push(supabase.rpc("count_my_programs"));
      }
      const results = await Promise.all(calls);
      if (cancelled) return;
      setRecentActivity(typeof results[0]?.data === "number" ? results[0].data : 0);
      if (user && results[1]) setInboundPending(typeof results[1].data === "number" ? results[1].data : 0);
      if (user && results[2]) setMyProgramCount(typeof results[2].data === "number" ? results[2].data : 0);
    })();
    return () => { cancelled = true; };
  }, [user]);

  function badgeFor(href) {
    if (href === "/geocon/activity" && recentActivity > 0) {
      return { count: recentActivity, tint: "#534AB7" };
    }
    if (href === "/geocon/proposals" && inboundPending > 0) {
      return { count: inboundPending, tint: "#A32D2D" };
    }
    if (href === "/geocon/programs" && myProgramCount > 0) {
      return { count: myProgramCount, tint: "#0F6E56" };
    }
    return null;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--gx-bg)", paddingBottom: isMobile ? 64 : 0 }}>
      <a href="#main" className="gx-skip">Skip to main content</a>
      {/* Mobile bottom-tab nav — frequently-used 4 surfaces only.
          Sidebar drawer stays for the long-tail list. Audit P3 follow-up:
          15-item drawer was unusable as the primary mobile nav. */}
      {isMobile && <MobileBottomNav pathname={pathname} />}
      {/* Mobile backdrop when sidebar drawer is open */}
      {isMobile && side && (
        <div
          onClick={() => setSide(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 18,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: side ? 220 : 0,
          flexShrink: 0,
          overflow: "hidden",
          background: "var(--gx-surface)",
          borderRight: "1px solid var(--gx-border-soft)",
          transition: "width 0.25s ease, background var(--gx-d-base) var(--gx-ease)",
          display: "flex",
          flexDirection: "column",
          ...(isMobile ? {
            position: "fixed",
            top: 0, bottom: 0, left: 0,
            zIndex: 20,
            boxShadow: side ? "8px 0 24px rgba(0,0,0,0.18)" : "none",
          } : {}),
        }}
      >
        <div style={{ padding: "18px 14px 14px", flex: 1, overflow: "hidden" }}>
          <Link
            href="/geocon"
            aria-label="GEOCON Atlas — home"
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, textDecoration: "none" }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(145deg,#085041,#1D9E75)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(15, 110, 86, 0.25)",
            }}>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "var(--gx-font-display)" }}>A</span>
            </div>
            <div>
              <div style={{
                fontSize: 15, fontWeight: 700, letterSpacing: -0.4,
                color: "var(--gx-ink)", fontFamily: "var(--gx-font-display)",
                lineHeight: 1,
              }}>
                ATLAS
              </div>
              <div style={{
                fontSize: 8, color: "var(--gx-ink-muted)", letterSpacing: 1.8,
                textTransform: "uppercase", marginTop: 3, fontWeight: 700,
                fontFamily: "var(--gx-font-body)",
              }}>
                GEOCON v3.1
              </div>
            </div>
          </Link>

          <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {navItems.map(n => {
              const active = isActive(pathname, n);
              const badge = badgeFor(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => { if (isMobile) setSide(false); }}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 11px",
                    borderRadius: 8,
                    fontSize: 12,
                    background: active ? "var(--gx-surface-3)" : "transparent",
                    color: active ? "var(--gx-ink)" : "var(--gx-ink-muted)",
                    fontWeight: active ? 700 : 500,
                    textDecoration: "none",
                    transition: "background 0.15s var(--gx-ease), color 0.15s var(--gx-ease)",
                    fontFamily: "var(--gx-font-body)",
                    borderLeft: active ? "2px solid var(--gx-accent-violet)" : "2px solid transparent",
                    paddingLeft: active ? 9 : 11,
                  }}
                >
                  <span style={{ fontSize: 14, opacity: active ? 1 : 0.75 }}>{n.icon}</span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {badge && (
                    <span
                      aria-label={`${badge.count} unread`}
                      style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: badge.tint, color: "#fff", minWidth: 16, textAlign: "center" }}
                    >
                      {badge.count > 99 ? "99+" : badge.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: 12, padding: 10, background: "var(--gx-surface-3)", borderRadius: 8, fontSize: 9, color: "var(--gx-ink-muted)", lineHeight: 1.8 }}>
            <div>
              <Dot color="var(--gx-accent-bio-green)" size={6} />
              <span style={{ marginLeft: 4 }}>Supabase connected</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 8, color: "var(--gx-ink-faint)" }}>
              Sign in via BEE for owner actions.
            </div>
            <Link href="/geocon/about" style={{ marginTop: 6, display: "inline-block", fontSize: 9, color: "#C2611A", textDecoration: "none", fontWeight: 600 }}>
              About GEOCON →
            </Link>
            <Link href="/geocon/shortcuts" style={{ marginTop: 2, display: "inline-block", fontSize: 9, color: "var(--gx-ink-muted)", textDecoration: "none" }}>
              Keyboard shortcuts
            </Link>
          </div>
        </div>

        {/* Bottom user pill */}
        <div style={{ padding: 14, borderTop: "1px solid #e8e6e1" }}>
          {user ? (
            <>
              <Link href="/geocon/profile" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, textDecoration: "none", color: "inherit" }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: role.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>{role.ic}</span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gx-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {researcher?.name || profile?.full_name || user.email.split("@")[0]}
                    </div>
                    {profile?.orcid_verified_at && (
                      <span
                        title="ORCID verified"
                        aria-label="ORCID verified"
                        style={{
                          fontSize: 9, fontWeight: 700,
                          padding: "1px 5px", borderRadius: 999,
                          background: "var(--gx-success-soft)",
                          color: "var(--gx-success)",
                          border: "1px solid color-mix(in srgb, var(--gx-success) 35%, transparent)",
                          flexShrink: 0,
                        }}
                      >
                        ✓ ORCID
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 8, color: "var(--gx-ink-faint)" }}>
                    {role.label}{profile?.approval_status === "pending" && " · pending"}
                  </div>
                </div>
              </Link>
              <button
                onClick={async () => { await signOut(); router.push("/"); }}
                style={{ width: "100%", padding: "5px 0", fontSize: 9, color: "#A32D2D", background: "none", border: "1px solid #FCEBEB", borderRadius: 6, cursor: "pointer" }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 8, textAlign: "center", lineHeight: 1.5 }}>
                Browsing as <strong>observer</strong>
              </div>
              <Link
                href="/"
                style={{ display: "block", textAlign: "center", padding: "8px 0", fontSize: 11, color: "#fff", background: "#0a4a3e", borderRadius: 6, fontWeight: 600, textDecoration: "none" }}
              >
                Sign in via BEE
              </Link>
            </>
          )}
        </div>
      </aside>

      {/* Main column — overflow:visible so the sticky header anchors to
          the body scroll, not the main container. */}
      <main id="main" style={{ flex: 1, minWidth: 0, padding: 0 }}>
        {/* Sticky top header — blurs over scrolled content */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          padding: isMobile ? "10px 12px" : "12px 20px",
          background: "color-mix(in srgb, var(--gx-bg) 86%, transparent)",
          backdropFilter: "blur(12px) saturate(150%)",
          WebkitBackdropFilter: "blur(12px) saturate(150%)",
          borderBottom: "1px solid var(--gx-border-soft)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
              <button
                onClick={() => setSide(!side)}
                style={{
                  fontSize: 18,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--gx-ink-muted)",
                  padding: 0,
                  flexShrink: 0,
                  // Tap-target floor for mobile / accessibility — WCAG
                  // recommends ≥ 44×44 for finger-driven interactions.
                  minWidth: 40,
                  minHeight: 40,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Toggle sidebar"
              >
                {isMobile ? (side ? "✕" : "☰") : (side ? "◀" : "▶")}
              </button>
              <Breadcrumb />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
                title="Search (⌘K)"
                aria-label="Open global search"
                className="gx-btn"
                style={{
                  fontSize: 11,
                  padding: "8px 12px",
                  background: "var(--gx-surface)",
                  color: "var(--gx-ink-muted)",
                  border: "1px solid var(--gx-border-soft)",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  minWidth: 40,
                  minHeight: 40,
                }}
              >
                🔎{!isMobile && <span style={{ color: "var(--gx-ink-faint)", fontSize: 9, fontFamily: "var(--gx-font-mono)" }}>⌘K</span>}
              </button>
              <ThemeSwitch />
              <NotificationBell />
            </div>
          </div>
        </header>

        <div style={{ padding: isMobile ? "12px 12px 28px" : "16px 20px 28px" }}>
        <Spotlight />

        {children}

        <footer style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: "1px solid var(--gx-border-soft)",
          color: "var(--gx-ink-muted)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 24,
            marginBottom: 20,
          }}>
            {/* Brand block */}
            <div>
              <div style={{
                fontFamily: "var(--gx-font-display)",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--gx-ink)",
                letterSpacing: -0.3,
                marginBottom: 6,
              }}>
                GEOCON Atlas
              </div>
              <div className="gx-caption" style={{ lineHeight: 1.55 }}>
                Endemic geophyte intelligence — species commons, programs,
                and recognition for conservation research.
              </div>
            </div>

            {/* Explore */}
            <div>
              <div className="gx-overline" style={{ marginBottom: 8 }}>Atlas</div>
              <FooterLink href="/geocon/species">Species</FooterLink>
              <FooterLink href="/geocon/families">Families</FooterLink>
              <FooterLink href="/geocon/countries">Countries</FooterLink>
              <FooterLink href="/geocon/metabolites">Metabolites</FooterLink>
              <FooterLink href="/geocon/publications">Publications</FooterLink>
            </div>

            {/* Programs */}
            <div>
              <div className="gx-overline" style={{ marginBottom: 8 }}>Network</div>
              <FooterLink href="/geocon/programs">Programs</FooterLink>
              <FooterLink href="/geocon/researchers">Researchers</FooterLink>
              <FooterLink href="/geocon/organizations">Organizations</FooterLink>
              <FooterLink href="/geocon/briefs">Open Briefs</FooterLink>
              <FooterLink href="/geocon/proposals">Proposals</FooterLink>
            </div>

            {/* About */}
            <div>
              <div className="gx-overline" style={{ marginBottom: 8 }}>About</div>
              <FooterLink href="/geocon/about">About GEOCON</FooterLink>
              <FooterLink href="/geocon/ask">Ask GEOCON</FooterLink>
              <FooterLink href="/geocon/activity">Activity</FooterLink>
              <FooterLink href="https://orcid.org" external>ORCID</FooterLink>
              <FooterLink href="https://www.iucnredlist.org" external>IUCN Red List</FooterLink>
            </div>
          </div>

          <div style={{
            paddingTop: 12,
            borderTop: "1px solid var(--gx-border-soft)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}>
            <span style={{ fontSize: 10, color: "var(--gx-ink-faint)" }}>
              GEOCON v3.1 · ATLAS intelligence layer
            </span>
            <span style={{ fontSize: 10, color: "var(--gx-ink-faint)" }}>
              Operated by <strong style={{ color: "var(--gx-ink-muted)" }}>Venn BioVentures OÜ</strong> · Tallinn, Estonia
            </span>
          </div>
        </footer>
        </div>
      </main>
    </div>
  );
}

// Mobile bottom-tab navigation. Renders a fixed bar across the bottom
// of the viewport on phones with 4 priority destinations. Active
// state matches Shell.isActive() so deep-link refreshes highlight the
// right tab. Tap targets are 56×48 (comfortably above the 44 floor).
const MOBILE_TABS = [
  { href: "/geocon",          label: "Home",     icon: "🏠", match: "exact" },
  { href: "/geocon/species",  label: "Atlas",    icon: "🌿" },
  { href: "/geocon/programs", label: "Programs", icon: "📋" },
  { href: "/geocon/briefs",   label: "Briefs",   icon: "🗂" },
];

function MobileBottomNav({ pathname }) {
  return (
    <nav
      aria-label="Primary"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        background: "color-mix(in srgb, var(--gx-surface) 92%, transparent)",
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        borderTop: "1px solid var(--gx-border-soft)",
        boxShadow: "0 -6px 24px rgba(0,0,0,0.06)",
        // Respect iOS bottom safe-area inset.
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {MOBILE_TABS.map((t) => {
        const active = isActive(pathname, t);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              padding: "8px 4px 10px",
              minHeight: 56,
              textDecoration: "none",
              color: active ? "var(--gx-accent-violet)" : "var(--gx-ink-muted)",
              fontWeight: active ? 700 : 500,
              fontSize: 10,
              letterSpacing: 0.3,
              transition: "color 120ms ease",
            }}
          >
            <span aria-hidden style={{
              fontSize: 20,
              lineHeight: 1,
              transform: active ? "translateY(-1px)" : "none",
              transition: "transform 120ms ease",
            }}>
              {t.icon}
            </span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function FooterLink({ href, external, children }) {
  const styleBase = {
    display: "block",
    fontSize: 12,
    color: "var(--gx-ink-soft)",
    textDecoration: "none",
    padding: "3px 0",
    lineHeight: 1.5,
    transition: "color 120ms ease",
  };
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={styleBase}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--gx-accent-violet)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--gx-ink-soft)"; }}
      >
        {children} <span aria-hidden style={{ fontSize: 9, opacity: 0.6 }}>↗</span>
      </a>
    );
  }
  return (
    <Link
      href={href}
      style={styleBase}
      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--gx-accent-violet)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--gx-ink-soft)"; }}
    >
      {children}
    </Link>
  );
}
