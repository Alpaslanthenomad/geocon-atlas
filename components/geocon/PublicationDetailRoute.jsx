"use client";
// /geocon/publications/[id]

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { SkeletonStack } from "../shared";

export default function PublicationDetailRoute({ publicationId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_publication_detail", { p_id: publicationId });
      if (cancelled) return;
      if (!error) setData(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [publicationId]);

  if (loading) return <Loading />;
  if (!data?.publication) return <NotFound />;

  const p = data.publication;
  const sp = data.species;
  const mets = data.metabolites || [];

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <Link href="/geocon/publications" style={{ fontSize: 11, color: "#888", textDecoration: "none" }}>← Publications</Link>
      </div>

      <section style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 12, padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap", marginBottom: 8 }}>
          {p.year && <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: "#f4f3ef", color: "#444", fontWeight: 700 }}>{p.year}</span>}
          {p.open_access && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "#FCE89B", color: "#85651A", fontWeight: 700 }}>🔓 Open access</span>}
          {p.category && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "#EEEDFE", color: "#534AB7", fontWeight: 700 }}>{p.category}</span>}
          {p.primary_topic && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "#E6F1FB", color: "#185FA5", fontWeight: 600 }}>{p.primary_topic}</span>}
        </div>

        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 24, fontWeight: 700, color: "#2c2c2a", margin: 0, lineHeight: 1.3 }}>
          {p.title || "(untitled)"}
        </h1>

        <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          {p.authors}
          {p.journal && <> · <em>{p.journal}</em></>}
          {typeof p.cited_by_count === "number" && p.cited_by_count > 0 && <> · {p.cited_by_count} citations</>}
          {typeof p.impact_factor === "number" && <> · IF {p.impact_factor}</>}
        </div>

        {sp && (
          <div style={{ marginTop: 12 }}>
            <Link href={`/geocon/species/${sp.id}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontStyle: "italic", fontFamily: "var(--gx-font-serif)", color: "#0a4a3e", fontWeight: 700, textDecoration: "none", fontSize: 13 }}>
              🌿 {sp.accepted_name}
              {sp.family && <span style={{ fontStyle: "normal", color: "#888", fontSize: 11, fontWeight: 400 }}> · {sp.family}</span>}
            </Link>
          </div>
        )}

        {(p.doi || p.openalex_id || p.pubmed_id || p.s2_paper_id) && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f0eee8", fontSize: 11, color: "#666", display: "flex", gap: 14, flexWrap: "wrap" }}>
            {p.doi && <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: "#185FA5", textDecoration: "none" }}>doi.org/{p.doi} ↗</a>}
            {p.openalex_id && <a href={p.openalex_id.startsWith("http") ? p.openalex_id : `https://openalex.org/${p.openalex_id}`} target="_blank" rel="noopener noreferrer" style={{ color: "#185FA5", textDecoration: "none" }}>OpenAlex ↗</a>}
            {p.pubmed_id && <a href={`https://pubmed.ncbi.nlm.nih.gov/${p.pubmed_id}`} target="_blank" rel="noopener noreferrer" style={{ color: "#185FA5", textDecoration: "none" }}>PubMed ↗</a>}
            {p.s2_paper_id && <a href={`https://www.semanticscholar.org/paper/${p.s2_paper_id}`} target="_blank" rel="noopener noreferrer" style={{ color: "#185FA5", textDecoration: "none" }}>Semantic Scholar ↗</a>}
          </div>
        )}

        {p.s2_tldr && (
          <div style={{ marginTop: 14, padding: 12, background: "#fafaf7", border: "1px solid #ece9e2", borderRadius: 8, fontSize: 12, color: "#444", lineHeight: 1.55 }}>
            <strong style={{ color: "#534AB7" }}>TL;DR:</strong> {p.s2_tldr}
          </div>
        )}

        {(p.abstract_text || p.abstract) && (
          <details style={{ marginTop: 14 }}>
            <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>
              Abstract
            </summary>
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 12, color: "#444", lineHeight: 1.6 }}>
              {p.abstract_text || p.abstract}
            </p>
          </details>
        )}

        {p.key_findings && (
          <div style={{ marginTop: 14, padding: 12, background: "#E1F5EE", borderRadius: 8, fontSize: 12, color: "#085041" }}>
            <strong>Key findings:</strong> {p.key_findings}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 18, fontWeight: 700, color: "#2c2c2a", margin: "0 0 10px" }}>
          Metabolites mentioned · {mets.length}
        </h2>
        {mets.length === 0 ? (
          <div style={{ padding: 20, border: "1px dashed #ece9e2", borderRadius: 10, textAlign: "center", color: "#888", fontSize: 12 }}>
            No metabolites linked to this publication.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {mets.map((m) => (
              <Link key={m.id} href={`/geocon/metabolites/${m.id}`}
                style={{ display: "block", padding: 12, background: "#fff", border: "1px solid #ece9e2", borderRadius: 10, textDecoration: "none", color: "inherit" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#2c2c2a", lineHeight: 1.3 }}>
                  🧪 {m.compound_name}
                </div>
                <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>
                  {m.compound_class}
                  {m.activity_category && <> · {m.activity_category}</>}
                  {m.is_primary_source && <span style={{ marginLeft: 6, padding: "1px 5px", borderRadius: 4, background: "#085041", color: "#fff", fontSize: 8, fontWeight: 700 }}>PRIMARY</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
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
  return <div style={{ padding: 60, textAlign: "center", color: "#888", fontSize: 13 }}>
    Publication not found.
    <div style={{ marginTop: 10 }}>
      <Link href="/geocon/publications" style={{ color: "#185FA5", fontSize: 11 }}>← Back</Link>
    </div>
  </div>;
}
