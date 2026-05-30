"use client";
// components/geocon/ProfileRoute.jsx
//
// /geocon/profile — settings hub for the signed-in user. Three sections:
//   * Identity card (role, researcher link, BEE email)
//   * Org affiliations (from org_memberships)
//   * Watch list (everything they've ☆-saved, with one-click unfollow)
// Notification preferences live in the bell dropdown; this page links over.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import PushSubscribeButton from "./PushSubscribeButton";

const KIND_META = {
  species:      { icon: "🌿", label: "Species",      tint: "#0F6E56" },
  organization: { icon: "🏢", label: "Organization", tint: "#185FA5" },
  researcher:   { icon: "👤", label: "Researcher",   tint: "#534AB7" },
  proposal:     { icon: "📬", label: "Proposal",     tint: "#0a4a3e" },
  family:       { icon: "🌳", label: "Family",       tint: "#85651A" },
  country:      { icon: "🗺",  label: "Country",      tint: "#BA7517" },
};

export default function ProfileRoute() {
  const { user, profile, researcher, loading: authLoading } = useAuthContext();
  const [orgs, setOrgs] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const [orgsResp, watchResp] = await Promise.all([
        supabase
          .from("org_memberships")
          .select("organization_id, role, title, status, is_primary, organizations(id, name, short_name, kind, accreditation_status)")
          .eq("user_id", user.id)
          .in("status", ["active", "pending"]),
        supabase.rpc("get_my_watchlist", { p_kind: null, p_limit: 200 }),
      ]);
      if (cancelled) return;
      setOrgs((orgsResp.data || []).filter((r) => r.organizations));
      setWatchlist(Array.isArray(watchResp.data) ? watchResp.data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading) return <div style={{ padding: 30, fontSize: 12, color: "#888" }}>Loading…</div>;
  if (!user) return <SignedOutPanel />;

  const displayName = researcher?.name || profile?.full_name || user.email?.split("@")[0];
  const role = profile?.role || "observer";

  async function unwatch(item) {
    await supabase.rpc("toggle_watch", {
      p_kind:      item.kind,
      p_entity_id: item.entity_id,
      p_label:     item.label,
      p_url:       item.url,
    });
    setWatchlist((wl) => wl.filter((w) => !(w.kind === item.kind && w.entity_id === item.entity_id)));
  }

  // Bucket watchlist by kind
  const byKind = {};
  for (const w of watchlist) {
    (byKind[w.kind] ??= []).push(w);
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>My profile</h1>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
          Your identity, affiliations, and saved entities.
        </div>
      </div>

      {/* Identity */}
      <section style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(150deg,#3C3489,#7F77DD)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>
            {(displayName || "?").trim().charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#2c2c2a" }}>{displayName}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
              {user.email} · <strong>{role}</strong>{profile?.approval_status === "pending" && " (pending approval)"}
            </div>
            {researcher && (
              <div style={{ fontSize: 11, marginTop: 4 }}>
                Researcher profile: <code style={{ background: "#f4f3ef", padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>{researcher.id}</code>
                {researcher.institution && <> · {researcher.institution}</>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Org affiliations */}
      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <h2 style={h2}>Organization affiliations</h2>
          <Link href="/geocon/organizations/new" style={linkBtn}>+ Register an org</Link>
        </div>
        {loading ? (
          <Loading />
        ) : orgs.length === 0 ? (
          <Empty line="You're not affiliated with any organization yet." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
            {orgs.map((m) => (
              <Link key={m.organization_id} href={`/geocon/organizations/${m.organization_id}`}
                style={{ display: "block", padding: 12, background: "#fafaf7", border: "1px solid #ece9e2", borderRadius: 8, textDecoration: "none", color: "inherit" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  🏢 {m.organizations.name}
                </div>
                <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>
                  {m.role}{m.title && ` · ${m.title}`}
                  {m.is_primary && <span style={{ marginLeft: 4, padding: "1px 5px", borderRadius: 4, background: "#0a4a3e", color: "#fff", fontSize: 8, fontWeight: 700 }}>PRIMARY</span>}
                  {m.status === "pending" && <span style={{ marginLeft: 4, color: "#BA7517", fontWeight: 700 }}>pending</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Watch list */}
      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <h2 style={h2}>★ Watching ({watchlist.length})</h2>
        </div>
        {loading ? (
          <Loading />
        ) : watchlist.length === 0 ? (
          <Empty line="You're not watching anything yet. Use the ☆ button on a species, organization, or proposal to save it." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {Object.entries(KIND_META).map(([kind, meta]) => {
              const arr = byKind[kind] || [];
              if (arr.length === 0) return null;
              return (
                <div key={kind}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: meta.tint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    {meta.icon} {meta.label} ({arr.length})
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>
                    {arr.map((w) => (
                      <div key={`${w.kind}|${w.entity_id}`} style={{ display: "flex", gap: 6, padding: "8px 10px", background: "#fafaf7", border: "1px solid #ece9e2", borderRadius: 8 }}>
                        <Link href={w.url || "#"} style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {w.label || String(w.entity_id).slice(0, 12)}
                          </div>
                        </Link>
                        <button onClick={() => unwatch(w)} title="Stop watching"
                          style={{ background: "none", border: "none", color: "#A32D2D", cursor: "pointer", fontSize: 14, padding: 0 }}>
                          ★
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Notification prefs pointer */}
      <section style={card}>
        <h2 style={h2}>Notification preferences</h2>
        <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>
          Toggle which kinds of bell notifications you receive from the
          🔔 <strong>⚙ Prefs</strong> tab inside the notification dropdown
          in the top bar.
        </div>
        <PushSubscribeButton />
      </section>
    </div>
  );
}

function SignedOutPanel() {
  return (
    <div style={{ maxWidth: 480, margin: "60px auto", padding: 40, background: "#fff", border: "1px solid #ece9e2", borderRadius: 12, textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>👤</div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: 0, color: "#2c2c2a" }}>Sign in to see your profile</h1>
      <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "9px 16px", fontSize: 12, fontWeight: 600, background: "#0a4a3e", color: "#fff", borderRadius: 7, textDecoration: "none" }}>
        Sign in via BEE
      </Link>
    </div>
  );
}

function Loading() { return <div style={{ padding: 20, textAlign: "center", color: "#888", fontSize: 11 }}>Loading…</div>; }
function Empty({ line }) {
  return <div style={{ padding: 18, border: "1px dashed #ece9e2", borderRadius: 8, textAlign: "center", color: "#888", fontSize: 12, background: "#fafaf7" }}>{line}</div>;
}

const card = {
  background: "#fff", border: "1px solid #ece9e2", borderRadius: 12,
  padding: 18, marginBottom: 14,
};
const h2 = { fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: "#2c2c2a", margin: 0 };
const linkBtn = {
  fontSize: 11, padding: "5px 10px", background: "#fff", color: "#0a4a3e",
  border: "1px solid #0a4a3e", borderRadius: 6, textDecoration: "none", fontWeight: 600,
};
