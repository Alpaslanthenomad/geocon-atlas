"use client";
// TrustStrip — narrow horizontal band of cell stats, typically used at
// the top of marketing/home pages.
//
//   <TrustStrip cells={[
//     { value: "47,066", label: "Species in atlas" },
//     { value: "12,309", label: "Researchers indexed" },
//     { value: "8",       label: "Active programs" },
//   ]} />

export default function TrustStrip({ cells = [] }) {
  if (!cells.length) return null;
  return (
    <div className="gx-trust-strip">
      {cells.map((c, i) => (
        <div key={i} className="gx-trust-cell">
          <div className="gx-trust-value" style={c.tint ? { color: c.tint } : undefined}>
            {c.value ?? "—"}
          </div>
          <div className="gx-trust-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
