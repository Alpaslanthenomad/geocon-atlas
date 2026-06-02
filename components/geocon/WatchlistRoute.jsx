"use client";
// /geocon/watch — signed-in user's saved species list.
//
// Pure read-from-RPC pattern: list_my_watchlist returns species rows
// with thumbnail + IUCN + score so we don't have to do a follow-up
// join. The "unwatch" action calls unwatch_species and re-loads.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import { EmptyState } from "../shared";

// Inline IUCN pill — keeps WatchlistRoute self-contained (no missing
// import). Mirrors the spectrum used by --gx-iucn-* tokens.
const IUCN_LABELS = {
  CR: { label: "Critically Endangered", short: "CR", tint: "var(--gx-iucn-cr)" },
  EN: { label: "Endangered",            short: "EN", tint: "var(--gx-iucn-en)" },
  VU: { label: "Vulnerable",            short: "VU", tint: "var(--gx-iucn-vu)" },
  NT: { label: "Near Threatened",       short: "NT", tint: "var(--gx-iucn-nt)" },
  LC: { label: "Least Concern",         short: "LC", tint: "var(--gx-iucn-lc)" },
  DD: { label: "Data Deficient",        short: "DD", tint: "var(--gx-iucn-dd)" },
  NE: { label: "Not Evaluated",         short: "NE", tint: "var(--gx-iucn-ne)" },
};
function IucnPill({ status }) {
  const m = IUCN_LABELS[status?.toUpperCase()] || { short: status, tint: "var(--gx-ink-muted)" };
  return (
    <span title={m.label} style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
      padding: "2px 7px", borderRadius: 999,
      background: m.tint, color: "#fff",
      fontFamily: "var(--gx-font-mono)",
    }}>
      {m.short}
    </span>
  );
}

export default function WatchlistRoute() {
  const { user, loading: authLoading } = useAuthContext();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unwatching, setUnwatching] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_my_watchlist", {
        p_limit: 200, p_offset: 0,
      });
      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Watchlist yüklenemedi", { detail: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function unwatch(speciesId) {
    setUnwatching(speciesId);
    try {
      const { error } = await supabase.rpc("unwatch_species", { p_species_id: speciesId });
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.species_id !== speciesId));
      toast.info("Watchlist'ten çıkarıldı");
    } catch (e) {
      toast.error("İşlem başarısız", { detail: e?.message || String(e) });
    } finally {
      setUnwatching(null);
    }
  }

  if (authLoading || loading) {
    return <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>Loading…</div>;
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", padding: 40, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: "var(--gx-card-radius)", textAlign: "center" }}>
        <Eye size={28} strokeWidth={1.5} style={{ color: "var(--gx-ink-muted)", marginBottom: 8 }} />
        <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, margin: 0, color: "var(--gx-ink)" }}>Sign in to track species</h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 8, lineHeight: 1.6 }}>
          Watchlist'in tek seferlik sign-in sonrası kişiselleşir. ORCID veya BEE üzerinden gir.
        </p>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "8px 14px", fontSize: 12, fontWeight: 600, background: "var(--gx-success)", color: "#fff", borderRadius: 7, textDecoration: "none" }}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <header style={{ marginBottom: 18 }}>
        <div className="gx-overline" style={{ marginBottom: 4 }}>Workspace</div>
        <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          Watching
          <span style={{ fontSize: 13, color: "var(--gx-ink-muted)", fontWeight: 400, fontFamily: "var(--gx-font-mono)" }}>
            {rows.length} species
          </span>
        </h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5, maxWidth: 640 }}>
          Senin için kaydettiğin species'lar. Aktivite akışı bunlara filtrelenir
          (planlanmış), bildirimler bunların üzerinden gelir.
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon="○"
          title="Henüz kimseyi izlemiyorsun"
          hint="Bir species sayfası açıp 'Watch' butonuna basarak izle. Buraya geri dönünce listende olacak."
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {rows.map((r) => (
            <WatchRow key={r.species_id} row={r}
              busy={unwatching === r.species_id}
              onUnwatch={() => unwatch(r.species_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WatchRow({ row, busy, onUnwatch }) {
  return (
    <div style={{
      padding: "var(--gx-card-pad-sm)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
      display: "flex", gap: 10, alignItems: "flex-start",
    }}>
      {row.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.thumbnail_url} alt="" loading="lazy"
          style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0, background: "var(--gx-surface-2)" }}
        />
      ) : (
        <div style={{ width: 56, height: 56, borderRadius: 8, background: "var(--gx-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gx-ink-faint)", fontSize: 18, flexShrink: 0 }}>
          ✿
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/geocon/species/${encodeURIComponent(row.species_id)}`}
          style={{
            display: "block",
            fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
            fontSize: 14, fontWeight: 700, color: "var(--gx-ink)",
            textDecoration: "none", lineHeight: 1.3,
          }}>
          {row.accepted_name}
        </Link>
        <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", marginTop: 2 }}>
          {row.family}
          {row.composite_score && <> · score {row.composite_score}</>}
        </div>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {row.iucn_status && <IucnPill status={row.iucn_status} />}
          <span style={{ fontSize: 9, color: "var(--gx-ink-faint)" }}>
            added {new Date(row.added_at).toLocaleDateString()}
          </span>
        </div>
        {row.note && (
          <p style={{ marginTop: 6, fontSize: 11, color: "var(--gx-ink-soft)", lineHeight: 1.4, fontStyle: "italic" }}>
            “{row.note}”
          </p>
        )}
      </div>
      <button
        onClick={onUnwatch}
        disabled={busy}
        title="Unwatch"
        aria-label="Remove from watchlist"
        style={{
          flexShrink: 0,
          padding: 6, background: "transparent",
          color: "var(--gx-ink-muted)",
          border: "1px solid var(--gx-border-soft)",
          borderRadius: 6, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: busy ? 0.5 : 1,
        }}
      >
        <EyeOff size={13} strokeWidth={1.75} />
      </button>
    </div>
  );
}
