"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { fetchAtlasFamilies } from "../../lib/atlas/queries";
import { familyTokens } from "../../lib/atlas/format";
import { supabase } from "../../lib/supabase";

export default function FamiliesOverviewRoute() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("count");
  // family name → open call count. Same sparse-map pattern used elsewhere.
  const [proposalCounts, setProposalCounts] = useState({});

  useEffect(() => {
    fetchAtlasFamilies().then((r) => {
      setRows(r);
      setLoading(false);
    });
  }, []);

  // Batched open-call counts per family. One RPC after families arrive.
  useEffect(() => {
    if (rows.length === 0) return;
    let cancelled = false;
    (async () => {
      const families = rows.map((r) => r.family).filter(Boolean);
      const { data } = await supabase.rpc("get_open_proposal_counts_for_families", {
        p_families: families,
      });
      if (cancelled) return;
      const next = {};
      for (const f of families) next[f] = data?.[f] || 0;
      setProposalCounts(next);
    })();
    return () => { cancelled = true; };
  }, [rows]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((x) => (x.family || "").toLowerCase().includes(q));
    }
    if (sort === "count") r = [...r].sort((a, b) => b.count - a.count);
    else if (sort === "name") r = [...r].sort((a, b) => (a.family || "").localeCompare(b.family || ""));
    return r;
  }, [rows, sort, search]);

  if (loading) return <Skeleton />;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#2c2c2a", margin: 0 }}>Families</h1>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            {rows.length} families in the atlas
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search family…"
            style={{ padding: "7px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, width: 200, background: "#fff" }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ padding: "7px 10px", fontSize: 12, border: "1px solid #e8e6e1", borderRadius: 7, background: "#fff", cursor: "pointer" }}
          >
            <option value="count">Most species</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {filtered.map(({ family, count }) => (
          <FamilyTile key={family} family={family} count={count} openCallCount={proposalCounts[family] || 0} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 40, marginTop: 16, border: "1px dashed #ece9e2", borderRadius: 12, textAlign: "center", color: "#888" }}>
          No families match that search.
        </div>
      )}
    </div>
  );
}

function FamilyTile({ family, count, openCallCount = 0 }) {
  const tok = familyTokens(family);
  return (
    <Link
      href={`/geocon/families/${encodeURIComponent(family)}`}
      style={{
        display: "block",
        background: tok.bg,
        border: `1px solid ${tok.border}33`,
        borderLeft: `4px solid ${tok.border}`,
        borderRadius: 10,
        padding: "14px 16px",
        textDecoration: "none",
        color: tok.text,
        transition: "transform 0.12s",
        position: "relative",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{family}</div>
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        {count.toLocaleString()} species
      </div>
      {openCallCount > 0 && (
        <span
          title={`${openCallCount} open call${openCallCount === 1 ? "" : "s"} in this family`}
          style={{
            position: "absolute", top: 10, right: 10,
            fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
            background: "rgba(10,74,62,0.92)", color: "#fff",
            display: "inline-flex", alignItems: "center", gap: 4,
          }}
        >
          📬 {openCallCount}
        </span>
      )}
    </Link>
  );
}

function Skeleton() {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ height: 60, background: "#f4f3ef", borderRadius: 10, marginBottom: 12 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ height: 80, background: "#f4f3ef", borderRadius: 10 }} />
        ))}
      </div>
    </div>
  );
}
