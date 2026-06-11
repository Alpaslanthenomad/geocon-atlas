"use client";
// v4.2-d — Inline iNaturalist Research-Grade observations panel.
//
// Mounted on SpeciesDetailRoute. Reads from inat_observations (synced
// nightly by the sync-inaturalist cron), shows up to 8 photo cards
// with observer + date + place. Each photo deep-links to the original
// iNaturalist observation, giving the contributor proper attribution.
//
// Silently empty if no observations are synced yet — the species page
// simply doesn't render the panel.

import { useEffect, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function INatObservations({ speciesId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!speciesId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("list_species_inat_observations", {
        p_species_id: speciesId, p_limit: 8,
      });
      if (!cancelled) {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [speciesId]);

  if (loading) return null;
  if (rows.length === 0) return null;

  return (
    <section style={{
      marginTop: 18,
      padding: "var(--gx-card-pad)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
        <div>
          <div className="gx-overline">Citizen science</div>
          <h2 style={{
            fontFamily: "var(--gx-font-display)",
            fontSize: 16, fontWeight: 700, color: "var(--gx-ink)",
            margin: 0,
          }}>
            Recent iNaturalist sightings
          </h2>
        </div>
        <a href={`https://www.inaturalist.org/taxa/search?q=${encodeURIComponent(rows[0]?.observer ? "" : "")}`}
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 10, color: "var(--gx-accent-azure)", textDecoration: "none", fontWeight: 600 }}>
          via iNaturalist.org
        </a>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 8,
      }}>
        {rows.map((o) => (
          <a key={o.inat_id} href={o.observation_url || "#"}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "block", borderRadius: 8, overflow: "hidden",
              background: "var(--gx-surface-2)",
              border: "1px solid var(--gx-border-soft)",
              textDecoration: "none",
              color: "inherit",
            }}>
            {o.photo_url ? (
              <img src={o.photo_url} alt={o.taxon_name || "iNat observation"}
                loading="lazy"
                style={{ display: "block", width: "100%", height: 100, objectFit: "cover" }} />
            ) : (
              <div style={{
                height: 100,
                background: "var(--gx-surface-3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--gx-ink-muted)", fontSize: 9, fontStyle: "italic",
              }}>
                no photo
              </div>
            )}
            <div style={{ padding: "6px 8px" }}>
              <div style={{
                fontSize: 10, color: "var(--gx-ink-soft)", fontWeight: 600,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                @{o.observer || "anon"}
              </div>
              <div style={{
                fontSize: 9, color: "var(--gx-ink-muted)", marginTop: 2,
                display: "flex", alignItems: "center", gap: 3,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                <MapPin size={8} strokeWidth={2} />
                {o.place_guess || (o.lat != null ? `${o.lat.toFixed(2)}, ${o.lng?.toFixed(2)}` : "—")}
              </div>
              <div style={{
                fontSize: 9, color: "var(--gx-ink-faint)", marginTop: 2,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                {o.observed_at || "—"}
                <ExternalLink size={8} strokeWidth={2} style={{ opacity: 0.6 }} />
              </div>
            </div>
          </a>
        ))}
      </div>
      <p style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 8, fontStyle: "italic" }}>
        Photos © respective observers · CC-licensed via iNaturalist.
      </p>
    </section>
  );
}
