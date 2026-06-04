"use client";
// T1 (c) — Conservation calendar route.
//
// "What's happening this month with the species I watch + what's
// peaking in the atlas overall." Two columns:
//   left:  my watchlist's phenology this month
//   right: atlas-wide phenology this month (top 30 by intensity)
//
// Researcher uses this to plan field seasons — "Mart geldi, Crocus
// pestalozzae çiçekleniyor, ekibe haber ver". Mobile-friendly column
// stack.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Sprout, Flower, Cherry, Wind, Sun } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { EmptyState } from "../shared";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const STAGE_META = {
  flowering:       { Icon: Flower,  label: "Flowering",       tint: "var(--gx-accent-violet)" },
  fruiting:        { Icon: Cherry,  label: "Fruiting",        tint: "var(--gx-warning)" },
  dormancy:        { Icon: Wind,    label: "Dormancy",        tint: "var(--gx-ink-soft)" },
  germination:     { Icon: Sprout,  label: "Germination",     tint: "var(--gx-success)" },
  seed_collection: { Icon: Sun,     label: "Seed collection", tint: "var(--gx-accent-azure)" },
};

export default function CalendarRoute() {
  const { user } = useAuthContext();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [myList, setMyList] = useState([]);
  const [atlasList, setAtlasList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const calls = [supabase.rpc("phenology_by_month", { p_month: month })];
      if (user) calls.push(supabase.rpc("my_phenology_this_month", { p_month: month }));
      const results = await Promise.all(calls);
      if (cancelled) return;
      setAtlasList(Array.isArray(results[0]?.data) ? results[0].data : []);
      if (user && results[1]) setMyList(Array.isArray(results[1].data) ? results[1].data : []);
      else setMyList([]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [month, user]);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <header style={{ marginBottom: 14 }}>
        <div className="gx-overline" style={{ marginBottom: 4 }}>Tools</div>
        <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <Calendar size={22} strokeWidth={1.85} style={{ color: "var(--gx-accent-violet)" }} />
          Conservation calendar
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 720 }}>
          Yıl ekseninde her ayın çiçeklenme, tohum toplama, dormans pencerelerini gör.
          Sahanın takvimini buradan kur.
        </p>
        <div style={{
          marginTop: 12, display: "flex", gap: 4, flexWrap: "wrap",
          padding: "6px",
          background: "var(--gx-surface-2)",
          borderRadius: "var(--gx-card-radius)",
          border: "1px solid var(--gx-card-border)",
        }}>
          {MONTHS.map((m, idx) => {
            const v = idx + 1;
            const active = v === month;
            return (
              <button key={m} onClick={() => setMonth(v)}
                style={{
                  flex: 1, minWidth: 50,
                  fontSize: 11, fontWeight: active ? 700 : 600,
                  padding: "7px 4px", borderRadius: 7,
                  background: active ? "var(--gx-accent-violet)" : "transparent",
                  color: active ? "#fff" : "var(--gx-ink-soft)",
                  border: "none", cursor: "pointer",
                  letterSpacing: 0.3, fontFamily: "var(--gx-font-mono)",
                }}>
                {m}
              </button>
            );
          })}
        </div>
      </header>

      <div style={{
        display: "grid", gridTemplateColumns: user ? "1fr 1fr" : "1fr",
        gap: 14, marginTop: 8,
      }}>
        {user && (
          <Column
            title="Your watchlist · this month"
            tint="var(--gx-accent-violet)"
            loading={loading} rows={myList}
            empty="Watchlist'inde bu ay aktif fenoloji kaydı yok. Bir species'e Watch düğmesi bas, takvim seni bilgilendirsin."
          />
        )}
        <Column
          title={`Atlas-wide · ${MONTHS[month - 1]}`}
          tint="var(--gx-accent-azure)"
          loading={loading} rows={atlasList}
          empty="Bu ay için fenoloji kaydı bulunamadı."
        />
      </div>
    </div>
  );
}

function Column({ title, tint, loading, rows, empty }) {
  return (
    <section style={{
      padding: "var(--gx-card-pad)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
      borderTop: `3px solid ${tint}`,
    }}>
      <div className="gx-overline" style={{ marginBottom: 10, color: tint }}>
        {title} <span style={{ fontFamily: "var(--gx-font-mono)", color: "var(--gx-ink-muted)" }}>· {rows.length}</span>
      </div>
      {loading ? (
        <div className="gx-skeleton" style={{ height: 50 }} />
      ) : rows.length === 0 ? (
        <EmptyState icon="○" title="—" hint={empty} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((r, i) => <Row key={`${r.species_id}:${r.stage}:${i}`} row={r} />)}
        </div>
      )}
    </section>
  );
}

function Row({ row }) {
  const meta = STAGE_META[row.stage] || STAGE_META.flowering;
  const Icon = meta.Icon;
  return (
    <Link href={`/geocon/species/${encodeURIComponent(row.species_id)}`}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 10px",
        background: "var(--gx-surface-2)",
        border: "1px solid var(--gx-border-soft)",
        borderRadius: 8,
        textDecoration: "none", color: "inherit",
      }}>
      <div style={{
        flexShrink: 0,
        width: 28, height: 28, borderRadius: 7,
        background: `color-mix(in srgb, ${meta.tint} 14%, transparent)`,
        color: meta.tint,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={14} strokeWidth={1.9} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
          fontSize: 13, fontWeight: 700, color: "var(--gx-ink)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {row.accepted_name}
        </div>
        <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 2 }}>
          {meta.label}
          {row.region_code && ` · ${row.region_code}`}
          {row.family && ` · ${row.family}`}
        </div>
      </div>
      {row.intensity != null && (
        <span title={`Intensity ${row.intensity}/3`}
          style={{
            fontSize: 9, fontFamily: "var(--gx-font-mono)",
            color: meta.tint, fontWeight: 700,
          }}>
          {Array(Math.max(1, row.intensity)).fill("●").join("")}
        </span>
      )}
    </Link>
  );
}
