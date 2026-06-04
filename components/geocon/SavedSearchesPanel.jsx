"use client";
// v5.2-d — Saved searches management panel.
//
// Mounts on /geocon/profile. Lists every saved search the user has
// created via SaveSearchButton. Each row: name + query + last_count
// + active toggle + delete + "preview now" button (runs the search
// immediately and shows match count).

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2, Pause, Play, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";

export default function SavedSearchesPanel() {
  const { user } = useAuthContext();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [previews, setPreviews] = useState({});

  async function load() {
    setLoading(true);
    const { data } = await supabase.rpc("list_my_saved_searches");
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function toggle(id) {
    setBusyId(id);
    try {
      await supabase.rpc("toggle_saved_search", { p_id: id });
      load();
    } finally { setBusyId(null); }
  }

  async function remove(id) {
    if (!confirm("Bu kayıtlı aramayı sil?")) return;
    setBusyId(id);
    try {
      await supabase.rpc("delete_my_saved_search", { p_id: id });
      load();
    } finally { setBusyId(null); }
  }

  async function preview(id) {
    setBusyId(id);
    try {
      const { data } = await supabase.rpc("run_saved_search", { p_id: id });
      setPreviews((p) => ({ ...p, [id]: data }));
    } catch (e) {
      toast.error("Preview başarısız", { detail: e?.message });
    } finally { setBusyId(null); }
  }

  if (!user) return null;

  return (
    <section style={{
      marginTop: 14, padding: "var(--gx-card-pad)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
    }}>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        flexWrap: "wrap", gap: 8, marginBottom: 10,
      }}>
        <div>
          <div className="gx-overline">Notifications</div>
          <h2 style={{
            fontFamily: "var(--gx-font-display)",
            fontSize: 18, fontWeight: 700, color: "var(--gx-ink)",
            margin: 0, display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <Bookmark size={15} strokeWidth={1.85} style={{ color: "var(--gx-accent-violet)" }} />
            Saved searches
          </h2>
        </div>
        <span style={{ fontSize: 11, color: "var(--gx-ink-muted)" }}>
          {rows.length} kayıtlı
        </span>
      </div>

      <p style={{ fontSize: 11, color: "var(--gx-ink-muted)", lineHeight: 1.55, margin: "0 0 12px 0" }}>
        Yeni eşleşmeler için haftalık özet emaili alırsın (Pazartesi sabahı).
        Email bir yere düşmüyorsa Resend env'i ve junk klasörünü kontrol et.
      </p>

      {loading ? (
        <div className="gx-skeleton" style={{ height: 60 }} />
      ) : rows.length === 0 ? (
        <div style={{
          padding: 18, textAlign: "center",
          background: "var(--gx-surface-2)",
          border: "1px dashed var(--gx-border-soft)",
          borderRadius: 8,
          fontSize: 12, color: "var(--gx-ink-muted)", fontStyle: "italic",
        }}>
          Henüz kayıtlı arama yok. <Link href="/geocon/search" style={{ color: "var(--gx-accent-azure)", fontWeight: 600, textDecoration: "none" }}>Search</Link>'te bir sorgu yap → "Save search".
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => {
            const query = r.query_json?.q || r.name;
            const prev = previews[r.id];
            return (
              <li key={r.id} style={{
                padding: 11,
                background: "var(--gx-surface-2)",
                border: "1px solid var(--gx-border-soft)",
                borderRadius: 9,
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <Link href={`/geocon/search?q=${encodeURIComponent(query)}`}
                    style={{
                      fontFamily: "var(--gx-font-mono)", fontSize: 12, fontWeight: 700,
                      color: "var(--gx-ink)", textDecoration: "none",
                    }}>
                    {r.name || query}
                  </Link>
                  {!r.active && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
                      padding: "2px 7px", borderRadius: 999,
                      background: "var(--gx-warning-soft)", color: "var(--gx-warning)",
                    }}>
                      PAUSED
                    </span>
                  )}
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--gx-ink-muted)" }}>
                    {r.last_run_at
                      ? `son çalışma ${new Date(r.last_run_at).toLocaleDateString()} · ${r.last_count} match`
                      : "henüz çalışmadı"}
                  </span>
                </div>

                {prev && (
                  <div style={{
                    marginTop: 6, padding: 8,
                    background: "var(--gx-surface)",
                    border: "1px solid var(--gx-border-soft)",
                    borderRadius: 7,
                    fontSize: 11, color: "var(--gx-ink-soft)",
                  }}>
                    <strong>{prev.matches}</strong> match · {(prev.species || []).length} species, {(prev.publications || []).length} pubs
                  </div>
                )}

                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={() => preview(r.id)} disabled={busyId === r.id}
                    style={smallBtn}>
                    <RefreshCw size={10} strokeWidth={2.2} /> Preview now
                  </button>
                  <a href={`/geocon/search?q=${encodeURIComponent(query)}`}
                    style={smallBtn}>
                    <ExternalLink size={10} strokeWidth={2.2} /> Open
                  </a>
                  <button onClick={() => toggle(r.id)} disabled={busyId === r.id}
                    style={smallBtn}>
                    {r.active ? <Pause size={10} strokeWidth={2.2} /> : <Play size={10} strokeWidth={2.2} />}
                    {r.active ? "Pause" : "Resume"}
                  </button>
                  <button onClick={() => remove(r.id)} disabled={busyId === r.id}
                    style={{ ...smallBtn, color: "var(--gx-danger)", marginLeft: "auto" }}>
                    <Trash2 size={10} strokeWidth={2.2} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const smallBtn = {
  display: "inline-flex", alignItems: "center", gap: 4,
  fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
  padding: "5px 10px",
  background: "transparent", color: "var(--gx-ink-soft)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 6, cursor: "pointer",
  textDecoration: "none",
};
