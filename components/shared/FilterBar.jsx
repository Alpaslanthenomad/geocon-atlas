"use client";
// FilterBar — shared chip-row filter primitive.
//
// Generic chip selector with three modes:
//   value === null   → "all" pill highlighted
//   value === string → single-select; clicking another chip swaps
//   value === array  → multi-select; clicking toggles membership
//
// Audit V.4 — each route was rebuilding this UI inline. Now there's
// one canonical implementation and SearchRoute, ActivityRoute (the
// kind selector), and outcomes tier filter can all converge on it
// over time.
//
// Props:
//   options    Array<{ key, label, tint? }>
//   value      string | string[] | null
//   onChange   (next: same shape) => void
//   allLabel   string to render for the "no filter" pill (default "All")
//   multi      boolean — switch to array semantics. Default false.

export default function FilterBar({
  options = [],
  value = null,
  onChange = () => {},
  allLabel = "All",
  multi = false,
}) {
  const isMulti = multi === true || Array.isArray(value);
  const selected = isMulti ? (Array.isArray(value) ? value : []) : value;

  function clickAll() {
    onChange(isMulti ? null : null);
  }
  function clickOne(key) {
    if (isMulti) {
      const set = new Set(selected);
      if (set.has(key)) set.delete(key); else set.add(key);
      onChange(set.size === 0 ? null : Array.from(set));
    } else {
      onChange(selected === key ? null : key);
    }
  }

  const allActive = isMulti ? (!selected || selected.length === 0) : selected == null;

  return (
    <div role="toolbar" aria-label="Filter"
      style={{
        display: "flex", flexWrap: "wrap", gap: 6,
      }}>
      <Chip active={allActive} onClick={clickAll}>{allLabel}</Chip>
      {options.map((o) => {
        const active = isMulti
          ? selected.includes(o.key)
          : selected === o.key;
        return (
          <Chip key={o.key} active={active} tint={o.tint} onClick={() => clickOne(o.key)}>
            {o.label}
          </Chip>
        );
      })}
    </div>
  );
}

function Chip({ active, tint, onClick, children }) {
  const accent = tint || "var(--gx-accent-violet)";
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11, fontWeight: active ? 700 : 600,
        padding: "5px 11px",
        borderRadius: 7,
        background: active ? accent : "transparent",
        color: active ? "#fff" : "var(--gx-ink-soft)",
        border: `1px solid ${active ? accent : "var(--gx-border-soft)"}`,
        cursor: "pointer",
        transition: "background 0.15s var(--gx-ease)",
        fontFamily: "var(--gx-font-body)",
      }}
    >
      {children}
    </button>
  );
}
