"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { countryName } from "../../lib/countryNames";
import { flag } from "../../lib/atlas/format";

const IUCN_COLORS = {
  CR: "#FF1744", EN: "#FF9100", VU: "#FFD600",
  NT: "#80CBC4", LC: "#66BB6A", DD: "#B0BEC5", NE: "#78909C",
};
const IUCN_ORDER = ["CR", "EN", "VU", "NT", "LC", "DD", "NE"];

export default function CountriesOverviewRoute() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("total");
  const [search, setSearch] = useState("");
  // ISO-2 → open call count. Sparse; absent means "not yet asked" (treated
  // as 0 by the tile).
  const [proposalCounts, setProposalCounts] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_explore_country_summary", {
        p_tiers: null,
        p_include_null: true,
      });
      if (cancelled) return;
      if (!error && data) setRows(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Batched open-call counts: one RPC call after countries arrive.
  useEffect(() => {
    if (rows.length === 0) return;
    let cancelled = false;
    (async () => {
      const codes = rows.map((r) => r.country).filter(Boolean);
      const { data } = await supabase.rpc("get_open_proposal_counts_for_countries", {
        p_countries: codes,
      });
      if (cancelled) return;
      const next = {};
      for (const c of codes) next[c] = data?.[c.toUpperCase()] || data?.[c] || 0;
      setProposalCounts(next);
    })();
    return () => { cancelled = true; };
  }, [rows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (x) => x.country.toLowerCase().includes(q) || (countryName(x.country) || "").toLowerCase().includes(q)
      );
    }
    if (sort === "total") r = [...r].sort((a, b) => b.total - a.total);
    else if (sort === "threatened") r = [...r].sort((a, b) => (b.cr_count + b.en_count + b.vu_count) - (a.cr_count + a.en_count + a.vu_count));
    else if (sort === "name") r = [...r].sort((a, b) => (countryName(a.country) || a.country).localeCompare(countryName(b.country) || b.country));
    return r;
  }, [rows, sort, search]);

  if (loading) return <Skeleton />;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>Countries</h1>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            {rows.length} countries with geophytes in the atlas
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country…"
            style={{ padding: "7px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, width: 200, background: "#fff" }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ padding: "7px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, background: "#fff", cursor: "pointer" }}
          >
            <option value="total">Most species</option>
            <option value="threatened">Most threatened</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {filtered.map((r) => <CountryTile key={r.country} row={r} openCallCount={proposalCounts[r.country] || 0} />)}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 40, marginTop: 16, border: "1px dashed #ece9e2", borderRadius: 12, textAlign: "center", color: "#888" }}>
          No countries match that search.
        </div>
      )}
    </div>
  );
}

function CountryTile({ row, openCallCount = 0 }) {
  const tierEntries = IUCN_ORDER
    .map((t) => ({ t, c: row[`${t.toLowerCase()}_count`] || 0 }))
    .filter((x) => x.c > 0);
  const threatened = (row.cr_count || 0) + (row.en_count || 0) + (row.vu_count || 0);
  return (
    <Link
      href={`/geocon/countries/${row.country}`}
      style={{
        display: "block",
        background: "#fff",
        border: "1px solid #ece9e2",
        borderRadius: 10,
        padding: "14px 16px",
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
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24, lineHeight: 1 }}>{flag(row.country)}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {countryName(row.country)}
          </div>
          <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>{row.country}</div>
        </div>
        {openCallCount > 0 && (
          <span
            title={`${openCallCount} open call${openCallCount === 1 ? "" : "s"} from this country`}
            style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: "rgba(10,74,62,0.92)", color: "#fff", display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}
          >
            📬 {openCallCount}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#2c2c2a", lineHeight: 1 }}>
          {row.total.toLocaleString()}
        </span>
        <span style={{ fontSize: 10, color: "#888" }}>species</span>
        {threatened > 0 && (
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: "#A32D2D" }}>
            {threatened} at risk
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        {tierEntries.map(({ t, c }) => (
          <div
            key={t}
            title={`${c} ${t}`}
            style={{
              flex: c,
              height: 5,
              background: IUCN_COLORS[t],
              borderRadius: 99,
            }}
          />
        ))}
      </div>
    </Link>
  );
}

function Skeleton() {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ height: 60, background: "#f4f3ef", borderRadius: 10, marginBottom: 12 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ height: 110, background: "#f4f3ef", borderRadius: 10 }} />
        ))}
      </div>
    </div>
  );
}
