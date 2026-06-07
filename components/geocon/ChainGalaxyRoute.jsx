"use client";
// THE CHAIN — the rabbit hole. A 3D radial tree (react-force-graph-3d, same
// three.js stack as the globe) of the architecture's 279 nodes radiating from
// one geophyte trunk. Drag to orbit, scroll to dive, click a node to fly in.
// Data: /chain-map.json (a static snapshot of the link-type map; goes live once
// the link_type registry is seeded). Coloured by mission so the conservation and
// value threads read as one tree.

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

const DOMAINS = [
  { key: "identity-systematics",    label: "Identity & Systematics",   color: "#4FB477" },
  { key: "ecology-distribution",    label: "Ecology & Distribution",   color: "#3FA7C4" },
  { key: "conservation-policy",     label: "Conservation & Policy",    color: "#E0A458" },
  { key: "propagation-cultivation", label: "Propagation & Cultivation",color: "#8C7AE6" },
  { key: "chemistry-bioactivity",   label: "Chemistry & Bioactivity",  color: "#E06C75" },
  { key: "omics-genetics",          label: "Omics & Genetics",         color: "#56B6C2" },
  { key: "translation-ethnobotany", label: "Translation & Value",      color: "#C678DD" },
];
const DOMCOLOR = Object.fromEntries(DOMAINS.map((d) => [d.key, d.color]));
const TAGCOLOR = { conservation_only: "#1D9E75", translational: "#B98AE6", neutral: "#90A4AE" };

export default function ChainGalaxyRoute() {
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  const [dim, setDim] = useState({ w: 800, h: 600 });
  const wrapRef = useRef(null);
  const fgRef = useRef(null);

  useEffect(() => {
    let on = true;
    fetch("/chain-map.json").then((r) => r.json())
      .then((d) => { if (on) setData(d); })
      .catch(() => { if (on) setData({ nodes: [], links: [] }); });
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
  }, [data]);

  const colorFor = (n) =>
    n.kind === "root" ? "#f4f1e4"
    : n.kind === "leaf" ? (TAGCOLOR[n.tag] || "#90A4AE")
    : (DOMCOLOR[n.domain] || "#90A4AE");
  const sizeFor = (n) =>
    n.kind === "root" ? 16 : n.kind === "domain" ? 8 : n.kind === "branch" ? 3 : 1.6;

  function flyTo(n) {
    const fg = fgRef.current;
    if (!fg || typeof fg.cameraPosition !== "function") return;
    const r = Math.hypot(n.x || 0, n.y || 0, n.z || 0) || 1;
    const ratio = 1 + 80 / r;
    fg.cameraPosition(
      { x: (n.x || 0) * ratio, y: (n.y || 0) * ratio, z: (n.z || 0) * ratio },
      n, 1200,
    );
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
        position: "relative", height: "calc(100vh - 180px)", minHeight: 500,
        borderRadius: 14, overflow: "hidden", background: "#0b0f0c",
        border: "1px solid var(--gx-card-border)",
      }}>
        <div ref={wrapRef} style={{ position: "absolute", inset: 0 }}>
          {data && data.nodes && data.nodes.length > 0 ? (
            <ForceGraph3D
              ref={fgRef}
              graphData={data}
              width={dim.w}
              height={dim.h}
              backgroundColor="#0b0f0c"
              dagMode="radialout"
              dagLevelDistance={55}
              nodeRelSize={4}
              nodeVal={sizeFor}
              nodeColor={colorFor}
              nodeOpacity={0.95}
              nodeResolution={10}
              nodeLabel={(n) =>
                `<div style="font:600 12px sans-serif;color:#fff;padding:2px 4px">${n.name}</div>` +
                (n.full ? `<div style="font:10px monospace;color:#9aa;padding:0 4px 2px">${n.full}</div>` : "")}
              linkColor={() => "rgba(150,165,150,0.16)"}
              linkWidth={0.4}
              enableNodeDrag={false}
              warmupTicks={80}
              cooldownTicks={140}
              onNodeClick={(n) => { setSel(n); flyTo(n); }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#9aa" }}>
              {data ? "No map data." : "Entering the rabbit hole…"}
            </div>
          )}
        </div>

        {/* HUD */}
        <div style={{ position: "absolute", top: 16, left: 16, maxWidth: 300, pointerEvents: "none" }}>
          <p style={{ fontSize: 11, color: "#9aa39a", lineHeight: 1.55, margin: "0 0 10px" }}>
            Every thread of knowledge &amp; value radiating from one geophyte —
            <b style={{ color: "#cfcabb" }}> 279 nodes, 7 branches</b>. Drag to orbit,
            scroll to dive, click a node to fly in.
          </p>
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#9aa39a", marginBottom: 8 }}>
            <span><i style={dot("#1D9E75")} />conservation</span>
            <span><i style={dot("#B98AE6")} />value</span>
            <span><i style={dot("#90A4AE")} />core</span>
          </div>
          <div style={{ display: "grid", gap: 2 }}>
            {DOMAINS.map((d) => (
              <div key={d.key} style={{ fontSize: 10.5, color: "#c9c4b6" }}>
                <i style={dot(d.color)} />{d.label}
              </div>
            ))}
          </div>
        </div>

        {/* detail panel */}
        {sel && (
          <div style={{
            position: "absolute", bottom: 16, right: 16, maxWidth: 320,
            background: "rgba(11,15,12,0.92)", border: "1px solid #2c3a30",
            borderRadius: 10, padding: "12px 14px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f4f1e4" }}>{sel.name}</div>
              <button onClick={() => setSel(null)}
                style={{ background: "none", border: "none", color: "#9aa", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>
                ×
              </button>
            </div>
            {sel.full && <div style={{ fontSize: 10, fontFamily: "monospace", color: "#7e8b80", marginTop: 3 }}>{sel.full}</div>}
            <div style={{ fontSize: 10.5, color: "#9aa39a", marginTop: 6 }}>
              {sel.tag && <span>{String(sel.tag).replace(/_/g, " ")} · </span>}
              {sel.sensitivity && <span>{sel.sensitivity} · </span>}
              {sel.data_today && <span>data: {sel.data_today}</span>}
            </div>
            {sel.desc && <div style={{ fontSize: 11, color: "#c9c4b6", marginTop: 8, lineHeight: 1.5 }}>{sel.desc}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function dot(c) {
  return { display: "inline-block", width: 8, height: 8, borderRadius: 8, background: c, marginRight: 5, verticalAlign: "middle" };
}
