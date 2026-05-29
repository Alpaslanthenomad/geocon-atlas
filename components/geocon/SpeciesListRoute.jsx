"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  fetchSpeciesPage,
  fetchAtlasFamilies,
  SPECIES_SORTS,
} from "../../lib/atlas/queries";
import { countryChip, familyTokens } from "../../lib/atlas/format";

const IUCN_COLORS = {
  CR: "#FF1744",
  EN: "#FF9100",
  VU: "#FFD600",
  NT: "#80CBC4",
  LC: "#66BB6A",
  DD: "#B0BEC5",
  NE: "#78909C",
};
const IUCN_TIERS = ["CR", "EN", "VU", "NT", "LC", "DD", "NE"];
const IUCN_LABEL = {
  CR: "Critically endangered",
  EN: "Endangered",
  VU: "Vulnerable",
  NT: "Near threatened",
  LC: "Least concern",
  DD: "Data deficient",
  NE: "Not evaluated",
};
const PAGE_SIZE = 50;

export default function SpeciesListRoute() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    search: searchParams?.get("q") || "",
    families: searchParams?.get("family") ? [searchParams.get("family")] : [],
    iucnTiers: searchParams?.get("iucn") ? searchParams.get("iucn").split(",") : [],
    country: (searchParams?.get("country") || "").toUpperCase(),
    endemicOnly: searchParams?.get("endemic") === "1",
    withImageOnly: searchParams?.get("img") === "1",
  }));
  const [sort, setSort] = useState("name_asc");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [families, setFamilies] = useState([]);
  const sentinelRef = useRef(null);

  // Debounced search input
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset paging whenever filters or sort change
  useEffect(() => { setPage(0); setRows([]); }, [filters, sort]);

  // Family chip list (loaded once)
  useEffect(() => {
    fetchAtlasFamilies().then(setFamilies).catch(() => {});
  }, []);

  // Fetch page when filters / sort / page change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSpeciesPage({ filters, sort, page, pageSize: PAGE_SIZE })
      .then(({ rows: r, total: t }) => {
        if (cancelled) return;
        setRows((prev) => (page === 0 ? r : [...prev, ...r]));
        setTotal(t);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "Failed to load");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [filters, sort, page]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting && !loading && rows.length < total) {
        setPage((p) => p + 1);
      }
    }, { rootMargin: "300px" });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loading, rows.length, total]);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.families.length +
    filters.iucnTiers.length +
    (filters.country ? 1 : 0) +
    (filters.endemicOnly ? 1 : 0) +
    (filters.withImageOnly ? 1 : 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, alignItems: "start" }}>
      <Sidebar
        families={families}
        filters={filters}
        setFilters={setFilters}
      />

      <div style={{ minWidth: 0 }}>
        <TopBar
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          sort={sort}
          setSort={setSort}
          total={total}
          loading={loading}
          activeFilterCount={activeFilterCount}
          onClear={() => {
            setSearchInput("");
            setFilters({
              search: "", families: [], iucnTiers: [],
              country: "", endemicOnly: false, withImageOnly: false,
            });
          }}
        />

        {error && (
          <div style={{ padding: 14, marginTop: 12, border: "1px solid #FCEBEB", background: "#FFF6F6", color: "#A32D2D", borderRadius: 10, fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {rows.map((s) => <SpeciesCard key={s.id} s={s} />)}
        </div>

        {rows.length < total && (
          <div ref={sentinelRef} style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: 11 }}>
            {loading ? "Loading more…" : `${total - rows.length} more · scroll`}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function TopBar({ searchInput, setSearchInput, sort, setSort, total, loading, activeFilterCount, onClear }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
      <div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#2c2c2a" }}>
          ATLAS · geophyte intelligence
        </div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
          {loading && total === 0 ? "Loading…" : `${total.toLocaleString()} species`}
          {activeFilterCount > 0 && (
            <>
              {" · "}
              <button
                onClick={onClear}
                style={{ background: "none", border: "none", color: "#1D9E75", cursor: "pointer", fontSize: 11, padding: 0 }}
              >
                clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name…"
          style={{ padding: "7px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, width: 220, background: "#fff" }}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ padding: "7px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, background: "#fff", cursor: "pointer" }}
        >
          {Object.entries(SPECIES_SORTS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Sidebar({ families, filters, setFilters }) {
  const familyToggle = (fam) => setFilters((f) => ({
    ...f,
    families: f.families.includes(fam) ? f.families.filter((x) => x !== fam) : [...f.families, fam],
  }));
  const iucnToggle = (tier) => setFilters((f) => ({
    ...f,
    iucnTiers: f.iucnTiers.includes(tier) ? f.iucnTiers.filter((x) => x !== tier) : [...f.iucnTiers, tier],
  }));

  return (
    <aside style={{ position: "sticky", top: 14 }}>
      <Section title="IUCN tier">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {IUCN_TIERS.map((t) => {
            const active = filters.iucnTiers.includes(t);
            return (
              <button
                key={t}
                onClick={() => iucnToggle(t)}
                title={IUCN_LABEL[t]}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  padding: "3px 8px",
                  borderRadius: 999,
                  border: `1px solid ${active ? IUCN_COLORS[t] : "#e8e6e1"}`,
                  background: active ? `${IUCN_COLORS[t]}22` : "#fff",
                  color: active ? "#2c2c2a" : "#5f5e5a",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: IUCN_COLORS[t], marginRight: 5, verticalAlign: "middle" }} />
                {t}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Country">
        <input
          value={filters.country}
          onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value.toUpperCase().slice(0, 2) }))}
          placeholder="ISO-2 (TR, ES, …)"
          maxLength={2}
          style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 6, background: "#fff", textTransform: "uppercase" }}
        />
      </Section>

      <Section title="Flags">
        <label style={flagRow}>
          <input
            type="checkbox"
            checked={filters.endemicOnly}
            onChange={(e) => setFilters((f) => ({ ...f, endemicOnly: e.target.checked }))}
          />
          Endemic only
        </label>
        <label style={flagRow}>
          <input
            type="checkbox"
            checked={filters.withImageOnly}
            onChange={(e) => setFilters((f) => ({ ...f, withImageOnly: e.target.checked }))}
          />
          With image
        </label>
      </Section>

      <Section title={`Families (${families.length})`}>
        <div style={{ maxHeight: 280, overflow: "auto", display: "flex", flexDirection: "column", gap: 3, paddingRight: 4 }}>
          {families.map(({ family, count }) => {
            const active = filters.families.includes(family);
            return (
              <button
                key={family}
                onClick={() => familyToggle(family)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "5px 8px",
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  borderRadius: 6,
                  border: `1px solid ${active ? "#1D9E75" : "transparent"}`,
                  background: active ? "#E1F5EE" : "transparent",
                  color: active ? "#085041" : "#5f5e5a",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>{family}</span>
                <span style={{ fontSize: 10, color: active ? "#085041" : "#9a978f" }}>{count.toLocaleString()}</span>
              </button>
            );
          })}
        </div>
      </Section>
    </aside>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function SpeciesCard({ s }) {
  const tier = IUCN_TIERS.includes(s.iucn_status) ? s.iucn_status : null;
  const countries = (s.native_countries && s.native_countries.length > 0)
    ? s.native_countries.slice(0, 4)
    : s.country_focus ? [s.country_focus] : [];
  const famTok = familyTokens(s.family);

  return (
    <Link
      href={`/geocon/species/${s.id}`}
      style={{
        display: "block",
        background: "#fff",
        border: "1px solid #ece9e2",
        borderTop: `3px solid ${famTok.border}`,
        borderRadius: 10,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        transition: "transform 0.12s, box-shadow 0.12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#f4f3ef", overflow: "hidden" }}>
        {s.thumbnail_url ? (
          <img
            src={s.thumbnail_url}
            alt={s.accepted_name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#b4b2a9", letterSpacing: 1 }}>
            no image
          </div>
        )}
        {tier && (
          <span
            title={IUCN_LABEL[tier]}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 999,
              background: IUCN_COLORS[tier],
              color: "#fff",
              letterSpacing: 0.5,
            }}
          >
            {tier}
          </span>
        )}
        {s.endemic && (
          <span style={{ position: "absolute", top: 8, left: 8, fontSize: 9, padding: "2px 7px", borderRadius: 999, background: "rgba(8, 80, 65, 0.85)", color: "#fff", fontWeight: 600 }}>
            endemic
          </span>
        )}
      </div>

      <div style={{ padding: "10px 12px" }}>
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: "italic",
            fontSize: 14,
            color: "#2c2c2a",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {s.accepted_name}
        </div>
        <div style={{ display: "inline-block", fontSize: 10, color: famTok.text, background: famTok.bg, padding: "2px 7px", borderRadius: 99, marginTop: 4 }}>
          {s.family}
        </div>
        {countries.length > 0 && (
          <div style={{ fontSize: 11, color: "#5f5e5a", marginTop: 6, letterSpacing: 0.3 }}>
            {countries.map((c) => countryChip(c)).join(" · ")}
            {s.native_countries && s.native_countries.length > 4 && (
              <span style={{ color: "#9a978f" }}> · +{s.native_countries.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: 40, marginTop: 16, border: "1px dashed #ece9e2", borderRadius: 12, textAlign: "center", color: "#888" }}>
      <div style={{ fontSize: 26, marginBottom: 10 }}>🌿</div>
      <div style={{ fontSize: 13, color: "#2c2c2a", fontWeight: 600 }}>No species match these filters</div>
      <div style={{ fontSize: 11, marginTop: 4 }}>Clear a filter or broaden the search.</div>
    </div>
  );
}

const flagRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  color: "#5f5e5a",
  padding: "4px 0",
  cursor: "pointer",
};
