"use client";
// THE CHAIN — the rabbit hole. A 3D radial tree (react-force-graph-3d, same
// three.js stack as the globe) of the architecture's 279 nodes radiating from
// one geophyte trunk. Branch-coloured glowing edges + flowing particles +
// UnrealBloom give it the futuristic, legible look; slow auto-orbit keeps it
// alive. Data: /chain-map.json (static snapshot; goes live when link_type seeds).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const DOMAINS = [
  { key: "identity-systematics",    label: "Identity & Systematics",   color: "#5BE39B" },
  { key: "ecology-distribution",    label: "Ecology & Distribution",   color: "#4FC8E8" },
  { key: "conservation-policy",     label: "Conservation & Policy",    color: "#F4C063" },
  { key: "propagation-cultivation", label: "Propagation & Cultivation",color: "#A78BFA" },
  { key: "chemistry-bioactivity",   label: "Chemistry & Bioactivity",  color: "#FF7A8A" },
  { key: "omics-genetics",          label: "Omics & Genetics",         color: "#5BD6D6" },
  { key: "translation-ethnobotany", label: "Translation & Value",      color: "#E08CF0" },
];
const DOMCOLOR = Object.fromEntries(DOMAINS.map((d) => [d.key, d.color]));
const TAGCOLOR = { conservation_only: "#36E0A0", translational: "#C99BFF", neutral: "#9FB2C0" };

export default function ChainGalaxyRoute() {
  const [FG, setFG] = useState(null);     // the component (loaded client-side so the ref forwards)
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  const [dim, setDim] = useState({ w: 800, h: 600 });
  const wrapRef = useRef(null);
  const fgRef = useRef(null);

  useEffect(() => { import("react-force-graph-3d").then((m) => setFG(() => m.default)); }, []);
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

  // glow (bloom) + slow auto-orbit + spread, once the graph instance exists
  useEffect(() => {
    if (!FG || !data || !data.nodes || !data.nodes.length) return undefined;
    let cancelled = false;
    const t = setTimeout(() => {
      const fg = fgRef.current;
      if (!fg || cancelled) return;
      try { fg.d3Force("charge").strength(-160); } catch (e) { /* noop */ }
      try {
        const c = fg.controls();
        if (c) { c.autoRotate = true; c.autoRotateSpeed = 0.55; }
      } catch (e) { /* noop */ }
      try { fg.zoomToFit(700, 50); } catch (e) { /* noop */ }
      import("three/examples/jsm/postprocessing/UnrealBloomPass.js")
        .then(({ UnrealBloomPass }) => {
          if (cancelled || !fgRef.current) return;
          const bloom = new UnrealBloomPass(undefined, 1.9, 0.85, 0.0);
          fgRef.current.postProcessingComposer().addPass(bloom);
        })
        .catch(() => { /* bloom optional */ });
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [FG, data]);

  const colorFor = (n) =>
    n.kind === "root" ? "#FFFFFF"
    : n.kind === "leaf" ? (TAGCOLOR[n.tag] || "#9FB2C0")
    : (DOMCOLOR[n.domain] || "#9FB2C0");
  const sizeFor = (n) =>
    n.kind === "root" ? 26 : n.kind === "domain" ? 10 : n.kind === "branch" ? 3.5 : 1.7;
  const linkColor = (l) => {
    const t = l.target;
    return (t && typeof t === "object" && DOMCOLOR[t.domain]) || "rgba(150,170,200,0.35)";
  };

  function flyTo(n) {
    const fg = fgRef.current;
    if (!fg || typeof fg.cameraPosition !== "function") return;
    const r = Math.hypot(n.x || 0, n.y || 0, n.z || 0) || 1;
    const ratio = 1 + 70 / r;
    fg.cameraPosition({ x: (n.x || 0) * ratio, y: (n.y || 0) * ratio, z: (n.z || 0) * ratio }, n, 1400);
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
        background: "radial-gradient(circle at 50% 42%, #0a1622 0%, #05080c 72%)",
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
              dagMode="radialout"
              dagLevelDistance={95}
              nodeRelSize={4}
              nodeVal={sizeFor}
              nodeColor={colorFor}
              nodeOpacity={1}
              nodeResolution={14}
              nodeLabel={(n) =>
                `<div style="font:600 12px sans-serif;color:#fff;padding:2px 4px">${n.name}</div>` +
                (n.full ? `<div style="font:10px monospace;color:#9aa;padding:0 4px 2px">${n.full}</div>` : "")}
              linkColor={linkColor}
              linkOpacity={0.55}
              linkWidth={0.55}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={1.1}
              linkDirectionalParticleSpeed={0.005}
              linkDirectionalParticleColor={linkColor}
              enableNodeDrag={false}
              warmupTicks={120}
              cooldownTicks={220}
              onNodeClick={(n) => { setSel(n); flyTo(n); }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#9aa" }}>
              {data && (!data.nodes || !data.nodes.length) ? "No map data." : "Entering the rabbit hole…"}
            </div>
          )}
        </div>

        {/* HUD */}
        <div style={{ position: "absolute", top: 16, left: 16, maxWidth: 300, pointerEvents: "none" }}>
          <p style={{ fontSize: 11, color: "#9fb2c0", lineHeight: 1.55, margin: "0 0 10px" }}>
            Every thread of knowledge &amp; value radiating from one geophyte —
            <b style={{ color: "#dfe7ec" }}> 279 nodes, 7 branches</b>. Drag to orbit,
            scroll to dive, click a node to fly in.
          </p>
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#9fb2c0", marginBottom: 8 }}>
            <span><i style={dot("#36E0A0")} />conservation</span>
            <span><i style={dot("#C99BFF")} />value</span>
            <span><i style={dot("#9FB2C0")} />core</span>
          </div>
          <div style={{ display: "grid", gap: 2 }}>
            {DOMAINS.map((d) => (
              <div key={d.key} style={{ fontSize: 10.5, color: "#c4d0d8" }}>
                <i style={dot(d.color)} />{d.label}
              </div>
            ))}
          </div>
        </div>

        {sel && (
          <div style={{
            position: "absolute", bottom: 16, right: 16, maxWidth: 320,
            background: "rgba(5,10,16,0.92)", border: "1px solid #213244",
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
            <div style={{ fontSize: 10.5, color: "#9fb2c0", marginTop: 6 }}>
              {sel.tag && <span>{String(sel.tag).replace(/_/g, " ")} · </span>}
              {sel.sensitivity && <span>{sel.sensitivity} · </span>}
              {sel.data_today && <span>data: {sel.data_today}</span>}
            </div>
            {sel.desc && <div style={{ fontSize: 11, color: "#c4d0d8", marginTop: 8, lineHeight: 1.5 }}>{sel.desc}</div>}
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
    boxShadow: `0 0 6px ${c}`,
  };
}
