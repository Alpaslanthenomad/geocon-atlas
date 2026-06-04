"use client";
// V4.2-a — Pl@ntNet identify widget for Field Notebook.
//
// Inline panel mounted inside FieldRoute. Lets the user pick (or
// capture on mobile) up to 5 photos, POSTs them to /api/plantnet/identify
// and renders the top candidate list with a one-tap "Use this species"
// button that fills in the parent form's pickedSpecies. When a candidate
// already exists in GEOCON, the row links directly to /geocon/species/<id>.

import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, X, Sparkles, ArrowRight } from "lucide-react";

export default function PlantnetIdentify({ onPick }) {
  const fileRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [candidates, setCandidates] = useState(null);

  function add(e) {
    setError(null);
    const picked = Array.from(e.target.files || []).slice(0, 5);
    setFiles(picked);
    setCandidates(null);
  }

  async function identify() {
    if (!files.length) return;
    setRunning(true);
    setError(null);
    try {
      const form = new FormData();
      for (const f of files) form.append("images", f);
      const r = await fetch("/api/plantnet/identify", { method: "POST", body: form });
      const json = await r.json();
      if (!r.ok) {
        throw new Error(json?.hint || json?.error || `HTTP ${r.status}`);
      }
      setCandidates(Array.isArray(json.candidates) ? json.candidates : []);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setFiles([]);
    setCandidates(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div style={{
      marginTop: 8, padding: 10,
      background: "var(--gx-surface-2)",
      border: "1px dashed color-mix(in srgb, var(--gx-accent-violet) 28%, transparent)",
      borderRadius: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Sparkles size={11} strokeWidth={2.2} style={{ color: "var(--gx-accent-violet)" }} />
        <strong style={{ fontSize: 11, color: "var(--gx-ink-soft)", letterSpacing: 0.4 }}>
          Identify with a photo (Pl@ntNet)
        </strong>
      </div>

      {/* Picker / preview row */}
      {files.length === 0 ? (
        <label htmlFor="plantnet-file"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 7,
            background: "var(--gx-accent-violet)", color: "#fff",
            fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
            cursor: "pointer",
          }}>
          <Camera size={11} strokeWidth={2.2} />
          Pick / take photo
        </label>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {files.map((f, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 8px", borderRadius: 999,
              background: "var(--gx-surface-3)", color: "var(--gx-ink-soft)",
              fontSize: 10, fontFamily: "var(--gx-font-mono)",
            }}>
              <ImageIcon size={9} strokeWidth={2} /> {f.name.slice(0, 18)}{f.name.length > 18 ? "…" : ""}
            </span>
          ))}
          <button onClick={reset}
            style={{
              fontSize: 10, padding: "3px 8px",
              background: "transparent", color: "var(--gx-ink-muted)",
              border: "1px solid var(--gx-border-soft)",
              borderRadius: 999, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 3,
            }}>
            <X size={9} strokeWidth={2.2} /> reset
          </button>
        </div>
      )}
      <input ref={fileRef} id="plantnet-file"
        type="file" accept="image/*" capture="environment" multiple
        onChange={add}
        style={{ display: "none" }} />

      {files.length > 0 && !candidates && (
        <button onClick={identify} disabled={running}
          style={{
            marginTop: 8, padding: "7px 14px", borderRadius: 7,
            background: "var(--gx-success)", color: "#fff",
            fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
            border: "none", cursor: "pointer",
            opacity: running ? 0.6 : 1,
          }}>
          {running ? "Identifying…" : "Identify"}
        </button>
      )}

      {error && (
        <div style={{
          marginTop: 8, padding: 8,
          background: "var(--gx-danger-soft)", color: "var(--gx-danger)",
          borderRadius: 7, fontSize: 11, lineHeight: 1.5,
        }}>
          {error}
        </div>
      )}

      {Array.isArray(candidates) && candidates.length === 0 && (
        <div style={{
          marginTop: 8, fontSize: 11, color: "var(--gx-ink-muted)", fontStyle: "italic",
        }}>
          No confident match. Use the search field above to pick manually.
        </div>
      )}

      {Array.isArray(candidates) && candidates.length > 0 && (
        <ul style={{
          listStyle: "none", padding: 0, margin: "10px 0 0 0",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          {candidates.map((c, i) => {
            const pct = c.score != null ? Math.round(c.score * 100) : null;
            return (
              <li key={i} style={{
                padding: "8px 10px",
                background: "var(--gx-surface)",
                border: "1px solid var(--gx-border-soft)",
                borderRadius: 7,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{
                  fontFamily: "var(--gx-font-mono)", fontSize: 11, fontWeight: 700,
                  color: pct >= 60 ? "var(--gx-success)" : pct >= 30 ? "var(--gx-warning)" : "var(--gx-ink-muted)",
                  minWidth: 36,
                }}>
                  {pct != null ? `${pct}%` : "—"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
                    fontSize: 12, fontWeight: 700, color: "var(--gx-ink)",
                  }}>
                    {c.scientific_name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 1 }}>
                    {c.family}{c.common_names?.length ? ` · ${c.common_names[0]}` : ""}
                    {c.geocon_iucn && (
                      <span style={{ marginLeft: 6, fontFamily: "var(--gx-font-mono)", color: "var(--gx-accent-violet)" }}>
                        IUCN {c.geocon_iucn}
                      </span>
                    )}
                  </div>
                </div>
                {c.geocon_id ? (
                  <button onClick={() => onPick && onPick({ id: c.geocon_id, accepted_name: c.scientific_name })}
                    style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
                      padding: "5px 10px", borderRadius: 6,
                      background: "var(--gx-success)", color: "#fff",
                      border: "none", cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                    Use <ArrowRight size={10} strokeWidth={2.4} />
                  </button>
                ) : (
                  <span style={{
                    fontSize: 9, color: "var(--gx-ink-muted)", fontStyle: "italic",
                  }}>
                    (not in atlas)
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
