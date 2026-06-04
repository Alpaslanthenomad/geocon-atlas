"use client";
// A2 — Specimen / Herbarium linker.
//
// Mounted on SpeciesDetailRoute between SpeciesTimeline and
// CommercializedOutcomes. Lists every herbarium specimen of the
// species (via list_species_specimens RPC) and lets a signed-in
// researcher ask the holding institution for physical pickup /
// access by calling request_specimen_pickup with a purpose markdown.
//
// Verification: today admin acts on behalf of the institution
// (status flips happen via specimen_pickup_requests RLS update
// policy); future pass replaces this with institution-account flow.

import { useEffect, useState } from "react";
import { Boxes, Building2, Calendar, Send } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { flag } from "../../lib/atlas/format";
import { useToast } from "../ui";
import { EmptyState } from "../shared";

export default function SpecimenLinker({ speciesId, speciesName }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { specimen, purpose }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("list_species_specimens", {
        p_species_id: speciesId,
      });
      if (cancelled) return;
      if (!error) setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [speciesId]);

  async function submitRequest() {
    if (!modal?.specimen?.id) return;
    if (!user) {
      toast.error("Sign in to request access");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("request_specimen_pickup", {
        p_specimen_id: modal.specimen.id,
        p_purpose_md: (modal.purpose || "").trim() || null,
      });
      if (error) throw error;
      toast.info("Pickup request sent", {
        detail: "Holder will respond — track status from your workspace.",
      });
      setModal(null);
    } catch (e) {
      toast.error("Could not send request", { detail: e?.message || String(e) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{
      background: "var(--gx-card-bg)",
      border: "1px solid var(--gx-card-border)",
      borderRadius: "var(--gx-card-radius)",
      padding: "var(--gx-card-pad, 16px)",
    }}>
      <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Boxes size={16} strokeWidth={1.85} style={{ color: "var(--gx-accent-violet)" }} />
        <h3 style={{
          fontFamily: "var(--gx-font-serif)",
          fontSize: 15, fontWeight: 700, color: "var(--gx-ink)",
          margin: 0,
        }}>
          Specimens · herbarium holdings
        </h3>
        <span style={{
          fontSize: 11, fontFamily: "var(--gx-font-mono)", color: "var(--gx-ink-muted)",
          marginLeft: "auto",
        }}>
          {loading ? "…" : `${rows.length}`}
        </span>
      </header>

      {loading ? (
        <div style={{ padding: 20, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12 }}>
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="○"
          title="No specimens catalogued yet"
          hint="Physical sheets / accessions for this species haven't been linked to the atlas. As institutions onboard their holdings, they will surface here."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((r) => (
            <SpecimenRow
              key={r.id}
              row={r}
              canRequest={!!user}
              onRequest={() => setModal({ specimen: r, purpose: "" })}
            />
          ))}
        </div>
      )}

      {!user && rows.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--gx-ink-muted)" }}>
          Sign in to request physical access to a specimen.
        </div>
      )}

      {modal && (
        <PickupModal
          specimen={modal.specimen}
          speciesName={speciesName}
          purpose={modal.purpose}
          setPurpose={(v) => setModal((m) => ({ ...m, purpose: v }))}
          onClose={() => !submitting && setModal(null)}
          onSubmit={submitRequest}
          submitting={submitting}
        />
      )}
    </section>
  );
}

function SpecimenRow({ row, canRequest, onRequest }) {
  return (
    <div style={{
      padding: "10px 12px",
      background: "var(--gx-surface)",
      border: "1px solid var(--gx-border-soft)",
      borderRadius: 9,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        flexShrink: 0,
        width: 32, height: 32, borderRadius: 7,
        background: "color-mix(in srgb, var(--gx-accent-violet) 14%, transparent)",
        color: "var(--gx-accent-violet)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Building2 size={14} strokeWidth={1.85} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: "var(--gx-ink)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {row.institution_name || row.institution_code || "Unknown institution"}
          </span>
          {row.institution_code && row.institution_name && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              padding: "2px 6px", borderRadius: 999,
              background: "var(--gx-surface-2)", color: "var(--gx-ink-soft)",
              fontFamily: "var(--gx-font-mono)",
            }}>
              {row.institution_code}
            </span>
          )}
        </div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 11, color: "var(--gx-ink-muted)" }}>
          {row.barcode && (
            <span style={{ fontFamily: "var(--gx-font-mono)", color: "var(--gx-ink-soft)" }}>
              {row.barcode}
            </span>
          )}
          {row.collected_at && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Calendar size={10} strokeWidth={1.85} />
              {new Date(row.collected_at).toLocaleDateString()}
            </span>
          )}
          {row.country && (
            <span title={row.country} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>{flag(row.country) || "🌐"}</span>
              {row.country}
            </span>
          )}
          {row.collector && (
            <span style={{ fontStyle: "italic" }}>
              leg. {row.collector}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onRequest}
        disabled={!canRequest}
        title={canRequest ? "Request physical access" : "Sign in to request access"}
        style={{
          flexShrink: 0,
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 11, fontWeight: 700,
          padding: "7px 11px", borderRadius: 7,
          background: canRequest ? "var(--gx-accent-violet)" : "var(--gx-surface-2)",
          color: canRequest ? "#fff" : "var(--gx-ink-muted)",
          border: "none",
          cursor: canRequest ? "pointer" : "not-allowed",
        }}
      >
        <Send size={11} strokeWidth={2} />
        Request access
      </button>
    </div>
  );
}

function PickupModal({ specimen, speciesName, purpose, setPurpose, onClose, onSubmit, submitting }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520,
          background: "var(--gx-card-bg)",
          border: "1px solid var(--gx-card-border)",
          borderRadius: "var(--gx-card-radius)",
          padding: 22,
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div className="gx-overline" style={{ marginBottom: 4 }}>Pickup request</div>
        <h2 style={{
          fontFamily: "var(--gx-font-display)",
          fontSize: 20, fontWeight: 700, color: "var(--gx-ink)",
          margin: "0 0 8px",
        }}>
          Request access to specimen
        </h2>
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", lineHeight: 1.55, marginBottom: 14 }}>
          {specimen.institution_name || specimen.institution_code || "Holder"}
          {specimen.barcode && (
            <> · <span style={{ fontFamily: "var(--gx-font-mono)" }}>{specimen.barcode}</span></>
          )}
          {speciesName && (
            <> · <span style={{ fontFamily: "var(--gx-font-serif)", fontStyle: "italic" }}>{speciesName}</span></>
          )}
        </div>

        <label style={{
          display: "block",
          fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase",
          color: "var(--gx-ink-faint)", marginBottom: 6,
        }}>
          Purpose (markdown supported)
        </label>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          rows={6}
          placeholder="Why do you need this specimen? Method, scope, timeline. Holder reviews this before approving."
          style={{
            width: "100%", boxSizing: "border-box",
            padding: 10,
            fontSize: 12, lineHeight: 1.55,
            fontFamily: "var(--gx-font-body)",
            background: "var(--gx-surface)",
            color: "var(--gx-ink)",
            border: "1px solid var(--gx-border-soft)",
            borderRadius: 8,
            resize: "vertical",
          }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "8px 14px",
              fontSize: 12, fontWeight: 600,
              background: "transparent",
              color: "var(--gx-ink-soft)",
              border: "1px solid var(--gx-border-soft)",
              borderRadius: 7,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            style={{
              padding: "8px 14px",
              fontSize: 12, fontWeight: 700,
              background: "var(--gx-accent-violet)",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              cursor: submitting ? "wait" : "pointer",
              opacity: submitting ? 0.7 : 1,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            <Send size={12} strokeWidth={2} />
            {submitting ? "Sending…" : "Send request"}
          </button>
        </div>
      </div>
    </div>
  );
}
