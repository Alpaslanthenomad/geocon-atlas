"use client";
// /geocon/search?q=... — full-page cross-entity search.
//
// Reads ?q= from the URL so /geocon/search?q=Allium is a sharable link.
// FilterBar at the top toggles which entity kinds are queried.
// Results group by kind in fixed order; species first (FTS-ranked),
// others in alphabetical kind order.

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Leaf, BookOpen, User, Briefcase, Building2, Award } from "lucide-react";
import { supabase } from "../../lib/supabase";
import FilterBar from "../shared/FilterBar";
import { EmptyState } from "../shared";

const KIND_META = {
  species:      { Icon: Leaf,        label: "Species",       tint: "var(--gx-success)" },
  publication:  { Icon: BookOpen,    label: "Publications",  tint: "var(--gx-info)" },
  researcher:   { Icon: User,        label: "Researchers",   tint: "var(--gx-accent-violet)" },
  program:      { Icon: Briefcase,   label: "Programs",      tint: "var(--gx-accent-azure)" },
  organization: { Icon: Building2,   label: "Organizations", tint: "var(--gx-warning)" },
  outcome:      { Icon: Award,       label: "Outcomes",      tint: "var(--gx-success)" },
};

export default function SearchRoute() {
  return (
    <Suspense fallback={<div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>Loading…</div>}>
      <SearchInner />
    </Suspense>
  );
}

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const [rows, setRows] = useState([]);
  const [kinds, setKinds] = useState(null); // null = all kinds
  const [loading, setLoading] = useState(false);

  // Refetch on q or kinds change; debounce keystrokes.
  useEffect(() => {
    const term = q.trim();
    if (!term) { setRows([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc("search_cross_entity", {
        p_q: term, p_kinds: kinds, p_limit: 60,
      });
      if (!error) setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [q, kinds]);

  // Reflect q into URL so the link is shareable. Skip first render.
  useEffect(() => {
    const term = q.trim();
    const url = term ? `/geocon/search?q=${encodeURIComponent(term)}` : "/geocon/search";
    if (typeof window !== "undefined" && window.location.pathname + window.location.search !== url) {
      router.replace(url, { scroll: false });
    }
  }, [q, router]);

  // Group results by kind so the UI shows sections instead of one
  // flat scroll list.
  const grouped = useMemo(() => {
    const m = new Map();
    for (const r of rows) {
      if (!m.has(r.kind)) m.set(r.kind, []);
      m.get(r.kind).push(r);
    }
    // Stable kind order: species → publication → researcher → program → organization → outcome
    return ["species","publication","researcher","program","organization","outcome"]
      .map((k) => [k, m.get(k) || []])
      .filter(([, list]) => list.length > 0);
  }, [rows]);

  const filterOptions = useMemo(() => [
    { key: "species",      label: "Species" },
    { key: "publication",  label: "Publications" },
    { key: "researcher",   label: "Researchers" },
    { key: "program",      label: "Programs" },
    { key: "organization", label: "Organizations" },
    { key: "outcome",      label: "Outcomes" },
  ], []);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <header style={{ marginBottom: 14 }}>
        <div className="gx-overline" style={{ marginBottom: 4 }}>Tools</div>
        <h1 className="gx-h1">Search</h1>
      </header>

      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "var(--gx-card-pad-sm)",
        background: "var(--gx-card-bg)",
        border: "1px solid var(--gx-card-border)",
        borderRadius: "var(--gx-card-radius)",
        marginBottom: 12,
      }}>
        <Search size={16} strokeWidth={1.85} style={{ color: "var(--gx-ink-muted)", flexShrink: 0 }} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search species, publications, researchers, programs, organizations…"
          style={{
            flex: 1, fontSize: 14,
            padding: "8px 0",
            background: "transparent", color: "var(--gx-ink)",
            border: "none", outline: "none",
            fontFamily: "var(--gx-font-body)",
          }}
        />
        {loading && <span style={{ fontSize: 10, color: "var(--gx-ink-faint)", fontFamily: "var(--gx-font-mono)" }}>…</span>}
      </div>

      <FilterBar
        options={filterOptions}
        value={kinds}
        onChange={setKinds}
        allLabel="All kinds"
      />

      <div style={{ marginTop: 14 }}>
        {!q.trim() ? (
          <EmptyState icon="○" title="Bir şey yaz" hint="Species adı, yayın başlığı, araştırmacı adı — herhangi bir şey." />
        ) : !loading && rows.length === 0 ? (
          <EmptyState icon="○" title="Eşleşme yok" hint={`"${q}" için sonuç bulunamadı. Kind filter'ı genişletmeyi dene.`} />
        ) : (
          grouped.map(([kind, list]) => (
            <ResultGroup key={kind} kind={kind} list={list} />
          ))
        )}
      </div>
    </div>
  );
}

function ResultGroup({ kind, list }) {
  const meta = KIND_META[kind] || { Icon: Search, label: kind, tint: "var(--gx-ink-muted)" };
  const Icon = meta.Icon;
  return (
    <section style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Icon size={13} strokeWidth={1.85} style={{ color: meta.tint }} />
        <div className="gx-overline" style={{ color: meta.tint }}>
          {meta.label} <span style={{ fontFamily: "var(--gx-font-mono)" }}>· {list.length}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {list.map((r) => (
          <Link key={`${kind}:${r.id}`} href={r.url || "#"}
            style={{
              padding: "8px 12px",
              background: "var(--gx-surface-2)",
              border: "1px solid var(--gx-border-soft)",
              borderRadius: 7,
              textDecoration: "none",
              display: "flex", alignItems: "baseline", gap: 8,
            }}>
            <span style={{
              fontSize: 13, fontWeight: 600, color: "var(--gx-ink)",
              ...(kind === "species" && {
                fontFamily: "var(--gx-font-serif)", fontStyle: "italic", fontWeight: 700,
              }),
              flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {r.title}
            </span>
            {r.subtitle && (
              <span style={{ fontSize: 11, color: "var(--gx-ink-muted)", flexShrink: 0 }}>
                {r.subtitle}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
