"use client";
// /geocon/metabolites/[id]

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { SkeletonStack } from "../shared";

export default function MetaboliteDetailRoute({ metaboliteId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_metabolite_detail", { p_id: metaboliteId });
      if (cancelled) return;
      if (!error) setData(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [metaboliteId]);

  if (loading) return <Loading />;
  if (!data?.metabolite) return <NotFound />;

  const m = data.metabolite;
  const sp = data.species;
  const pubs = data.publications || [];

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <Link href="/geocon/metabolites" style={{ fontSize: 11, color: "var(--gx-ink-muted)", textDecoration: "none" }}>← Metabolites</Link>
      </div>

      <section style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 96, height: 96, flexShrink: 0, borderRadius: 12, background: "linear-gradient(145deg,#E1F5EE,#FCE89B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
            🧪
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 26, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
              {m.compound_name || "(unnamed)"}
            </h1>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {m.compound_class && <strong style={{ color: "#085041" }}>{m.compound_class}</strong>}
              {m.molecular_formula && <> · {m.molecular_formula}</>}
              {m.molecular_weight && <> · {m.molecular_weight} g/mol</>}
            </div>
            {sp && (
              <div style={{ marginTop: 10 }}>
                <Link href={`/geocon/species/${sp.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontStyle: "italic", fontFamily: "var(--gx-font-serif)", color: "#0a4a3e", fontWeight: 700, textDecoration: "none" }}>
                  🌿 {sp.accepted_name}
                  {sp.family && <span style={{ fontStyle: "normal", color: "var(--gx-ink-muted)", fontSize: 11, fontWeight: 400 }}> · {sp.family}</span>}
                </Link>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 18 }}>
          <Field label="Plant organ"        value={m.plant_organ} />
          <Field label="Extraction method"  value={m.extraction_method} />
          <Field label="Activity"           value={m.activity_category} />
          <Field label="Therapeutic area"   value={m.therapeutic_area} />
          <Field label="Reported activity"  value={m.reported_activity} />
          <Field label="Confidence"         value={m.confidence} />
        </div>

        {(m.cas_number || m.pubchem_cid || m.chebi_id) && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f0eee8", fontSize: 11, color: "#666", display: "flex", gap: 14, flexWrap: "wrap" }}>
            {m.cas_number && <span><strong>CAS:</strong> {m.cas_number}</span>}
            {m.pubchem_cid && <a href={`https://pubchem.ncbi.nlm.nih.gov/compound/${m.pubchem_cid}`} target="_blank" rel="noopener noreferrer" style={{ color: "#185FA5", textDecoration: "none" }}>PubChem CID {m.pubchem_cid} ↗</a>}
            {m.chebi_id && <a href={`https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${m.chebi_id}`} target="_blank" rel="noopener noreferrer" style={{ color: "#185FA5", textDecoration: "none" }}>ChEBI {m.chebi_id} ↗</a>}
          </div>
        )}

        {m.notes && (
          <p style={{ marginTop: 14, marginBottom: 0, fontSize: 12, color: "#444", lineHeight: 1.6 }}>
            {m.notes}
          </p>
        )}
      </section>

      <section>
        <h2 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 18, fontWeight: 700, color: "var(--gx-ink)", margin: "0 0 10px" }}>
          Source publications · {pubs.length}
        </h2>
        {pubs.length === 0 ? (
          <div style={{ padding: 20, border: "1px dashed var(--gx-border-soft)", borderRadius: 10, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>
            No linked publications.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pubs.map((p) => (
              <Link key={p.id} href={`/geocon/publications/${p.id}`}
                style={{ display: "block", padding: 12, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 10, textDecoration: "none", color: "inherit" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)", lineHeight: 1.3 }}>
                  {p.title || "(untitled)"}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>
                  {p.authors}{p.year && ` · ${p.year}`}{p.journal && ` · ${p.journal}`}
                  {p.is_primary_source && <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 4, background: "#085041", color: "#fff", fontSize: 9, fontWeight: 700 }}>PRIMARY</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ padding: 10, background: "var(--gx-surface-2)", borderRadius: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "var(--gx-ink-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: "var(--gx-ink)" }}>{value}</div>
    </div>
  );
}

function Loading()  {
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: 16 }}>
      <SkeletonStack rows={3} />
    </div>
  );
}
function NotFound() {
  return <div style={{ padding: 60, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 13 }}>
    Metabolite not found.
    <div style={{ marginTop: 10 }}>
      <Link href="/geocon/metabolites" style={{ color: "#185FA5", fontSize: 11 }}>← Back</Link>
    </div>
  </div>;
}
