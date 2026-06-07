"use client";
// IA v2 — Home intent router.
//
// The home page's first screen is now a "what do you want to do?"
// router with three lanes mapped to the three personas:
//   Discover (explore) · Work (run) · Field (field)
// Each lane has 3 inline quick-actions so a field researcher reaches
// the notebook in one tap and a project runner reaches Programs in one
// tap — no wandering through 24 tabs.
//
// The lane matching the user's resolved persona is highlighted and
// pulled to the front ("suggested for you"). Persona = explicit
// onboarding choice if set, else inferred from behaviour
// (get_my_persona).

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass, Briefcase, MapPin, ArrowRight,
  Leaf, Globe2, Sparkles, Inbox, ShieldCheck,
  Radio, Calendar,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const LANES = [
  {
    key: "explore", title: "Discover", icon: Compass,
    blurb: "Türleri ara, globe'da gez, karşılaştır",
    tint: "var(--gx-accent-azure)",
    actions: [
      { href: "/geocon/species", label: "Atlas", icon: Leaf },
      { href: "/geocon/explore", label: "Explore", icon: Globe2 },
      { href: "/geocon/ask",     label: "Ask", icon: Sparkles },
    ],
  },
  {
    key: "run", title: "Work", icon: Briefcase,
    blurb: "Program aç, teklif ver, çıktı & rapor ekle",
    tint: "var(--gx-accent-violet)",
    actions: [
      { href: "/geocon/programs",     label: "Programs", icon: Briefcase },
      { href: "/geocon/proposals/new", label: "New proposal", icon: Inbox },
      { href: "/geocon/iucn",         label: "IUCN Hub", icon: ShieldCheck },
    ],
  },
  {
    key: "field", title: "Field", icon: MapPin,
    blurb: "GPS gözlem, ses notu, fotoğrafla tanıma",
    tint: "var(--gx-success)",
    actions: [
      { href: "/geocon/field",    label: "New observation", icon: MapPin },
      { href: "/geocon/observe",  label: "Live feed", icon: Radio },
      { href: "/geocon/calendar", label: "Calendar", icon: Calendar },
    ],
  },
];

export default function IntentRouter() {
  const { user } = useAuthContext();
  const [persona, setPersona] = useState(null);
  const [source, setSource] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_my_persona");
      if (!cancelled && data) {
        setPersona(data.persona || "explore");
        setSource(data.source || null);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Order lanes: persona lane first, then the rest in canonical order.
  const ordered = [...LANES].sort((a, b) => {
    if (a.key === persona) return -1;
    if (b.key === persona) return 1;
    return 0;
  });

  return (
    <section style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <h2 style={{
          fontFamily: "var(--gx-font-display)", fontSize: 16, fontWeight: 700,
          color: "var(--gx-ink)", margin: 0, letterSpacing: "-0.01em",
        }}>
          Ne yapmak istiyorsun?
        </h2>
        {persona && source && (
          <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
            {source === "chosen" ? "tercihine göre" : "geçmişine göre"} düzenlendi
          </span>
        )}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 10,
      }}>
        {ordered.map((lane) => (
          <Lane key={lane.key} lane={lane} suggested={lane.key === persona} />
        ))}
      </div>
    </section>
  );
}

function Lane({ lane, suggested }) {
  const Icon = lane.icon;
  return (
    <div style={{
      position: "relative",
      padding: 14, borderRadius: 12,
      background: suggested
        ? `linear-gradient(150deg, color-mix(in srgb, ${lane.tint} 10%, var(--gx-card-bg)) 0%, var(--gx-card-bg) 70%)`
        : "var(--gx-card-bg)",
      border: `1px solid ${suggested ? `color-mix(in srgb, ${lane.tint} 38%, transparent)` : "var(--gx-card-border)"}`,
    }}>
      {suggested && (
        <span style={{
          position: "absolute", top: 10, right: 10,
          fontSize: 8, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
          padding: "2px 7px", borderRadius: 999,
          background: lane.tint, color: "#fff",
        }}>
          Senin için
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <Icon size={17} strokeWidth={1.9} style={{ color: lane.tint }} />
        <h3 style={{
          fontFamily: "var(--gx-font-display)", fontSize: 15, fontWeight: 700,
          color: "var(--gx-ink)", margin: 0,
        }}>
          {lane.title}
        </h3>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--gx-ink-muted)", lineHeight: 1.45, margin: "0 0 11px 0" }}>
        {lane.blurb}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {lane.actions.map((a) => {
          const AIcon = a.icon;
          return (
            <Link key={a.href} href={a.href}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "6px 11px", borderRadius: 8,
                background: suggested ? lane.tint : "var(--gx-surface-2)",
                color: suggested ? "#fff" : "var(--gx-ink)",
                border: suggested ? "none" : "1px solid var(--gx-border-soft)",
                fontSize: 11, fontWeight: 700, textDecoration: "none",
              }}>
              <AIcon size={11} strokeWidth={2.1} />
              {a.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
