"use client";

import { useState, useRef, useCallback } from "react";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs";

const COLUMNS = [
  { key: "tur", label: "Tür (Latin)", icon: "🌿", width: "18%" },
  { key: "bolge", label: "Bölge", icon: "📍", width: "12%" },
  { key: "statu", label: "Statü", icon: "🔴", width: "10%" },
  { key: "notlar", label: "Notlar / Kaynak", icon: "📋", width: "18%" },
  { key: "ciceklenme", label: "Çiçeklenme", icon: "🌸", width: "10%" },
  { key: "habitat", label: "Habitat", icon: "🏔", width: "14%" },
  { key: "rakim", label: "Rakım", icon: "⛰", width: "9%" },
  { key: "kullanim", label: "Kullanım", icon: "🧪", width: "9%" },
];

const STATUS_COLORS = {
  CR: "#ef4444",
  EN: "#f97316",
  VU: "#eab308",
  NT: "#84cc16",
  LC: "#22c55e",
  DD: "#94a3b8",
};

function StatusBadge({ value }) {
  const upper = (value || "").toUpperCase().trim();
  const color = STATUS_COLORS[upper] || "#64748b";
  return (
    <span
      style={{
        background: color + "22",
        color,
        border: `1px solid ${color}55`,
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        fontFamily: "monospace",
      }}
    >
      {value || "—"}
    </span>
  );
}

export default function AtlasExcelUpload() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [step, setStep] = useState("idle"); // idle | parsed | uploading | done | error
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const fileRef = useRef();

  const parseFile = useCallback((f) => {
    setFile(f);
    setErrors([]);
    setUploadResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });

        const headerMap = {
          "tür (latin)": "tur",
          "tür": "tur",
          latin: "tur",
          bölge: "bolge",
          bolge: "bolge",
          "statü": "statu",
          statu: "statu",
          "notlar/kaynak": "notlar",
          "notlar / kaynak": "notlar",
          notlar: "notlar",
          kaynak: "notlar",
          "çiçeklenme": "ciceklenme",
          ciceklenme: "ciceklenme",
          habitat: "habitat",
          "rakım": "rakim",
          rakim: "rakim",
          kullanım: "kullanim",
          kullanim: "kullanim",
        };

        const errs = [];
        const parsed = raw.map((row, i) => {
          const mapped = {};
          Object.entries(row).forEach(([k, v]) => {
            const norm = k.toLowerCase().trim().replace(/\s+/g, " ");
            const dest = headerMap[norm];
            if (dest) mapped[dest] = String(v).trim();
          });
          if (!mapped.tur) errs.push(`Satır ${i + 2}: "Tür" alanı boş`);
          return { _id: i, ...mapped };
        });

        setErrors(errs);
        setRows(parsed);
        setSelectedRows(new Set(parsed.map((r) => r._id)));
        setStep("parsed");
      } catch (err) {
        setErrors(["Dosya okunamadı: " + err.message]);
        setStep("error");
      }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) parseFile(f);
    },
    [parseFile]
  );

  const onFileChange = (e) => {
    if (e.target.files[0]) parseFile(e.target.files[0]);
  };

  const toggleRow = (id) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === filtered.length)
      setSelectedRows(new Set());
    else
      setSelectedRows(new Set(filtered.map((r) => r._id)));
  };

  const handleUpload = async () => {
    setUploading(true);
    setStep("uploading");
    const payload = rows.filter((r) => selectedRows.has(r._id)).map(({ _id, ...rest }) => rest);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: payload, source: file?.name }),
      });
      const data = await res.json();
      setUploadResult(data);
      setStep(res.ok ? "done" : "error");
    } catch (err) {
      setUploadResult({ error: err.message });
      setStep("error");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setRows([]);
    setErrors([]);
    setUploadResult(null);
    setStep("idle");
    setSearch("");
    setSelectedRows(new Set());
    if (fileRef.current) fileRef.current.value = "";
  };

  const filtered = rows.filter((r) =>
    !search ||
    COLUMNS.some((c) =>
      (r[c.key] || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f0d",
      color: "#e2ede8",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      padding: 0,
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1e3329",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "linear-gradient(90deg, #0d1a14 0%, #0a0f0d 100%)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "linear-gradient(135deg, #16a34a, #4ade80)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
        }}>🌿</div>
        <div>
          <div style={{ fontSize: 13, color: "#4ade80", letterSpacing: 3, textTransform: "uppercase" }}>
            ATLAS — Admin Panel
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#f0fdf4", letterSpacing: -0.5 }}>
            Fritillaria Türleri · Excel Yükleyici
          </div>
        </div>
        {step !== "idle" && (
          <button onClick={reset} style={{
            marginLeft: "auto", background: "transparent",
            border: "1px solid #2d4a3e", color: "#86efac",
            padding: "6px 16px", borderRadius: 6, cursor: "pointer",
            fontSize: 12, letterSpacing: 1,
          }}>↺ SIFIRLA</button>
        )}
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>

        {/* STEP 1 — Drop Zone */}
        {step === "idle" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#4ade80" : "#1e3329"}`,
              borderRadius: 16,
              background: dragOver ? "#0d2a1e" : "#0d1a14",
              padding: "64px 32px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              transform: dragOver ? "scale(1.01)" : "scale(1)",
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#d1fae5", marginBottom: 8 }}>
              Excel dosyasını sürükle & bırak
            </div>
            <div style={{ fontSize: 13, color: "#4b6b5a", marginBottom: 24 }}>
              veya tıkla • .xlsx / .xls formatı • Fritillaria_Tur_Listesi.xlsx
            </div>
            <div style={{
              display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "center",
            }}>
              {COLUMNS.map((c) => (
                <span key={c.key} style={{
                  background: "#122118", border: "1px solid #1e3329",
                  borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#6b9e7a",
                }}>
                  {c.icon} {c.label}
                </span>
              ))}
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={onFileChange}
              style={{ display: "none" }} />
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div style={{
            marginTop: 16, background: "#1a0a0a", border: "1px solid #7f1d1d",
            borderRadius: 8, padding: "12px 16px",
          }}>
            <div style={{ color: "#fca5a5", fontWeight: 700, marginBottom: 6, fontSize: 12, letterSpacing: 1 }}>
              ⚠ UYARILAR ({errors.length})
            </div>
            {errors.slice(0, 5).map((e, i) => (
              <div key={i} style={{ color: "#f87171", fontSize: 12, marginBottom: 2 }}>• {e}</div>
            ))}
            {errors.length > 5 && <div style={{ color: "#6b7280", fontSize: 11 }}>+{errors.length - 5} daha...</div>}
          </div>
        )}

        {/* STEP 2 — Preview */}
        {(step === "parsed" || step === "uploading") && rows.length > 0 && (
          <>
            {/* Stats Bar */}
            <div style={{
              display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center",
            }}>
              <div style={{
                background: "#0d2a1e", border: "1px solid #1e3329",
                borderRadius: 8, padding: "8px 16px",
                display: "flex", gap: 20,
              }}>
                <Stat label="Toplam Tür" value={rows.length} />
                <Stat label="Seçili" value={selectedRows.size} color="#4ade80" />
                <Stat label="Dosya" value={file?.name} small />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Filtrele..."
                style={{
                  background: "#0d1a14", border: "1px solid #1e3329",
                  borderRadius: 8, padding: "8px 14px", color: "#d1fae5",
                  fontSize: 13, outline: "none", minWidth: 200,
                }}
              />
              <button onClick={handleUpload} disabled={uploading || selectedRows.size === 0}
                style={{
                  marginLeft: "auto",
                  background: selectedRows.size === 0 ? "#1e3329" : "linear-gradient(135deg, #16a34a, #4ade80)",
                  color: selectedRows.size === 0 ? "#4b6b5a" : "#052e16",
                  border: "none", borderRadius: 8, padding: "10px 28px",
                  fontWeight: 700, fontSize: 13, cursor: selectedRows.size === 0 ? "not-allowed" : "pointer",
                  letterSpacing: 1, transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {uploading ? (
                  <><Spinner /> YÜKLENİYOR...</>
                ) : (
                  <>↑ {selectedRows.size} KAYIT YÜKLE</>
                )}
              </button>
            </div>

            {/* Table */}
            <div style={{
              background: "#0d1a14", borderRadius: 12,
              border: "1px solid #1e3329", overflow: "hidden",
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#0a0f0d", borderBottom: "1px solid #1e3329" }}>
                      <th style={{ padding: "10px 12px", width: 36 }}>
                        <input type="checkbox"
                          checked={selectedRows.size === filtered.length && filtered.length > 0}
                          onChange={toggleAll}
                          style={{ accentColor: "#4ade80", cursor: "pointer" }}
                        />
                      </th>
                      {COLUMNS.map((c) => (
                        <th key={c.key} style={{
                          padding: "10px 12px", textAlign: "left",
                          color: "#4ade80", letterSpacing: 1, fontSize: 10,
                          fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap",
                          width: c.width,
                        }}>
                          {c.icon} {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, i) => (
                      <tr key={row._id}
                        onClick={() => toggleRow(row._id)}
                        style={{
                          background: selectedRows.has(row._id)
                            ? (i % 2 === 0 ? "#0f2318" : "#0d2016")
                            : (i % 2 === 0 ? "#0a0f0d" : "#080d0b"),
                          borderBottom: "1px solid #111f18",
                          cursor: "pointer",
                          transition: "background 0.1s",
                          opacity: selectedRows.has(row._id) ? 1 : 0.4,
                        }}
                      >
                        <td style={{ padding: "8px 12px" }}>
                          <input type="checkbox" checked={selectedRows.has(row._id)}
                            onChange={() => toggleRow(row._id)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ accentColor: "#4ade80" }}
                          />
                        </td>
                        <td style={{ padding: "8px 12px", color: "#d1fae5", fontStyle: "italic", fontWeight: 500 }}>
                          {row.tur || <span style={{ color: "#374151" }}>—</span>}
                        </td>
                        <td style={{ padding: "8px 12px", color: "#a7f3d0" }}>{row.bolge || "—"}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <StatusBadge value={row.statu} />
                        </td>
                        <td style={{ padding: "8px 12px", color: "#6b9e7a", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.notlar || "—"}
                        </td>
                        <td style={{ padding: "8px 12px", color: "#86efac" }}>{row.ciceklenme || "—"}</td>
                        <td style={{ padding: "8px 12px", color: "#a7f3d0" }}>{row.habitat || "—"}</td>
                        <td style={{ padding: "8px 12px", color: "#6b9e7a", whiteSpace: "nowrap" }}>{row.rakim || "—"}</td>
                        <td style={{ padding: "8px 12px", color: "#4ade80" }}>{row.kullanim || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{
                padding: "10px 16px", borderTop: "1px solid #1e3329",
                color: "#4b6b5a", fontSize: 11, display: "flex", justifyContent: "space-between",
              }}>
                <span>{filtered.length} tür gösteriliyor</span>
                <span style={{ display: "flex", gap: 12 }}>
                  {Object.entries(STATUS_COLORS).map(([k, v]) => (
                    <span key={k} style={{ color: v }}>■ {k}</span>
                  ))}
                </span>
              </div>
            </div>
          </>
        )}

        {/* STEP 3 — Done */}
        {step === "done" && (
          <div style={{
            background: "#0d2a1e", border: "1px solid #166534",
            borderRadius: 16, padding: 40, textAlign: "center",
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#4ade80", marginBottom: 8 }}>
              Yükleme Başarılı
            </div>
            <div style={{ color: "#86efac", fontSize: 14, marginBottom: 24 }}>
              {uploadResult?.inserted || selectedRows.size} kayıt ATLAS veritabanına eklendi
            </div>
            {uploadResult && (
              <pre style={{
                background: "#0a0f0d", borderRadius: 8, padding: 16,
                fontSize: 11, color: "#4ade80", textAlign: "left",
                maxWidth: 480, margin: "0 auto 24px",
                overflow: "auto",
              }}>
                {JSON.stringify(uploadResult, null, 2)}
              </pre>
            )}
            <button onClick={reset} style={{
              background: "linear-gradient(135deg, #16a34a, #4ade80)",
              color: "#052e16", border: "none", borderRadius: 8,
              padding: "10px 28px", fontWeight: 700, cursor: "pointer",
              fontSize: 13, letterSpacing: 1,
            }}>
              + YENİ DOSYA YÜKLE
            </button>
          </div>
        )}

        {step === "error" && !rows.length && (
          <div style={{
            background: "#1a0a0a", border: "1px solid #7f1d1d",
            borderRadius: 16, padding: 40, textAlign: "center",
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>❌</div>
            <div style={{ color: "#f87171", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              Hata oluştu
            </div>
            <div style={{ color: "#fca5a5", fontSize: 13, marginBottom: 24 }}>
              {uploadResult?.error || errors[0] || "Bilinmeyen hata"}
            </div>
            <button onClick={reset} style={{
              background: "#7f1d1d", color: "#fecaca", border: "none",
              borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 13,
            }}>↺ Tekrar Dene</button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0f0d; }
        ::-webkit-scrollbar-thumb { background: #1e3329; border-radius: 3px; }
        tr:hover { filter: brightness(1.15); }
      `}</style>
    </div>
  );
}

function Stat({ label, value, color, small }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: small ? 11 : 20, fontWeight: 700, color: color || "#d1fae5", maxWidth: small ? 160 : "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value ?? "—"}
      </div>
      <div style={{ fontSize: 10, color: "#4b6b5a", letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 12, height: 12,
      border: "2px solid #052e16", borderTopColor: "#052e16aa",
      borderRadius: "50%", animation: "spin 0.7s linear infinite",
    }} />
  );
}
