"use client";
// Mission-driven home feed.
//
// Reads the caller's profiles.mission_tags (set in Welcome Step 4) and
// renders one collapsible section per active mission with the briefs
// + programs that match its mapping in get_my_mission_matches RPC.
//
// Mounted on /geocon between OrcidConnectBanner and OnboardingChecklist
// — surfaces personalisation as the SECOND thing the user sees once
// they finish onboarding.
//
// Auto-hides for:
//   - signed-out viewers
//   - signed-in users without mission_tags (Welcome incomplete)
//   - the (empty) state when every section returns 0 matches

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

// Same icon/label set used in Welcome Step 4 so the feed reads as a
// follow-through of what the user picked.
const MISSION_META = {
  publish_specialty:         { icon: "📚", label: "Uzmanlık alanında yayın yapmak",          tint: "var(--gx-accent-azure)" },
  propagation_study:         { icon: "🌱", label: "Çoğaltma protokolü çalışması yürütmek", tint: "var(--gx-success)" },
  mentor_junior:             { icon: "🤝", label: "Genç bir araştırmacıya mentorluk",      tint: "var(--gx-accent-violet)" },
  multi_org_collab:          { icon: "🌐", label: "Çok-organizasyonlu işbirliği kurmak",    tint: "var(--gx-info)" },
  red_list_reassessment:     { icon: "🛡",  label: "IUCN Red List değerlendirmesine katkı", tint: "var(--gx-danger)" },
  compound_characterization: { icon: "🧪", label: "Bir bileşiği karakterize etmek",         tint: "var(--gx-accent-violet)" },
  field_survey:              { icon: "🔭", label: "Saha araştırması / herbaryum keşfi",     tint: "var(--gx-success)" },
  policy_engagement:         { icon: "⚖",  label: "Politika / koruma yönetimi tarafı",     tint: "var(--gx-warning)" },
};

const BRIEF_KIND_LABEL = {
  research_brief: "Research", capability_brief: "Capability",
  partner_brief: "Partner",   conservation_brief: "Conservation",
  production_brief: "Production", service_brief: "Service",
  idea_brief: "Idea",
};

const URGENCY_TINT = {
  urgent: "var(--gx-danger)",
  high:   "var(--gx-warning)",
  normal: "var(--gx-ink-muted)",
  low:    "var(--gx-ink-faint)",
};

export default function MyMissionFeed() {
  const { user, loading: authLoading } = useAuthContext();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) { setFetching(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data: row } = await supabase.rpc("get_my_mission_matches", { p_limit: 4 });
        if (!cancelled) setData(row || null);
      } catch (e) {
        if (!cancelled) console.warn("[MyMissionFeed]", e?.message || e);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading || fetching) return null;
  if (!user) return null;
  if (!data?.signed_in || !data?.has_tags) return null;

  const matches = Array.isArray(data.matches) ? data.matches : [];
  // Only render a section if it has at least one match
  const live = matches.filter((m) => (m.count || 0) > 0);
  if (live.length === 0) return null;

  return (
    <section style={{
      padding: "20px 22px",
      marginBottom: 22,
      background: "linear-gradient(135deg, color-mix(in srgb, var(--gx-accent-violet) 6%, var(--gx-surface)) 0%, var(--gx-surface) 60%)",
      border: "1px solid color-mix(in srgb, var(--gx-accent-violet) 25%, var(--gx-border-soft))",
      borderRadius: 14,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <div>
          <div className="gx-overline" style={{ marginBottom: 2, color: "var(--gx-accent-violet)" }}>
            Misyonuna göre
          </div>
          <h2 style={{
            fontFamily: "var(--gx-font-display)",
            fontSize: 22, fontWeight: 700, color: "var(--gx-ink)",
            margin: 0, letterSpacing: "-0.01em",
          }}>
            ✦ Senin için bugün
          </h2>
        </div>
        <Link href="/geocon/welcome" style={{
          fontSize: 11, fontWeight: 600,
          color: "var(--gx-accent-violet)",
          textDecoration: "none",
        }}>
          Misyonumu güncelle →
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {live.map((m) => {
          const meta = MISSION_META[m.tag] || { icon: "✦", label: m.tag, tint: "var(--gx-ink)" };
          return (
            <div key={m.tag} style={{
              padding: 12,
              background: "var(--gx-surface)",
              border: `1px solid color-mix(in srgb, ${meta.tint} 25%, var(--gx-border-soft))`,
              borderLeft: `3px solid ${meta.tint}`,
              borderRadius: 10,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14 }}>{meta.icon}</span>
                <span style={{
                  fontFamily: "var(--gx-font-serif)",
                  fontSize: 13, fontWeight: 700,
                  fontStyle: "italic", color: meta.tint,
                }}>
                  {meta.label}
                </span>
                <span style={{ fontSize: 10, color: "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)" }}>
                  · {m.count} match{m.count === 1 ? "" : "es"}
                </span>
              </div>

              {/* Briefs row */}
              {Array.isArray(m.briefs) && m.briefs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: m.programs?.length ? 8 : 0 }}>
                  {m.briefs.map((b) => (
                    <Link key={b.id} href={`/geocon/proposals/${b.id}`}
                      style={{
                        display: "flex", alignItems: "baseline", gap: 8,
                        padding: "7px 10px",
                        background: "var(--gx-surface-2)",
                        border: "1px solid var(--gx-border-soft)",
                        borderRadius: 7,
                        textDecoration: "none", color: "inherit",
                      }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                        textTransform: "uppercase",
                        padding: "2px 6px", borderRadius: 999,
                        background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)",
                        flexShrink: 0,
                      }}>
                        🗂 {BRIEF_KIND_LABEL[b.brief_kind] || b.brief_kind}
                      </span>
                      {b.urgency && b.urgency !== "normal" && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                          textTransform: "uppercase",
                          color: URGENCY_TINT[b.urgency] || "var(--gx-ink-muted)",
                          flexShrink: 0,
                        }}>
                          {b.urgency}
                        </span>
                      )}
                      <span style={{
                        fontSize: 12, fontWeight: 600, color: "var(--gx-ink)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        flex: 1, minWidth: 0,
                      }}>
                        {b.title || "(untitled brief)"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Programs row */}
              {Array.isArray(m.programs) && m.programs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {m.programs.map((p) => (
                    <Link key={p.id} href={`/geocon/programs/${p.id}`}
                      style={{
                        display: "flex", alignItems: "baseline", gap: 8,
                        padding: "7px 10px",
                        background: "var(--gx-surface-2)",
                        border: "1px solid var(--gx-border-soft)",
                        borderRadius: 7,
                        textDecoration: "none", color: "inherit",
                      }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                        textTransform: "uppercase",
                        padding: "2px 6px", borderRadius: 999,
                        background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)",
                        flexShrink: 0,
                      }}>
                        📋 Program
                      </span>
                      <span style={{
                        fontSize: 12, fontWeight: 600, color: "var(--gx-ink)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        flex: 1, minWidth: 0,
                      }}>
                        {p.name}
                        {p.species_name && (
                          <span style={{
                            marginLeft: 6,
                            fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
                            color: "var(--gx-ink-muted)", fontWeight: 400, fontSize: 11,
                          }}>
                            · {p.species_name}
                          </span>
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        fontSize: 10, color: "var(--gx-ink-muted)",
        marginTop: 12, fontStyle: "italic", lineHeight: 1.5,
      }}>
        Bu liste {data.tag_count} misyon etiketin ile eşleşen açık brief'ler ve programları gösterir.
        İlgilenmedikçe Welcome'dan misyon listeni güncelleyebilirsin.
      </div>
    </section>
  );
}
