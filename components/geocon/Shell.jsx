"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLES } from "../../lib/constants";
import { useAuthContext } from "../../lib/authContext";
import { signOut } from "../../lib/auth";
import { Dot } from "../shared";

/**
 * /geocon shell — sidebar, auth indicator, footer. Renders the active route
 * page via {children}. Replaces the inline sidebar from the old single-file
 * orchestrator.
 */

const NAV = [
  { href: "/geocon",             label: "Home",         icon: "🏠", match: "exact" },
  { href: "/geocon/programs",    label: "Programs",     icon: "📋" },
  { href: "/geocon/species",     label: "ATLAS",        icon: "🌿" },
  { href: "/geocon/metabolites", label: "Metabolites",  icon: "🧪" },
  { href: "/geocon/publications",label: "Publications", icon: "📚" },
  { href: "/geocon/researchers", label: "Researchers",  icon: "👨‍🔬" },
  { href: "/geocon/communities", label: "Communities",  icon: "🤝" },
];

const ADMIN_NAV = { href: "/geocon/admin", label: "Admin", icon: "⚙️" };

function isActive(pathname, item) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export default function GeoconShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, researcher } = useAuthContext();
  const [side, setSide] = useState(true);

  const userRole = profile?.role || "observer";
  const role = ROLES[userRole] || { label: "Observer", color: "#888780", ic: "O", accent: "#f4f3ef" };
  const isAdminUser = userRole === "admin";
  const navItems = isAdminUser ? [...NAV, ADMIN_NAV] : NAV;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f7f4" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: side ? 220 : 0,
          flexShrink: 0,
          overflow: "hidden",
          background: "#fff",
          borderRight: "1px solid #e8e6e1",
          transition: "width 0.25s ease",
          display: "flex",
          flexDirection: "column",
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
              return (
                <Link
                  key={n.href}
                  href={n.href}
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
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ marginTop: 12, padding: 10, background: "#f4f3ef", borderRadius: 8, fontSize: 9, color: "#888", lineHeight: 1.8 }}>
            <div>
              <Dot color="#0F6E56" size={6} />
              <span style={{ marginLeft: 4 }}>Supabase connected</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 8, color: "#a8a59c" }}>
              Sign in via BEE for owner actions.
            </div>
          </div>
        </div>

        {/* Bottom user pill */}
        <div style={{ padding: 14, borderTop: "1px solid #e8e6e1" }}>
          {user ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
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
              </div>
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
      <div style={{ flex: 1, minWidth: 0, padding: "16px 20px 28px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button
            onClick={() => setSide(!side)}
            style={{ fontSize: 16, background: "none", border: "none", cursor: "pointer", color: "#888", padding: 0 }}
            aria-label="Toggle sidebar"
          >
            {side ? "◀" : "▶"}
          </button>
        </div>

        {children}

        <div style={{ marginTop: 32, paddingTop: 10, borderTop: "1px solid #e8e6e1", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4, fontSize: 8, color: "#b4b2a9" }}>
          <span>GEOCON v3.0 · ATLAS intelligence layer</span>
          <span>Venn BioVentures OÜ</span>
        </div>
      </div>
    </div>
  );
}
