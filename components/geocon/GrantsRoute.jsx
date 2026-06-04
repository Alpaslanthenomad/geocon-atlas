"use client";
// T4.a — Conservation Grant Explorer.
//
// Public list of open grants relevant to conservation / ethnobotany /
// biodiversity work. Sortable by deadline; chips for the scope tags
// the grant covers (anatolia, endemic, propagation…). Click row →
// jumps to the funder's official URL.
//
// Data side currently empty — seeded over time. Admins curate via
// /geocon/admin (future surface) or direct DB insert.

import { useEffect, useState } from "react";
import { Banknote, Calendar, ExternalLink } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { EmptyState } from "../shared";

export default function GrantsRoute() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("list_open_grants", { p_limit: 200 });
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <div className="gx-overline" style={{ marginBottom: 4 }}>Tools</div>
        <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <Banknote size={22} strokeWidth={1.85} style={{ color: "var(--gx-success)" }} />
          Conservation Grants
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 720 }}>
          Açık konservasyon ve etnobotanik fonları. Deadline'a göre sıralı.
          GEOCON parayı görmez — yalnızca public fırsatları ortak buluşturuyor.
        </p>
      </header>

      {loading ? (
        <div className="gx-skeleton" style={{ height: 80 }} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="○"
          title="Henüz kayıtlı grant yok"
          hint="Admin paneli üzerinden eklendikçe burada listelenecek. /api/v1/grants endpoint'i de zaten boş dönüyor."
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 12 }}>
          {rows.map((g) => <GrantCard key={g.id} g={g} />)}
        </div>
      )}

      <div style={{
        marginTop: 18, padding: 12,
        background: "var(--gx-info-soft)",
        border: "1px solid color-mix(in srgb, var(--gx-info) 25%, transparent)",
        borderRadius: 10, fontSize: 11, color: "var(--gx-ink-soft)", lineHeight: 1.6,
      }}>
        💡 Public API: <code style={{ fontFamily: "var(--gx-font-mono)" }}>GET /api/v1/grants</code> — JSON,
        cached 10 min, CORS açık. OpenAPI spec'i: <code style={{ fontFamily: "var(--gx-font-mono)" }}>/api/v1/spec</code>.
      </div>
    </div>
  );
}

function GrantCard({ g }) {
  const dl = g.deadline ? new Date(g.deadline) : null;
  const today = new Date();
  const days = dl ? Math.ceil((dl - today) / (1000 * 60 * 60 * 24)) : null;
  const urgent = days != null && days <= 30 && days >= 0;
  return (
    <article style={{
      padding: "var(--gx-card-pad-sm)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
      borderLeft: `3px solid ${urgent ? "var(--gx-warning)" : "var(--gx-success)"}`,
    }}>
      <div className="gx-overline" style={{ marginBottom: 4 }}>{g.funder}</div>
      <h3 style={{
        fontFamily: "var(--gx-font-display)", fontWeight: 700,
        fontSize: 15, lineHeight: 1.3, color: "var(--gx-ink)",
        margin: 0,
      }}>
        {g.title}
      </h3>

      {g.description_md && (
        <p style={{
          marginTop: 6, marginBottom: 0,
          fontSize: 11, color: "var(--gx-ink-soft)", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {g.description_md}
        </p>
      )}

      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
        {(g.scope_tags || []).map((t) => (
          <span key={t} style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
            padding: "2px 7px", borderRadius: 999,
            background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)",
            fontFamily: "var(--gx-font-mono)",
          }}>
            {t}
          </span>
        ))}
      </div>

      <div style={{
        marginTop: 10, paddingTop: 8,
        borderTop: "1px solid var(--gx-border-soft)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 10, color: "var(--gx-ink-muted)",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Calendar size={11} strokeWidth={1.85} />
          {g.rolling
            ? "Rolling"
            : dl
              ? `${dl.toLocaleDateString()} · ${days >= 0 ? `${days}d kaldı` : "geçti"}`
              : "Tarih belirtilmemiş"}
        </span>
        {g.amount_currency && (g.amount_min || g.amount_max) && (
          <span style={{ fontFamily: "var(--gx-font-mono)" }}>
            {g.amount_min ? Math.round(g.amount_min).toLocaleString() : "0"} – {g.amount_max ? Math.round(g.amount_max).toLocaleString() : "?"} {g.amount_currency}
          </span>
        )}
      </div>

      {g.url && (
        <a href={g.url} target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            marginTop: 6, fontSize: 11, fontWeight: 700,
            color: "var(--gx-accent-azure)", textDecoration: "none",
          }}>
          Funder sayfasını aç <ExternalLink size={11} strokeWidth={2} />
        </a>
      )}
    </article>
  );
}
