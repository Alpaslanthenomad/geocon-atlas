"use client";
import { useState, useMemo } from "react";
import { S } from "../../lib/constants";

/* ── Metabolite Explorer ── 
   Veri kalitesi temizliği sonrası gerçek bağlantılar:
   - 2813 metabolit kaydı, 28 distinct compound_class
   - 5123 metabolite_publications link (624 metab × 321 pub)
*/

// Compound class color mapping — biyolojik anlamla uyumlu
const CLASS_META = {
  "Alkaloid": { color: "#534AB7", bg: "#EEEDFE", icon: "🧬" },
  "Flavonoid": { color: "#BA7517", bg: "#FAEEDA", icon: "🌼" },
  "Flavanoid": { color: "#BA7517", bg: "#FAEEDA", icon: "🌼" },
  "Phenolic acid": { color: "#854F0B", bg: "#F4E5D2", icon: "🍇" },
  "Phytohormone": { color: "#0F6E56", bg: "#E1F5EE", icon: "🌱" },
  "Terpenoid": { color: "#0F6E56", bg: "#E1F5EE", icon: "🌿" },
  "Steroid": { color: "#639922", bg: "#EAF3DE", icon: "💊" },
  "Saponin/Glycoside": { color: "#993556", bg: "#FBEAF0", icon: "🧴" },
  "Glycoside": { color: "#993556", bg: "#FBEAF0", icon: "🧴" },
  "Carotenoid": { color: "#D85A30", bg: "#FAECE7", icon: "🟠" },
  "Stilbene": { color: "#A32D2D", bg: "#FCEBEB", icon: "🍷" },
  "Fatty acid": { color: "#185FA5", bg: "#E6F1FB", icon: "🛢️" },
  "Amino acid": { color: "#185FA5", bg: "#E6F1FB", icon: "🔗" },
  "Tuliposide": { color: "#3C3489", bg: "#EEEDFE", icon: "🌷" },
  "Anthocyanin": { color: "#993556", bg: "#FBEAF0", icon: "🟣" },
  "Other secondary metabolite": { color: "#888780", bg: "#F1EFE8", icon: "⚛️" },
  "Unidentified": { color: "#b4b2a9", bg: "#F4F3EF", icon: "❓" },
};

const getClassMeta = (cls) => CLASS_META[cls] || CLASS_META["Other secondary metabolite"];

export default function MetaboliteExplorer({ metabolites = [], metabolitePublications = [], publications = [], species = [], onSpeciesClick }) {
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState(null);
  const [hasPubsOnly, setHasPubsOnly] = useState(false);
  const [expanded, setExpanded] = useState(null);

  // Index'ler — performans için useMemo
  const pubsById = useMemo(() => {
    const map = new Map();
    for (const p of publications) map.set(p.id, p);
    return map;
  }, [publications]);

  const speciesById = useMemo(() => {
    const map = new Map();
    for (const s of species) map.set(s.id, s);
    return map;
  }, [species]);

  // Metabolite ID → publication links
  const linksByMetabolite = useMemo(() => {
    const map = new Map();
    for (const link of metabolitePublications) {
      if (!map.has(link.metabolite_id)) map.set(link.metabolite_id, []);
      map.get(link.metabolite_id).push(link);
    }
    return map;
  }, [metabolitePublications]);

  // Compound name → all metabolite kayıtları (aynı compound farklı türlerde olabilir)
  const compoundGroups = useMemo(() => {
    const map = new Map();
    for (const m of metabolites) {
      const name = m.compound_name || "(unnamed)";
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(m);
    }
    return map;
  }, [metabolites]);

  // compound_name başına aggregate (UI için bir satır = bir compound)
  const compoundList = useMemo(() => {
    const list = [];
    for (const [name, metabs] of compoundGroups) {
      const speciesIds = new Set(metabs.map(m => m.species_id).filter(Boolean));
      const allLinkPubIds = new Set();
      const allLinks = [];
      let primaryCount = 0;
      for (const m of metabs) {
        const links = linksByMetabolite.get(m.id) || [];
        for (const l of links) {
          allLinkPubIds.add(l.publication_id);
          allLinks.push({ ...l, metabolite_id: m.id, species_id: m.species_id });
          if (l.is_primary_source) primaryCount++;
        }
      }
      const first = metabs[0];
      list.push({
        compound_name: name,
        compound_class: first.compound_class,
        cas_number: metabs.find(m => m.cas_number)?.cas_number || null,
        molecular_formula: metabs.find(m => m.molecular_formula)?.molecular_formula || null,
        evidence: first.evidence,
        reported_activity: metabs.find(m => m.reported_activity)?.reported_activity || null,
        therapeutic_area: metabs.find(m => m.therapeutic_area)?.therapeutic_area || null,
        plant_organ: metabs.find(m => m.plant_organ)?.plant_organ || null,
        pubchem_cid: metabs.find(m => m.pubchem_cid)?.pubchem_cid || null,
        chebi_id: metabs.find(m => m.chebi_id)?.chebi_id || null,
        species_count: speciesIds.size,
        species_ids: [...speciesIds],
        publication_count: allLinkPubIds.size,
        primary_count: primaryCount,
        all_links: allLinks,
        record_count: metabs.length,
      });
    }
    return list;
  }, [compoundGroups, linksByMetabolite]);

  // Class breakdown — sayılar
  const classBreakdown = useMemo(() => {
    const counts = new Map();
    for (const c of compoundList) {
      const cls = c.compound_class || "Unidentified";
      counts.set(cls, (counts.get(cls) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [compoundList]);

  // Üst düzey metrikler
  const totalCompounds = compoundList.length;
  const compoundsWithPubs = compoundList.filter(c => c.publication_count > 0).length;
  const totalSpeciesWithMetabs = useMemo(() => {
    const ids = new Set(metabolites.map(m => m.species_id).filter(Boolean));
    return ids.size;
  }, [metabolites]);

  // Featured: en çok yayında bahsedilen 6 compound
  const featured = useMemo(() => {
    return [...compoundList]
      .filter(c => c.publication_count > 0 && c.compound_name && !c.compound_name.startsWith("Unknown"))
      .sort((a, b) => b.publication_count - a.publication_count)
      .slice(0, 6);
  }, [compoundList]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = compoundList;
    if (filterClass) list = list.filter(c => (c.compound_class || "Unidentified") === filterClass);
    if (hasPubsOnly) list = list.filter(c => c.publication_count > 0);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        (c.compound_name || "").toLowerCase().includes(q) ||
        (c.cas_number || "").toLowerCase().includes(q) ||
        (c.compound_class || "").toLowerCase().includes(q)
      );
    }
    // Default sıralama: önce yayınlı olanlar, sonra tür sayısı
    list = [...list].sort((a, b) => {
      if ((b.publication_count > 0) !== (a.publication_count > 0)) return b.publication_count > 0 ? 1 : -1;
      if (b.publication_count !== a.publication_count) return b.publication_count - a.publication_count;
      return b.species_count - a.species_count;
    });
    return list;
  }, [compoundList, filterClass, hasPubsOnly, search]);

  // Top 8 class chip'leri
  const topClasses = classBreakdown.slice(0, 8);
  const otherClassCount = classBreakdown.slice(8).reduce((s, [, n]) => s + n, 0);

  return (
    <div>
      {/* ── HERO METRIK ŞERİDİ ── */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#2c2c2a", fontFamily: "Georgia,serif" }}>Metabolites</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            Compound discovery across {totalSpeciesWithMetabs} species · {publications.length} publications indexed
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {[
            { l: "Compounds", v: totalCompounds, c: "#534AB7" },
            { l: "With publications", v: compoundsWithPubs, c: "#0F6E56" },
            { l: "Classes", v: classBreakdown.length, c: "#185FA5" },
            { l: "Records", v: metabolites.length, c: "#888780" },
          ].map(s => (
            <div key={s.l} style={{ textAlign: "center", padding: "6px 12px", background: "#f4f3ef", borderRadius: 8, minWidth: 80 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 9, color: "#999", textTransform: "uppercase", letterSpacing: 0.4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── COMPOUND CLASS CHIP'LERİ ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          onClick={() => setFilterClass(null)}
          style={{
            padding: "6px 12px",
            background: filterClass === null ? "#2c2c2a" : "#fff",
            color: filterClass === null ? "#fff" : "#5f5e5a",
            border: "1px solid " + (filterClass === null ? "#2c2c2a" : "#e8e6e1"),
            borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}
        >
          All ({totalCompounds})
        </button>
        {topClasses.map(([cls, n]) => {
          const m = getClassMeta(cls);
          const active = filterClass === cls;
          return (
            <button
              key={cls}
              onClick={() => setFilterClass(active ? null : cls)}
              style={{
                padding: "6px 12px",
                background: active ? m.color : m.bg,
                color: active ? "#fff" : m.color,
                border: "1px solid " + (active ? m.color : m.color + "33"),
                borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <span>{m.icon}</span> {cls} <span style={{ opacity: 0.7 }}>({n})</span>
            </button>
          );
        })}
        {otherClassCount > 0 && (
          <span style={{ padding: "6px 12px", color: "#999", fontSize: 11 }}>
            +{classBreakdown.length - 8} more classes ({otherClassCount} compounds)
          </span>
        )}
      </div>

      {/* ── FEATURED — sadece filtre yokken ── */}
      {!filterClass && !search && !hasPubsOnly && featured.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, fontWeight: 600 }}>
            ★ Most studied
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
            {featured.map(c => {
              const m = getClassMeta(c.compound_class);
              return (
                <div
                  key={c.compound_name}
                  onClick={() => setSearch(c.compound_name)}
                  style={{
                    padding: "12px 14px", background: m.bg, borderRadius: 10,
                    cursor: "pointer", border: `1px solid ${m.color}33`,
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#2c2c2a", marginBottom: 3 }}>
                    {m.icon} {c.compound_name}
                  </div>
                  <div style={{ fontSize: 10, color: m.color, fontWeight: 600, marginBottom: 6 }}>
                    {c.compound_class}
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: 10, color: "#5f5e5a" }}>
                    <span><strong>{c.publication_count}</strong> pubs</span>
                    <span><strong>{c.species_count}</strong> species</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ARAMA + FİLTRE ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search compound name, CAS number, or class..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...S.input, flex: 1, minWidth: 240 }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: hasPubsOnly ? "#534AB7" : "#fff", color: hasPubsOnly ? "#fff" : "#5f5e5a", border: "1px solid " + (hasPubsOnly ? "#534AB7" : "#e8e6e1"), borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
          <input type="checkbox" checked={hasPubsOnly} onChange={e => setHasPubsOnly(e.target.checked)} style={{ display: "none" }} />
          {hasPubsOnly ? "✓" : "○"} With publications
        </label>
      </div>

      {/* ── COMPOUND LİSTESİ ── */}
      <div style={{ fontSize: 10, color: "#888", marginBottom: 8 }}>
        {filtered.length} compound{filtered.length === 1 ? "" : "s"}
        {filterClass && <> · in <strong style={{ color: getClassMeta(filterClass).color }}>{filterClass}</strong></>}
        {search && <> · matching "<strong>{search}</strong>"</>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 13, background: "#f4f3ef", borderRadius: 10 }}>
            No compounds match these filters.
          </div>
        ) : (
          filtered.slice(0, 100).map(c => {
            const m = getClassMeta(c.compound_class);
            const isExp = expanded === c.compound_name;
            return (
              <div
                key={c.compound_name}
                onClick={() => setExpanded(isExp ? null : c.compound_name)}
                style={{
                  background: "#fff",
                  border: isExp ? "1px solid " + m.color : "1px solid #e8e6e1",
                  borderLeft: `3px solid ${m.color}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                }}
              >
                {/* SATIR */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span>{c.compound_name}</span>
                      {c.cas_number && (
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "#f4f3ef", color: "#888", fontWeight: 500, fontFamily: "monospace" }}>
                          CAS {c.cas_number}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, padding: "1px 8px", borderRadius: 99, background: m.bg, color: m.color, fontWeight: 600 }}>
                        {m.icon} {c.compound_class || "Unidentified"}
                      </span>
                      <span style={{ fontSize: 10, color: "#888" }}>
                        in <strong style={{ color: "#5f5e5a" }}>{c.species_count}</strong> species
                      </span>
                      {c.publication_count > 0 && (
                        <span style={{ fontSize: 10, color: "#888" }}>
                          · <strong style={{ color: "#185FA5" }}>{c.publication_count}</strong> publications
                          {c.primary_count > 0 && (
                            <span style={{ marginLeft: 4, fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "#E1F5EE", color: "#085041", fontWeight: 600 }}>
                              {c.primary_count} primary
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "#888" }}>{isExp ? "▾" : "▸"}</span>
                </div>

                {/* AKTIVITE ÖZETI */}
                {c.reported_activity && !isExp && (
                  <div style={{ fontSize: 11, color: "#5f5e5a", marginTop: 6, lineHeight: 1.4 }}>
                    {c.reported_activity.length > 140 ? c.reported_activity.slice(0, 140) + "…" : c.reported_activity}
                  </div>
                )}

                {/* DETAY PANELI */}
                {isExp && (
                  <CompoundDetail
                    compound={c}
                    pubsById={pubsById}
                    speciesById={speciesById}
                    onSpeciesClick={onSpeciesClick}
                  />
                )}
              </div>
            );
          })
        )}
        {filtered.length > 100 && (
          <div style={{ textAlign: "center", padding: 10, fontSize: 11, color: "#888" }}>
            Showing first 100 · refine search to find specific compounds
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Compound Detail (expand altı) ── */
function CompoundDetail({ compound: c, pubsById, speciesById, onSpeciesClick }) {
  const m = getClassMeta(c.compound_class);

  // Publications: link → publication
  const pubs = (c.all_links || [])
    .map(l => ({ ...l, pub: pubsById.get(l.publication_id) }))
    .filter(x => x.pub);
  // Önce primary, sonra confidence, sonra year
  pubs.sort((a, b) => {
    if (a.is_primary_source !== b.is_primary_source) return a.is_primary_source ? -1 : 1;
    if (a.confidence !== b.confidence) return b.confidence - a.confidence;
    return (b.pub.year || 0) - (a.pub.year || 0);
  });
  // Distinct yayınlar (aynı yayın birden fazla metabolit kaydından gelebilir)
  const seen = new Set();
  const distinctPubs = pubs.filter(p => {
    if (seen.has(p.publication_id)) return false;
    seen.add(p.publication_id);
    return true;
  });

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + m.color + "33" }}>
      {/* Metadata grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "6px 14px", fontSize: 11, marginBottom: 10 }}>
        {[
          { l: "Class", v: c.compound_class },
          { l: "Plant organ", v: c.plant_organ },
          { l: "Therapeutic area", v: c.therapeutic_area },
          { l: "Evidence", v: c.evidence },
          { l: "Molecular formula", v: c.molecular_formula },
          { l: "PubChem CID", v: c.pubchem_cid, link: c.pubchem_cid ? `https://pubchem.ncbi.nlm.nih.gov/compound/${c.pubchem_cid}` : null },
          { l: "ChEBI", v: c.chebi_id, link: c.chebi_id ? `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${c.chebi_id}` : null },
          { l: "Records", v: `${c.record_count} entries` },
        ].filter(x => x.v).map(({ l, v, link }) => (
          <div key={l}>
            <div style={{ color: "#b4b2a9", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.4 }}>{l}</div>
            {link ? (
              <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                style={{ color: m.color, fontWeight: 500, textDecoration: "none", fontSize: 11 }}>
                {v} ↗
              </a>
            ) : (
              <div style={{ color: "#2c2c2a", fontWeight: 500, fontSize: 11 }}>{v}</div>
            )}
          </div>
        ))}
      </div>

      {/* Reported activity full */}
      {c.reported_activity && (
        <div style={{ padding: "8px 10px", background: m.bg, borderRadius: 6, fontSize: 11, color: "#2c2c2a", lineHeight: 1.5, marginBottom: 10 }}>
          <span style={{ fontSize: 9, color: m.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Activity </span>
          {c.reported_activity}
        </div>
      )}

      {/* Species chip'leri */}
      {c.species_ids && c.species_ids.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5, fontWeight: 600 }}>
            Found in {c.species_ids.length} species
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {c.species_ids.slice(0, 20).map(sid => {
              const sp = speciesById.get(sid);
              if (!sp) return null;
              return (
                <span
                  key={sid}
                  onClick={(e) => { e.stopPropagation(); onSpeciesClick && onSpeciesClick(sp); }}
                  style={{
                    fontSize: 10, padding: "2px 8px", background: "#fff",
                    border: "1px solid #e8e6e1", borderRadius: 99,
                    color: "#534AB7", cursor: "pointer", fontStyle: "italic",
                  }}
                >
                  {sp.accepted_name}
                </span>
              );
            })}
            {c.species_ids.length > 20 && (
              <span style={{ fontSize: 10, color: "#999", padding: "2px 8px" }}>
                +{c.species_ids.length - 20} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Publications */}
      {distinctPubs.length > 0 && (
        <div>
          <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, fontWeight: 600 }}>
            Mentioned in {distinctPubs.length} publications
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {distinctPubs.slice(0, 8).map(({ pub, confidence, is_primary_source }) => (
              <div key={pub.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "5px 0", borderBottom: "1px dashed #e8e6e1" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "#2c2c2a", lineHeight: 1.4 }}>
                    {pub.doi ? (
                      <a href={pub.doi.startsWith("http") ? pub.doi : `https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        style={{ color: "#185FA5", textDecoration: "none", fontWeight: 500 }}>
                        {(pub.title || "Untitled").slice(0, 100)}
                      </a>
                    ) : (
                      <span style={{ fontWeight: 500 }}>{(pub.title || "Untitled").slice(0, 100)}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 9, color: "#999", marginTop: 1 }}>
                    {pub.year && <>{pub.year} · </>}
                    {pub.species && <em>{pub.species.accepted_name}</em>}
                    {pub.journal && <> · {pub.journal.slice(0, 40)}</>}
                  </div>
                </div>
                <div style={{ flexShrink: 0, display: "flex", gap: 4, alignItems: "center" }}>
                  {is_primary_source && (
                    <span style={{ fontSize: 8, padding: "1px 5px", background: "#E1F5EE", color: "#085041", borderRadius: 4, fontWeight: 700 }}>
                      PRIMARY
                    </span>
                  )}
                  <span style={{ fontSize: 9, color: confidence >= 0.8 ? "#0F6E56" : confidence >= 0.6 ? "#854F0B" : "#999", fontWeight: 600 }}>
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
            {distinctPubs.length > 8 && (
              <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
                +{distinctPubs.length - 8} more publications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
