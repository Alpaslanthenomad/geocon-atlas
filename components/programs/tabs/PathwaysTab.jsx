"use client";
import { useEffect, useState, useCallback } from "react";
import {
  fetchProgramPathways,
  activatePathway,
  declarePathway,
  PATHWAY_STATUS_LABEL,
  PATHWAY_STATUS_COLOR,
  PATHWAY_LABEL,
  PATHWAY_DESCRIPTION,
  PATHWAY_ICON,
} from "../../../lib/programPathways";
import DeclarePathwayModal from "../modals/DeclarePathwayModal";

/* ─────────────────────────────────────────────────────────
   PathwaysTab
   - Active pathways (declared / ready / active / realized / etc.)
   - Available pathway library (declare to start)
   - Gate-aware activate button
───────────────────────────────────────────────────────── */

export default function PathwaysTab({ programId, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);  // pathway ref currently being mutated
  const [msg, setMsg] = useState(null);
  const [declareOpen, setDeclareOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetchProgramPathways(programId);
    setData(d);
    setLoading(false);
  }, [programId]);

  useEffect(() => { load(); }, [load]);

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleActivate = async (pathway) => {
    const ref = pathway.is_custom ? `custom:${pathway.id}` : pathway.pathway_id;
    setBusy(ref);
    const res = await activatePathway(programId, ref);
    setBusy(null);
    if (res.success) {
      flash(`Activated: ${pathway.label || PATHWAY_LABEL[pathway.pathway_id] || pathway.pathway_id}`, true);
      load();
      if (onChanged) onChanged();
    } else {
      const reason = res.error || "Activation failed";
      flash(reason, false);
    }
  };

  const handleDeclareDone = (success, label) => {
    setDeclareOpen(false);
    if (success) {
      flash(`Declared: ${label}`, true);
      load();
      if (onChanged) onChanged();
    }
  };

  if (loading) return <div style={ph}>Loading pathways…</div>;
  if (!data) return <div style={{ ...ph, color: "#A32D2D" }}>Could not load pathways.</div>;

  const { is_owner, gate_passed, active = [], available = [] } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {!gate_passed && (
        <div style={gateClosedBanner}>
          ⏳ <strong>Foundation gate is closed.</strong> Pathways can be declared but not activated until the foundation is complete.
        </div>
      )}

      {msg && (
        <div style={{
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 13,
          background: msg.ok ? "#DCFCE7" : "#FEE2E2",
          color: msg.ok ? "#166534" : "#991B1B",
          border: `1px solid ${msg.ok ? "#BBF7D0" : "#FECACA"}`,
        }}>
          {msg.text}
        </div>
      )}

      {/* Active pathways */}
      <section>
        <SectionHeader title="Active pathways" count={active.length} />
        {active.length === 0 ? (
          <div style={{ ...ph, fontSize: 13 }}>
            No pathways declared yet. {is_owner && <em>Declare one from the library below.</em>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {active.map((p) => (
              <ActivePathwayRow
                key={p.id}
                pathway={p}
                isOwner={is_owner}
                gatePassed={gate_passed}
                busy={busy === (p.is_custom ? `custom:${p.id}` : p.pathway_id)}
                onActivate={() => handleActivate(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Available library */}
      {is_owner && available.length > 0 && (
        <section>
          <SectionHeader title="Available pathway library" count={available.length} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {available.map((lib) => (
              <LibraryCard
                key={lib.id}
                lib={lib}
                onDeclare={async () => {
                  setBusy(`declare:${lib.id}`);
                  const res = await declarePathway(programId, { pathwayId: lib.id });
                  setBusy(null);
                  if (res.success) {
                    flash(`Declared: ${PATHWAY_LABEL[lib.id] || lib.id}`, true);
                    load();
                    if (onChanged) onChanged();
                  } else {
                    flash(res.error || "Declare failed", false);
                  }
                }}
                busy={busy === `declare:${lib.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Custom pathway */}
      {is_owner && (
        <section>
          <button onClick={() => setDeclareOpen(true)} style={btnGhost}>
            + Declare custom pathway
          </button>
        </section>
      )}

      {declareOpen && (
        <DeclarePathwayModal
          programId={programId}
          onClose={() => setDeclareOpen(false)}
          onDone={handleDeclareDone}
        />
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionHeader({ title, count }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 8,
      paddingBottom: 6,
      borderBottom: "1px solid #E5E7EB",
    }}>
      <h3 style={{ margin: 0, fontSize: 14, color: "#111827" }}>{title}</h3>
      {typeof count === "number" && (
        <span style={{ fontSize: 12, color: "#6B7280" }}>{count}</span>
      )}
    </div>
  );
}

function ActivePathwayRow({ pathway, isOwner, gatePassed, busy, onActivate }) {
  const sc = PATHWAY_STATUS_COLOR[pathway.status] || PATHWAY_STATUS_COLOR.declared;
  const label = pathway.is_custom
    ? (pathway.custom_label || "Custom pathway")
    : (PATHWAY_LABEL[pathway.pathway_id] || pathway.pathway_id);
  const icon = pathway.is_custom ? "✨" : (PATHWAY_ICON[pathway.pathway_id] || "🔹");

  const canActivate = isOwner
    && pathway.status === "ready_to_activate"
    && gatePassed;

  return (
    <div style={{
      border: "1px solid #E5E7EB",
      borderRadius: 8,
      padding: 12,
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "#FFFFFF",
    }}>
      <div style={{ fontSize: 24 }}>{icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{label}</span>
          <span style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 999,
            background: sc.bg,
            color: sc.color,
            border: `1px solid ${sc.border}`,
            fontWeight: 600,
          }}>
            {PATHWAY_STATUS_LABEL[pathway.status] || pathway.status}
          </span>
          {pathway.is_custom && (
            <span style={{ fontSize: 10, color: "#6B7280" }}>custom</span>
          )}
        </div>
        {!pathway.is_custom && PATHWAY_DESCRIPTION[pathway.pathway_id] && (
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            {PATHWAY_DESCRIPTION[pathway.pathway_id]}
          </div>
        )}
        {pathway.origin && pathway.origin !== "declared" && (
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2, textTransform: "uppercase" }}>
            origin: {pathway.origin}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0 }}>
        {canActivate && (
          <button onClick={onActivate} disabled={busy} style={busy ? btnDisabled : btnPrimary}>
            {busy ? "Activating…" : "Activate"}
          </button>
        )}
        {pathway.status === "declared" && (
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>
            Awaiting prerequisite tics
          </span>
        )}
        {pathway.status === "ready_to_activate" && !gatePassed && (
          <span style={{ fontSize: 11, color: "#92400E" }} title="Foundation gate closed">
            🔒 Gate closed
          </span>
        )}
      </div>
    </div>
  );
}

function LibraryCard({ lib, onDeclare, busy }) {
  const icon = PATHWAY_ICON[lib.id] || "🔹";
  return (
    <div style={{
      border: "1px solid #E5E7EB",
      borderRadius: 10,
      padding: 14,
      background: "#FAFAFA",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <strong style={{ fontSize: 14, color: "#111827" }}>
          {PATHWAY_LABEL[lib.id] || lib.id}
        </strong>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "#6B7280", lineHeight: 1.4 }}>
        {PATHWAY_DESCRIPTION[lib.id] || lib.description || ""}
      </p>
      {Array.isArray(lib.required_tics) && lib.required_tics.length > 0 && (
        <div style={{ fontSize: 10, color: "#9CA3AF" }}>
          requires: {lib.required_tics.join(", ")}
        </div>
      )}
      <button onClick={onDeclare} disabled={busy} style={busy ? btnDisabled : btnSecondary}>
        {busy ? "Declaring…" : "Declare"}
      </button>
    </div>
  );
}

/* ─── styles ─── */

const ph = {
  padding: 24,
  textAlign: "center",
  color: "#6B7280",
  background: "#F9FAFB",
  borderRadius: 8,
  fontSize: 13,
};

const gateClosedBanner = {
  padding: "10px 14px",
  borderRadius: 8,
  background: "#FEF3C7",
  color: "#92400E",
  fontSize: 13,
  border: "1px solid #FDE68A",
};

const btnPrimary = {
  fontSize: 13,
  padding: "6px 14px",
  borderRadius: 6,
  border: "1px solid #0E7C66",
  background: "#0E7C66",
  color: "#FFFFFF",
  cursor: "pointer",
  fontWeight: 600,
};

const btnSecondary = {
  fontSize: 12,
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#374151",
  cursor: "pointer",
};

const btnDisabled = {
  fontSize: 12,
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #E5E7EB",
  background: "#F3F4F6",
  color: "#9CA3AF",
  cursor: "not-allowed",
};

const btnGhost = {
  fontSize: 13,
  padding: "8px 14px",
  borderRadius: 6,
  border: "1px dashed #D1D5DB",
  background: "transparent",
  color: "#6B7280",
  cursor: "pointer",
};
