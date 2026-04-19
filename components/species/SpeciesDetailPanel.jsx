"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { FAMILY_COLORS, DEF_FAM } from "../../lib/constants";
import { iucnC, iucnBg, flag, riskColor, riskBg } from "../../lib/helpers";

export default function SpeciesDetailPanel({ species, onClose, onStartProgram }) {
  const [pubs, setPubs] = useState([]);
  const [mets, setMets] = useState([]);
  const [cons, setCons] = useState([]);
  const [gov, setGov] = useState(null);
  const [prop, setProp] = useState([]);
  const [comm, setComm] = useState([]);
  const [locs, setLocs] = useState([]);
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("story");

  useEffect(() => {
    if (!species) return;

    let mounted = true;

    setLoading(true);
    setPubs([]);
    setMets([]);
    setCons([]);
    setGov(null);
    setProp([]);
    setComm([]);
    setLocs([]);
    setStory(null);
    setTab("story");

    Promise.all([
      supabase
        .from("publications")
        .select("id,title,authors,year,journal,doi,open_access,source,abstract")
        .eq("species_id", species.id)
        .order("year", { ascending: false })
        .limit(50),

      supabase
        .from("metabolites")
        .select("id,compound_name,compound_class,reported_activity,activity_category,evidence,confidence,therapeutic_area,plant_organ")
        .eq("species_id", species.id)
        .order("confidence", { ascending: false }),

      supabase.from("conservation").select("*").eq("species_id", species.id),
      supabase.from("governance").select("*").eq("species_id", species.id).maybeSingle(),
      supabase.from("propagation").select("*").eq("species_id", species.id),
      supabase.from("commercial").select("*").eq("species_id", species.id),
      supabase.from("locations").select("*").eq("species_id", species.id),
      supabase.from("species_stories").select("*").eq("species_id", species.id).maybeSingle(),
    ])
      .then(([pubR, metR, conR, govR, propR, commR, locR, storyR]) => {
        if (!mounted) return;

        setPubs(pubR.data || []);
        setMets(metR.data || []);
        setCons(conR.data || []);
        setGov(govR.data || null);
        setProp(propR.data || []);
        setComm(commR.data || []);
        setLocs(locR.data || []);
        setStory(storyR.data || null);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [species?.id]);

  if (!species) return null;

  const c = FAMILY_COLORS[species.family] || DEF_FAM;

  const TABS = [
    { k: "story", l: "Story" },
    { k: "pubs", l: `Publications (${pubs.length})` },
    { k: "mets", l: `Metabolites (${mets.length})` },
    { k: "cons", l: "Conservation" },
    { k: "gov", l: "Governance" },
    { k: "prop", l: "Propagation" },
    { k: "comm", l: "Commercial" },
    { k: "info", l: "Details" },
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 100,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 540,
          maxWidth: "96vw",
          background: "#fff",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          {species.photo_url && (
            <div style={{ height: 200, overflow: "hidden", position: "relative" }}>
              <img
                src={species.photo_url}
                alt={species.accepted_name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                }}
                onError={(e) => {
                  e.target.parentElement.style.display = "none";
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom,transparent 30%,rgba(0,0,0,0.7))",
                }}
              />
              <div style={{ position: "absolute", bottom: 12, left: 16, right: 40 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.7)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  {species.family}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    fontStyle: "italic",
                    color: "#fff",
                    fontFamily: "Georgia,serif",
                    lineHeight: 1.2,
                  }}
                >
                  {species.accepted_name}
                </div>
                {species.common_name && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                    {species.common_name}
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "rgba(0,0,0,0.4)",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  cursor: "pointer",
                  color: "#fff",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>

              {species.photo_credit && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 4,
                    right: 8,
                    fontSize: 8,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {species.photo_credit}
                </div>
              )}
            </div>
          )}

          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e8e6e1",
              background: c.bg,
            }}
          >
            {!species.photo_url && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 9,
                      color: c.text,
                      opacity: 0.7,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 4,
                    }}
                  >
                    {species.family}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      fontStyle: "italic",
                      color: "#2c2c2a",
                      fontFamily: "Georgia,serif",
                      lineHeight: 1.3,
                    }}
                  >
                    {species.accepted_name}
                  </div>
                  {species.common_name && (
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                      {species.common_name}
                    </div>
                  )}
                </div>

                <button
                  onClick={onClose}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 20,
                    cursor: "pointer",
                    color: "#888",
                    padding: "0 0 0 12px",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: species.photo_url ? 0 : 10 }}>
              {species.iucn_status && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: iucnBg(species.iucn_status),
                    color: iucnC(species.iucn_status),
                    border: "0.5px solid currentColor",
                  }}
                >
                  IUCN: {species.iucn_status}
                </span>
              )}

              {species.family && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: c.bg,
                    color: c.text,
                    border: `0.5px solid ${c.border}`,
                  }}
                >
                  {species.family}
                </span>
              )}

              {species.geophyte_type && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: "#f4f3ef",
                    color: "#5f5e5a",
                  }}
                >
                  {species.geophyte_type}
                </span>
              )}

              {species.country_focus && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: "#f4f3ef",
                    color: "#5f5e5a",
                  }}
                >
                  {flag(species.country_focus)}
                </span>
              )}
            </div>
          </div>
        </div>

        {(species.composite_score || species.score_conservation) && (
          <div
            style={{
              padding: "10px 20px",
              borderBottom: "1px solid #e8e6e1",
              display: "flex",
              gap: 6,
              flexShrink: 0,
            }}
          >
            {[
              { l: "Composite", v: species.composite_score, c: "#1D9E75" },
              { l: "Urgency", v: species.score_conservation, c: "#E24B4A" },
              { l: "Value", v: species.score_venture, c: "#185FA5" },
              { l: "TRL", v: species.trl_level, c: "#534AB7" },
            ].map((m) =>
              m.v ? (
                <div
                  key={m.l}
                  style={{
                    flex: 1,
                    background: "#f4f3ef",
                    borderRadius: 8,
                    padding: "6px 8px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 8, color: "#999", textTransform: "uppercase", marginBottom: 2 }}>
                    {m.l}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: m.c }}>{m.v}</div>
                </div>
              ) : null
            )}
          </div>
        )}

        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid #e8e6e1",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, color: "#888" }}>GEOCON program pathway</span>
          <button
            onClick={() => onStartProgram && onStartProgram(species)}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 8,
              background: "#1D9E75",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Start Program
          </button>
        </div>

        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e8e6e1",
            flexShrink: 0,
            overflowX: "auto",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              style={{
                flexShrink: 0,
                padding: "10px 12px",
                border: "none",
                borderBottom: tab === t.k ? "2px solid #1D9E75" : "2px solid transparent",
                background: "none",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: tab === t.k ? 600 : 400,
                color: tab === t.k ? "#1D9E75" : "#888",
                whiteSpace: "nowrap",
              }}
            >
              {t.l}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 13 }}>
              Loading...
            </div>
          ) : (
            <>
              {tab === "story" &&
                (!story ? (
                  <div style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📖</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#2c2c2a", marginBottom: 8 }}>
                      No story yet
                    </div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 16, lineHeight: 1.6 }}>
                      Generate a GEOCON story for this species using the harvest endpoint.
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#b4b2a9",
                        background: "#f8f7f4",
                        padding: "8px 14px",
                        borderRadius: 8,
                        textAlign: "left",
                      }}
                    >
                      Run:{" "}
                      <code style={{ fontSize: 10 }}>
                        /api/harvest/story?species_id={species.id}&secret=atlas2026
                      </code>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <StoryBlock
                      color="#1D9E75"
                      bg="linear-gradient(135deg,#E1F5EE,#f8fff8)"
                      border="1px solid #1D9E75"
                      label="GEOCON Perspective"
                    >
                      {story.geocon_rationale && (
                        <p style={{ fontSize: 12, color: "#2c2c2a", lineHeight: 1.7, margin: "0 0 8px" }}>
                          {story.geocon_rationale}
                        </p>
                      )}
                      {story.rescue_urgency && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#A32D2D",
                            lineHeight: 1.6,
                            padding: "8px 10px",
                            background: "#FCEBEB",
                            borderRadius: 8,
                          }}
                        >
                          <strong style={{ fontSize: 9, textTransform: "uppercase" }}>
                            Rescue urgency:{" "}
                          </strong>
                          {story.rescue_urgency}
                        </div>
                      )}
                    </StoryBlock>

                    <StoryBlock
                      color="#534AB7"
                      bg="#f8f7f4"
                      border="1px solid #e8e6e1"
                      label="Scientific narrative"
                    >
                      {story.scientific_narrative && (
                        <p style={{ fontSize: 12, color: "#2c2c2a", lineHeight: 1.7, margin: "0 0 10px" }}>
                          {story.scientific_narrative}
                        </p>
                      )}
                      {story.habitat_story && (
                        <>
                          <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", marginBottom: 4 }}>
                            Habitat
                          </div>
                          <p style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.6, margin: 0 }}>
                            {story.habitat_story}
                          </p>
                        </>
                      )}
                    </StoryBlock>

                    {story.conservation_context && (
                      <StoryBlock
                        color="#BA7517"
                        bg="#FAEEDA"
                        border="1px solid #BA7517"
                        label="Conservation context"
                      >
                        <p style={{ fontSize: 12, color: "#2c2c2a", lineHeight: 1.7, margin: 0 }}>
                          {story.conservation_context}
                        </p>
                      </StoryBlock>
                    )}

                    {story.propagation_pathway && (
                      <StoryBlock
                        color="#085041"
                        bg="#E1F5EE"
                        border="1px solid #1D9E75"
                        label="Propagation pathway"
                      >
                        <p style={{ fontSize: 12, color: "#2c2c2a", lineHeight: 1.7, margin: 0 }}>
                          {story.propagation_pathway}
                        </p>
                      </StoryBlock>
                    )}

                    <div
                      style={{
                        padding: "14px 16px",
                        background: "#f8f7f4",
                        borderRadius: 12,
                        border: "1px solid #e8e6e1",
                        borderLeft: "3px solid #185FA5",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: "#185FA5",
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                          fontWeight: 600,
                          marginBottom: 8,
                        }}
                      >
                        Commercial hypothesis{" "}
                        <span
                          style={{
                            fontSize: 8,
                            color: "#888",
                            fontWeight: 400,
                            textTransform: "none",
                          }}
                        >
                          (GEOCON internal)
                        </span>
                      </div>

                      {story.commercial_hypothesis && (
                        <p style={{ fontSize: 12, color: "#2c2c2a", lineHeight: 1.7, margin: "0 0 8px" }}>
                          {story.commercial_hypothesis}
                        </p>
                      )}

                      {story.market_narrative && (
                        <p style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.6, margin: "0 0 6px" }}>
                          <strong style={{ fontSize: 9, textTransform: "uppercase", color: "#888" }}>
                            Market:{" "}
                          </strong>
                          {story.market_narrative}
                        </p>
                      )}

                      {story.value_chain && (
                        <p style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.6, margin: 0 }}>
                          <strong style={{ fontSize: 9, textTransform: "uppercase", color: "#888" }}>
                            Value chain:{" "}
                          </strong>
                          {story.value_chain}
                        </p>
                      )}
                    </div>

                    <div style={{ fontSize: 9, color: "#b4b2a9", textAlign: "right" }}>
                      Generated by {story.generated_by || "GEOCON"} ·{" "}
                      {story.last_generated_at?.split("T")[0] || ""}
                    </div>
                  </div>
                ))}

              {tab === "pubs" &&
                (pubs.length === 0 ? (
                  <p style={{ color: "#999", fontSize: 13, textAlign: "center", padding: 20 }}>
                    No publications found
                  </p>
                ) : (
                  pubs.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        marginBottom: 10,
                        padding: "10px 12px",
                        background: "#f8f7f4",
                        borderRadius: 8,
                        borderLeft: "3px solid #378ADD",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#2c2c2a",
                          lineHeight: 1.4,
                          marginBottom: 4,
                        }}
                      >
                        {p.doi ? (
                          <a
                            href={p.doi}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#185FA5", textDecoration: "none" }}
                          >
                            {(p.title || "").slice(0, 100)}
                            {(p.title || "").length > 100 ? "..." : ""}
                          </a>
                        ) : (
                          (p.title || "").slice(0, 100)
                        )}
                      </div>

                      <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>
                        {(p.authors || "").slice(0, 60)}
                        {(p.authors || "").length > 60 ? "..." : ""}
                      </div>

                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {p.year && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 99,
                              background: "#E6F1FB",
                              color: "#0C447C",
                            }}
                          >
                            {p.year}
                          </span>
                        )}
                        {p.journal && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 99,
                              background: "#EEEDFE",
                              color: "#3C3489",
                            }}
                          >
                            {p.journal.slice(0, 25)}
                          </span>
                        )}
                        {p.open_access && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 99,
                              background: "#E1F5EE",
                              color: "#085041",
                            }}
                          >
                            OA
                          </span>
                        )}
                      </div>

                      {p.abstract && (
                        <div style={{ fontSize: 10, color: "#5f5e5a", marginTop: 6, lineHeight: 1.5 }}>
                          {p.abstract.slice(0, 200)}...
                        </div>
                      )}
                    </div>
                  ))
                ))}

              {tab === "mets" &&
                (mets.length === 0 ? (
                  <p style={{ color: "#999", fontSize: 13, textAlign: "center", padding: 20 }}>
                    No metabolites yet
                  </p>
                ) : (
                  mets.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        marginBottom: 10,
                        padding: "10px 12px",
                        background: "#f8f7f4",
                        borderRadius: 8,
                        borderLeft: "3px solid #534AB7",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", marginBottom: 4 }}>
                        {m.compound_name}
                      </div>

                      {m.reported_activity && (
                        <div style={{ fontSize: 11, color: "#5f5e5a", marginBottom: 6 }}>
                          {m.reported_activity}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {m.compound_class && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 99,
                              background: "#EEEDFE",
                              color: "#3C3489",
                            }}
                          >
                            {m.compound_class}
                          </span>
                        )}

                        {m.activity_category && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 99,
                              background: "#E1F5EE",
                              color: "#085041",
                            }}
                          >
                            {m.activity_category}
                          </span>
                        )}

                        {m.evidence && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 99,
                              background: "#FAEEDA",
                              color: "#633806",
                            }}
                          >
                            {m.evidence}
                          </span>
                        )}

                        {m.confidence && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 99,
                              background: "#f4f3ef",
                              color: "#5f5e5a",
                            }}
                          >
                            Conf: {Math.round(m.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ))}

              {tab === "cons" &&
                (cons.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 32 }}>
                    <p style={{ color: "#999", fontSize: 13 }}>No conservation assessments yet</p>
                  </div>
                ) : (
                  cons.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        marginBottom: 12,
                        padding: "12px 14px",
                        background: "#f8f7f4",
                        borderRadius: 8,
                        borderLeft: "3px solid #E24B4A",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{a.source}</div>
                        {a.status_interpreted && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 8px",
                              borderRadius: 99,
                              background: iucnBg(a.status_interpreted),
                              color: iucnC(a.status_interpreted),
                            }}
                          >
                            {a.status_interpreted}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 11 }}>
                        {a.assessment_year && (
                          <div>
                            <span style={{ color: "#b4b2a9", fontSize: 9, textTransform: "uppercase" }}>
                              Year
                            </span>
                            <div style={{ color: "#2c2c2a", fontWeight: 500 }}>{a.assessment_year}</div>
                          </div>
                        )}

                        {a.trend && (
                          <div>
                            <span style={{ color: "#b4b2a9", fontSize: 9, textTransform: "uppercase" }}>
                              Trend
                            </span>
                            <div style={{ color: "#2c2c2a", fontWeight: 500 }}>{a.trend}</div>
                          </div>
                        )}
                      </div>

                      {a.notes && (
                        <div style={{ fontSize: 10, color: "#5f5e5a", marginTop: 6, lineHeight: 1.5 }}>
                          {a.notes}
                        </div>
                      )}
                    </div>
                  ))
                ))}

              {tab === "gov" &&
                (!gov ? (
                  <div style={{ textAlign: "center", padding: 32 }}>
                    <p style={{ color: "#999", fontSize: 13 }}>No governance data yet</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div
                      style={{
                        padding: "14px 16px",
                        background: "#f8f7f4",
                        borderRadius: 8,
                        borderLeft: "3px solid #D85A30",
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
                        {[
                          { l: "Access regime", v: gov.access_regime },
                          { l: "ABS/Nagoya risk", v: gov.abs_nagoya_risk, col: true },
                          { l: "Collection sensitivity", v: gov.collection_sensitivity, col: true },
                          { l: "Public visibility", v: gov.public_visibility_level },
                        ].map(({ l, v, col }) =>
                          v ? (
                            <div key={l}>
                              <div
                                style={{
                                  fontSize: 9,
                                  color: "#b4b2a9",
                                  textTransform: "uppercase",
                                  letterSpacing: 0.4,
                                  marginBottom: 3,
                                }}
                              >
                                {l}
                              </div>

                              {col ? (
                                <span
                                  style={{
                                    fontSize: 11,
                                    padding: "2px 8px",
                                    borderRadius: 99,
                                    background: riskBg(v),
                                    color: riskColor(v),
                                    fontWeight: 600,
                                  }}
                                >
                                  {v}
                                </span>
                              ) : (
                                <div style={{ fontSize: 12, color: "#2c2c2a", fontWeight: 500 }}>{v}</div>
                              )}
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>

                    {gov.notes && (
                      <div
                        style={{
                          padding: "10px 14px",
                          background: "#f8f7f4",
                          borderRadius: 8,
                          fontSize: 11,
                          color: "#5f5e5a",
                          lineHeight: 1.6,
                        }}
                      >
                        {gov.notes}
                      </div>
                    )}
                  </div>
                ))}

              {tab === "prop" &&
                (prop.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 32 }}>
                    <p style={{ color: "#999", fontSize: 13 }}>No propagation protocols yet</p>
                  </div>
                ) : (
                  prop.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        marginBottom: 12,
                        padding: "12px 14px",
                        background: "#f8f7f4",
                        borderRadius: 8,
                        borderLeft: "3px solid #1D9E75",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a", marginBottom: 8 }}>
                        {p.protocol_type}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 11 }}>
                        {p.explant && (
                          <div>
                            <span style={{ color: "#b4b2a9", fontSize: 9, textTransform: "uppercase" }}>
                              Explant
                            </span>
                            <div style={{ color: "#2c2c2a", fontWeight: 500 }}>{p.explant}</div>
                          </div>
                        )}

                        {p.medium_or_condition && (
                          <div>
                            <span style={{ color: "#b4b2a9", fontSize: 9, textTransform: "uppercase" }}>
                              Medium
                            </span>
                            <div style={{ color: "#2c2c2a", fontWeight: 500 }}>{p.medium_or_condition}</div>
                          </div>
                        )}

                        {p.success_rate && (
                          <div>
                            <span style={{ color: "#b4b2a9", fontSize: 9, textTransform: "uppercase" }}>
                              Success rate
                            </span>
                            <div style={{ color: "#1D9E75", fontWeight: 700 }}>{p.success_rate}%</div>
                          </div>
                        )}
                      </div>

                      {p.notes && (
                        <div style={{ fontSize: 10, color: "#5f5e5a", marginTop: 8, lineHeight: 1.5 }}>
                          {p.notes}
                        </div>
                      )}
                    </div>
                  ))
                ))}

              {tab === "comm" &&
                (comm.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 32 }}>
                    <p style={{ color: "#999", fontSize: 13 }}>No commercial hypotheses yet</p>
                  </div>
                ) : (
                  comm.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        marginBottom: 12,
                        padding: "12px 14px",
                        background: "#f8f7f4",
                        borderRadius: 8,
                        borderLeft: "3px solid #185FA5",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>
                          {h.application_area}
                        </div>
                        {h.status && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "2px 8px",
                              borderRadius: 99,
                              background: h.status === "monitor" ? "#FAEEDA" : "#E1F5EE",
                              color: h.status === "monitor" ? "#633806" : "#085041",
                            }}
                          >
                            {h.status}
                          </span>
                        )}
                      </div>

                      {h.justification && (
                        <div style={{ fontSize: 11, color: "#5f5e5a", lineHeight: 1.6 }}>
                          {h.justification}
                        </div>
                      )}
                    </div>
                  ))
                ))}

              {tab === "info" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
                  {[
                    { l: "ID", v: species.id },
                    { l: "Genus", v: species.genus },
                    { l: "Family", v: species.family },
                    { l: "Geophyte type", v: species.geophyte_type },
                    { l: "Region", v: species.region },
                    { l: "Country", v: species.country_focus },
                    { l: "TC status", v: species.tc_status },
                    { l: "Decision", v: species.current_decision || species.decision },
                    { l: "Market area", v: species.market_area },
                  ].map(({ l, v }) =>
                    v ? (
                      <div key={l}>
                        <div
                          style={{
                            fontSize: 9,
                            color: "#b4b2a9",
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                          }}
                        >
                          {l}
                        </div>
                        <div style={{ fontSize: 12, color: "#2c2c2a", fontWeight: 500 }}>{v}</div>
                      </div>
                    ) : null
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

function StoryBlock({ color, bg, border, label, children }) {
  return (
    <div style={{ padding: "14px 16px", background: bg, borderRadius: 12, border }}>
      <div
        style={{
          fontSize: 9,
          color,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
