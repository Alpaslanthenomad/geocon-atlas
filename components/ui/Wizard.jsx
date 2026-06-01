"use client";
// Multi-step wizard primitive.
//
//   const [step, setStep] = useState(0);
//   <Wizard
//     steps={["Detay", "Onay", "Tamam"]}
//     current={step}
//     onStepClick={(i) => i <= step && setStep(i)}
//   />
//   ...
//   <WizardNav
//     onPrev={() => setStep(s => s - 1)}
//     onNext={() => setStep(s => s + 1)}
//     onFinish={submit}
//     current={step}
//     total={3}
//     nextDisabled={!isValid}
//   />

import Button from "./Button";

export default function Wizard({ steps = [], current = 0, onStepClick, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 24, ...style }}>
      {steps.map((label, idx) => {
        const done = idx < current;
        const active = idx === current;
        const clickable = !!onStepClick && idx <= current;
        return (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={clickable ? () => onStepClick(idx) : undefined}
              disabled={!clickable}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "5px 10px",
                background: "transparent",
                border: "1px solid transparent",
                borderRadius: 999,
                cursor: clickable ? "pointer" : "default",
                color: active ? "var(--gx-ink)" : done ? "var(--gx-ink-soft)" : "var(--gx-ink-muted)",
                fontSize: 11, fontWeight: 600,
                fontFamily: "var(--gx-font-body)",
                opacity: !active && !done ? 0.85 : 1,
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                background: done ? "var(--gx-success)" : active ? "var(--gx-accent-violet)" : "var(--gx-surface-3)",
                color: done || active ? "#fff" : "var(--gx-ink-muted)",
              }}>
                {done ? "✓" : idx + 1}
              </span>
              <span>{label}</span>
            </button>
            {idx < steps.length - 1 && (
              <span style={{
                width: 22, height: 1,
                background: done ? "var(--gx-success)" : "var(--gx-border-soft)",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WizardNav({
  onPrev, onNext, onFinish,
  current = 0, total = 1,
  nextDisabled = false,
  prevLabel = "← Geri",
  nextLabel = "İleri →",
  finishLabel = "Tamamla",
  loading = false,
  style,
}) {
  const isLast = current >= total - 1;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 10, marginTop: 24,
      paddingTop: 16, borderTop: "1px solid var(--gx-border-soft)",
      ...style,
    }}>
      <Button
        variant="ghost"
        onClick={onPrev}
        disabled={current === 0 || loading}
      >
        {prevLabel}
      </Button>
      <Button
        variant="primary"
        onClick={isLast ? onFinish : onNext}
        disabled={nextDisabled || loading}
        loading={loading}
      >
        {isLast ? finishLabel : nextLabel}
      </Button>
    </div>
  );
}
