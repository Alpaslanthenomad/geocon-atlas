"use client";
// /geocon/specimens — atlas-wide herbarium specimen browser.
//
// Reads list_all_specimens (public RPC) and surfaces every catalogued
// physical specimen in the platform. Filter chips for institution
// and country are derived from the loaded rows so they always match
// the corpus. A text search narrows by species name / institution /
// barcode / collector — purely client-side for the current scale.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, Building2, Calendar, Search } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { flag } from "../../lib/atlas/format";
import { EmptyState } from "../shared";
import FilterBar from "../shared/FilterBar";

export default function SpecimensRoute() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState(null);
  const [country, setCountry] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("list_all_specimens", {
        p_limit: 1000, p_offset: 0,
      });
      if (cancelled) return;
      if (!error) setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const institutions = useMemo(() => {
    const set = new Map();
    for (const r of rows) {
      const key = r.institution_code || r.institution_name;
      if (!key) continue;
      if (!set.has(key)) {
        set.set(key, { key, label: r.institution_name || r.institution_code });
      }
    }
    return Array.from(set.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const countries = useMemo(() => {
    const set = new Set();
    for (const r of rows) {
      if (r.country) set.add(r.country);
    }
    return Array.from(set).sort().map((c) => ({
      key: c,
      label: `${flag(c) || ""} ${c}`.trim(),
    }));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (institution) {
        const ikey = r.institution_code || r.institution_name;
        if (ikey !== institution) return false;
      }
      if (country && r.country !== country) return false;
      if (q) {
        const hay = [
          r.species_name, r.institution_name, r.institution_code,
          r.barcode, r.collector, r.country,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, institution, country, query]);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <div className="gx-overline" style={{ marginBottom: 4 }}>Commons</div>
        <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          Specimens
          <span style={{ fontSize: 13, color: "var(--gx-ink-muted)", fontWeight: 400, fontFamily: "var(--gx-font-mono)" }}>
            {loading ? "…" : `${filtered.length}${filtered.length !== rows.length ? ` / ${rows.length}` : ""}`}
          </span>
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 720 }}>
          Atlas içindeki fiziksel herbaryum kayıtları. Kurum, ülke veya
          tür adıyla daralt; bir species sayfasından "Request access"
          ile holder kurumla iletişime geç.
        </p>

        <div style={{
          marginTop: 14,
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        }}>
          <div style={{
            position: "relative", flex: "0 1 320px",
            display: "flex", alignItems: "center",
          }}>
            <Search size={13} strokeWidth={1.85}
              style={{ position: "absolute", left: 10, color: "var(--gx-ink-faint)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search species, barcode, collector…"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "7px 10px 7px 30px",
                fontSize: 12,
                background: "var(--gx-surface)",
                color: "var(--gx-ink)",
                border: "1px solid var(--gx-border-soft)",
                borderRadius: 7,
                fontFamily: "var(--gx-font-body)",
              }}
            />
          </div>
        </div>

        {institutions.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--gx-ink-faint)", marginBottom: 5 }}>
              Institution
            </div>
            <FilterBar
              allLabel="All institutions"
              value={institution}
              onChange={setInstitution}
              options={institutions}
            />
          </div>
        )}

        {countries.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--gx-ink-faint)", marginBottom: 5 }}>
              Country
            </div>
            <FilterBar
              allLabel="All countries"
              value={country}
              onChange={setCountry}
              options={countries}
            />
          </div>
        )}
      </header>

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="○"
          title="No specimens catalogued yet"
          hint="Atlas'a henüz fiziksel herbaryum kaydı eklenmedi. Kurumlar holdings'lerini onboard ettikçe burada listelenecek."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="○"
          title="No specimens match these filters"
          hint="Filtreleri temizleyip tekrar dene."
          cta={{
            label: "Clear filters",
            onClick: () => { setInstitution(null); setCountry(null); setQuery(""); },
          }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((r) => <SpecimenCard key={r.id} row={r} />)}
        </div>
      )}
    </div>
  );
}

function SpecimenCard({ row }) {
  return (
    <article style={{
      padding: "var(--gx-card-pad-sm)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        flexShrink: 0,
        width: 36, height: 36, borderRadius: 8,
        background: "color-mix(in srgb, var(--gx-accent-violet) 14%, transparent)",
        color: "var(--gx-accent-violet)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Boxes size={16} strokeWidth={1.85} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          {row.species_id ? (
            <Link
              href={`/geocon/species/${encodeURIComponent(row.species_id)}`}
              style={{
                fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
                fontSize: 14, fontWeight: 700, color: "var(--gx-ink)",
                textDecoration: "none",
              }}
            >
              {row.species_name || row.species_id}
            </Link>
          ) : (
            <span style={{
              fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
              fontSize: 14, fontWeight: 700, color: "var(--gx-ink-soft)",
            }}>
              {row.species_name || "(unlinked species)"}
            </span>
          )}
          {row.institution_code && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              padding: "2px 7px", borderRadius: 999,
              background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)",
              fontFamily: "var(--gx-font-mono)",
            }}>
              {row.institution_code}
            </span>
          )}
        </div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 11, color: "var(--gx-ink-muted)" }}>
          {row.institution_name && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Building2 size={10} strokeWidth={1.85} />
              {row.institution_name}
            </span>
          )}
          {row.barcode && (
            <span style={{ fontFamily: "var(--gx-font-mono)", color: "var(--gx-ink-soft)" }}>
              {row.barcode}
            </span>
          )}
          {row.collected_at && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Calendar size={10} strokeWidth={1.85} />
              {new Date(row.collected_at).toLocaleDateString()}
            </span>
          )}
          {row.country && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>{flag(row.country) || "🌐"}</span>
              {row.country}
            </span>
          )}
          {row.collector && (
            <span style={{ fontStyle: "italic" }}>leg. {row.collector}</span>
          )}
        </div>
      </div>

      {row.species_id && (
        <Link
          href={`/geocon/species/${encodeURIComponent(row.species_id)}`}
          style={{
            flexShrink: 0,
            fontSize: 11, fontWeight: 700,
            padding: "7px 12px", borderRadius: 7,
            background: "var(--gx-surface)",
            color: "var(--gx-accent-violet)",
            border: "1px solid var(--gx-border-soft)",
            textDecoration: "none",
          }}
        >
          View species →
        </Link>
      )}
    </article>
  );
}
