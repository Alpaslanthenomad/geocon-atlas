"use client";
// THE CHAIN — the rabbit hole, as a professional 3D tree. A recursive botanical
// tree in three.js: a shaded woody trunk rises and splits into the 7 great
// branches; each recurses into gently drooping twigs; the 279 leaves are lush
// two-layer glowing foliage at the tips. Real lighting + UnrealBloom + fog +
// starfield + vignette give it the finished look. Data: /chain-map.json.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const DOMAINS = [
  { key: "identity-systematics",    label: "Identity & Systematics",   color: "#57C98A" },
  { key: "ecology-distribution",    label: "Ecology & Distribution",   color: "#4AA9D6" },
  { key: "conservation-policy",     label: "Conservation & Policy",    color: "#DCA651" },
  { key: "propagation-cultivation", label: "Propagation & Cultivation",color: "#9683E6" },
  { key: "chemistry-bioactivity",   label: "Chemistry & Bioactivity",  color: "#E66B7B" },
  { key: "omics-genetics",          label: "Omics & Genetics",         color: "#46C4C4" },
  { key: "translation-ethnobotany", label: "Translation & Value",      color: "#CC78E0" },
];
const DOMCOLOR = Object.fromEntries(DOMAINS.map((d) => [d.key, d.color]));
const TAGCOLOR = { conservation_only: "#3BE39A", translational: "#C49BFF", neutral: "#93A9B6" };

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
      const { EffectComposer } = await import("three/examples/jsm/postprocessing/EffectComposer.js");
      const { RenderPass } = await import("three/examples/jsm/postprocessing/RenderPass.js");
      const { UnrealBloomPass } = await import("three/examples/jsm/postprocessing/UnrealBloomPass.js");
      if (disposed) return;

      const V = THREE.Vector3;

      // rebuild hierarchy from the flat graph
      const byId = new Map(data.nodes.map((n) => [n.id, { ...n, _kids: [] }]));
      data.links.forEach((l) => {
        const s = byId.get(typeof l.source === "object" ? l.source.id : l.source);
        const t = byId.get(typeof l.target === "object" ? l.target.id : l.target);
        if (s && t) s._kids.push(t);
      });
      const root = [...byId.values()].find((n) => n.kind === "root") || byId.values().next().value;

      // ---- recursive layout
      const segs = [];   // {a,b,rA,rB,domain}
      const leaves = [];
      function frame(dir) {
        const up = Math.abs(dir.y) < 0.98 ? new V(0, 1, 0) : new V(1, 0, 0);
        const u = new V().crossVectors(dir, up).normalize();
        const v = new V().crossVectors(dir, u).normalize();
        return [u, v];
      }
      function grow(node, base, dir, len, rad, depth) {
        const end = base.clone().add(dir.clone().multiplyScalar(len));
        segs.push({ a: base, b: end, rA: Math.max(rad * 0.62, 0.12), rB: Math.max(rad, 0.18), domain: node.domain });
        const kids = node._kids || [];
        if (!kids.length) {
          const j = new V(rand(node.id) - 0.5, rand(node.id + 7) - 0.5, rand(node.id + 13) - 0.5).multiplyScalar(len * 0.3);
          leaves.push({ pos: end.clone().add(j), node });
          return;
        }
        const [u, v] = frame(dir);
        const spread = depth === 0 ? 0.82 : depth === 1 ? 0.62 : 0.5;
        kids.forEach((k, i) => {
          const az = (i / kids.length) * Math.PI * 2 + depth * 0.9 + rand(node.id + i) * 1.3;
          const a = spread * (0.7 + 0.55 * rand(k.id));
          const childDir = dir.clone().multiplyScalar(Math.cos(a))
            .add(u.clone().multiplyScalar(Math.sin(a) * Math.cos(az)))
            .add(v.clone().multiplyScalar(Math.sin(a) * Math.sin(az)));
          childDir.y -= 0.07 * (depth + 1);     // gravity droop -> graceful weeping canopy
          childDir.normalize();
          grow(k, end, childDir, len * 0.71, rad * 0.6, depth + 1);
        });
      }

      const H = 64;
      const top = new V(0, H, 0);
      segs.push({ a: new V(0, 0, 0), b: top, rA: 2.7, rB: 4.6, domain: null });
      (root._kids || []).forEach((dn, i) => {
        const az = (i / root._kids.length) * Math.PI * 2 + 0.3;
        const a = 0.8;
        const dir = new V(Math.sin(a) * Math.cos(az), Math.cos(a), Math.sin(a) * Math.sin(az)).normalize();
        grow(dn, top, dir, 42, 2.5, 0);
      });

      // ---- scene
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x03060a, 150, 520);
      const w = mount.clientWidth, h = mount.clientHeight || 520;
      const camera = new THREE.PerspectiveCamera(48, w / h, 0.5, 6000);
      camera.position.set(48, H * 0.62, H * 2.5);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      // lighting -> woody depth
      scene.add(new THREE.HemisphereLight(0x9ec4ff, 0x0a0d12, 0.75));
      const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(70, 140, 90); scene.add(key);
      const rim = new THREE.DirectionalLight(0x6fd0ff, 0.55); rim.position.set(-90, 50, -70); scene.add(rim);

      // branches: shaded standard material per domain (woody, faint self-glow)
      const mats = {};
      const matFor = (dom) => {
        const k = dom || "trunk";
        if (!mats[k]) {
          const col = new THREE.Color(dom ? (DOMCOLOR[dom] || "#93A9B6") : "#7c6647");
          mats[k] = new THREE.MeshStandardMaterial({
            color: col, roughness: 0.78, metalness: 0.08,
            emissive: col, emissiveIntensity: dom ? 0.16 : 0.04,
          });
        }
        return mats[k];
      };
      const branchGroup = new THREE.Group();
      segs.forEach((s) => {
        const dir = new V().subVectors(s.b, s.a);
        const len = dir.length();
        if (len < 0.001) return;
        const geo = new THREE.CylinderGeometry(s.rA, s.rB, len, 8, 1, true);
        const m = new THREE.Mesh(geo, matFor(s.domain));
        m.position.copy(s.a).add(s.b).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(new V(0, 1, 0), dir.normalize());
        branchGroup.add(m);
      });
      scene.add(branchGroup);

      // foliage: round soft sprite, two layers (bright core + soft halo)
      const cv = document.createElement("canvas"); cv.width = cv.height = 64;
      const ctx = cv.getContext("2d");
      const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, "rgba(255,255,255,1)");
      grd.addColorStop(0.25, "rgba(255,255,255,0.8)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(cv);
      const pos = new Float32Array(leaves.length * 3);
      const col = new Float32Array(leaves.length * 3);
      leaves.forEach((lf, i) => {
        pos.set([lf.pos.x, lf.pos.y, lf.pos.z], i * 3);
        const c = new THREE.Color(TAGCOLOR[lf.node.tag] || "#93A9B6");
        col.set([c.r, c.g, c.b], i * 3);
      });
      const lg = new THREE.BufferGeometry();
      lg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      lg.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const core = new THREE.Points(lg, new THREE.PointsMaterial({
        size: 3.6, map: tex, vertexColors: true, transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
      }));
      const halo = new THREE.Points(lg, new THREE.PointsMaterial({
        size: 11, map: tex, vertexColors: true, transparent: true, opacity: 0.5,
        depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
      }));
      scene.add(halo); scene.add(core);

      // faint starfield backdrop
      const sN = 360;
      const sp = new Float32Array(sN * 3);
      for (let i = 0; i < sN; i++) {
        const rr = 700 + rand(i) * 900, th = rand(i + 1) * Math.PI * 2, ph = Math.acos(2 * rand(i + 2) - 1);
        sp.set([rr * Math.sin(ph) * Math.cos(th), rr * Math.cos(ph) * 0.6 + 120, rr * Math.sin(ph) * Math.sin(th)], i * 3);
      }
      const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
      scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.6, color: 0x8fb0d0, transparent: true, opacity: 0.5, sizeAttenuation: false })));

      // GEOPHYTE base label
      try {
        const SpriteText = (await import("three-spritetext")).default;
        const s = new SpriteText("GEOPHYTE");
        s.color = "#eaf2f6"; s.textHeight = 6.5; s.fontWeight = "600";
        s.strokeColor = "#04070b"; s.strokeWidth = 2.5;
        s.position.set(0, -8, 0);
        if (s.material) s.material.depthWrite = false;
        scene.add(s);
      } catch (e) { /* label optional */ }

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = 0.07;
      controls.autoRotate = true; controls.autoRotateSpeed = 0.3;
      controls.target.set(0, H * 0.82, 0);
      controls.minDistance = 30; controls.maxDistance = 900;

      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.62, 0.6, 0.82);
      composer.addPass(bloom);

      // click -> nearest leaf
      const ray = new THREE.Raycaster(); ray.params.Points.threshold = 4;
      const m2 = new THREE.Vector2();
      function onClick(ev) {
        const rect = renderer.domElement.getBoundingClientRect();
        m2.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        m2.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        ray.setFromCamera(m2, camera);
        const hits = ray.intersectObject(core);
        if (hits.length) setSel(leaves[hits[0].index].node);
      }
      renderer.domElement.addEventListener("click", onClick);

      let raf;
      const animate = () => { raf = requestAnimationFrame(animate); controls.update(); composer.render(); };
      animate();

      const onResize = () => {
        const ww = mount.clientWidth, hh = mount.clientHeight || 520;
        camera.aspect = ww / hh; camera.updateProjectionMatrix();
        renderer.setSize(ww, hh); composer.setSize(ww, hh);
      };
      const ro = new ResizeObserver(onResize); ro.observe(mount);

      cleanup = () => {
        cancelAnimationFrame(raf); ro.disconnect();
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
        background: "radial-gradient(circle at 50% 80%, #0b1422 0%, #03060a 68%)",
        border: "1px solid var(--gx-card-border)",
      }}>
        <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
        {/* vignette */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(circle at 50% 55%, transparent 55%, rgba(0,0,0,0.45) 100%)",
        }} />
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
            <span><i style={dot("#93A9B6")} />core</span>
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
