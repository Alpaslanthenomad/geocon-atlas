"use client";
// v5.4-a — Live observation feed.
//
// /geocon/observe — community-living view of every field observation +
// iNaturalist Research-Grade sighting as it lands in the database.
// Real-time updates via Supabase postgres_changes subscription on both
// field_observations and inat_observations. Left column: chronological
// stream. Right column: photo grid.
//
// Capture itself lives at /geocon/field (PWA-grade, offline queue,
// voice memo, Pl@ntNet ID). This route is read-only consumption.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Radio, MapPin, Camera, ExternalLink, Eye, Filter, Sparkles,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { SkeletonList } from "../shared/Skeleton";
import { IUCN_TINT as TIER_TINT } from "../../lib/iucn";

const TIERS = ["CR", "EN", "VU", "NT", "LC", "DD", "NE"];

export default function ObserveRoute() {
  const { user } = useAuthContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [familyFilter, setFamilyFilter] = useState("");
  const [tierFilter, setTierFilter] = useState([]);
  const [watchOnly, setWatchOnly] = useState(false);
  const [newBadge, setNewBadge] = useState(0);

  async function load() {
    setLoading(true);
    const { data } = await supabase.rpc("get_live_observation_feed", {
      p_limit: 30,
      p_family: familyFilter || null,
      p_iucn_tier: tierFilter.length > 0 ? tierFilter : null,
      p_my_watchlist_only: watchOnly,
    });
    setRows(Array.isArray(data) ? data : []);
    setNewBadge(0);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyFilter, tierFilter, watchOnly]);

  // Real-time subscription: bump a badge when new rows land.
  useEffect(() => {
    const ch = supabase
      .channel("observe-feed")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "field_observations" },
        () => setNewBadge((n) => n + 1))
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "inat_observations" },
        () => setNewBadge((n) => n + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const families = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => { if (r.family) set.add(r.family); });
    return Array.from(set).sort().slice(0, 12);
  }, [rows]);

  function toggleTier(t) {
    setTierFilter((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 60px" }}>
      {/* Header */}
      <header style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <div className="gx-overline">Community</div>
          {newBadge > 0 && (
            <button onClick={load}
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
                padding: "3px 9px", borderRadius: 999,
                background: "var(--gx-accent-violet)", color: "#fff",
                fontFamily: "var(--gx-font-mono)",
                border: "none", cursor: "pointer",
                animation: "gx-shimmer 1.2s ease-in-out infinite",
              }}>
              ● {newBadge} new — refresh
            </button>
          )}
        </div>
        <h1 style={{
          fontFamily: "var(--gx-font-display)",
          fontSize: 28, fontWeight: 700, color: "var(--gx-ink)",
          letterSpacing: "-0.02em", margin: "2px 0 6px 0",
          display: "inline-flex", alignItems: "center", gap: 10,
        }}>
          <Radio size={20} strokeWidth={1.85} style={{ color: "var(--gx-success)" }} />
          Live observations
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", lineHeight: 1.55, maxWidth: 580 }}>
          Sahadan ve iNaturalist'ten gelen son gözlemler. Yeni kayıtlar
          gerçek zamanlı olarak buraya düşer.{" "}
          <Link href="/geocon/field" style={{ color: "var(--gx-accent-azure)", fontWeight: 600, textDecoration: "none" }}>
            Kendi gözlemini eklemek için Field notebook'a git →
          </Link>
        </p>
      </header>

      {/* Filters */}
      <section style={{
        padding: 10, marginBottom: 14,
        background: "var(--gx-card-bg)",
        border: "1px solid var(--gx-card-border)",
        borderRadius: 10,
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        <Filter size={12} strokeWidth={2} style={{ color: "var(--gx-ink-muted)" }} />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {TIERS.map((t) => {
            const on = tierFilter.includes(t);
            return (
              <button key={t} onClick={() => toggleTier(t)}
                style={{
                  padding: "4px 9px", fontSize: 10, fontWeight: 700,
                  fontFamily: "var(--gx-font-mono)",
                  background: on ? TIER_TINT[t] : "transparent",
                  color: on ? "#1a1816" : "var(--gx-ink-soft)",
                  border: `1px solid ${on ? TIER_TINT[t] : "var(--gx-border-soft)"}`,
                  borderRadius: 999, cursor: "pointer",
                }}>
                {t}
              </button>
            );
          })}
        </div>
        {user && (
          <label style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, color: "var(--gx-ink-soft)", cursor: "pointer",
            marginLeft: "auto",
          }}>
            <input type="checkbox" checked={watchOnly}
              onChange={(e) => setWatchOnly(e.target.checked)} />
            My watchlist only
          </label>
        )}
        {families.length > 0 && (
          <select value={familyFilter} onChange={(e) => setFamilyFilter(e.target.value)}
            style={{
              padding: "4px 8px", fontSize: 11,
              background: "var(--gx-surface)", color: "var(--gx-ink)",
              border: "1px solid var(--gx-border-soft)", borderRadius: 6,
              fontFamily: "var(--gx-font-body)",
            }}>
            <option value="">All families</option>
            {families.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
      </section>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        {/* Left: list */}
        <section>
          {loading ? <SkeletonList rows={6} rowHeight={88} /> : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {rows.length === 0 ? (
                <Empty />
              ) : (
                rows.map((r) => <ObservationRow key={`${r.source}:${r.id}`} row={r} />)
              )}
            </ul>
          )}
        </section>

        {/* Right: photo grid */}
        <aside style={{
          padding: 10,
          background: "var(--gx-card-bg)",
          border: "1px solid var(--gx-card-border)",
          borderRadius: 10,
          alignSelf: "start",
          position: "sticky", top: 70,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <Camera size={11} strokeWidth={2} style={{ color: "var(--gx-ink-muted)" }} />
            <strong style={{ fontSize: 10, color: "var(--gx-ink-soft)", letterSpacing: 0.5, textTransform: "uppercase" }}>
              Recent photos
            </strong>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
            gap: 4,
          }}>
            {rows.filter((r) => r.photo_url).slice(0, 12).map((r) => (
              <a key={`p:${r.source}:${r.id}`} href={r.link}
                target={r.source === "inaturalist" ? "_blank" : undefined}
                rel={r.source === "inaturalist" ? "noopener noreferrer" : undefined}
                title={r.species_name}
                style={{ display: "block", aspectRatio: "1", overflow: "hidden", borderRadius: 6 }}>
                <img src={r.photo_url} alt={r.species_name || ""}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </a>
            ))}
            {rows.filter((r) => r.photo_url).length === 0 && (
              <div style={{
                gridColumn: "1 / -1",
                padding: 18, textAlign: "center",
                fontSize: 10, fontStyle: "italic",
                color: "var(--gx-ink-muted)",
              }}>
                Fotosuz gözlemler — sadece liste tarafında görünür.
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function ObservationRow({ row }) {
  const tint = row.iucn_status ? TIER_TINT[row.iucn_status] : null;
  const Icon = row.source === "inaturalist" ? Sparkles : Radio;
  return (
    <li style={{
      padding: 11,
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: 9,
      display: "flex", gap: 11,
    }}>
      {row.photo_url ? (
        <a href={row.link}
          target={row.source === "inaturalist" ? "_blank" : undefined}
          rel={row.source === "inaturalist" ? "noopener noreferrer" : undefined}
          style={{
            flexShrink: 0, width: 64, height: 64,
            borderRadius: 7, overflow: "hidden",
            display: "block",
          }}>
          <img src={row.photo_url} alt={row.species_name || ""}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </a>
      ) : (
        <div style={{
          flexShrink: 0, width: 64, height: 64,
          borderRadius: 7,
          background: "var(--gx-surface-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Eye size={18} strokeWidth={1.5} style={{ color: "var(--gx-ink-muted)" }} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <Icon size={9} strokeWidth={2} style={{
            color: row.source === "inaturalist" ? "var(--gx-accent-violet)" : "var(--gx-success)",
          }} />
          {row.species_id ? (
            <Link href={row.link}
              style={{
                fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
                fontSize: 13, fontWeight: 700, color: "var(--gx-ink)",
                textDecoration: "none",
              }}>
              {row.species_name || "Unknown species"}
            </Link>
          ) : (
            <span style={{
              fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
              fontSize: 13, fontWeight: 700, color: "var(--gx-ink-soft)",
            }}>
              {row.species_name || "Unidentified"}
            </span>
          )}
          {tint && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              padding: "1px 6px", borderRadius: 999,
              background: tint, color: "#1a1816",
              fontFamily: "var(--gx-font-mono)",
            }}>
              {row.iucn_status}
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--gx-ink-muted)" }}>
            {row.observed_at ? new Date(row.observed_at).toLocaleString(undefined, {
              month: "short", day: "numeric", year: "numeric",
            }) : "—"}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 3, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600 }}>@{row.observer || "anon"}</span>
          {row.family && <span>· {row.family}</span>}
          {(row.place_guess || (row.lat && row.lng)) && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
              <MapPin size={8} strokeWidth={2} />
              {row.place_guess || `${row.lat?.toFixed(2)}, ${row.lng?.toFixed(2)}`}
            </span>
          )}
          {row.source === "inaturalist" && (
            <span style={{
              padding: "1px 5px", borderRadius: 999,
              background: "color-mix(in srgb, var(--gx-accent-violet) 14%, transparent)",
              color: "var(--gx-accent-violet)", fontWeight: 700,
              fontFamily: "var(--gx-font-mono)",
            }}>
              iNat
            </span>
          )}
        </div>

        {row.notes && (
          <div style={{
            fontSize: 11, color: "var(--gx-ink-soft)", marginTop: 4,
            lineHeight: 1.45, fontStyle: "italic",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            "{row.notes}"
          </div>
        )}

        {row.source === "inaturalist" && (
          <a href={row.link} target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 10, color: "var(--gx-accent-azure)", fontWeight: 600,
              textDecoration: "none", marginTop: 4,
            }}>
            <ExternalLink size={8} strokeWidth={2.2} />
            Open on iNaturalist
          </a>
        )}
      </div>
    </li>
  );
}

function Empty() {
  return (
    <div style={{
      padding: 30, textAlign: "center",
      background: "var(--gx-surface-2)",
      border: "1px dashed var(--gx-border-soft)",
      borderRadius: 10,
      color: "var(--gx-ink-muted)", fontSize: 12, lineHeight: 1.5,
    }}>
      Filtre kriterlerine uyan gözlem yok.{" "}
      <Link href="/geocon/field" style={{ color: "var(--gx-accent-azure)", fontWeight: 600, textDecoration: "none" }}>
        Yeni bir kayıt aç →
      </Link>
    </div>
  );
}
