"use client";
// THE BOOK: the work-desk — the researcher's portfolio of POSITIONS (species x work-area),
// in the locked language (green brand + a mini radial per card). Data: get_my_positions.

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { AREA_BY_KEY } from "../../lib/atlas/workAreas";

const R = 20;
const CIRC = 2 * Math.PI * R;

function MiniRing({ fill, color }) {
  const vis = Math.max(0, Math.min(1, (fill || 0) / 100)) * CIRC;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx="26" cy="26" r={R} fill="none" stroke="var(--gx-border-soft)" strokeWidth="5" />
      <circle cx="26" cy="26" r={R} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${vis.toFixed(1)} ${CIRC.toFixed(1)}`} transform="rotate(-90 26 26)" />
      <text x="26" y="30" textAnchor="middle" fontSize="13" fill="var(--gx-ink)">{fill}</text>
    </svg>
  );
}

export default function WorkDesk() {
  const { user } = useAuthContext();
  const [rows, setRows] = useState(null);

  function load() {
    if (!user) return;
    supabase.rpc("get_my_positions")
      .then(({ data }) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  }
  useEffect(load, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  async function remove(id) {
    try { await supabase.rpc("remove_position", { p_id: id }); load(); } catch (e) { /* noop */ }
  }

  async function toggleStatus(p) {
    try { await supabase.rpc("set_position_status", { p_id: p.id, p_status: p.status === "active" ? "passive" : "active" }); load(); } catch (e) { /* noop */ }
  }

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: "#0F6E56", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#9FE1CB", fontSize: 13 }}>✿</span>
        <h2 style={{ margin: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 19, color: "var(--gx-ink)" }}>Çalışma masam</h2>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--gx-ink-soft)", margin: "0 0 14px" }}>Üstünde çalıştığın bitkiler — her biri bir tür × bir çalışma alanı.</p>

      {rows === null ? (
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)" }}>Yükleniyor…</div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "var(--gx-ink-muted)", padding: "14px 16px", background: "var(--gx-surface-1)", border: "1px dashed var(--gx-border-soft)", borderRadius: 12 }}>
          Henüz pozisyon almadın. Bir tür sayfasının üst kısmında <strong style={{ fontWeight: 600 }}>"pozisyon al"</strong> diyerek başla — seçtiğin çalışma alanı buraya gelir.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(255px, 1fr))", gap: 12 }}>
          {rows.map((p) => {
            const area = AREA_BY_KEY[p.area_key] || { label: p.area_key, color: "#888780" };
            return (
              <div key={p.id} style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: "0.95rem 1.05rem", display: "flex", gap: 13, alignItems: "center" }}>
                <MiniRing fill={p.fill} color={area.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    <Link href={`/geocon/species/${p.species_id}`} style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontSize: 14.5, color: "var(--gx-ink)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</Link>
                    <span style={{ fontSize: 10, color: area.color, background: "var(--gx-surface-2)", padding: "1px 7px", borderRadius: 999, flexShrink: 0 }}>{area.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gx-ink-faint)", display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => toggleStatus(p)} title="aktif/pasif değiştir"
                      style={{ fontSize: 10, fontWeight: 600, padding: "1px 8px", borderRadius: 999, cursor: "pointer",
                               border: "1px solid var(--gx-border-soft)",
                               background: p.status === "active" ? "#E1F5EE" : "var(--gx-surface-2)",
                               color: p.status === "active" ? "#0F6E56" : "var(--gx-ink-soft)" }}>
                      {p.status === "active" ? "aktif" : "pasif"}
                    </button>
                    {p.family ? <span>· {p.family}</span> : null}
                  </div>
                </div>
                <button onClick={() => remove(p.id)} aria-label="Kaldır" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gx-ink-faint)", padding: 2 }}><X size={14} strokeWidth={2} /></button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
