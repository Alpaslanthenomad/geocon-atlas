"use client";
// components/geocon/AccreditationBanner.jsx
//
// Compact card rendered on the org detail page. Communicates the current
// accreditation state and offers the right next action for the viewer:
//   * org admin + no application yet  → "Apply for accreditation"
//   * org admin + applied / under review → status + "what next" copy
//   * accredited → green badge + level + scope chips
//   * rejected / revoked → red-tinted card + reason + re-apply CTA

const STATUS_META = {
  not_applied: { tint: "var(--gx-ink-muted)", bg: "var(--gx-surface-3)",
    label: "Not applied",
    desc: "This organization has not yet applied for Venn accreditation. Accreditation unlocks the ability to participate in collaborative programs and to send / receive proposals." },
  applied:     { tint: "#185FA5", bg: "#E6F1FB",
    label: "Application submitted",
    desc: "Awaiting Venn review. You'll be notified when a decision is reached." },
  under_review:{ tint: "#534AB7", bg: "#EEEDFE",
    label: "Under Venn review",
    desc: "A Venn reviewer is evaluating this application." },
  accredited:  { tint: "#0F6E56", bg: "#E1F5EE",
    label: "Venn-accredited",
    desc: "This organization is accredited and may participate in programs and proposals." },
  rejected:    { tint: "#A32D2D", bg: "#FCEBEB",
    label: "Accreditation rejected",
    desc: "The most recent application was not accepted. The org admin may re-apply with updated information." },
  revoked:     { tint: "#A32D2D", bg: "#FCEBEB",
    label: "Accreditation revoked",
    desc: "Previously accredited; accreditation was withdrawn. The org admin may re-apply." },
};

const LEVEL_LABEL = {
  basic:     "Basic",
  partner:   "Partner",
  preferred: "Preferred",
};

export default function AccreditationBanner({ org, isOrgAdmin, onApply }) {
  const status = org.accreditation_status || "not_applied";
  const meta = STATUS_META[status] || STATUS_META.not_applied;
  const canApply = isOrgAdmin && ["not_applied", "rejected", "revoked"].includes(status);

  return (
    <div
      style={{
        background: meta.bg,
        border: `1px solid ${meta.tint}33`,
        borderLeft: `4px solid ${meta.tint}`,
        borderRadius: 10,
        padding: "14px 18px",
        marginBottom: 18,
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: meta.tint, textTransform: "uppercase", letterSpacing: 1 }}>
            Accreditation
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: meta.tint }}>
            · {meta.label}
          </span>
          {status === "accredited" && org.accreditation_level && (
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: meta.tint, color: "#fff", fontWeight: 700 }}>
              {LEVEL_LABEL[org.accreditation_level] || org.accreditation_level}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#444", lineHeight: 1.5 }}>
          {meta.desc}
        </div>

        {status === "accredited" && Array.isArray(org.accreditation_scope) && org.accreditation_scope.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              Accredited scope
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {org.accreditation_scope.map((s) => (
                <span key={s} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "var(--gx-card-bg)", border: `1px solid ${meta.tint}33`, color: meta.tint }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {(status === "rejected" || status === "revoked") && org.accreditation_notes && (
          <div style={{ marginTop: 8, fontSize: 11, color: meta.tint, fontStyle: "italic" }}>
            Reviewer note: {org.accreditation_notes}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {canApply && (
          <button
            onClick={onApply}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "8px 14px",
              background: meta.tint,
              color: "#fff",
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {status === "not_applied" ? "Apply for accreditation" : "Re-apply"}
          </button>
        )}
        {!canApply && isOrgAdmin && (status === "applied" || status === "under_review") && (
          <div style={{ fontSize: 10, color: meta.tint, fontWeight: 600 }}>
            Application pending
          </div>
        )}
      </div>
    </div>
  );
}
