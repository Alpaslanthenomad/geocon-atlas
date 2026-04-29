"use client";

import { useState, useEffect, useMemo } from "react";
import {
  fetchResearcherById,
  fetchResearcherPublications,
  fetchResearcherSpecies,
  fetchResearcherProgramMemberships,
  fetchResearcherAuthority,
  fetchResearcherContributions,
} from "../../lib/researchers";

const TABS = ["authority", "programs", "publications", "species", "contributions"];

const CONTRIBUTION_TYPE_META = {
  evidence:         { color: "#185FA5", bg: "#E6F1FB", label: "Evidence" },
  protocol:         { color: "#0F6E56", bg: "#E1F5EE", label: "Protocol" },
  analysis:         { color: "#534AB7", bg: "#EEEDFE", label: "Analysis" },
  fieldwork:        { color: "#3B6D11", bg: "#EAF3DE", label: "Fieldwork" },
  lab_work:         { color: "#993556", bg: "#FBEAF0", label: "Lab work" },
  governance:       { color: "#854F0B", bg: "#FAEEDA", label: "Governance" },
  mentorship:       { color: "#5F5E5A", bg: "#F1EFE8", label: "Mentorship" },
  curation:         { color: "#0C447C", bg: "#E6F1FB", label: "Curation" },
  review:           { color: "#444441", bg: "#F1EFE8", label: "Review" },
  program_creation: { color: "#085041", bg: "#E1F5EE", label: "Program creation" },
  other:            { color: "#5F5E5A", bg: "#F1EFE8", label: "Other" },
};

const STATUS_META = {
  verified:  { color: "#085041", bg: "#E1F5EE", label: "Verified" },
  pending:   { color: "#854F0B", bg: "#FAEEDA", label: "Pending" },
  disputed:  { color: "#A32D2D", bg: "#FCEBEB", label: "Disputed" },
  rejected:  { color: "#888780", bg: "#F1EFE8", label: "Rejected" },
  archived:  { color: "#888780", bg: "#F1EFE8", label: "Archived" },
};

export default function ResearcherDetailPanel({ researcherId, onClose, onOpenProgram, onOpenSpecies, breadcrumb }) {
  const [researcher, setResearcher] = useState(null);
  const [publications, setPublications] = useState([]);
  const [species, setSpecies] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [authority, setAuthority] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("authority");

  useEffect(() => {
    if (!researcherId) return;
    let mounted = true;
    setLoading(true);
    setTab("authority");

    Promise.all([
      fetchResearcherById(researcherId),
      fetchResearcherPublications(researcherId),
      fetchResearcherSpecies(researcherId),
      fetchResearcherProgramMemberships(researcherId),
      fetchResearcherAuthority(researcherId),
      fetchResearcherContributions(researcherId),
    ])
      .then(([r, p, s, m, a, c]) => {
        if (!mounted) return;
        setResearcher(r);
        setPublications(Array.isArray(p) ? p : []);
        setSpecies(Array.isArray(s) ? s : []);
        setMemberships(Array.isArray(m) ? m : []);
        setAuthority(Array.isArray(a) ? a : []);
        setContributions(Array.isArray(c) ? c : []);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [researcherId]);

  // Birleşik authority skoru — tüm programların ortalaması
  const aggregateAuthority = useMemo(() => {
    if (authority.length === 0) return null;
    const totalAuth = authority.reduce((sum, a) => sum + (parseFloat(a.authority_score) || 0), 0);
    const totalContribs = authority.reduce((sum, a) => sum + (parseInt(a.contribution_count) || 0), 0);
    const totalVerified = authority.reduce((sum, a) => sum + (parseInt(a.verified_count) || 0), 0);
    return {
      avg: totalAuth / authority.length,
      programs: authority.length,
      contributions: totalContribs,
      verified: totalVerified,
    };
  }, [authority]);

  if (!researcherId) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 201, display: "flex", flexDirection: "column", background: "#f8f7f4" }}>

        {/* ── Gradient Header ── */}
        <div style={{ background: "linear-gradient(150deg, #3C3489 0%, #534AB7 65%, #7F77DD 100%)", flexShrink: 0 }}>
          <div style={{ padding: "16px 24px 0" }}>
            {/* Back + breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <button
                onClick={onClose}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6, padding: "5px 12px", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >
                {breadcrumb ? `← ${breadcrumb}` : "← Close"}
              </button>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                Researcher · GEOCON network
              </span>
            </div>

            {/* Identity */}
            {loading ? (
              <div style={{ padding: "20px 0 28px", color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Loading…</div>
            ) : researcher ? (
              <>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingBottom: 16 }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                      {researcher.id}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "Georgia,serif", lineHeight: 1.2 }}>
                      {researcher.name}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.85)" }}>
                      {researcher.institution && <span>{researcher.institution}</span>}
                      {researcher.country && <span>· {researcher.country}</span>}
                      {researcher.expertise_area && <span>· {researcher.expertise_area}</span>}
                    </div>
                  </div>

                  {/* Hero metric: aggregate authority */}
                  {aggregateAuthority && (
                    <div style={{ textAlign: "right", color: "#fff" }}>
                      <div style={{ fontSize: 38, fontWeight: 700, fontFamily: "Georgia,serif", lineHeight: 1 }}>
                        {aggregateAuthority.avg.toFixed(0)}
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 2 }}>
                        Avg authority · {aggregateAuthority.programs} {aggregateAuthority.programs === 1 ? "program" : "programs"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Metric strip */}
                <div style={{ display: "flex", gap: 18, paddingBottom: 12, fontSize: 11, color: "rgba(255,255,255,0.85)", flexWrap: "wrap" }}>
                  {researcher.h_index != null && (
                    <span><strong style={{ color: "#fff" }}>h-index</strong> {researcher.h_index}</span>
                  )}
                  {researcher.publications_count != null && (
                    <span><strong style={{ color: "#fff" }}>Publications (total)</strong> {researcher.publications_count}</span>
                  )}
                  <span><strong style={{ color: "#fff" }}>In GEOCON</strong> {publications.length} pub · {species.length} species · {memberships.length} program membership{memberships.length === 1 ? "" : "s"}</span>
                  {contributions.length > 0 && (
                    <span><strong style={{ color: "#fff" }}>Contributions</strong> {contributions.length}</span>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: "20px 0 28px", color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                Researcher not found.
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        {!loading && researcher && (
          <div style={{ display: "flex", padding: "0 20px", background: "#fff", borderBottom: "1px solid #e8e6e1", flexShrink: 0, overflowX: "auto" }}>
            {TABS.map((t) => {
              const counts = {
                authority: authority.length,
                programs: memberships.length,
                publications: publications.length,
                species: species.length,
                contributions: contributions.length,
              };
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flexShrink: 0, padding: "10px 16px", border: "none",
                    borderBottom: tab === t ? "2px solid #534AB7" : "2px solid transparent",
                    background: "none", cursor: "pointer", fontSize: 11,
                    fontWeight: tab === t ? 600 : 400,
                    color: tab === t ? "#534AB7" : "#888",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                  {counts[t] > 0 && (
                    <span style={{ marginLeft: 4, fontSize: 9, padding: "1px 5px", borderRadius: 99, background: "#EEEDFE", color: "#3C3489" }}>
                      {counts[t]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#999" }}>Loading…</div>
          ) : !researcher ? (
            <div style={{ textAlign: "center", padding: 40, color: "#999" }}>Researcher data unavailable.</div>
          ) : (
            <>
              {/* AUTHORITY TAB */}
              {tab === "authority" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {authority.length === 0 ? (
                    <EmptyHint text="No verified contributions in any GEOCON program yet." />
                  ) : (
                    <>
                      <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700, marginBottom: 4 }}>
                        Authority by program
                      </div>
                      {authority.map((row) => {
                        const score = parseFloat(row.authority_score) || 0;
                        return (
                          <div
                            key={row.program_id}
                            onClick={() => onOpenProgram?.({ id: row.program_id, program_name: row.program_name })}
                            style={{ padding: "12px 14px", background: "#fff", borderRadius: 12, border: "1px solid #e8e6e1", cursor: onOpenProgram ? "pointer" : "default", transition: "border-color 0.15s" }}
                            onMouseEnter={(e) => onOpenProgram && (e.currentTarget.style.borderColor = "#534AB7")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e8e6e1")}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, gap: 12 }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {row.program_name}
                                </div>
                                <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                                  {row.verified_count} verified · {row.contribution_count} total contribution{row.contribution_count === 1 ? "" : "s"}
                                </div>
                              </div>
                              <div style={{ fontSize: 22, fontWeight: 700, color: "#534AB7", fontFamily: "Georgia,serif" }}>
                                {score.toFixed(0)}
                              </div>
                            </div>
                            <div style={{ height: 4, background: "#f4f3ef", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                              <div style={{ height: "100%", width: `${Math.min(100, score)}%`, background: "linear-gradient(90deg, #7F77DD, #3C3489)" }} />
                            </div>
                            <div style={{ display: "flex", gap: 12, fontSize: 9, color: "#888", flexWrap: "wrap" }}>
                              <span><strong style={{ color: "#5f5e5a" }}>Contribution</strong> {row.avg_contribution || "—"}</span>
                              <span><strong style={{ color: "#5f5e5a" }}>Impact</strong> {row.avg_impact || "—"}</span>
                              <span><strong style={{ color: "#5f5e5a" }}>Reliability</strong> {row.avg_reliability || "—"}</span>
                              <span><strong style={{ color: "#5f5e5a" }}>Relevance</strong> {row.avg_relevance || "—"}</span>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ fontSize: 9, color: "#b4b2a9", lineHeight: 1.5, paddingTop: 4 }}>
                        Authority = 0.30·Contribution + 0.30·Impact + 0.25·Reliability + 0.15·Relevance · only verified contributions count
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* PROGRAMS TAB */}
              {tab === "programs" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {memberships.length === 0 ? (
                    <EmptyHint text="Not yet a member of any GEOCON program." />
                  ) : (
                    memberships.map((m, i) => (
                      <div
                        key={m.programs?.id || i}
                        onClick={() => m.programs?.id && onOpenProgram?.(m.programs)}
                        style={{ padding: "12px 14px", background: "#fff", borderRadius: 10, border: "1px solid #e8e6e1", cursor: onOpenProgram ? "pointer" : "default", transition: "border-color 0.15s" }}
                        onMouseEnter={(e) => onOpenProgram && (e.currentTarget.style.borderColor = "#534AB7")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e8e6e1")}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {m.programs?.program_name || "Unknown program"}
                            </div>
                            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                              {m.programs?.current_module && <span>{m.programs.current_module}</span>}
                              {m.programs?.current_gate && <span> / {m.programs.current_gate}</span>}
                              {m.programs?.species?.accepted_name && <span> · <em>{m.programs.species.accepted_name}</em></span>}
                            </div>
                          </div>
                          <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 99, background: m.role === "owner" || m.role === "co-owner" ? "#1D9E75" : "#EEEDFE", color: m.role === "owner" || m.role === "co-owner" ? "#fff" : "#3C3489", fontWeight: 700, flexShrink: 0, textTransform: "uppercase", letterSpacing: 0.3 }}>
                            {m.role}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* PUBLICATIONS TAB */}
              {tab === "publications" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {publications.length === 0 ? (
                    <EmptyHint text="No publications linked to this researcher in GEOCON." />
                  ) : (
                    publications.map((pr, i) => {
                      const p = pr.publications;
                      if (!p) return null;
                      return (
                        <div key={p.id || i} style={{ padding: "10px 12px", background: "#fff", borderRadius: 8, border: "1px solid #e8e6e1", borderLeft: p.is_curated ? "3px solid #1D9E75" : "1px solid #e8e6e1" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a", lineHeight: 1.4, flex: 1 }}>
                              {p.doi
                                ? <a href={p.doi.startsWith("http") ? p.doi : `https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: "#185FA5", textDecoration: "none" }}>{p.title || "Untitled"}</a>
                                : (p.title || "Untitled")}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end", flexShrink: 0 }}>
                              {p.year && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "#E6F1FB", color: "#0C447C" }}>{p.year}</span>}
                              {p.is_curated && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 99, background: "#E1F5EE", color: "#085041", fontWeight: 700 }}>CURATED</span>}
                            </div>
                          </div>
                          <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>
                            {p.species?.accepted_name && (
                              <span
                                onClick={(e) => { e.stopPropagation(); p.species_id && onOpenSpecies?.({ id: p.species_id, accepted_name: p.species.accepted_name }); }}
                                style={{ color: onOpenSpecies ? "#1D9E75" : "#888", cursor: onOpenSpecies ? "pointer" : "default", fontStyle: "italic" }}
                              >
                                {p.species.accepted_name}
                              </span>
                            )}
                            {p.journal && <span> · <em>{p.journal}</em></span>}
                            {p.category && <span> · {p.category}</span>}
                          </div>
                          {pr.author_as_listed && pr.author_as_listed !== researcher.name && (
                            <div style={{ fontSize: 9, color: "#b4b2a9", marginTop: 4, fontStyle: "italic" }}>
                              Listed as: {pr.author_as_listed}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* SPECIES TAB */}
              {tab === "species" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                  {species.length === 0 ? (
                    <EmptyHint text="No species worked on by this researcher in GEOCON." />
                  ) : (
                    species.map((rs, i) => {
                      const sp = rs.species;
                      if (!sp) return null;
                      return (
                        <div
                          key={sp.id || i}
                          onClick={() => sp.id && onOpenSpecies?.(sp)}
                          style={{ padding: "10px 12px", background: "#fff", borderRadius: 10, border: "1px solid #e8e6e1", cursor: onOpenSpecies ? "pointer" : "default", display: "flex", alignItems: "center", gap: 10, transition: "border-color 0.15s" }}
                          onMouseEnter={(e) => onOpenSpecies && (e.currentTarget.style.borderColor = "#534AB7")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e8e6e1")}
                        >
                          {sp.thumbnail_url && (
                            <img src={sp.thumbnail_url} alt={sp.accepted_name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} onError={(e) => (e.target.style.display = "none")} />
                          )}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#2c2c2a", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {sp.accepted_name}
                            </div>
                            <div style={{ fontSize: 9, color: "#888", marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {sp.family && <span>{sp.family}</span>}
                              {sp.iucn_status && <span style={{ padding: "1px 6px", borderRadius: 99, background: "#f4f3ef", fontWeight: 600 }}>{sp.iucn_status}</span>}
                              {rs.role && rs.role !== "Researcher" && <span>· {rs.role}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* CONTRIBUTIONS TAB */}
              {tab === "contributions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {contributions.length === 0 ? (
                    <EmptyHint text="No contributions recorded yet for this researcher." />
                  ) : (
                    contributions.map((c) => {
                      const typeMeta   = CONTRIBUTION_TYPE_META[c.contribution_type] || CONTRIBUTION_TYPE_META.other;
                      const statusMeta = STATUS_META[c.status] || STATUS_META.pending;
                      return (
                        <div
                          key={c.id}
                          style={{ padding: "12px 14px", background: "#fcfbf9", borderRadius: 8, borderLeft: `3px solid ${typeMeta.color}`, opacity: c.status === "rejected" || c.status === "archived" ? 0.55 : 1 }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: typeMeta.bg, color: typeMeta.color, fontWeight: 700, letterSpacing: 0.3 }}>
                              {typeMeta.label}
                            </span>
                            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: statusMeta.bg, color: statusMeta.color, fontWeight: 600 }}>
                              {statusMeta.label}
                            </span>
                            {c.programs?.program_name && (
                              <span
                                onClick={() => c.program_id && onOpenProgram?.({ id: c.program_id, program_name: c.programs.program_name })}
                                style={{ fontSize: 10, color: onOpenProgram ? "#534AB7" : "#888", cursor: onOpenProgram ? "pointer" : "default", textDecoration: onOpenProgram ? "underline" : "none" }}
                              >
                                {c.programs.program_name}
                              </span>
                            )}
                            <span style={{ fontSize: 9, color: "#b4b2a9", marginLeft: "auto" }}>
                              {c.created_at ? new Date(c.created_at).toISOString().slice(0, 10) : ""}
                            </span>
                          </div>
                          {c.what_was_done && (
                            <div style={{ fontSize: 12, color: "#2c2c2a", lineHeight: 1.5, marginBottom: 6, fontWeight: 500 }}>
                              {c.what_was_done}
                            </div>
                          )}
                          {c.result_summary && (
                            <div style={{ fontSize: 10, color: "#5f5e5a", lineHeight: 1.55, fontStyle: "italic" }}>
                              → {c.result_summary}
                            </div>
                          )}
                          {(c.contribution_score != null || c.impact_score != null) && (
                            <div style={{ display: "flex", gap: 10, fontSize: 9, color: "#888", paddingTop: 6, marginTop: 6, borderTop: "0.5px dashed #e8e6e1", flexWrap: "wrap" }}>
                              {c.contribution_score != null && <span><strong style={{ color: "#5f5e5a" }}>C</strong> {c.contribution_score}</span>}
                              {c.impact_score != null && <span><strong style={{ color: "#5f5e5a" }}>I</strong> {c.impact_score}</span>}
                              {c.reliability_score != null && <span><strong style={{ color: "#5f5e5a" }}>R</strong> {c.reliability_score}</span>}
                              {c.relevance_score != null && <span><strong style={{ color: "#5f5e5a" }}>Rel</strong> {c.relevance_score}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function EmptyHint({ text }) {
  return (
    <div style={{ textAlign: "center", padding: 40, color: "#b4b2a9", fontSize: 12, fontStyle: "italic" }}>
      {text}
    </div>
  );
}
