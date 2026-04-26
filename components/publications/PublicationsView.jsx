"use client";
import { useState } from "react";
import { S } from "../../lib/constants";

const CAT_META = {
  Phytochemistry: { icon: "⚗️", color: "#534AB7", bg: "#EEEDFE", desc: "Metabolites, compounds, chemical analysis" },
  Conservation:   { icon: "🛡",  color: "#A32D2D", bg: "#FCEBEB", desc: "Threatened species, habitat, population" },
  Agronomy:       { icon: "🌾", color: "#639922", bg: "#EAF3DE", desc: "Cultivation, yield, crop production" },
  Pharmacology:   { icon: "💊", color: "#185FA5", bg: "#E6F1FB", desc: "Medical activity, therapeutic, clinical" },
  Taxonomy:       { icon: "🔬", color: "#854F0B", bg: "#FAEEDA", desc: "Systematics, phylogeny, classification" },
  Ecology:        { icon: "🌍", color: "#0F6E56", bg: "#E1F5EE", desc: "Distribution, habitat, occurrence" },
  Biotechnology:  { icon: "🧬", color: "#993556", bg: "#FBEAF0", desc: "Tissue culture, in vitro, genetic" },
  Other:          { icon: "📄", color: "#888780", bg: "#F1EFE8", desc: "Other topics" },
};

const CATS = Object.keys(CAT_META);
const PAGE_SIZE = 30;

export default function PublicationsView({ publications }) {
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);

  const catCounts = {};
  for (const cat of CATS) catCounts[cat] = publications.filter(p => p.category === cat).length;

  const catPubs = selectedCat
    ? publications.filter(p =>
        p.category === selectedCat &&
        (!search ||
          (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.authors || "").toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const totalPages = Math.ceil(catPubs.length / PAGE_SIZE);
  const paginated = catPubs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const uncategorized = publications.filter(p => !p.category).length;

  return (
    <div>
      {!selectedCat ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#2c2c2a", fontFamily: "Georgia,serif" }}>Publications</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{publications.length} publications · {CATS.length} categories</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { l: "Total",         v: publications.length,                             c: "#185FA5" },
                { l: "Open Access",   v: publications.filter(p => p.open_access).length, c: "#0F6E56" },
                { l: "With Abstract", v: publications.filter(p => p.abstract).length,    c: "#534AB7" },
              ].map(s => (
                <div key={s.l} style={{ textAlign: "center", padding: "5px 10px", background: "#f4f3ef", borderRadius: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: "#999" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
            {CATS.map(cat => {
              const m = CAT_META[cat];
              const count = catCounts[cat] || 0;
              const topPubs = publications.filter(p => p.category === cat).slice(0, 3);
              return (
                <div key={cat}
                  onClick={() => { setSelectedCat(cat); setPage(0); setSearch(""); }}
                  style={{ background: "#fff", border: "1px solid #e8e6e1", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e6e1"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ background: m.bg, padding: "14px 14px 10px", borderBottom: `1px solid ${m.color}22` }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{m.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{cat}</div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{m.desc}</div>
                  </div>
                  <div style={{ padding: "10px 14px" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#2c2c2a", marginBottom: 6 }}>{count}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {topPubs.map(p => (
                        <div key={p.id} style={{ fontSize: 9, color: "#b4b2a9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {(p.title || "").slice(0, 45)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {uncategorized > 0 && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#FAEEDA", borderRadius: 8, fontSize: 11, color: "#633806" }}>
              ⚠ {uncategorized} publications not yet categorized
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => { setSelectedCat(null); setSearch(""); }}
              style={{ padding: "6px 12px", border: "1px solid #e8e6e1", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 11, color: "#888" }}>
              ← Categories
            </button>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{CAT_META[selectedCat]?.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: CAT_META[selectedCat]?.color }}>{selectedCat}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{catPubs.length} publications</div>
              </div>
            </div>
          </div>

          <input type="text" placeholder="Search title or author..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            style={{ width: "100%", marginBottom: 12, ...S.input }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {paginated.map(p => (
              <div key={p.id}
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                style={{ background: "#fff", border: expanded === p.id ? "1px solid #85B7EB" : "1px solid #e8e6e1", borderRadius: 8, padding: "10px 12px", cursor: "pointer", borderLeft: `3px solid ${CAT_META[selectedCat]?.color || "#888"}` }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a", lineHeight: 1.4 }}>
                      {p.doi
                        ? <a href={p.doi} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "#185FA5", textDecoration: "none" }}>{(p.title || "Untitled").slice(0, 120)}</a>
                        : (p.title || "Untitled").slice(0, 120)
                      }
                    </div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>{(p.authors || "").slice(0, 80)}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end", flexShrink: 0 }}>
                    {p.year && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "#E6F1FB", color: "#0C447C" }}>{p.year}</span>}
                    {p.open_access && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "#E1F5EE", color: "#085041" }}>OA</span>}
                  </div>
                </div>
                {p.journal && <div style={{ fontSize: 10, color: "#b4b2a9", marginTop: 4, fontStyle: "italic" }}>{p.journal.slice(0, 60)}</div>}
                {expanded === p.id && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e8e6e1" }}>
                    {p.abstract
                      ? <div style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.6 }}>{p.abstract.slice(0, 500)}</div>
                      : <div style={{ fontSize: 11, color: "#b4b2a9", fontStyle: "italic" }}>
                          No abstract — {p.doi ? <a href={p.doi} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "#185FA5" }}>view paper ↗</a> : "no DOI"}
                        </div>
                    }
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <button onClick={() => setPage(0)} disabled={page === 0} style={{ ...S.input, padding: "5px 10px", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1 }}>«</button>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ ...S.input, padding: "5px 10px", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1 }}>‹</button>
              <span style={{ fontSize: 12, color: "#888", minWidth: 100, textAlign: "center" }}>Page {page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={{ ...S.input, padding: "5px 10px", cursor: page === totalPages - 1 ? "default" : "pointer", opacity: page === totalPages - 1 ? 0.4 : 1 }}>›</button>
              <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1} style={{ ...S.input, padding: "5px 10px", cursor: page === totalPages - 1 ? "default" : "pointer", opacity: page === totalPages - 1 ? 0.4 : 1 }}>»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
