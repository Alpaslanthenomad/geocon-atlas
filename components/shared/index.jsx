"use client";
import { S } from "../../lib/constants";

// Illustration registry + tip rotation re-exports
export {
  EmptyAtlas, EmptyInbox, EmptyGarden, EmptyShelf, EmptyFlask,
  EmptyNetwork, EmptyTrophy, EmptyOffline, NotFound404, ServerError500,
  ILLUSTRATIONS,
} from "./Illustrations";
export { default as LoadingTips } from "./LoadingTips";

export function Pill({ children, color, bg }) {
  return <span style={S.pill(color, bg)}>{children}</span>;
}

export function Dot({ color, size = 6 }) {
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:color, flexShrink:0 }} />;
}

export function MiniBar({ value, max = 100, color, h = 5 }) {
  return (
    <div style={{ height:h, background:"#eae8e3", borderRadius:h/2, overflow:"hidden", flex:1 }}>
      <div style={{ height:"100%", width:`${(value/max)*100}%`, background:color, borderRadius:h/2, transition:"width 0.6s ease" }} />
    </div>
  );
}

export function Loading() {
  return (
    <div style={{ padding: 24 }}>
      <SkeletonStack />
    </div>
  );
}

export function SecondaryLoading({ label = "Loading" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60, color:"var(--gx-ink-muted,#999)", fontSize:13, fontStyle:"italic" }}>
      {label}…
    </div>
  );
}

/* Generic shimmer block — colors/shape from CSS tokens. */
export function Skeleton({ w = "100%", h = 14, r = 8, style }) {
  return (
    <span
      className="gx-skeleton"
      style={{ display:"block", width:w, height:h, borderRadius:r, ...style }}
    />
  );
}

/* A common loading pattern: header + list rows. */
export function SkeletonStack({ rows = 4 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <Skeleton w="40%" h={22} r={10} />
      <Skeleton w="65%" h={12} r={6} />
      <div style={{ height: 10 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} h={56} r={10} />
      ))}
    </div>
  );
}

/* Glassmorphism card wrapper. Uses utility class so theme changes
   propagate without re-render. */
export function GlassCard({ children, style, className = "", ...rest }) {
  return (
    <div className={`gx-glass ${className}`} style={style} {...rest}>
      {children}
    </div>
  );
}

/*
 * EmptyState — single, consistent empty surface. Replaces the inline
 * "Henüz X yok" / "No X yet" / silent-null patterns that drifted
 * across routes. Always token-aware so it themes cleanly in dark mode.
 *
 *   <EmptyState
 *     icon="🌿"
 *     title="No species match these filters"
 *     hint="Try clearing the IUCN tier filter"
 *     cta={{ label: "Clear filters", onClick: handleClear }}
 *   />
 *
 * Tones: 'neutral' (default — no data yet), 'error' (load failed),
 * 'pending' (queued/in-flight).
 */
export function EmptyState({
  icon = "·",
  illustration,        // ReactNode (e.g. <EmptyAtlas />) — overrides icon
  illustrationKey,     // alternative: string key into ILLUSTRATIONS registry
  title,
  hint,
  cta,
  tone = "neutral",
  style,
}) {
  const accent =
    tone === "error"   ? "var(--gx-accent-rose)" :
    tone === "pending" ? "var(--gx-accent-bee-warm)" :
                         "var(--gx-ink-muted)";

  // Resolve illustration by key if no node was provided directly.
  let illoNode = illustration;
  if (!illoNode && illustrationKey) {
    try {
      // eslint-disable-next-line @next/next/no-html-link-for-pages, global-require
      const { ILLUSTRATIONS } = require("./Illustrations");
      const Comp = ILLUSTRATIONS[illustrationKey];
      if (Comp) illoNode = <Comp />;
    } catch { /* registry unavailable */ }
  }

  return (
    <div
      role="status"
      style={{
        padding: "36px 24px",
        textAlign: "center",
        background: "var(--gx-surface-2)",
        border: "1px dashed var(--gx-border)",
        borderRadius: "var(--gx-radius-4)",
        color: "var(--gx-ink-soft)",
        ...style,
      }}
    >
      {illoNode ? (
        <div style={{
          color: accent,
          marginBottom: 14,
          display: "inline-flex",
          opacity: 0.85,
        }}>
          {illoNode}
        </div>
      ) : (
        <div style={{
          fontSize: 30,
          opacity: 0.7,
          marginBottom: 10,
          lineHeight: 1,
        }}>
          {icon}
        </div>
      )}
      {title && (
        <div style={{
          fontFamily: "var(--gx-font-serif)",
          fontSize: 15,
          fontWeight: 700,
          color: accent,
          marginBottom: hint ? 6 : 0,
          lineHeight: 1.3,
        }}>
          {title}
        </div>
      )}
      {hint && (
        <div style={{
          fontSize: 12,
          color: "var(--gx-ink-muted)",
          lineHeight: 1.55,
          maxWidth: 480,
          margin: "0 auto",
        }}>
          {hint}
        </div>
      )}
      {cta && (
        <div style={{ marginTop: 14 }}>
          {cta.href ? (
            <a
              href={cta.href}
              style={emptyCtaStyle}
            >
              {cta.label}
            </a>
          ) : (
            <button
              onClick={cta.onClick}
              style={emptyCtaStyle}
            >
              {cta.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const emptyCtaStyle = {
  display: "inline-block",
  padding: "8px 14px",
  fontSize: 12,
  fontWeight: 700,
  color: "#fff",
  background: "var(--gx-accent-bio-green)",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  textDecoration: "none",
  letterSpacing: 0.3,
};

export function RadarChart({ scores, size = 100 }) {
  if (!scores) return null;
  const keys = ["conservation","science","production","governance","venture"];
  const labels = { conservation:"URGN", science:"MATR", production:"VALU", governance:"GOV", venture:"VENT" };
  const vals = keys.map(k => scores[k] || 0);
  const n = keys.length, cx = size/2, cy = size/2, r = size*0.36;
  const ang = i => (Math.PI*2*i)/n - Math.PI/2;
  const pt  = (i,v) => { const a=ang(i), d=(v/100)*r; return [cx+d*Math.cos(a), cy+d*Math.sin(a)]; };
  const cols = { conservation:"#E24B4A", science:"#534AB7", production:"#1D9E75", governance:"#D85A30", venture:"#185FA5" };
  const dp   = keys.map((k,i) => pt(i, vals[i]));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[25,50,75,100].map(lv => {
        const pts = keys.map((_,i) => pt(i,lv)).map(p=>`${p[0]},${p[1]}`).join(" ");
        return <polygon key={lv} points={pts} fill="none" stroke="#e8e6e1" strokeWidth="0.5" />;
      })}
      {keys.map((_,i) => { const [ex,ey]=pt(i,100); return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#e8e6e1" strokeWidth="0.5" />; })}
      <polygon points={dp.map(p=>`${p[0]},${p[1]}`).join(" ")} fill="rgba(29,158,117,0.12)" stroke="#1D9E75" strokeWidth="1.5" />
      {keys.map((k,i) => { const [px,py]=pt(i,vals[i]); return <circle key={k} cx={px} cy={py} r={2.5} fill={cols[k]} />; })}
      {keys.map((k,i) => { const [lx,ly]=pt(i,118); return <text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" style={{fontSize:8,fill:"#999"}}>{labels[k]}</text>; })}
    </svg>
  );
}
