"use client";
// v4.5-a — Safe markdown renderer.
//
// Pure wrapper around react-markdown + rehype-sanitize + remark-gfm.
// One blessed instance so every notes / rationale / preregistration
// markdown block in the app renders identically.
//
// Sanitisation: default schema from rehype-sanitize, which blocks
// <script>, inline event handlers, javascript: URLs, and data: URIs
// outside images. External links open in a new tab with
// rel="noopener noreferrer".

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const COMPONENTS = {
  a: (props) => {
    const isExternal = (props.href || "").startsWith("http");
    return (
      <a {...props}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        style={{
          color: "var(--gx-accent-azure)",
          fontWeight: 600,
          textDecoration: "underline",
          textDecorationThickness: 1,
          textUnderlineOffset: 2,
        }}
      >
        {props.children}
      </a>
    );
  },
  p:  (props) => <p style={{ margin: "0.4em 0", lineHeight: 1.6 }} {...props} />,
  h1: (props) => <h1 style={hStyle(20)} {...props} />,
  h2: (props) => <h2 style={hStyle(17)} {...props} />,
  h3: (props) => <h3 style={hStyle(15)} {...props} />,
  ul: (props) => <ul style={{ paddingLeft: 22, margin: "0.4em 0", lineHeight: 1.55 }} {...props} />,
  ol: (props) => <ol style={{ paddingLeft: 22, margin: "0.4em 0", lineHeight: 1.55 }} {...props} />,
  li: (props) => <li style={{ margin: "0.15em 0" }} {...props} />,
  code: (props) => <code style={{
    fontFamily: "var(--gx-font-mono)",
    fontSize: "0.92em",
    padding: "1px 4px",
    background: "var(--gx-surface-2)",
    border: "1px solid var(--gx-border-soft)",
    borderRadius: 4,
  }} {...props} />,
  pre: (props) => <pre style={{
    fontFamily: "var(--gx-font-mono)",
    fontSize: "0.88em",
    padding: 10,
    background: "var(--gx-surface-2)",
    border: "1px solid var(--gx-border-soft)",
    borderRadius: 7,
    overflowX: "auto",
    margin: "0.6em 0",
  }} {...props} />,
  blockquote: (props) => <blockquote style={{
    borderLeft: "3px solid var(--gx-accent-violet)",
    padding: "2px 12px",
    margin: "0.5em 0",
    color: "var(--gx-ink-soft)",
    fontStyle: "italic",
  }} {...props} />,
  table: (props) => <div style={{ overflowX: "auto", margin: "0.5em 0" }}>
    <table style={{ borderCollapse: "collapse", fontSize: "0.9em" }} {...props} />
  </div>,
  th: (props) => <th style={{
    textAlign: "left", padding: "5px 9px",
    borderBottom: "2px solid var(--gx-border)",
    fontWeight: 700, fontSize: "0.85em",
    color: "var(--gx-ink)",
  }} {...props} />,
  td: (props) => <td style={{
    padding: "5px 9px",
    borderBottom: "1px solid var(--gx-border-soft)",
  }} {...props} />,
  hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--gx-border-soft)", margin: "1em 0" }} />,
};

function hStyle(size) {
  return {
    fontFamily: "var(--gx-font-display)",
    fontSize: size, fontWeight: 700,
    color: "var(--gx-ink)", letterSpacing: "-0.01em",
    margin: "0.6em 0 0.3em",
  };
}

export default function Markdown({ children, style }) {
  if (!children || typeof children !== "string") return null;
  return (
    <div style={{
      fontFamily: "var(--gx-font-body)",
      fontSize: 13,
      color: "var(--gx-ink)",
      ...style,
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={COMPONENTS}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
