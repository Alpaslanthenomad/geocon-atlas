"use client";
// Button — semantic action element.
//
//   <Button variant="primary" size="lg">Submit</Button>
//   <Button as="a" href="/x" variant="ghost">Cancel</Button>
//   <Button variant="danger" onClick={...}>Delete</Button>
//
// Variants: primary, secondary, ghost, danger, link.
// Sizes:    sm, md (default), lg.

const VARIANT = {
  primary:   "gx-btn-primary",
  secondary: "gx-btn-secondary",
  ghost:     "gx-btn-ghost",
  danger:    "gx-btn-danger",
  link:      "gx-btn-link",
};

const SIZE = {
  sm: "gx-btn-sm",
  md: "",
  lg: "gx-btn-lg",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  iconLeft,
  iconRight,
  loading = false,
  disabled,
  ...rest
}) {
  const cls = [
    "gx-btn",
    "gx-btn-base",
    VARIANT[variant] || VARIANT.primary,
    SIZE[size] || "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <Tag
      className={cls}
      disabled={Tag === "button" ? (disabled || loading) : undefined}
      aria-disabled={(disabled || loading) || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {iconLeft && <span aria-hidden>{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && <span aria-hidden>{iconRight}</span>}
    </Tag>
  );
}
