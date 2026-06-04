"use client";
// v4.1-d — Specimen request inbox.
//
// Lists every herbarium specimen pickup request the signed-in user has
// raised, with status, target institution + barcode + species, and the
// purpose markdown they submitted. Mounts on /geocon/profile so it
// lives next to webhook channels + API keys + my contributions.
//
// Backed by list_my_specimen_requests() (SECURITY DEFINER, RLS-safe).
// Pure read-only; updating a request status is the institution
// curator's job and happens out-of-band.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Clock, CheckCircle2, XCircle, Hourglass, Microscope } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const STATUS_META = {
  pending:    { label: "Pending",   icon: Hourglass,    color: "var(--gx-warning)" },
  approved:   { label: "Approved",  icon: CheckCircle2, color: "var(--gx-success)" },
  declined:   { label: "Declined",  icon: XCircle,      color: "var(--gx-danger)"  },
  fulfilled:  { label: "Fulfilled", icon: CheckCircle2, color: "var(--gx-success)" },
  cancelled:  { label: "Cancelled", icon: XCircle,      color: "var(--gx-ink-muted)" },
};

export default function SpecimenRequestInbox() {
  const { user } = useAuthContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.rpc("list_my_specimen_requests");
      if (!cancelled) {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  return (
    <section style={{
      marginTop: 14,
      padding: "var(--gx-card-pad)",
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
    }}>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        flexWrap: "wrap", gap: 8, marginBottom: 12,
      }}>
        <div>
          <div className="gx-overline">Specimens</div>
          <h2 style={{
            fontFamily: "var(--gx-font-display)",
            fontSize: 18, fontWeight: 700, color: "var(--gx-ink)",
            margin: 0, display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <Inbox size={16} strokeWidth={1.85} style={{ color: "var(--gx-accent-violet)" }} />
            My specimen requests
          </h2>
        </div>
        <span style={{ fontSize: 11, color: "var(--gx-ink-muted)" }}>
          {rows.length} request{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <div className="gx-skeleton" style={{ height: 60 }} />
      ) : rows.length === 0 ? (
        <Empty />
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => <RequestRow key={r.id} row={r} />)}
        </ul>
      )}
    </section>
  );
}

function RequestRow({ row }) {
  const meta = STATUS_META[row.status] || STATUS_META.pending;
  const StatusIcon = meta.icon;
  return (
    <li style={{
      padding: 11,
      background: "var(--gx-surface-2)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: 9,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
          padding: "2px 8px", borderRadius: 999,
          background: `color-mix(in srgb, ${meta.color} 18%, transparent)`,
          color: meta.color,
          fontFamily: "var(--gx-font-mono)",
        }}>
          <StatusIcon size={9} strokeWidth={2.2} />
          {meta.label}
        </span>
        {row.species_id && (
          <Link href={`/geocon/species/${encodeURIComponent(row.species_id)}`}
            style={{
              fontFamily: "var(--gx-font-serif)", fontStyle: "italic",
              fontSize: 13, color: "var(--gx-ink)", fontWeight: 600,
              textDecoration: "none",
            }}>
            {row.species_name || row.species_id}
          </Link>
        )}
        <span style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Clock size={9} strokeWidth={2} />
          {new Date(row.requested_at).toLocaleDateString()}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--gx-ink-soft)", flexWrap: "wrap", marginBottom: 4 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Microscope size={10} strokeWidth={1.9} style={{ color: "var(--gx-ink-muted)" }} />
          <strong style={{ color: "var(--gx-ink)" }}>{row.institution_name || row.institution_code || "Institution"}</strong>
        </span>
        {row.barcode && (
          <span style={{ fontFamily: "var(--gx-font-mono)", fontSize: 11, color: "var(--gx-ink-muted)" }}>
            {row.barcode}
          </span>
        )}
        {row.country && (
          <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
            · {row.country}
          </span>
        )}
      </div>

      {row.purpose_md && (
        <div style={{
          marginTop: 5, fontSize: 11, color: "var(--gx-ink-soft)",
          fontStyle: "italic", lineHeight: 1.5,
          borderLeft: "2px solid var(--gx-border-soft)",
          paddingLeft: 8,
        }}>
          {row.purpose_md.length > 220 ? row.purpose_md.slice(0, 220) + "…" : row.purpose_md}
        </div>
      )}

      {row.responded_at && (
        <div style={{ marginTop: 5, fontSize: 10, color: "var(--gx-ink-muted)" }}>
          Responded {new Date(row.responded_at).toLocaleString()}
        </div>
      )}
    </li>
  );
}

function Empty() {
  return (
    <div style={{
      padding: 22, textAlign: "center",
      background: "var(--gx-surface-2)",
      border: "1px dashed var(--gx-border-soft)",
      borderRadius: 9,
      fontSize: 12, color: "var(--gx-ink-muted)", lineHeight: 1.5,
    }}>
      You haven't requested any specimens yet. Browse the{" "}
      <Link href="/geocon/specimens" style={{ color: "var(--gx-accent-azure)", fontWeight: 600, textDecoration: "none" }}>
        Specimens atlas
      </Link>{" "}
      or open a species page to find a herbarium loanable accession.
    </div>
  );
}
