"use client";
// Typography primitives — opinionated wrappers around the .gx-* class
// hooks. Use these instead of inline font-size styles wherever
// possible so the design tokens stay the single source of truth.

export function Display({ children, as: Tag = "h1", className = "", style }) {
  return <Tag className={`gx-display ${className}`} style={style}>{children}</Tag>;
}
export function H1({ children, className = "", style }) {
  return <h1 className={`gx-h1 ${className}`} style={style}>{children}</h1>;
}
export function H2({ children, className = "", style }) {
  return <h2 className={`gx-h2 ${className}`} style={style}>{children}</h2>;
}
export function H3({ children, className = "", style }) {
  return <h3 className={`gx-h3 ${className}`} style={style}>{children}</h3>;
}
export function Body({ children, lead = false, className = "", style, as: Tag = "p" }) {
  return <Tag className={`${lead ? "gx-body-lg" : "gx-body"} ${className}`} style={style}>{children}</Tag>;
}
export function Lede({ children, className = "", style, as: Tag = "p" }) {
  return <Tag className={`gx-lede ${className}`} style={style}>{children}</Tag>;
}
export function Caption({ children, className = "", style, as: Tag = "span" }) {
  return <Tag className={`gx-caption ${className}`} style={style}>{children}</Tag>;
}
export function Overline({ children, className = "", style, as: Tag = "span" }) {
  return <Tag className={`gx-overline ${className}`} style={style}>{children}</Tag>;
}
