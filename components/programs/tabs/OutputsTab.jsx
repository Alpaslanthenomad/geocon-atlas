"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

/* ─────────────────────────────────────────────────────────
   OutputsTab
   - Lists publications linked to the program
   - Lists metabolites discovered/profiled (if any)
   - Placeholder for future output types (varieties, datasets, IP)

   Keeps backend touch points minimal — uses existing
   program-publication and program-metabolite link tables.
───────────────────────────────────────────────────────── */

export default function OutputsTab({ programId }) {
  const [pubs, setPubs] = useState([]);
  const [metabolites, setMetabolites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        // Real schema names: program_publications (plural). Metabolites link
        // table differs across migrations, so we use a defensive try/fallback.
        const pubReq = supabase
          .from("program_publications")
          .select("publication:publication_id(id, title, doi, year, journal, authors_text)")
          .eq("program_id", programId)
          .limit(200);

        // Fallback chain for metabolites link (table may be plural or absent)
        const metaReq = supabase
          .from("program_metabolites")
          .select("metabolite:metabolite_id(id, canonical_name, formula, monoisotopic_mass)")
          .eq("program_id", programId)
          .limit(200);

        const [pp, pm] = await Promise.all([pubReq, metaReq]);
        if (!alive) return;

        if (pp.error) {
          console.warn("[OutputsTab] publications error:", pp.error.message);
        }
        if (pm.error && pm.error.code !== "42P01") {
          // 42P01 = relation does not exist (table absent — that's fine)
          console.warn("[OutputsTab] metabolites error:", pm.error.message);
        }

        setPubs((pp.data || []).map((r) => r.publication).filter(Boolean));
        setMetabolites((pm.data || []).map((r) => r.metabolite).filter(Boolean));
      } catch (e) {
        console.warn("[OutputsTab] load error", e?.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [programId]);

  if (loading) return <div style={ph}>Loading outputs…</div>;

  const empty = pubs.length === 0 && metabolites.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {empty && (
        <div style={ph}>
          No outputs yet. Outputs accrue as the program progresses — publications, metabolite profiles, varieties, and datasets.
        </div>
      )}

      {pubs.length > 0 && (
        <section>
          <SectionHeader title="Publications" count={pubs.length} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {pubs.map((p) => (
              <div key={p.id} style={card}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
                  {p.title || "(untitled)"}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                  {p.authors_text && <span>{p.authors_text}</span>}
                  {p.year && <span> · {p.year}</span>}
                  {p.journal && <span> · {p.journal}</span>}
                </div>
                {p.doi && (
                  <a
                    href={`https://doi.org/${p.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#1D4ED8", marginTop: 4, display: "inline-block" }}
                  >
                    🔗 {p.doi}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {metabolites.length > 0 && (
        <section>
          <SectionHeader title="Metabolites" count={metabolites.length} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
            {metabolites.map((m) => (
              <div key={m.id} style={card}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
                  {m.canonical_name || "(unnamed)"}
                </div>
                {m.formula && (
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2, fontFamily: "monospace" }}>
                    {m.formula}
                  </div>
                )}
                {m.monoisotopic_mass != null && (
                  <div style={{ fontSize: 11, color: "#6B7280" }}>
                    {Number(m.monoisotopic_mass).toFixed(4)} Da
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ title, count }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 8,
      paddingBottom: 6,
      borderBottom: "1px solid #E5E7EB",
    }}>
      <h3 style={{ margin: 0, fontSize: 14, color: "#111827" }}>{title}</h3>
      {typeof count === "number" && (
        <span style={{ fontSize: 12, color: "#6B7280" }}>{count}</span>
      )}
    </div>
  );
}

const ph = {
  padding: 24,
  textAlign: "center",
  color: "#6B7280",
  background: "#F9FAFB",
  borderRadius: 8,
  fontSize: 13,
};

const card = {
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  padding: 10,
  background: "#FFFFFF",
};
