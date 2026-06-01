"use client";
// Floating-label form fields. Label slides up + shrinks when the
// field has focus or content.
//
//   <FloatingInput label="Title" value={t} onChange={...} required />
//   <FloatingTextarea label="Description" rows={4} value={d} onChange={...} />
//   <FloatingSelect label="Kind" value={k} onChange={...}>
//     <option value="">Pick one</option>
//     <option value="a">A</option>
//   </FloatingSelect>

import { useId, useState } from "react";

function Wrapper({ children, error, help, style }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <div style={{ position: "relative" }}>{children}</div>
      {(error || help) && (
        <div className={error ? "gx-help gx-help-error" : "gx-help"}>
          {error || help}
        </div>
      )}
    </div>
  );
}

function labelStyle(active) {
  return {
    position: "absolute",
    pointerEvents: "none",
    left: 12,
    top: active ? -8 : 11,
    fontSize: active ? 10 : 13,
    fontWeight: active ? 700 : 500,
    letterSpacing: active ? 0.12 : 0,
    textTransform: active ? "uppercase" : "none",
    color: active ? "var(--gx-accent-violet)" : "var(--gx-ink-muted)",
    background: active ? "var(--gx-surface-2)" : "transparent",
    padding: active ? "0 6px" : 0,
    transition: "all 120ms cubic-bezier(0.2, 0.7, 0.2, 1)",
    fontFamily: "var(--gx-font-body)",
  };
}

export function FloatingInput({ label, value, onChange, error, help, style, required, ...rest }) {
  const id = useId();
  const [focus, setFocus] = useState(false);
  const active = focus || !!value;
  return (
    <Wrapper error={error} help={help} style={style}>
      <input
        id={id}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value, e)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="gx-input"
        style={{ paddingTop: active ? 18 : 14, paddingBottom: active ? 10 : 10 }}
        aria-required={required || undefined}
        {...rest}
      />
      <label htmlFor={id} style={labelStyle(active)}>
        {label}{required && " *"}
      </label>
    </Wrapper>
  );
}

export function FloatingTextarea({ label, value, onChange, error, help, style, rows = 3, required, ...rest }) {
  const id = useId();
  const [focus, setFocus] = useState(false);
  const active = focus || !!value;
  return (
    <Wrapper error={error} help={help} style={style}>
      <textarea
        id={id}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value, e)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="gx-textarea"
        rows={rows}
        style={{ paddingTop: active ? 18 : 14 }}
        aria-required={required || undefined}
        {...rest}
      />
      <label htmlFor={id} style={labelStyle(active)}>
        {label}{required && " *"}
      </label>
    </Wrapper>
  );
}

export function FloatingSelect({ label, value, onChange, error, help, style, required, children, ...rest }) {
  const id = useId();
  const [focus, setFocus] = useState(false);
  const active = focus || !!value;
  return (
    <Wrapper error={error} help={help} style={style}>
      <select
        id={id}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value, e)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="gx-select"
        style={{ paddingTop: active ? 18 : 14 }}
        aria-required={required || undefined}
        {...rest}
      >
        {children}
      </select>
      <label htmlFor={id} style={labelStyle(active)}>
        {label}{required && " *"}
      </label>
    </Wrapper>
  );
}
