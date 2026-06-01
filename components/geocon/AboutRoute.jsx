"use client";
// /geocon/about — public marketing landing for GEOCON.

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const GEOCON_GRADIENT =
  "linear-gradient(135deg, #FFD15C 0%, #F5A623 35%, #C2611A 75%, #6B3010 100%)";

const STRONG_DISPLAY =
  '"Arial Black", "Helvetica Neue", Helvetica, "Segoe UI Black", system-ui, sans-serif';

export default function AboutRoute() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [totalSp, threatSp, programs, proposals, orgs, fams] = await Promise.all([
          supabase.from("species").select("id", { count: "exact", head: true }),
          supabase.from("species").select("id", { count: "exact", head: true }).in("iucn_status", ["CR", "EN", "VU"]),
          supabase.from("programs").select("id", { count: "exact", head: true }),
          supabase.from("collaboration_proposals").select("id", { count: "exact", head: true }).eq("status", "open"),
          supabase.from("organizations").select("id", { count: "exact", head: true }),
          supabase.rpc("get_atlas_family_counts"),
        ]);
        if (cancelled) return;
        setStats({
          total: totalSp.count || 0,
          threatened: threatSp.count || 0,
          programs: programs.count || 0,
          openCalls: proposals.count || 0,
          orgs: orgs.count || 0,
          families: Array.isArray(fams.data) ? fams.data.length : 0,
        });
      } catch (e) {
        if (!cancelled) setStats({ total: 0, threatened: 0, programs: 0, openCalls: 0, orgs: 0, families: 0 });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 48 }}>
      <Hero stats={stats} signedIn={!!user} />
      <Stats stats={stats} />
      <ValueProps />
      <Manifesto />
      <LayersExplainer />
      <IucnCompliance />
      <Audiences />
      <CTA signedIn={!!user} />
    </div>
  );
}

function Hero({ stats, signedIn }) {
  return (
    <section
      style={{
        position: "relative",
        padding: "56px 36px 48px",
        marginTop: 4,
        borderRadius: 18,
        background:
          "radial-gradient(ellipse at 12% 18%, rgba(229,114,43,0.18) 0%, transparent 45%)," +
          "radial-gradient(ellipse at 88% 82%, rgba(86,142,80,0.18) 0%, transparent 50%)," +
          "radial-gradient(ellipse at 50% 50%, #2a1240 0%, #150821 100%)",
        color: "#f3e8d3",
        overflow: "hidden",
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 5, textTransform: "uppercase", color: "#FFD79B", fontWeight: 600, marginBottom: 14 }}>
        Endemic Geophyte Intelligence
      </div>
      <h1
        style={{
          fontFamily: STRONG_DISPLAY,
          fontWeight: 900,
          fontSize: "clamp(56px, 9vw, 112px)",
          lineHeight: 0.92,
          letterSpacing: -3,
          margin: 0,
          background: GEOCON_GRADIENT,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        }}
      >
        GEOCON
      </h1>
      <p
        style={{
          fontFamily: "var(--gx-font-serif)",
          fontStyle: "italic",
          fontSize: "clamp(16px, 2vw, 22px)",
          maxWidth: 720,
          marginTop: 18,
          color: "#F0D9B6",
          lineHeight: 1.45,
        }}
      >
        The world&apos;s endemic geophytes — every species, every range, every threat — turned
        into a working surface for researchers, conservationists, and ventures.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
        <Link
          href="/geocon/explore"
          style={{
            padding: "12px 22px",
            fontWeight: 700,
            fontSize: 13,
            color: "#1a0d2e",
            background: GEOCON_GRADIENT,
            borderRadius: 10,
            textDecoration: "none",
            letterSpacing: 0.4,
            boxShadow: "0 8px 24px rgba(245,166,35,0.25)",
          }}
        >
          🌍 Explore the globe →
        </Link>
        <Link
          href="/geocon/species"
          style={{
            padding: "12px 22px",
            fontWeight: 600,
            fontSize: 13,
            color: "#FFE6BC",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(245,166,35,0.35)",
            borderRadius: 10,
            textDecoration: "none",
            letterSpacing: 0.4,
          }}
        >
          🌿 Browse the atlas
        </Link>
        {!signedIn && (
          <Link
            href="/"
            style={{
              padding: "12px 22px",
              fontWeight: 600,
              fontSize: 13,
              color: "rgba(255,215,155,0.85)",
              background: "transparent",
              border: "1px solid rgba(245,166,35,0.22)",
              borderRadius: 10,
              textDecoration: "none",
              letterSpacing: 0.4,
            }}
          >
            Sign in via BEE →
          </Link>
        )}
      </div>
    </section>
  );
}

function Stats({ stats }) {
  const items = [
    { label: "Species in atlas",       value: stats?.total },
    { label: "Threatened (CR/EN/VU)",  value: stats?.threatened, tint: "#FF8B96" },
    { label: "Plant families",         value: stats?.families },
    { label: "Open calls",             value: stats?.openCalls, tint: "#A8C49C" },
    { label: "Active programs",        value: stats?.programs },
    { label: "Organizations",          value: stats?.orgs },
  ];
  return (
    <section
      style={{
        marginTop: 24,
        padding: 26,
        background: "#fff",
        border: "1px solid #ece9e2",
        borderRadius: 14,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 18,
      }}
    >
      {items.map((it) => (
        <div key={it.label}>
          <div style={{
            fontFamily: STRONG_DISPLAY,
            fontSize: 30,
            fontWeight: 900,
            color: it.tint || "#2c2c2a",
            letterSpacing: -1,
            lineHeight: 1,
          }}>
            {it.value == null ? "…" : it.value.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 6, letterSpacing: 0.3, textTransform: "uppercase", fontWeight: 600 }}>
            {it.label}
          </div>
        </div>
      ))}
    </section>
  );
}

function ValueProps() {
  const props = [
    {
      icon: "🌍",
      title: "See the whole picture",
      copy: "Every endemic geophyte on a 3D globe, filtered by IUCN tier and family. Drill into any country to see its full species list.",
      href: "/geocon/explore",
      link: "Open the globe",
    },
    {
      icon: "🔍",
      title: "Search like a specialist",
      copy: "Species, families, countries, organizations, researchers, proposals — all indexed and linked. Cmd+K to jump anywhere.",
      href: "/geocon/species",
      link: "Search the atlas",
    },
    {
      icon: "📣",
      title: "Match science to ventures",
      copy: "Open calls connect researchers, gardens, and biotechs around shared subjects. Propose a collaboration, get matched to who's already working there.",
      href: "/geocon/proposals/open",
      link: "Browse open calls",
    },
    {
      icon: "📋",
      title: "Run multi-actor programs",
      copy: "Structured execution: contributors, outputs, milestones, audit. The same engine BEE uses, scoped to plant-conservation work.",
      href: "/geocon/programs",
      link: "See active programs",
    },
  ];
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, fontWeight: 700, color: "var(--gx-ink)", margin: "0 0 14px", letterSpacing: "-0.008em" }}>
        What GEOCON gives you
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {props.map((p) => (
          <div key={p.title} style={{
            padding: 20,
            background: "#fff",
            border: "1px solid #ece9e2",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}>
            <div style={{ fontSize: 28 }}>{p.icon}</div>
            <div style={{ fontFamily: "var(--gx-font-body)", fontSize: 14, fontWeight: 700, color: "var(--gx-ink)" }}>
              {p.title}
            </div>
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.55, margin: 0, flex: 1 }}>
              {p.copy}
            </p>
            <Link href={p.href} style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#C2611A",
              textDecoration: "none",
              letterSpacing: 0.4,
              marginTop: 4,
            }}>
              {p.link} →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function Audiences() {
  const items = [
    { tag: "Researchers",          copy: "Find the threat status, distribution, metabolite profile, and active programs for any geophyte you study." },
    { tag: "Botanic gardens",      copy: "Show your collections, accreditation, and the species you steward — and surface to teams looking to collaborate." },
    { tag: "Conservation NGOs",    copy: "Run multi-org programs with clear milestones, audit trail, and a notification surface that brings the right people in." },
    { tag: "Biotech ventures",     copy: "Spot characterised metabolites with IP signals, link them to source species, and open calls when you need a partner." },
  ];
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, fontWeight: 700, color: "var(--gx-ink)", margin: "0 0 14px", letterSpacing: "-0.008em" }}>
        Built for everyone touching endemic flora
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {items.map((it) => (
          <div key={it.tag} style={{
            padding: 16,
            background: "linear-gradient(140deg, #fafaf7 0%, #fff 100%)",
            border: "1px solid #ece9e2",
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#085041", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
              {it.tag}
            </div>
            <p style={{ fontSize: 12, color: "#444", lineHeight: 1.55, margin: 0 }}>
              {it.copy}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA({ signedIn }) {
  return (
    <section style={{
      marginTop: 32,
      padding: "32px 28px",
      borderRadius: 14,
      background: "linear-gradient(135deg, #1a0d2e 0%, #2a1240 100%)",
      color: "#FFE6BC",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "#FFD79B", fontWeight: 600 }}>
        Ready when you are
      </div>
      <h2 style={{
        fontFamily: STRONG_DISPLAY,
        fontWeight: 900,
        fontSize: "clamp(28px, 4vw, 44px)",
        margin: "10px 0 8px",
        letterSpacing: -1,
      }}>
        {signedIn ? "Pick up where you left off" : "Step into the atlas"}
      </h2>
      <p style={{ fontSize: 13, color: "rgba(255,215,155,0.75)", margin: "0 auto", maxWidth: 540 }}>
        {signedIn
          ? "Your watch list, programs, and inbound proposals are all on the home dashboard."
          : "Browsing is free and signed-in members get a personalised home, watch list, and proposal inbox."}
      </p>
      <div style={{ display: "inline-flex", gap: 10, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href={signedIn ? "/geocon" : "/geocon/explore"}
          style={{
            padding: "11px 22px",
            fontWeight: 700,
            fontSize: 13,
            color: "#1a0d2e",
            background: GEOCON_GRADIENT,
            borderRadius: 10,
            textDecoration: "none",
            letterSpacing: 0.4,
          }}
        >
          {signedIn ? "🏠 Home dashboard" : "🌍 Explore the globe"} →
        </Link>
        {!signedIn && (
          <Link href="/" style={{
            padding: "11px 22px",
            fontWeight: 600,
            fontSize: 13,
            color: "#FFE6BC",
            background: "transparent",
            border: "1px solid rgba(245,166,35,0.35)",
            borderRadius: 10,
            textDecoration: "none",
            letterSpacing: 0.4,
          }}>
            Sign in
          </Link>
        )}
      </div>
    </section>
  );
}

// ─── Manifesto: what GEOCON is / what it is NOT ─────────────
function Manifesto() {
  return (
    <section style={{ marginTop: 36 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <span className="gx-section-eyebrow">Manifesto</span>
        <h2 className="gx-display" style={{ fontSize: 32, marginTop: 6 }}>
          What GEOCON is — and isn't
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
        <div style={manifestoCard("var(--gx-success)")}>
          <div className="gx-overline" style={{ color: "var(--gx-success)" }}>What it IS</div>
          <ul style={manifestoList}>
            <li>A research-only atlas of endemic geophytes</li>
            <li>A citation registry for commercialization outcomes</li>
            <li>A program graph linking species → people → institutions</li>
            <li>An open Brief board for capability-matched collaboration</li>
            <li>An impact attribution system across 5 currencies × 3 buckets</li>
          </ul>
        </div>
        <div style={manifestoCard("var(--gx-danger)")}>
          <div className="gx-overline" style={{ color: "var(--gx-danger)" }}>What it is NOT</div>
          <ul style={manifestoList}>
            <li>Not a marketplace — GEOCON holds no funds</li>
            <li>Not a patent owner — IP stays with member organizations</li>
            <li>Not a broker — commerce happens off-platform under member legal structure</li>
            <li>Not a sales channel — no product listings, no commissions</li>
            <li>Not a closed walled garden — public attribution is the point</li>
          </ul>
        </div>
      </div>
      <p style={{
        marginTop: 18, textAlign: "center", maxWidth: 720, marginInline: "auto",
        fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
        fontSize: 15, lineHeight: 1.6, color: "rgba(243,232,211,0.85)",
      }}>
        This structural boundary is why GEOCON stays compatible with IUCN's
        non-commercial mission. Commerce belongs to member organizations;
        recognition stays with the atlas.
      </p>
    </section>
  );
}

const manifestoCard = (accent) => ({
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderLeft: `4px solid ${accent}`,
  borderRadius: 14,
  padding: "22px 26px",
});

const manifestoList = {
  marginTop: 12, paddingLeft: 18, color: "rgba(243,232,211,0.92)",
  fontFamily: "var(--gx-font-body)", fontSize: 14, lineHeight: 1.85,
};

// ─── 5-Layer architecture ──────────────────────────────────
function LayersExplainer() {
  const layers = [
    { n: 1, name: "Species Commons",  desc: "Open taxonomy + IUCN status + atlas footprint.", tint: "#1D9E75" },
    { n: 2, name: "Programs",         desc: "Multi-year work packages around one or more species. Members + pathway + member agreements.", tint: "#534AB7" },
    { n: 3, name: "Studies",          desc: "Publications, protocols, contributions — attached to programs OR standalone.", tint: "#185FA5" },
    { n: 4, name: "Open Briefs",      desc: "Research demand signals: capability, partner, urgency, scope. Not commerce.", tint: "#BA7517" },
    { n: 5, name: "Commercialization Recognition", desc: "Citation-only outcomes (products, patents, licenses) credited back to contributors.", tint: "#D85A30" },
  ];
  return (
    <section style={{ marginTop: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <span className="gx-section-eyebrow">Architecture</span>
        <h2 className="gx-display" style={{ fontSize: 32, marginTop: 6 }}>
          Five layers, one atlas
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {layers.map((L) => (
          <div key={L.n} style={{
            padding: 18,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: 14, right: 14,
              fontSize: 36, fontWeight: 800, color: L.tint,
              fontFamily: "var(--gx-font-display)",
              letterSpacing: -1, opacity: 0.45, lineHeight: 1,
            }}>
              0{L.n}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase",
              color: L.tint, marginBottom: 6,
            }}>
              Layer {L.n}
            </div>
            <div style={{
              fontFamily: "var(--gx-font-display)", fontSize: 18, fontWeight: 700,
              color: "rgba(255,255,255,0.95)", marginBottom: 6, lineHeight: 1.25,
            }}>
              {L.name}
            </div>
            <div style={{
              fontSize: 12, color: "rgba(243,232,211,0.82)",
              lineHeight: 1.55,
            }}>
              {L.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── IUCN compliance principles ────────────────────────────
function IucnCompliance() {
  const principles = [
    "No money columns anywhere in GEOCON's schema.",
    "No patents filed in GEOCON's name — outcomes credit the launching org.",
    "No product listings, no commissions, no escrow.",
    "Public attribution is the only commerce: recognition stays attached to contributors.",
    "Member organizations operate under their own legal + ethics frameworks.",
  ];
  return (
    <section style={{ marginTop: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <span className="gx-section-eyebrow" style={{ color: "#FFD15C" }}>IUCN Compatibility</span>
        <h2 className="gx-display" style={{ fontSize: 32, marginTop: 6 }}>
          Structural, not promised
        </h2>
        <p style={{
          maxWidth: 640, marginInline: "auto", marginTop: 10,
          fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
          fontSize: 15, lineHeight: 1.6, color: "rgba(243,232,211,0.82)",
        }}>
          GEOCON's compliance with conservation principles is enforced by
          architecture — not by trust statements. The five guarantees below
          are baked into the database itself.
        </p>
      </div>
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255, 209, 92, 0.18)",
        borderRadius: 14,
        padding: "22px 28px",
        maxWidth: 720, marginInline: "auto",
      }}>
        {principles.map((p, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            paddingBottom: i < principles.length - 1 ? 12 : 0,
            marginBottom: i < principles.length - 1 ? 12 : 0,
            borderBottom: i < principles.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              background: "rgba(15, 110, 86, 0.35)", color: "#A5DBC3",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontSize: 11, fontWeight: 800, marginTop: 1,
            }}>
              ✓
            </span>
            <span style={{
              fontFamily: "var(--gx-font-body)", fontSize: 14, lineHeight: 1.55,
              color: "rgba(243,232,211,0.92)",
            }}>
              {p}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
