"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

/* ─────────────────────────────────────────────────────────
   OutputsTab (fixed for current GEOCON schema)
   - Path: components/programs/v2/tabs/ → 4 levels up to reach lib/
   - Publications: program_publications → publications (uses 'authors')
   - Metabolites: derived from program → species_id → metabolites
     (no program_metabolites table exists yet)
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
        const pubReq = supabase
          .from("program_publications")
          .select("publication:publication_id(id, title, doi, year, journal, authors)")
          .eq("program_id", programId)
          .limit(200);

        const progReq = supabase
          .from("programs")
          .select("species_id")
          .eq("id", programId)
          .maybeSingle();

        const [pp, pr] = await Promise.all([pubReq, progReq]);
        if (!alive) return;

        if (pp.error) {
          console.warn("[OutputsTab] publications error:", pp.error.message);
        }
        setPubs((pp.data || []).map((r) => r.publication).filter(Boolean));

        if (pr.data?.species_id) {
          const { data: metRows, error: metErr } = await supabase
            .from("metabolites")
            .select("id, compound_name, compound_class, cas_number, reported_activity")
            .eq("species_id", pr.data.species_id)
            .order("confidence", { ascending: false, nullsFirst: false })
            .limit(200);
          if (metErr) {
            console.warn("[OutputsTab] metabolites error:", metErr.message);
          } else if (alive) {
            setMetabolites(metRows || []);
          }
        } else {
          setMetabolites([]);
        }
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
                  {p.authors && <span>{p.authors}</span>}
                  {p.year && <span> · {p.year}</span>}
                  {p.journal && <span> · {p.journal}</span>}
                </div>
                {p.doi && (
                  <a
                    href={p.doi.startsWith("http") ? p.doi : `https://doi.org/${p.doi}`}
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
          <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 8, fontStyle: "italic" }}>
            Derived from the program's primary species
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
            {metabolites.map((m) => (
              <div key={m.id} style={card}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
                  {m.compound_name || "(unnamed)"}
                </div>
                {m.compound_class && (
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                    {m.compound_class}
                  </div>
                )}
                {m.cas_number && (
                  <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2, fontFamily: "monospace" }}>
                    CAS {m.cas_number}
                  </div>
                )}
                {m.reported_activity && (
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4, lineHeight: 1.4 }}>
                    {m.reported_activity.length > 100 ? m.reported_activity.slice(0, 100) + "…" : m.reported_activity}
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
