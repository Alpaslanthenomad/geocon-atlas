"use client";
// Small export chip strip — currently DarwinCore TSV + Zotero BibTeX.
// Drops onto species detail and family detail panels.

export default function ExportButtons({ speciesId, family }) {
  const links = [];
  if (speciesId) {
    links.push({
      href: `/api/public/species/${speciesId}/darwincore`,
      label: "DarwinCore TSV",
      icon: "🔎",
    });
    links.push({
      href: `/api/public/publications/bibtex?species_id=${encodeURIComponent(speciesId)}`,
      label: "Publications · BibTeX",
      icon: "📚",
    });
  }
  if (family) {
    links.push({
      href: `/api/public/publications/bibtex?family=${encodeURIComponent(family)}`,
      label: "Family · BibTeX",
      icon: "📚",
    });
  }
  if (links.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          download
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            background: "var(--gx-surface)",
            color: "var(--gx-ink-soft)",
            border: "1px solid var(--gx-border-soft)",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <span>{l.icon}</span> {l.label}
        </a>
      ))}
    </div>
  );
}
