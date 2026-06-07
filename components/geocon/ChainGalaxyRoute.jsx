"use client";
// THE CHAIN — the rabbit hole, as a real 3D tree. Not a force graph: a recursive
// botanical tree built directly in three.js. A vertical trunk (the geophyte) rises
// and splits into the 7 great branches (a canopy), each recursively into twigs,
// with the 279 leaves as glowing foliage at the tips. Branches coloured by branch,
// leaves by mission. Orbit + slow drift. Data: /chain-map.json (flat graph we
// rebuild into a hierarchy here).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const DOMAINS = [
  { key: "identity-systematics",    label: "Identity & Systematics",   color: "#5BD08A" },
  { key: "ecology-distribution",    label: "Ecology & Distribution",   color: "#4FB3DE" },
  { key: "conservation-policy",     label: "Conservation & Policy",    color: "#E2AE57" },
  { key: "propagation-cultivation", label: "Propagation & Cultivation",color: "#9B86EC" },
  { key: "chemistry-bioactivity",   label: "Chemistry & Bioactivity",  color: "#EE6E7E" },
  { key: "omics-genetics",          label: "Omics & Genetics",         color: "#4FCBCB" },
  { key: "translation-ethnobotany", label: "Translation & Value",      color: "#D17CE6" },
];
const DOMCOLOR = Object.fromEntries(DOMAINS.map((d) => [d.key, d.color]));
const TAGCOLOR = { conservation_only: "#3BE39A", translational: "#C49BFF", neutral: "#8FA7B5" };
const BARK = "#8a7350";

function rand(seed) {
  const x = Math.sin((seed + 1) * 99991.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function ChainGalaxyRoute() {
  const mountRef = useRef(null);
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    let on = true;
    fetch("/chain-map.json").then((r) => r.json())
      .then((d) => on && setData(d)).catch(() => on && setData({ nodes: [], links: [] }));
    return () => { on = false; };
  }, []);

  useEffect(() => {
    if (!data || !data.nodes || !data.nodes.length || !mountRef.current) return undefined;
    const mount = mountRef.current;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      let SpriteText = null;
      try { SpriteText = (await import("three-spritetext")).default; } catch (e) { /* labels optional */ }
      if (disposed) return;

      // rebuild hierarchy from the flat graph (it is a tree)
      const byId = new Map(data.nodes.map((n) => [n.id, { ...n, _kids: [] }]));
      data.links.forEach((l) => {
        const s = byId.get(typeof l.source === "object" ? l.source.id : l.source);
        const t = byId.get(typeof l.target === "object" ? l.target.id : l.target);
        if (s && t) s._kids.push(t);
      });
      const root = [...byId.values()].find((n) => n.kind === "root") || byId.values().next().value;

      // ---- recursive layout: place every node, collect branch segments + leaves
      const V = THREE.Vector3;
      const segs = [];       // {a,b,rA,rB,domain}
      const leaves = [];     // {pos,node}
      const labels = [];     // {pos,text,color,big}

      function frame(dir) {
        const up = Math.abs(dir.y) < 0.98 ? new V(0, 1, 0) : new V(1, 0, 0);
        const u = new V().crossVectors(dir, up).normalize();
        const v = new V().crossVectors(dir, u).normalize();
        return [u, v];
      }
      function grow(node, base, dir, len, rad, depth) {
        const end = base.clone().add(dir.clone().multiplyScalar(len));
        segs.push({ a: base, b: end, rA: rad * 0.62, rB: rad, domain: node.domain });
        if (node.kind === "domain" && SpriteText) labels.push({ pos: end, text: node.name, color: DOMCOLOR[node.domain], big: false });
        const kids = node._kids || [];
        if (!kids.length) {
          const j = new V((rand(node.id) - 0.5), (rand(node.id + 7) - 0.5), (rand(node.id + 13) - 0.5)).multiplyScalar(len * 0.25);
          leaves.push({ pos: end.clone().add(j), node });
          return;
        }
        const [u, v] = frame(dir);
        const spread = depth === 0 ? 1.05 : depth === 1 ? 0.7 : 0.55;
        kids.forEach((k, i) => {
          const az = (i / kids.length) * Math.PI * 2 + depth * 0.9 + rand(node.id + i) * 1.4;
          const a = spread * (0.65 + 0.6 * rand(k.id));
          const childDir = dir.clone().multiplyScalar(Math.cos(a))
            .add(u.clone().multiplyScalar(Math.sin(a) * Math.cos(az)))
            .add(v.clone().multiplyScalar(Math.sin(a) * Math.sin(az)))
            .normalize();
          grow(k, end, childDir, len * 0.72, rad * 0.6, depth + 1);
        });
      }

      // trunk straight up, then the 7 branches form the canopy from its top
      const H = 70;
      const top = new V(0, H, 0);
      segs.push({ a: new V(0, 0, 0), b: top, rA: 2.4, rB: 4.2, domain: null }); // trunk
      labels.push({ pos: new V(0, 0, 0), text: "GEOPHYTE", color: "#ffffff", big: true });
      (root._kids || []).forEach((dn, i) => {
        const az = (i / root._kids.length) * Math.PI * 2;
        const a = 0.95;
        const dir = new V(Math.sin(a) * Math.cos(az), Math.cos(a), Math.sin(a) * Math.sin(az)).normalize();
        grow(dn, top, dir, 46, 2.4, 0);
      });

      // ---- scene
      const scene = new THREE.Scene();
      const w = mount.clientWidth, h = mount.clientHeight || 520;
      const camera = new THREE.PerspectiveCamera(52, w / h, 1, 6000);
      camera.position.set(0, H * 0.55, H * 2.7);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      mount.appendChild(renderer.domElement);

      // branches (one merged-ish material per domain via per-segment mesh)
      const mats = {};
      const matFor = (dom) => {
        const key = dom || "trunk";
        if (!mats[key]) {
          mats[key] = new THREE.MeshBasicMaterial({
            color: new THREE.Color(dom ? (DOMCOLOR[dom] || "#8FA7B5") : BARK),
            transparent: true, opacity: dom ? 0.85 : 0.95,
          });
        }
        return mats[key];
      };
      const branchGroup = new THREE.Group();
      segs.forEach((s) => {
        const dir = new V().subVectors(s.b, s.a);
        const len = dir.length();
        if (len < 0.001) return;
        const geo = new THREE.CylinderGeometry(Math.max(s.rA, 0.18), Math.max(s.rB, 0.18), len, 6, 1, true);
        const m = new THREE.Mesh(geo, matFor(s.domain));
        m.position.copy(s.a).add(s.b).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(new V(0, 1, 0), dir.normalize());
        branchGroup.add(m);
      });
      scene.add(branchGroup);

      // leaves as glowing points (foliage)
      const lp = new Float32Array(leaves.length * 3);
      const lc = new Float32Array(leaves.length * 3);
      leaves.forEach((lf, i) => {
        lp.set([lf.pos.x, lf.pos.y, lf.pos.z], i * 3);
        const c = new THREE.Color(TAGCOLOR[lf.node.tag] || "#8FA7B5");
        lc.set([c.r, c.g, c.b], i * 3);
      });
      const lg = new THREE.BufferGeometry();
      lg.setAttribute("position", new THREE.BufferAttribute(lp, 3));
      lg.setAttribute("color", new THREE.BufferAttribute(lc, 3));
      // soft round glow sprite
      const cv = document.createElement("canvas"); cv.width = cv.height = 64;
      const ctx = cv.getContext("2d");
      const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, "rgba(255,255,255,1)");
      grd.addColorStop(0.3, "rgba(255,255,255,0.85)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(cv);
      const lm = new THREE.PointsMaterial({
        size: 5.5, map: tex, vertexColors: true, transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
      });
      const points = new THREE.Points(lg, lm);
      scene.add(points);

      // labels
      if (SpriteText) {
        labels.forEach((L) => {
          const s = new SpriteText(L.text);
          s.color = L.color; s.textHeight = L.big ? 8 : 4.4; s.fontWeight = "600";
          s.strokeColor = "#04070b"; s.strokeWidth = 2;
          if (s.material) s.material.depthWrite = false;
          s.position.copy(L.pos); s.position.y += L.big ? -5 : 4;
          scene.add(s);
        });
      }

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = 0.08;
      controls.autoRotate = true; controls.autoRotateSpeed = 0.4;
      controls.target.set(0, H * 0.7, 0);
      controls.minDistance = 30; controls.maxDistance = 900;

      // click -> nearest leaf
      const ray = new THREE.Raycaster();
      ray.params.Points.threshold = 4;
      const mouse = new THREE.Vector2();
      function onClick(ev) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        ray.setFromCamera(mouse, camera);
        const hits = ray.intersectObject(points);
        if (hits.length) setSel(leaves[hits[0].index].node);
      }
      renderer.domElement.addEventListener("click", onClick);

      let raf;
      const animate = () => { raf = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
      animate();

      const onResize = () => {
        const ww = mount.clientWidth, hh = mount.clientHeight || 520;
        camera.aspect = ww / hh; camera.updateProjectionMatrix();
        renderer.setSize(ww, hh);
      };
      const ro = new ResizeObserver(onResize); ro.observe(mount);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.domElement.removeEventListener("click", onClick);
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      };
    })();

    return () => { disposed = true; cleanup(); };
  }, [data]);

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
        background: "radial-gradient(circle at 50% 78%, #0a1119 0%, #03060a 72%)",
        border: "1px solid var(--gx-card-border)",
      }}>
        <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
        {!data && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#9aa" }}>Growing the tree…</div>}

        <div style={{ position: "absolute", top: 16, left: 16, maxWidth: 290, pointerEvents: "none" }}>
          <p style={{ fontSize: 11, color: "#92a3b0", lineHeight: 1.55, margin: "0 0 10px" }}>
            One geophyte, grown into every thread of its knowledge &amp; value —
            <b style={{ color: "#d3dce2" }}> 279 leaves on 7 boughs</b>. Drag to orbit,
            scroll to zoom, click a leaf.
          </p>
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#92a3b0", marginBottom: 8 }}>
            <span><i style={dot("#3BE39A")} />conservation</span>
            <span><i style={dot("#C49BFF")} />value</span>
            <span><i style={dot("#8FA7B5")} />core</span>
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
  return { display: "inline-block", width: 8, height: 8, borderRadius: 8, background: c, marginRight: 5, verticalAlign: "middle" };
}
