"use client";
// Section — page chunk with eyebrow + title + trailing rule.
//
//   <Section eyebrow="Recognition" title="Commercialized outcomes" actions={<Button>+</Button>}>
//     ...
//   </Section>

export default function Section({
  eyebrow,
  title,
  actions,
  children,
  className = "",
  bare = false,        // omit the head divider if true
  style,
}) {
  return (
    <section className={`gx-section ${className}`} style={style}>
      {(eyebrow || title || actions) && (
        <div className={bare ? "" : "gx-section-head"}>
          <div>
            {eyebrow && <span className="gx-section-eyebrow">{eyebrow}</span>}
            {title && <h2 className="gx-section-title">{title}</h2>}
          </div>
          {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
