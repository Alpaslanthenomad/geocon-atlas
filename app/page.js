"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const FAMILY_COLORS = {
  Liliaceae:        { bg: "#EAF3DE", border: "#639922", text: "#27500A", dot: "#639922" },
  Amaryllidaceae:   { bg: "#E6F1FB", border: "#378ADD", text: "#0C447C", dot: "#378ADD" },
  Asparagaceae:     { bg: "#E1F5EE", border: "#1D9E75", text: "#085041", dot: "#1D9E75" },
  Iridaceae:        { bg: "#EEEDFE", border: "#7F77DD", text: "#3C3489", dot: "#7F77DD" },
  Orchidaceae:      { bg: "#FBEAF0", border: "#D4537E", text: "#72243E", dot: "#D4537E" },
  Araceae:          { bg: "#FAECE7", border: "#D85A30", text: "#712B13", dot: "#D85A30" },
  Colchicaceae:     { bg: "#FAEEDA", border: "#BA7517", text: "#633806", dot: "#BA7517" },
  Primulaceae:      { bg: "#FCEBEB", border: "#E24B4A", text: "#791F1F", dot: "#E24B4A" },
  Ranunculaceae:    { bg: "#F1EFE8", border: "#5F5E5A", text: "#2C2C2A", dot: "#5F5E5A" },
  Gentianaceae:     { bg: "#E1F5EE", border: "#0F6E56", text: "#04342C", dot: "#0F6E56" },
  Paeoniaceae:      { bg: "#FBEAF0", border: "#993556", text: "#4B1528", dot: "#993556" },
  Nymphaeaceae:     { bg: "#E6F1FB", border: "#185FA5", text: "#042C53", dot: "#185FA5" },
  Geraniaceae:      { bg: "#FAEEDA", border: "#854F0B", text: "#412402", dot: "#854F0B" },
  Tecophilaeaceae:  { bg: "#EEEDFE", border: "#534AB7", text: "#26215C", dot: "#534AB7" },
  Alstroemeriaceae: { bg: "#EAF3DE", border: "#3B6D11", text: "#173404", dot: "#3B6D11" },
};

const DEFAULT_COLOR = { bg: "#F1EFE8", border: "#888780", text: "#2C2C2A", dot: "#888780" };

function FamilyBadge({ family }) {
  const c = FAMILY_COLORS[family] || DEFAULT_COLOR;
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 500,
      padding: "2px 8px",
      borderRadius: 99,
      background: c.bg,
      color: c.text,
      border: `0.5px solid ${c.border}`,
      whiteSpace: "nowrap",
    }}>
      {family}
    </span>
  );
}

function SpeciesCard({ species }) {
  const c = FAMILY_COLORS[species.family] || DEFAULT_COLOR;
  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      borderLeft: `3px solid ${c.dot}`,
    }}>
      <p style={{ margin: 0, fontSize: 13, fontStyle: "italic", fontWeight: 500, color: "var(--color-text-primary)" }}>
        {species.accepted_name}
      </p>
      {species.common_name && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
          {species.common_name}
        </p>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
        {species.iucn_status && (
          <span style={{
            fontSize: 11,
            padding: "1px 7px",
            borderRadius: 99,
            background: species.iucn_status === "EN" || species.iucn_status === "CR"
              ? "#FCEBEB" : "#F1EFE8",
            color: species.iucn_status === "EN" || species.iucn_status === "CR"
              ? "#791F1F" : "#444441",
            border: "0.5px solid currentColor",
          }}>
            IUCN: {species.iucn_status}
          </span>
        )}
        {species.origin_country && (
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            {species.origin_country}
          </span>
        )}
      </div>
    </div>
  );
}

function FamilyGroup({ family, species, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const c = FAMILY_COLORS[family] || DEFAULT_COLOR;
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: c.bg,
          border: `0.5px solid ${c.border}`,
          borderRadius: open ? "12px 12px 0 0" : 12,
          padding: "10px 16px",
          cursor: "pointer",
          transition: "border-radius 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: c.dot,
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: c.text }}>
            {family}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: c.text, opacity: 0.7 }}>
            {species.length} tür
          </span>
          <span style={{ fontSize: 14, color: c.text, opacity: 0.6 }}>
            {open ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {open && (
        <div style={{
          border: `0.5px solid ${c.border}`,
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          padding: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 8,
          background: "var(--color-background-secondary)",
        }}>
          {species.map(s => <SpeciesCard key={s.id} species={s} />)}
        </div>
      )}
    </div>
  );
}

export default function SpeciesPage() {
  const [allSpecies, setAllSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("family"); // "family" | "list"
  const [search, setSearch] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("all");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("species")
        .select("id, accepted_name, common_name, family, iucn_status, origin_country")
        .order("family", { ascending: true })
        .order("accepted_name", { ascending: true });
      if (!error) setAllSpecies(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const families = [...new Set(allSpecies.map(s => s.family).filter(Boolean))].sort();

  const filtered = allSpecies.filter(s => {
    const matchSearch = !search ||
      s.accepted_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.common_name?.toLowerCase().includes(search.toLowerCase());
    const matchFamily = selectedFamily === "all" || s.family === selectedFamily;
    return matchSearch && matchFamily;
  });

  const grouped = families.reduce((acc, fam) => {
    const members = filtered.filter(s => s.family === fam);
    if (members.length > 0) acc[fam] = members;
    return acc;
  }, {});

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-secondary)" }}>
      Yükleniyor...
    </div>
  );

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Header & Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Tür ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: "1 1 200px", minWidth: 180 }}
        />
        <select
          value={selectedFamily}
          onChange={e => setSelectedFamily(e.target.value)}
          style={{ flex: "0 1 200px" }}
        >
          <option value="all">Tüm familyalar</option>
          {families.map(f => (
            <option key={f} value={f}>{f} ({allSpecies.filter(s => s.family === f).length})</option>
          ))}
        </select>
        <div style={{ display: "flex", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, overflow: "hidden" }}>
          {["family", "list"].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "7px 14px",
                fontSize: 13,
                background: view === v ? "var(--color-background-secondary)" : "transparent",
                color: view === v ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                border: "none",
                borderRight: v === "family" ? "0.5px solid var(--color-border-secondary)" : "none",
                cursor: "pointer",
                fontWeight: view === v ? 500 : 400,
              }}
            >
              {v === "family" ? "Familya" : "Liste"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>
          <span style={{ color: "var(--color-text-secondary)" }}>Gösterilen: </span>
          <span style={{ fontWeight: 500 }}>{filtered.length} tür</span>
        </div>
        <div style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>
          <span style={{ color: "var(--color-text-secondary)" }}>Familya: </span>
          <span style={{ fontWeight: 500 }}>{Object.keys(grouped).length}</span>
        </div>
      </div>

      {/* Family View */}
      {view === "family" && (
        <div>
          {Object.entries(grouped).map(([fam, spp], i) => (
            <FamilyGroup key={fam} family={fam} species={spp} defaultOpen={i < 3} />
          ))}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 8,
        }}>
          {filtered.map(s => (
            <div key={s.id} style={{ position: "relative" }}>
              <SpeciesCard species={s} />
              <div style={{ position: "absolute", top: 10, right: 10 }}>
                <FamilyBadge family={s.family} />
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-secondary)" }}>
          Sonuç bulunamadı
        </div>
      )}
    </div>
  );
}
