"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  fetchSpeciesPage,
  fetchAtlasFamilies,
  SPECIES_SORTS,
} from "../../lib/atlas/queries";
import { countryChip, familyTokens } from "../../lib/atlas/format";
import { supabase } from "../../lib/supabase";

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
  return (
    <Suspense fallback={<Loading />}>
      <SpeciesListInner />
    </Suspense>
  );
}

function Loading() {
  return <div style={{ padding: 24, fontSize: 12, color: "#888" }}>Loading…</div>;
}

function SpeciesListInner() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    search: searchParams?.get("q") || "",
    families: searchParams?.get("family") ? [searchParams.get("family")] : [],
    iucnTiers: searchParams?.get("iucn") ? searchParams.get("iucn").split(",") : [],
    country: (searchParams?.get("country") || "").toUpperCase(),
    endemicOnly: searchParams?.get("endemic") === "1",
    withImageOnly: searchParams?.get("img") === "1",
    hasOpenCalls: searchParams?.get("calls") === "1",
  }));
  const [sort, setSort] = useState("name_asc");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [families, setFamilies] = useState([]);
  // species_id → open call count. Sparse; missing means we haven't asked yet
  // (treat as 0 in the UI). We only ever insert keys for species we have
  // counts for, so the map stays bounded by what's visible on the page.
  const [proposalCounts, setProposalCounts] = useState({});
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

  // Batch-fetch open-call counts for species we don't already have counts for.
  // Runs after each rows update (initial load + each infinite-scroll page).
  useEffect(() => {
    if (rows.length === 0) return;
    const missing = rows.map((s) => s.id).filter((id) => id && !(id in proposalCounts));
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_open_proposal_counts_for_species", {
        p_species_ids: missing,
      });
      if (cancelled) return;
      // Seed every requested id (even ones with 0 hits) so we don't re-ask.
      const next = {};
      for (const id of missing) next[id] = data?.[id] || 0;
      setProposalCounts((prev) => ({ ...prev, ...next }));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  // Reset counts when filters change so a stale map doesn't carry over
  useEffect(() => { setProposalCounts({}); }, [filters, sort]);

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
    (filters.withImageOnly ? 1 : 0) +
    (filters.hasOpenCalls ? 1 : 0);

  const onClear = () => {
    setSearchInput("");
    setFilters({
      search: "", families: [], iucnTiers: [],
      country: "", endemicOnly: false, withImageOnly: false, hasOpenCalls: false,
    });
  };

  // Two distinct layouts so the architecture matches the user's mental model
  // of the old Atlas: a clean full-width family landing, and a focused
  // sidebar-driven species grid once anything is narrowed.
  if (activeFilterCount === 0) {
    return (
      <FamilyLanding
        families={families}
        onPickFamily={(family) => setFilters((f) => ({ ...f, families: [family] }))}
      />
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, alignItems: "start" }}>
      <Sidebar families={families} filters={filters} setFilters={setFilters} />

      <div style={{ minWidth: 0 }}>
        <TopBar
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          sort={sort}
          setSort={setSort}
          total={total}
          loading={loading}
          activeFilterCount={activeFilterCount}
          onClear={onClear}
        />

        {error && (
          <div style={{ padding: 14, marginTop: 12, border: "1px solid #FCEBEB", background: "#FFF6F6", color: "#A32D2D", borderRadius: 10, fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {rows.map((s) => <SpeciesCard key={s.id} s={s} openCallCount={proposalCounts[s.id] || 0} />)}
        </div>

        {rows.length < total && (
          <div ref={sentinelRef} style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: 11 }}>
            {loading ? "Loading more…" : `${total - rows.length} more · scroll`}
          </div>
        )}

        {!loading && rows.length === 0 && <EmptyState />}
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
        <label style={flagRow}>
          <input
            type="checkbox"
            checked={filters.hasOpenCalls}
            onChange={(e) => setFilters((f) => ({ ...f, hasOpenCalls: e.target.checked }))}
          />
          📬 Has open calls
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

function FamilyLanding({ families, onPickFamily }) {
  // The cold-start, no-filter landing. Matches the architecture of the old
  // Atlas: full-width, hero stats strip at the top, then a wide grid of
  // photo-background family cards. No sidebar — sidebar comes back the
  // moment any filter is active.
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("get_atlas_overview");
      if (cancelled) return;
      setStats(data || null);
    })();
    return () => { cancelled = true; };
  }, []);

  const sorted = [...(families || [])].sort((a, b) => b.count - a.count);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {/* Hero header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 34, fontWeight: 700, color: "#2c2c2a", margin: 0, letterSpacing: -1, lineHeight: 1 }}>
            Species Families
          </h1>
          {stats && (
            <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
              {stats.total_species?.toLocaleString()} species · {stats.family_count} families · {stats.country_count} countries
            </div>
          )}
        </div>
        {stats && (
          <div style={{ display: "flex", gap: 24 }}>
            <Stat tint="#1D9E75"  label="Total"        value={stats.total_species} />
            <Stat tint="#A32D2D"  label="Threatened"   value={stats.threatened_count} />
            <Stat tint="#185FA5"  label="Photographed" value={stats.with_photo_count} />
            <Stat tint="#534AB7"  label="Endemic"      value={stats.endemic_count} />
          </div>
        )}
      </div>

      {/* Family grid — bigger tiles, more columns */}
      {sorted.length === 0 ? (
        <div style={{ padding: 60, border: "1px dashed #ece9e2", borderRadius: 12, textAlign: "center", color: "#888", fontSize: 12 }}>
          Loading families…
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {sorted.map((row) => <FamilyTile key={row.family} {...row} onPickFamily={onPickFamily} />)}
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 11, color: "#aaa", textAlign: "center" }}>
        Use the search or sidebar filters to drill into the full {stats?.total_species?.toLocaleString() || "47,000+"} species.
      </div>
    </div>
  );
}

function Stat({ label, value, tint }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: tint, lineHeight: 1 }}>
        {(value ?? 0).toLocaleString()}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function FamilyBrowse({ families, onPickFamily }) {
  // Photo-background family tiles. Each card has the representative species
  // image as a full-bleed background with a darkening gradient overlay so
  // the family name + count stay legible. Families without a hero image
  // fall back to the colored familyTokens treatment.
  if (!families || families.length === 0) {
    return (
      <div style={{ marginTop: 18, padding: 30, border: "1px dashed #ece9e2", borderRadius: 12, textAlign: "center", color: "#888", fontSize: 12 }}>
        Loading families…
      </div>
    );
  }
  const sorted = [...families].sort((a, b) => b.count - a.count);
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
        Pick a family to browse its species, or search / filter from the sidebar.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {sorted.map((row) => <FamilyTile key={row.family} {...row} onPickFamily={onPickFamily} />)}
      </div>
    </div>
  );
}

function FamilyTile({ family, count, hero_url, onPickFamily }) {
  const tok = familyTokens(family);
  const hasPhoto = !!hero_url;
  return (
    <button
      onClick={() => onPickFamily(family)}
      style={{
        position: "relative",
        display: "block",
        textAlign: "left",
        aspectRatio: "4 / 3",
        background: hasPhoto ? "#222" : tok.bg,
        border: `1px solid ${tok.border}33`,
        borderRadius: 10,
        padding: 0,
        cursor: "pointer",
        color: hasPhoto ? "#fff" : tok.text,
        fontFamily: "inherit",
        overflow: "hidden",
        transition: "transform 0.12s, box-shadow 0.12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 8px 22px rgba(0,0,0,0.18)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {hasPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero_url}
          alt=""
          loading="lazy"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", display: "block",
            opacity: 0.95,
          }}
        />
      )}
      {hasPhoto && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.78) 100%)",
        }} />
      )}
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 12 }}>
        <div style={{
          fontFamily: "Georgia, serif",
          fontSize: 18, fontWeight: 700, lineHeight: 1.15,
          textShadow: hasPhoto ? "0 1px 4px rgba(0,0,0,0.6)" : "none",
        }}>
          {family}
        </div>
        <div style={{
          fontSize: 11, marginTop: 3,
          opacity: hasPhoto ? 0.92 : 0.7,
          textShadow: hasPhoto ? "0 1px 3px rgba(0,0,0,0.55)" : "none",
        }}>
          {count.toLocaleString()} species
        </div>
      </div>
    </button>
  );
}

function SpeciesCard({ s, openCallCount = 0 }) {
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
        {openCallCount > 0 && (
          <span
            title={`${openCallCount} open call${openCallCount === 1 ? "" : "s"} reference this species`}
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 999,
              background: "rgba(10, 74, 62, 0.92)",
              color: "#fff",
              letterSpacing: 0.3,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            📬 {openCallCount}
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
