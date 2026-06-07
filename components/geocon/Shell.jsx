"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Breadcrumb from "./Breadcrumb";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { ROLES } from "../../lib/constants";
import { useAuthContext } from "../../lib/authContext";
import { signOut } from "../../lib/auth";
import { useTheme } from "../../lib/themeContext";
import NotificationBell from "./NotificationBell";
import Spotlight from "./Spotlight";
// VerticalSwitcher was mounted here briefly but verticals are a
// BEE-platform-level concept, not a GEOCON-internal one. GEOCON is
// itself one vertical (geophytes). The switcher belongs in BEE's
// outer shell when other verticals come online; nothing to switch
// to inside GEOCON. Data layer (verticals table, species.vertical_id)
// is kept untouched as a future-proof anchor for BEE-level work.
import { usePageviews } from "../../lib/analytics";
import {
  Home, Activity, Briefcase, Inbox, FolderOpen,
  Leaf, FlaskConical, BookOpen, User, Building2, Eye, FileText, Award,
  Sparkles, ArrowLeftRight, Globe2, MapPin, Calendar, ShieldCheck, Banknote, Radio, Sprout,
  Microscope, GraduationCap, Rss,
  Search, Settings, Sun, Moon, Menu, X, ChevronLeft, ChevronRight, ChevronDown,
  Compass, Library,
} from "lucide-react";

/**
 * /geocon shell — sidebar, auth indicator, footer. Renders the active route
 * page via {children}.
 *
 * Sidebar layout: 3 buckets (WORKSPACE / COMMONS / TOOLS) instead of one
 * flat 15-item list. Section overlines visually separate them, and item
 * order inside each bucket goes by frequency-of-use. Mobile bottom nav
 * mirrors the WORKSPACE bucket — that's the "do" surface researchers
 * touch most often.
 *
 * Icons: lucide-react (mono-line) instead of emoji. Tone-consistent with
 * Crimson Pro display + Inter body typography — emoji broke the editorial
 * register.
 */

// IA v2 — intent-based navigation. 24 flat tabs were a wall; now they're
// grouped into 4 collapsible "worlds" mapped to the three personas
// (explore / run / field) plus a reference Library. Only the active
// world is expanded — a researcher sees ~7 rows, not 24.
//
// Personal shortcuts (Home, Watching) live above the worlds; gated
// items (Admin, Ventures) below.

// Always-visible personal cluster (top).
const NAV_PERSONAL = [
  { href: "/geocon",       label: "Home",     icon: Home, match: "exact" },
  { href: "/geocon/watch", label: "Watching", icon: Eye,  requiresAuth: true },
];

// The four worlds. `persona` ties a world to an intent so the home
// router + auto-expand can prioritise it.
const NAV_WORLDS = [
  {
    key: "discover", label: "Discover", icon: Compass, persona: "explore",
    blurb: "Browse + find species",
    items: [
      { href: "/geocon/species",  label: "Species",     icon: Leaf },
      { href: "/geocon/explore",  label: "Explore",     icon: Globe2 },
      { href: "/geocon/compare",  label: "Compare",     icon: ArrowLeftRight },
      { href: "/geocon/ask",      label: "Ask GEOCON",  icon: Sparkles },
    ],
  },
  {
    key: "work", label: "Work", icon: Briefcase, persona: "run",
    blurb: "Run programs + report outcomes",
    items: [
      { href: "/geocon/programs",  label: "Programs",    icon: Briefcase },
      { href: "/geocon/proposals", label: "Proposals",   icon: Inbox },
      { href: "/geocon/briefs",    label: "Open Briefs", icon: FolderOpen },
      { href: "/geocon/iucn",      label: "IUCN Hub",    icon: ShieldCheck, requiresAuth: true },
      { href: "/geocon/thesis",    label: "Thesis",      icon: GraduationCap, requiresAuth: true },
      { href: "/geocon/outcomes",  label: "Outcomes",    icon: Award },
      { href: "/geocon/grants",    label: "Grants",      icon: Banknote },
      { href: "/geocon/drafts",    label: "Drafts",      icon: FileText, requiresAuth: true },
    ],
  },
  {
    key: "field", label: "Field", icon: MapPin, persona: "field",
    blurb: "Capture + observe in the field",
    items: [
      { href: "/geocon/field",    label: "Field notebook", icon: MapPin },
      { href: "/geocon/observe",  label: "Live feed",      icon: Radio },
      { href: "/geocon/calendar", label: "Calendar",       icon: Calendar },
    ],
  },
  {
    key: "library", label: "Library", icon: Library, persona: null,
    blurb: "Reference + what's happening",
    items: [
      { href: "/geocon/publications",  label: "Publications",  icon: BookOpen },
      { href: "/geocon/researchers",   label: "Researchers",   icon: User },
      { href: "/geocon/organizations", label: "Organizations", icon: Building2 },
      { href: "/geocon/specimens",     label: "Specimens",     icon: Microscope },
      { href: "/geocon/metabolites",   label: "Metabolites",   icon: FlaskConical },
      { href: "/geocon/feed",          label: "Feed",          icon: Rss },
      { href: "/geocon/activity",      label: "Activity",      icon: Activity },
    ],
  },
];

const ADMIN_NAV = { href: "/geocon/admin", label: "Admin", icon: Settings };
// Bahçe — internal ventures workspace, admin-only, sits next to Admin.
const VENTURES_NAV = { href: "/geocon/ventures", label: "Ventures", icon: Sprout };

// Which world owns a given pathname? (for auto-expand)
function worldForPath(pathname) {
  for (const w of NAV_WORLDS) {
    if (w.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"))) {
      return w.key;
    }
  }
  return null;
}

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
      {isDark ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
    </button>
  );
}

export default function GeoconShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, researcher } = useAuthContext();
  const [side, setSide] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Self-hosted telemetry — fires a 'pageview' event on every route
  // change. Bot UAs skipped inside the hook; no IP, no third party.
  usePageviews();

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

  // IA v2 — personal cluster (filtered for auth) + gated items.
  const personalItems = NAV_PERSONAL.filter((n) => !n.requiresAuth || user);
  const gatedItems = isAdminUser ? [VENTURES_NAV, ADMIN_NAV] : [];

  // Persona drives which world auto-expands when no route is active.
  const [persona, setPersona] = useState("explore");
  useEffect(() => {
    if (!user) { setPersona("explore"); return; }
    let cancelled = false;
    supabase.rpc("get_my_persona").then(({ data }) => {
      if (!cancelled && data?.persona) setPersona(data.persona);
    });
    return () => { cancelled = true; };
  }, [user]);

  // Accordion expansion. The active world (by pathname) is always
  // expanded; otherwise fall back to the persona's world. Users can
  // manually toggle any world; manual state overrides the default.
  const activeWorld = worldForPath(pathname);
  const personaWorld = NAV_WORLDS.find((w) => w.persona === persona)?.key || "discover";
  const [openWorlds, setOpenWorlds] = useState({});
  // Auto-open the relevant world on navigation (without collapsing ones
  // the user manually opened).
  useEffect(() => {
    const target = activeWorld || personaWorld;
    setOpenWorlds((prev) => (prev[target] ? prev : { ...prev, [target]: true }));
  }, [activeWorld, personaWorld]);
  function toggleWorld(key) {
    setOpenWorlds((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Sidebar nav badges (recent activity 24h + my inbound pending proposals
  // + programs I'm a member of + species I'm watching).
  const [recentActivity, setRecentActivity] = useState(0);
  const [inboundPending, setInboundPending] = useState(0);
  const [myProgramCount, setMyProgramCount] = useState(0);
  const [myWatchCount, setMyWatchCount] = useState(0);
  const [myDraftCount, setMyDraftCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const calls = [supabase.rpc("count_recent_activity", { p_since: new Date(Date.now() - 86_400_000).toISOString() })];
      if (user) {
        calls.push(supabase.rpc("count_my_inbound_pending"));
        calls.push(supabase.rpc("count_my_programs"));
        calls.push(supabase.rpc("count_my_watchlist"));
        calls.push(supabase.rpc("count_my_drafts"));
      }
      const results = await Promise.all(calls);
      if (cancelled) return;
      setRecentActivity(typeof results[0]?.data === "number" ? results[0].data : 0);
      if (user && results[1]) setInboundPending(typeof results[1].data === "number" ? results[1].data : 0);
      if (user && results[2]) setMyProgramCount(typeof results[2].data === "number" ? results[2].data : 0);
      if (user && results[3]) setMyWatchCount(typeof results[3].data === "number" ? results[3].data : 0);
      if (user && results[4]) setMyDraftCount(typeof results[4].data === "number" ? results[4].data : 0);
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
    if (href === "/geocon/watch" && myWatchCount > 0) {
      return { count: myWatchCount, tint: "var(--gx-accent-violet)" };
    }
    if (href === "/geocon/drafts" && myDraftCount > 0) {
      return { count: myDraftCount, tint: "var(--gx-warning)" };
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
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(145deg,#085041,#1D9E75)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(15, 110, 86, 0.25)",
            }}>
              <span style={{ color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "var(--gx-font-display)" }}>G</span>
            </div>
            <div>
              <div style={{
                fontSize: 15, fontWeight: 700, letterSpacing: -0.3,
                color: "var(--gx-ink)", fontFamily: "var(--gx-font-display)",
                lineHeight: 1,
              }}>
                GEOCON Atlas
              </div>
              <div style={{
                fontSize: 9, color: "var(--gx-ink-muted)", letterSpacing: 0.4,
                marginTop: 3, fontFamily: "var(--gx-font-body)",
              }}>
                Endemic geophyte commons
              </div>
            </div>
          </Link>

          <nav aria-label="Primary" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Personal cluster — Home + Watching, always flat */}
            <NavFlat
              items={personalItems}
              pathname={pathname}
              onPick={() => { if (isMobile) setSide(false); }}
              badgeFor={badgeFor}
            />

            {/* The four intent worlds — collapsible. Active / persona
                world auto-expands; rest stay tucked. */}
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
              {NAV_WORLDS.map((w) => (
                <NavWorld
                  key={w.key}
                  world={w}
                  open={!!openWorlds[w.key]}
                  onToggle={() => toggleWorld(w.key)}
                  pathname={pathname}
                  user={user}
                  isPersona={w.key === personaWorld}
                  onPick={() => { if (isMobile) setSide(false); }}
                  badgeFor={badgeFor}
                />
              ))}
            </div>

            {/* Gated — Admin / Ventures */}
            {gatedItems.length > 0 && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--gx-border-soft)" }}>
                <NavFlat
                  items={gatedItems}
                  pathname={pathname}
                  onPick={() => { if (isMobile) setSide(false); }}
                  badgeFor={badgeFor}
                />
              </div>
            )}
          </nav>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--gx-border-soft)" }}>
            <Link href="/geocon/about" style={{ display: "block", fontSize: 11, color: "var(--gx-ink-soft)", textDecoration: "none", padding: "3px 0" }}>
              About
            </Link>
            <Link href="/geocon/shortcuts" style={{ display: "block", fontSize: 11, color: "var(--gx-ink-soft)", textDecoration: "none", padding: "3px 0" }}>
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
              <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginBottom: 8, textAlign: "center", lineHeight: 1.5 }}>
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
                {isMobile
                  ? (side ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />)
                  : (side ? <ChevronLeft size={18} strokeWidth={1.75} /> : <ChevronRight size={18} strokeWidth={1.75} />)}
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
                <Search size={15} strokeWidth={1.75} />
                {!isMobile && <span style={{ color: "var(--gx-ink-faint)", fontSize: 9, fontFamily: "var(--gx-font-mono)" }}>⌘K</span>}
              </button>
              <ThemeSwitch />
              <NotificationBell />
            </div>
          </div>
        </header>

        <div style={{ padding: isMobile ? "12px 12px 28px" : "16px 20px 28px" }}>
        <Spotlight />

        {children}

        {/* Footer — audit VIII.c. Was a 3-column 15-link sitemap that
            mirrored the sidebar (which already exposes everything).
            Pure cost, zero new value, broke page-flow. Now: one line
            with operator credit + a couple of policy/help links.
            About is in the sidebar bottom now; ORCID + IUCN exist as
            external partners worth crediting. */}
        <footer style={{
          marginTop: 40,
          paddingTop: 14,
          borderTop: "1px solid var(--gx-border-soft)",
          color: "var(--gx-ink-faint)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          fontSize: 10,
        }}>
          <span>
            GEOCON Atlas · Operated by{" "}
            <strong style={{ color: "var(--gx-ink-muted)" }}>Venn BioVentures OÜ</strong>
            {" · "}Tallinn, Estonia
          </span>
          <span style={{ display: "inline-flex", gap: 12, flexWrap: "wrap" }}>
            <FooterLink href="/geocon/about">About</FooterLink>
            <FooterLink href="https://orcid.org" external>ORCID</FooterLink>
            <FooterLink href="https://www.iucnredlist.org" external>IUCN Red List</FooterLink>
          </span>
        </footer>
        </div>
      </main>
    </div>
  );
}

// Single nav row. Shared by flat lists + worlds.
function NavRow({ n, pathname, onPick, badgeFor, indent }) {
  const active = isActive(pathname, n);
  const badge = badgeFor(n.href);
  const Icon = n.icon;
  return (
    <Link
      href={n.href}
      onClick={onPick}
      aria-current={active ? "page" : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "7px 11px",
        paddingLeft: indent ? (active ? 24 : 26) : (active ? 9 : 11),
        borderRadius: 8, fontSize: 12,
        background: active ? "var(--gx-surface-3)" : "transparent",
        color: active ? "var(--gx-ink)" : "var(--gx-ink-soft)",
        fontWeight: active ? 600 : 500,
        textDecoration: "none",
        transition: "background 0.15s var(--gx-ease), color 0.15s var(--gx-ease)",
        fontFamily: "var(--gx-font-body)",
        borderLeft: active ? "2px solid var(--gx-accent-violet)" : "2px solid transparent",
      }}
    >
      {Icon && (
        <Icon size={15} strokeWidth={active ? 2.2 : 1.75} aria-hidden
          style={{ flexShrink: 0, opacity: active ? 1 : 0.85 }} />
      )}
      <span style={{ flex: 1 }}>{n.label}</span>
      {badge && (
        <span aria-label={`${badge.count} unread`} style={{
          fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999,
          background: badge.tint, color: "#fff", minWidth: 16, textAlign: "center",
        }}>
          {badge.count > 99 ? "99+" : badge.count}
        </span>
      )}
    </Link>
  );
}

// Flat list (personal cluster, gated items) — no header, no collapse.
function NavFlat({ items, pathname, onPick, badgeFor }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((n) => (
        <NavRow key={n.href} n={n} pathname={pathname} onPick={onPick} badgeFor={badgeFor} />
      ))}
    </div>
  );
}

// IA v2 — collapsible "world". Header toggles; children indent. Active
// child bubbles a dot up to a collapsed header so the user knows where
// they are even when tucked. Auth-gated children are filtered out for
// signed-out viewers.
function NavWorld({ world, open, onToggle, pathname, user, isPersona, onPick, badgeFor }) {
  const items = world.items.filter((n) => !n.requiresAuth || user);
  if (items.length === 0) return null;
  const containsActive = items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"));
  // sum of child badges (shown on collapsed header)
  const childBadge = items.reduce((acc, it) => {
    const b = badgeFor(it.href);
    return acc + (b ? b.count : 0);
  }, 0);
  const Icon = world.icon;
  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={open}
        title={world.blurb}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 9,
          padding: "8px 11px", borderRadius: 8,
          background: containsActive && !open ? "var(--gx-surface-2)" : "transparent",
          border: "none", cursor: "pointer",
          color: containsActive ? "var(--gx-ink)" : "var(--gx-ink-soft)",
          fontFamily: "var(--gx-font-body)", fontSize: 12,
          fontWeight: 700, letterSpacing: 0.2,
        }}
      >
        <Icon size={15} strokeWidth={containsActive ? 2.2 : 1.85} aria-hidden
          style={{ flexShrink: 0, color: containsActive ? "var(--gx-accent-violet)" : "inherit" }} />
        <span style={{ flex: 1, textAlign: "left" }}>{world.label}</span>
        {isPersona && !containsActive && (
          <span title="suggested for you" style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "var(--gx-accent-violet)", flexShrink: 0,
          }} />
        )}
        {!open && childBadge > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999,
            background: "var(--gx-accent-violet)", color: "#fff", minWidth: 16, textAlign: "center",
          }}>
            {childBadge > 99 ? "99+" : childBadge}
          </span>
        )}
        <ChevronDown size={13} strokeWidth={2}
          style={{
            flexShrink: 0, opacity: 0.6,
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.18s var(--gx-ease)",
          }} />
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 1, marginBottom: 4 }}>
          {items.map((n) => (
            <NavRow key={n.href} n={n} pathname={pathname} onPick={onPick} badgeFor={badgeFor} indent />
          ))}
        </div>
      )}
    </div>
  );
}

// Mobile bottom-tab navigation. Renders a fixed bar across the bottom
// of the viewport on phones with 4 priority destinations. Active
// state matches Shell.isActive() so deep-link refreshes highlight the
// right tab. Tap targets are 56×48 (comfortably above the 44 floor).
// v4.5 — Expanded from 4 → 6 tabs. Watching + Calendar are heavy mobile
// surfaces (daily check-ins for researchers in the field), and after
// telemetry showed both clicked more than Briefs from desktop, they
// earn a thumb-zone slot.
const MOBILE_TABS = [
  { href: "/geocon",          label: "Home",     icon: Home,     match: "exact" },
  { href: "/geocon/species",  label: "Atlas",    icon: Leaf },
  { href: "/geocon/watch",    label: "Watch",    icon: Eye },
  { href: "/geocon/calendar", label: "Phenol",   icon: Calendar },
  { href: "/geocon/programs", label: "Programs", icon: Briefcase },
  { href: "/geocon/briefs",   label: "Briefs",   icon: FolderOpen },
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
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {MOBILE_TABS.map((t) => {
        const active = isActive(pathname, t);
        const Icon = t.icon;
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
              gap: 3,
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
            <Icon
              size={20}
              strokeWidth={active ? 2.2 : 1.75}
              aria-hidden
              style={{
                transform: active ? "translateY(-1px)" : "none",
                transition: "transform 120ms ease",
              }}
            />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function FooterLink({ href, external, children }) {
  const styleBase = {
    display: "inline-flex", alignItems: "center", gap: 3,
    fontSize: 10,
    color: "var(--gx-ink-soft)",
    textDecoration: "none",
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
