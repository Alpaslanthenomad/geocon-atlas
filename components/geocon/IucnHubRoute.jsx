"use client";
// T3.b — IUCN Assessment Hub.
//
// Workspace for preparing a Red List assessment. Lists the user's
// active assessments + lets them start a new one. Detailed editor
// (criteria checklist, rationale markdown, SIS export) lands in a
// follow-up — this is the entry point + draft persistence so the
// workflow is real.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Plus, FileText } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import { EmptyState } from "../shared";

const STATUS_META = {
  draft:       { label: "Draft",       tint: "var(--gx-ink-muted)" },
  peer_review: { label: "Peer review", tint: "var(--gx-info)" },
  submitted:   { label: "Submitted",   tint: "var(--gx-accent-violet)" },
  published:   { label: "Published",   tint: "var(--gx-success)" },
};

export default function IucnHubRoute() {
  const { user } = useAuthContext();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [speciesQ, setSpeciesQ] = useState("");
  const [speciesHits, setSpeciesHits] = useState([]);
  const [starting, setStarting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_my_iucn_assessments");
      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Liste yüklenemedi", { detail: e?.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const q = speciesQ.trim();
    if (q.length < 2) { setSpeciesHits([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("species")
        .select("id, accepted_name, family, iucn_status")
        .ilike("accepted_name", `${q}%`)
        .limit(6);
      if (!cancelled) setSpeciesHits(data || []);
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [speciesQ]);

  async function startNew(speciesId) {
    setStarting(true);
    try {
      const { data, error } = await supabase.rpc("start_iucn_assessment", { p_species_id: speciesId });
      if (error) throw error;
      toast.success("Yeni assessment başlatıldı");
      setSpeciesQ("");
      setSpeciesHits([]);
      load();
    } catch (e) {
      toast.error("Başlatılamadı", { detail: e?.message });
    } finally {
      setStarting(false);
    }
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", padding: 32, textAlign: "center",
                    background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)",
                    borderRadius: "var(--gx-card-radius)" }}>
        <ShieldCheck size={28} strokeWidth={1.5} style={{ color: "var(--gx-ink-muted)" }} />
        <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, marginTop: 10 }}>IUCN Assessment Hub</h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 8, lineHeight: 1.5 }}>
          Red List assessment hazırlamak için workspace. Giriş gerekir.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <div className="gx-overline" style={{ marginBottom: 4 }}>Workspace</div>
        <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <ShieldCheck size={22} strokeWidth={1.85} style={{ color: "var(--gx-accent-violet)" }} />
          IUCN Assessment Hub
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 720 }}>
          Red List assessment hazırla, peer reviewer'la birlikte düzenle,
          IUCN SIS-uyumlu olarak dışa aktar. Bu workspace draftlarını
          tutar — formal submission IUCN SSC üzerinden gerçekleşir.
        </p>
      </header>

      {/* New assessment */}
      <section style={{ ...cardPanel, borderTop: "3px solid var(--gx-accent-violet)" }}>
        <div className="gx-overline" style={{ marginBottom: 8 }}>Yeni assessment</div>
        <input value={speciesQ}
          onChange={(e) => setSpeciesQ(e.target.value)}
          placeholder="Species adı yaz: Allium, Crocus, Tulipa…"
          style={inputStyle} />
        {speciesHits.length > 0 && (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {speciesHits.map((s) => (
              <button key={s.id} onClick={() => startNew(s.id)} disabled={starting}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px",
                  background: "var(--gx-surface-2)",
                  border: "1px solid var(--gx-border-soft)",
                  borderRadius: 7,
                  textAlign: "left", cursor: "pointer",
                }}>
                <Plus size={13} strokeWidth={2.2} style={{ color: "var(--gx-accent-violet)" }} />
                <span style={{ flex: 1, fontFamily: "var(--gx-font-serif)", fontStyle: "italic", fontWeight: 700, color: "var(--gx-ink)" }}>
                  {s.accepted_name}
                </span>
                {s.iucn_status && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999,
                                  background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)",
                                  fontFamily: "var(--gx-font-mono)" }}>
                    Current: {s.iucn_status}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* My assessments */}
      <section style={{ ...cardPanel, marginTop: 14 }}>
        <div className="gx-overline" style={{ marginBottom: 10 }}>
          Assessment'larım · {rows.length}
        </div>
        {loading ? (
          <div className="gx-skeleton" style={{ height: 60 }} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="○"
            title="Henüz assessment yok"
            hint="Yukarıdan bir species seç → assessment workspace açılır."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((r) => {
              const m = STATUS_META[r.status] || STATUS_META.draft;
              return (
                <Link key={r.id} href={`/geocon/iucn/${r.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px",
                    background: "var(--gx-surface-2)",
                    border: "1px solid var(--gx-border-soft)",
                    borderRadius: 8, textDecoration: "none", color: "inherit",
                  }}>
                  <FileText size={14} strokeWidth={1.85} style={{ color: m.tint, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
                                    fontSize: 13, fontWeight: 700, color: "var(--gx-ink)" }}>
                      {r.accepted_name || r.species_id}
                    </span>
                    <span style={{ display: "block", fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 2 }}>
                      Son güncelleme: {new Date(r.updated_at).toLocaleString()}
                    </span>
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
                    padding: "3px 8px", borderRadius: 999,
                    background: `color-mix(in srgb, ${m.tint} 14%, transparent)`,
                    color: m.tint, fontFamily: "var(--gx-font-mono)",
                  }}>
                    {m.label}
                  </span>
                  {r.proposed_category && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: "3px 8px", borderRadius: 999,
                      background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)",
                      fontFamily: "var(--gx-font-mono)",
                    }}>
                      → {r.proposed_category}
                    </span>
                  )}
                  {/* v4.1-c — SIS JSON export (one-click, opens in new tab) */}
                  <a href={`/api/v1/iucn/${r.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Export SIS-compatible JSON"
                    style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
                      padding: "3px 8px", borderRadius: 999,
                      background: "transparent",
                      color: "var(--gx-accent-azure)",
                      border: "1px solid color-mix(in srgb, var(--gx-accent-azure) 30%, transparent)",
                      fontFamily: "var(--gx-font-mono)",
                      textDecoration: "none",
                    }}>
                    SIS .json
                  </a>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div style={{
        marginTop: 14, padding: 12,
        background: "var(--gx-info-soft)",
        border: "1px solid color-mix(in srgb, var(--gx-info) 25%, transparent)",
        borderRadius: 10, fontSize: 11, color: "var(--gx-ink-soft)", lineHeight: 1.6,
      }}>
        💡 SIS-uyumlu JSON export ve full editor (criteria checklist + rationale markdown) sonraki sürümde gelecek.
        Şu an her assessment için species_id + status + proposed_category persist ediliyor.
      </div>
    </div>
  );
}

const cardPanel = {
  padding: "var(--gx-card-pad)",
  background: "var(--gx-card-bg)",
  border: "1px solid var(--gx-card-border)",
  borderRadius: "var(--gx-card-radius)",
};
const inputStyle = {
  width: "100%", boxSizing: "border-box",
  fontSize: 14, padding: "10px 12px",
  background: "var(--gx-surface-2)", color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 8, outline: "none",
  fontFamily: "var(--gx-font-mono)",
};
