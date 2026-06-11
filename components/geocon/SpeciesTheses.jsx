"use client";
// Theses studying this species — the species-page side of the thesis bench connect.
// A thesis declares its species_set; this surfaces those theses on the species page
// (active research, alongside Programs). Public-safe fields only.

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { supabase } from "../../lib/supabase";

const LEVEL_LABEL = { phd: "PhD", masters: "MSc", msc: "MSc", undergrad: "Lisans", postdoc: "Postdoc" };

export default function SpeciesTheses({ speciesId }) {
  const [theses, setTheses] = useState([]);

  useEffect(() => {
    let cancelled = false;
    if (!speciesId) return;
    supabase.rpc("list_theses_for_species", { p_species_id: speciesId })
      .then(({ data }) => { if (!cancelled) setTheses(Array.isArray(data) ? data : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [speciesId]);

  if (!theses.length) return null;

  return (
    <section style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
        <GraduationCap size={15} strokeWidth={2.1} style={{ color: "var(--gx-accent-violet)" }} />
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--gx-ink)" }}>Theses · {theses.length}</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {theses.map((t) => (
          <Link key={t.id} href={`/geocon/thesis/${t.id}`}
            style={{ display: "block", padding: "10px 12px", background: "var(--gx-surface-2)",
                     border: "1px solid var(--gx-border-soft)", borderRadius: 8, textDecoration: "none" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gx-ink)", marginBottom: 3 }}>
              {t.title || "Untitled thesis"}
            </div>
            <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {t.institution && <span>{t.institution}</span>}
              {t.level && <span>· {LEVEL_LABEL[String(t.level).toLowerCase()] || t.level}</span>}
              {t.status && <span>· {t.status}</span>}
              {t.species_count > 1 && <span>· {t.species_count} tür</span>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
