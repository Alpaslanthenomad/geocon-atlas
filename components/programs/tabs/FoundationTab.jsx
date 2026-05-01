"use client";
import { useEffect, useState, useCallback } from "react";
import {
  fetchFoundationStatus,
  groupTicsByWheel,
  gateProgressPct,
  TIC_STATUS_LABEL,
  TIC_STATUS_COLOR,
  WHEEL_LABEL,
  WHEEL_COLOR,
} from "../../../lib/programTics";
import CompleteTicModal from "../modals/CompleteTicModal";
import WaiveTicModal from "../modals/WaiveTicModal";

/* ─────────────────────────────────────────────────────────
   FoundationTab
   - Shows the two core wheels (Conservation + Science)
   - Renders foundation tics + deep tics (Science only)
   - Gate banner: Decision Gate progress + missing tics
   - Owner can complete/waive tics via modals
───────────────────────────────────────────────────────── */

export default function FoundationTab({ programId, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [waiveTarget, setWaiveTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetchFoundationStatus(programId);
    setData(d);
    setLoading(false);
  }, [programId]);

  useEffect(() => { load(); }, [load]);

  const handleAfterChange = () => {
    setCompleteTarget(null);
    setWaiveTarget(null);
    load();
    if (onChanged) onChanged();
  };

  if (loading) {
    return <div style={ph}>Loading foundation status…</div>;
  }
  if (!data) {
    return <div style={{ ...ph, color: "#A32D2D" }}>Could not load foundation status.</div>;
  }

  const { is_owner, gate, tics } = data;
  const groups = groupTicsByWheel(tics || []);
  const pct = gateProgressPct(gate);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Decision Gate banner */}
      <GateBanner gate={gate} pct={pct} />

      {/* Conservation wheel */}
      {groups.conservation && (
        <WheelSection
          wheelType="conservation"
          buckets={groups.conservation}
          isOwner={is_owner}
          onComplete={(t) => setCompleteTarget(t)}
          onWaive={(t) => setWaiveTarget(t)}
        />
      )}

      {/* Science wheel */}
      {groups.science && (
        <WheelSection
          wheelType="science"
          buckets={groups.science}
          isOwner={is_owner}
          onComplete={(t) => setCompleteTarget(t)}
          onWaive={(t) => setWaiveTarget(t)}
        />
      )}

      {/* Modals */}
      {completeTarget && (
        <CompleteTicModal
          programId={programId}
          tic={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onCompleted={handleAfterChange}
        />
      )}
      {waiveTarget && (
        <WaiveTicModal
          programId={programId}
          tic={waiveTarget}
          onClose={() => setWaiveTarget(null)}
          onWaived={handleAfterChange}
        />
      )}
    </div>
  );
}

/* ─── Gate Banner ─── */

function GateBanner({ gate, pct }) {
  const passed = gate?.passed;
  const counts = gate?.counts || {};
  const missing = gate?.missing_tics || [];

  return (
    <div style={{
      border: "1px solid",
      borderColor: passed ? "#86EFAC" : "#FDE68A",
      background: passed
        ? "linear-gradient(180deg,#F0FDF4,#DCFCE7)"
        : "linear-gradient(180deg,#FFFBEB,#FEF3C7)",
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{passed ? "🎯" : "⏳"}</span>
            <h3 style={{ margin: 0, fontSize: 16, color: passed ? "#065F46" : "#92400E" }}>
              Decision Gate {passed ? "open" : "in progress"}
            </h3>
          </div>
          <p style={{ margin: "6px 0 0 32px", fontSize: 13, color: passed ? "#065F46" : "#78350F" }}>
            {passed
              ? "Foundation complete — value pathways may be activated."
              : "Complete the required foundation tics before activating any pathway."
            }
          </p>
        </div>

        <div style={{ minWidth: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#374151", marginBottom: 4 }}>
            <span>Progress</span>
            <span style={{ fontWeight: 600 }}>
              {counts.required_completed ?? 0} / {counts.required_total ?? 0} required ({pct}%)
            </span>
          </div>
          <div style={{ height: 8, background: "#FFFFFF80", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: passed ? "#10B981" : "#F59E0B",
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      </div>

      {!passed && missing.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#78350F" }}>
          <strong>Missing:</strong> {missing.join(", ")}
        </div>
      )}
    </div>
  );
}

/* ─── Wheel Section ─── */

function WheelSection({ wheelType, buckets, isOwner, onComplete, onWaive }) {
  const c = WHEEL_COLOR[wheelType] || { primary: "#374151", soft: "#F3F4F6" };
  const label = WHEEL_LABEL[wheelType] || wheelType;

  const allTics = [
    ...(buckets.foundation || []),
    ...(buckets.deep || []),
    ...(buckets.bonus || []),
  ];

  const stats = allTics.reduce((acc, t) => {
    acc.total++;
    if (t.status === "completed") acc.done++;
    if (t.status === "waived") acc.waived++;
    return acc;
  }, { total: 0, done: 0, waived: 0 });

  return (
    <section style={{
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      background: "#FFFFFF",
      overflow: "hidden",
    }}>
      <header style={{
        padding: "12px 16px",
        background: c.soft,
        borderBottom: "1px solid #E5E7EB",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, color: c.primary }}>{label}</h3>
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            {stats.done}/{stats.total} completed{stats.waived ? ` • ${stats.waived} waived` : ""}
          </span>
        </div>
      </header>

      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {buckets.foundation?.length > 0 && (
          <BucketBlock title="Foundation" tics={buckets.foundation} isOwner={isOwner} onComplete={onComplete} onWaive={onWaive} />
        )}
        {buckets.deep?.length > 0 && (
          <BucketBlock title="Deep (Pathway unlocks)" tics={buckets.deep} isOwner={isOwner} onComplete={onComplete} onWaive={onWaive} muted />
        )}
        {buckets.bonus?.length > 0 && (
          <BucketBlock title="Bonus" tics={buckets.bonus} isOwner={isOwner} onComplete={onComplete} onWaive={onWaive} muted />
        )}
      </div>
    </section>
  );
}

function BucketBlock({ title, tics, isOwner, onComplete, onWaive, muted }) {
  return (
    <div>
      <div style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        color: muted ? "#9CA3AF" : "#374151",
        margin: "4px 0 6px 0",
        fontWeight: 600,
      }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tics.map((t) => (
          <TicRow
            key={t.tic_id}
            tic={t}
            isOwner={isOwner}
            onComplete={onComplete}
            onWaive={onWaive}
          />
        ))}
      </div>
    </div>
  );
}

function TicRow({ tic, isOwner, onComplete, onWaive }) {
  const sc = TIC_STATUS_COLOR[tic.status] || TIC_STATUS_COLOR.pending;
  const isDone = tic.status === "completed" || tic.status === "waived";

  return (
    <div style={{
      border: "1px solid #E5E7EB",
      borderRadius: 8,
      padding: "10px 12px",
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      background: isDone ? "#FAFAFA" : "#FFFFFF",
    }}>
      {/* status pill */}
      <span style={{
        flexShrink: 0,
        fontSize: 11,
        padding: "3px 8px",
        borderRadius: 999,
        background: sc.bg,
        color: sc.color,
        border: `1px solid ${sc.border}`,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}>
        {TIC_STATUS_LABEL[tic.status] || tic.status}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{tic.label}</span>
          {tic.is_core && (
            <span style={ticTag("#FEE2E2", "#991B1B")}>core</span>
          )}
          {tic.is_required && (
            <span style={ticTag("#DBEAFE", "#1E40AF")}>required</span>
          )}
          {tic.evidence_required && (
            <span style={ticTag("#FEF3C7", "#92400E")}>evidence</span>
          )}
          {tic.is_custom && (
            <span style={ticTag("#E0E7FF", "#3730A3")}>custom</span>
          )}
        </div>
        {tic.description && (
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{tic.description}</div>
        )}
        {tic.status === "completed" && tic.evidence_link && (
          <div style={{ fontSize: 11, marginTop: 4 }}>
            <a href={tic.evidence_link} target="_blank" rel="noopener noreferrer" style={{ color: "#1D4ED8" }}>
              📎 {tic.evidence_type || "Evidence"}
            </a>
            {tic.evidence_notes && <span style={{ color: "#6B7280", marginLeft: 6 }}>· {tic.evidence_notes}</span>}
          </div>
        )}
        {tic.status === "waived" && tic.waiver_reason && (
          <div style={{ fontSize: 11, marginTop: 4, color: "#6B7280", fontStyle: "italic" }}>
            Waived: {tic.waiver_reason}
          </div>
        )}
      </div>

      {isOwner && tic.status !== "completed" && tic.status !== "waived" && (
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={() => onComplete(tic)} style={btnPrimary}>Complete</button>
          {!tic.is_required && (
            <button onClick={() => onWaive(tic)} style={btnSecondary}>Waive</button>
          )}
          {tic.is_required && tic.is_core && (
            <button onClick={() => onWaive(tic)} style={btnSecondary} title="Core required tic — waive needs justification.">Waive…</button>
          )}
        </div>
      )}
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

const ticTag = (bg, color) => ({
  fontSize: 10,
  padding: "2px 6px",
  borderRadius: 4,
  background: bg,
  color,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.3,
});

const btnPrimary = {
  fontSize: 12,
  padding: "5px 10px",
  borderRadius: 6,
  border: "1px solid #0E7C66",
  background: "#0E7C66",
  color: "#FFFFFF",
  cursor: "pointer",
  fontWeight: 600,
};

const btnSecondary = {
  fontSize: 12,
  padding: "5px 10px",
  borderRadius: 6,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#374151",
  cursor: "pointer",
};
