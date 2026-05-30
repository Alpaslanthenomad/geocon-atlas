"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
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
  { href: "/geocon/activity",    label: "Activity",     icon: "⚡" },
  { href: "/geocon/explore",     label: "Explore",      icon: "🌍" },
  { href: "/geocon/programs",    label: "Programs",     icon: "📋" },
  { href: "/geocon/species",     label: "ATLAS",        icon: "🌿" },
  { href: "/geocon/metabolites", label: "Metabolites",  icon: "🧪" },
  { href: "/geocon/publications",label: "Publications", icon: "📚" },
  { href: "/geocon/researchers", label: "Researchers",  icon: "👨‍🔬" },
  { href: "/geocon/organizations", label: "Organizations", icon: "🏢" },
  { href: "/geocon/proposals",   label: "Proposals",    icon: "📬" },
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
      className="gx-btn"
      style={{
        fontSize: 13,
        padding: "5px 10px",
        background: "var(--gx-surface)",
        color: "var(--gx-ink-muted)",
        border: "1px solid var(--gx-border-soft)",
        borderRadius: 7,
        cursor: "pointer",
        lineHeight: 1,
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
  const role = ROLES[userRole] || { label: "Observer", color: "#888780", ic: "O", accent: "#f4f3ef" };
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
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--gx-bg)" }}>
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
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, textDecoration: "none" }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(145deg,#085041,#1D9E75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "Georgia,serif" }}>A</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.5, color: "#2c2c2a", fontFamily: "Georgia,serif" }}>ATLAS</div>
              <div style={{ fontSize: 7, color: "#b4b2a9", letterSpacing: 1.5, textTransform: "uppercase" }}>GEOCON v3.0</div>
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 10px",
                    borderRadius: 7,
                    fontSize: 11,
                    background: active ? "#f4f3ef" : "transparent",
                    color: active ? "#2c2c2a" : "#888",
                    fontWeight: active ? 600 : 400,
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{n.icon}</span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {badge && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 999, background: badge.tint, color: "#fff", minWidth: 16, textAlign: "center" }}>
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
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {researcher?.name || profile?.full_name || user.email.split("@")[0]}
                  </div>
                  <div style={{ fontSize: 8, color: "#b4b2a9" }}>
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

      {/* Main column */}
      <div style={{ flex: 1, minWidth: 0, padding: isMobile ? "12px 12px 28px" : "16px 20px 28px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button
            onClick={() => setSide(!side)}
            style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer", color: "#888", padding: 0 }}
            aria-label="Toggle sidebar"
          >
            {isMobile ? (side ? "✕" : "☰") : (side ? "◀" : "▶")}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              title="Search (⌘K)"
              className="gx-btn"
              style={{
                fontSize: 11,
                padding: "5px 10px",
                background: "var(--gx-surface)",
                color: "var(--gx-ink-muted)",
                border: "1px solid var(--gx-border-soft)",
                borderRadius: 7,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🔎 <span style={{ color: "var(--gx-ink-faint)", fontSize: 9, fontFamily: "monospace" }}>⌘K</span>
            </button>
            <ThemeSwitch />
            <NotificationBell />
          </div>
        </div>
        <Spotlight />

        {children}

        <div style={{ marginTop: 32, paddingTop: 10, borderTop: "1px solid #e8e6e1", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4, fontSize: 8, color: "#b4b2a9" }}>
          <span>GEOCON v3.0 · ATLAS intelligence layer</span>
          <span>Venn BioVentures OÜ</span>
        </div>
      </div>
    </div>
  );
}
