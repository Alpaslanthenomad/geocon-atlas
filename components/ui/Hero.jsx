"use client";
// Hero — top-of-page header used by detail and discovery routes.
//
//   <Hero
//     imageUrl="..."          // optional; if omitted, no overlay image
//     eyebrow="Species"
//     title="Crocus mathewii"
//     sub={<i>H. Kerndorff &amp; Pasche · Iridaceae</i>}
//     meta={<><Pill tone="danger">VU</Pill>...</>}
//     actions={<Button>Watch</Button>}
//   />
//
// All styling lives in globals.css under .gx-hero-*

import { GlassCard } from "../shared";

export default function Hero({ imageUrl, eyebrow, title, sub, meta, actions, children }) {
  return (
    <section className={`gx-hero gx-rise ${imageUrl ? "" : "gx-hero-no-image"}`}>
      {imageUrl && (
        <div className="gx-hero-image">
          <img src={imageUrl} alt="" />
        </div>
      )}
      <div className="gx-hero-content">
        {eyebrow && <span className="gx-hero-eyebrow">{eyebrow}</span>}
        {title && <h1 className="gx-hero-title">{title}</h1>}
        {sub && <div className="gx-hero-sub">{sub}</div>}
        {meta && <div className="gx-hero-meta">{meta}</div>}
        {actions && <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
        {children}
      </div>
    </section>
  );
}

// A no-image alternate that uses a soft gradient instead — for routes
// that don't have a hero photo yet.
export function HeroBare({ eyebrow, title, sub, meta, actions, accentTint = "var(--gx-accent-violet)" }) {
  return (
    <section
      className="gx-hero gx-rise"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${accentTint} 8%, var(--gx-surface)) 0%, var(--gx-surface) 60%)`,
      }}
    >
      <div className="gx-hero-content">
        {eyebrow && <span className="gx-hero-eyebrow" style={{ color: accentTint, background: `color-mix(in srgb, ${accentTint} 14%, transparent)` }}>{eyebrow}</span>}
        {title && <h1 className="gx-hero-title">{title}</h1>}
        {sub && <div className="gx-hero-sub">{sub}</div>}
        {meta && <div className="gx-hero-meta">{meta}</div>}
        {actions && <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
      </div>
    </section>
  );
}
