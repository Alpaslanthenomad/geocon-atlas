"use client";
// THE CHAIN — the rabbit hole. A 3D hierarchical tree (react-force-graph-3d,
// same three.js stack as the globe) of the architecture's 279 nodes growing from
// one geophyte trunk. Top-down DAG so the structure is legible; curved branch-
// coloured edges; the 7 great branches carry 3D labels; restrained bloom + a slow
// drift keep it futuristic without glare. Data: /chain-map.json (static snapshot;
// goes live when the link_type registry is seeded).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const DOMAINS = [
  { key: "identity-systematics",    label: "Identity & Systematics",   color: "#49C98A" },
  { key: "ecology-distribution",    label: "Ecology & Distribution",   color: "#3FA9D6" },
  { key: "conservation-policy",     label: "Conservation & Policy",    color: "#D9A24B" },
  { key: "propagation-cultivation", label: "Propagation & Cultivation",color: "#8E78E0" },
  { key: "chemistry-bioactivity",   label: "Chemistry & Bioactivity",  color: "#E36A79" },
  { key: "omics-genetics",          label: "Omics & Genetics",         color: "#46C0C0" },
  { key: "translation-ethnobotany", label: "Translation & Value",      color: "#CE79E0" },
];
const DOMCOLOR = Object.fromEntries(DOMAINS.map((d) => [d.key, d.color]));
const TAGCOLOR = { conservation_only: "#2FBE86", translational: "#B083E8", neutral: "#8597A4" };

export default function ChainGalaxyRoute() {
  const [FG, setFG] = useState(null);
  const [Sprite, setSprite] = useState(null);
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  const [dim, setDim] = useState({ w: 800, h: 600 });
  const wrapRef = useRef(null);
  const fgRef = useRef(null);

  useEffect(() => {
    import("react-force-graph-3d").then((m) => setFG(() => m.default));
    import("three-spritetext").then((m) => setSprite(() => m.default)).catch(() => {});
  }, []);
  useEffect(() => {
    let on = true;
    fetch("/chain-map.json").then((r) => r.json())
      .then((d) => on && setData(d)).catch(() => on && setData({ nodes: [], links: [] }));
    return () => { on = false; };
  }, []);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => setDim({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [FG, data]);

  // restrained glow + slow drift + framing
  useEffect(() => {
    if (!FG || !data || !data.nodes || !data.nodes.length) return undefined;
    let cancelled = false;
    const t = setTimeout(() => {
      const fg = fgRef.current;
      if (!fg || cancelled) return;
      try { fg.d3Force("charge").strength(-90); } catch (e) { /* noop */ }
      try {
        const c = fg.controls();
        if (c) { c.autoRotate = true; c.autoRotateSpeed = 0.32; }
      } catch (e) { /* noop */ }
      try { fg.zoomToFit(800, 60); } catch (e) { /* noop */ }
      import("three/examples/jsm/postprocessing/UnrealBloomPass.js")
        .then(({ UnrealBloomPass }) => {
          if (cancelled || !fgRef.current) return;
          const bloom = new UnrealBloomPass(undefined, 0.7, 0.5, 0.22);
          fgRef.current.postProcessingComposer().addPass(bloom);
        })
        .catch(() => { /* bloom optional */ });
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [FG, data]);

  const colorFor = (n) =>
    n.kind === "root" ? "#F2F6F8"
    : n.kind === "leaf" ? (TAGCOLOR[n.tag] || "#8597A4")
    : (DOMCOLOR[n.domain] || "#8597A4");
  const sizeFor = (n) =>
    n.kind === "root" ? 16 : n.kind === "domain" ? 7 : n.kind === "branch" ? 2.4 : 1;
  const linkColor = (l) => {
    const t = l.target;
    return (t && typeof t === "object" && DOMCOLOR[t.domain]) || "rgba(140,160,180,0.4)";
  };

  function flyTo(n) {
    const fg = fgRef.current;
    if (!fg || typeof fg.cameraPosition !== "function") return;
    const r = Math.hypot(n.x || 0, n.y || 0, n.z || 0) || 1;
    const ratio = 1 + 60 / r;
    fg.cameraPosition({ x: (n.x || 0) * ratio, y: (n.y || 0) * ratio, z: (n.z || 0) * ratio }, n, 1400);
  }

  function nodeObject(n) {
    if (!Sprite || (n.kind !== "root" && n.kind !== "domain")) return null;
    const s = new Sprite(n.kind === "root" ? "GEOPHYTE" : n.name);
    s.color = n.kind === "root" ? "#FFFFFF" : colorFor(n);
    s.textHeight = n.kind === "root" ? 8 : 4.6;
    s.fontWeight = "600";
    s.strokeColor = "#04070b";
    s.strokeWidth = 2;
    s.position.y = n.kind === "root" ? 16 : 9;
    if (s.material) s.material.depthWrite = false;
    return s;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="gx-overline">The Chain</div>
          <h1 className="gx-h1">The rabbit hole</h1>
        </div>
        <Link href="/geocon/species" style={{ fontSize: 12, color: "var(--gx-ink-muted)", textDecoration: "none" }}>
          ← back to the atlas
        </Link>
      </div>

      <div style={{
        position: "relative", height: "calc(100vh - 180px)", minHeight: 520,
        borderRadius: 14, overflow: "hidden",
        background: "radial-gradient(circle at 50% 40%, #070d14 0%, #03060a 70%)",
        border: "1px solid var(--gx-card-border)",
      }}>
        <div ref={wrapRef} style={{ position: "absolute", inset: 0 }}>
          {FG && data && data.nodes && data.nodes.length > 0 ? (
            <FG
              ref={fgRef}
              graphData={data}
              width={dim.w}
              height={dim.h}
              backgroundColor="rgba(0,0,0,0)"
              showNavInfo={false}
              dagMode="td"
              dagLevelDistance={60}
              nodeRelSize={4}
              nodeVal={sizeFor}
              nodeColor={colorFor}
              nodeOpacity={0.92}
              nodeResolution={12}
              nodeThreeObjectExtend
              nodeThreeObject={nodeObject}
              nodeLabel={(n) =>
                `<div style="font:600 12px sans-serif;color:#fff;padding:2px 4px">${n.name}</div>` +
                (n.full ? `<div style="font:10px monospace;color:#9aa;padding:0 4px 2px">${n.full}</div>` : "")}
              linkColor={linkColor}
              linkOpacity={0.26}
              linkWidth={0.5}
              linkCurvature={0.25}
              linkDirectionalParticles={0}
              enableNodeDrag={false}
              warmupTicks={140}
              cooldownTicks={240}
              onNodeClick={(n) => { setSel(n); flyTo(n); }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#9aa" }}>
              {data && (!data.nodes || !data.nodes.length) ? "No map data." : "Entering the rabbit hole…"}
            </div>
          )}
        </div>

        {/* HUD */}
        <div style={{ position: "absolute", top: 16, left: 16, maxWidth: 290, pointerEvents: "none" }}>
          <p style={{ fontSize: 11, color: "#92a3b0", lineHeight: 1.55, margin: "0 0 10px" }}>
            Every thread of knowledge &amp; value growing from one geophyte —
            <b style={{ color: "#d3dce2" }}> 279 nodes, 7 branches</b>. Drag to orbit,
            scroll to dive, click a node to fly in.
          </p>
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#92a3b0", marginBottom: 8 }}>
            <span><i style={dot("#2FBE86")} />conservation</span>
            <span><i style={dot("#B083E8")} />value</span>
            <span><i style={dot("#8597A4")} />core</span>
          </div>
          <div style={{ display: "grid", gap: 2 }}>
            {DOMAINS.map((d) => (
              <div key={d.key} style={{ fontSize: 10.5, color: "#b7c3cb" }}>
                <i style={dot(d.color)} />{d.label}
              </div>
            ))}
          </div>
        </div>

        {sel && (
          <div style={{
            position: "absolute", bottom: 16, right: 16, maxWidth: 320,
            background: "rgba(4,8,13,0.92)", border: "1px solid #1d2b39",
            borderRadius: 10, padding: "12px 14px", backdropFilter: "blur(4px)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#eef3f6" }}>{sel.name}</div>
              <button onClick={() => setSel(null)}
                style={{ background: "none", border: "none", color: "#9aa", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>
                ×
              </button>
            </div>
            {sel.full && <div style={{ fontSize: 10, fontFamily: "monospace", color: "#7e8b96", marginTop: 3 }}>{sel.full}</div>}
            <div style={{ fontSize: 10.5, color: "#92a3b0", marginTop: 6 }}>
              {sel.tag && <span>{String(sel.tag).replace(/_/g, " ")} · </span>}
              {sel.sensitivity && <span>{sel.sensitivity} · </span>}
              {sel.data_today && <span>data: {sel.data_today}</span>}
            </div>
            {sel.desc && <div style={{ fontSize: 11, color: "#b7c3cb", marginTop: 8, lineHeight: 1.5 }}>{sel.desc}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function dot(c) {
  return {
    display: "inline-block", width: 8, height: 8, borderRadius: 8,
    background: c, marginRight: 5, verticalAlign: "middle",
  };
}
