"use client";
// components/exchange/LifecycleRoute.jsx
//
// The Cambium layer surface. With 0 real ventures it shows the HONEST empty state
// (an un-grown evidence seed) beside a clearly-labelled EXAMPLE cross-section, so
// the instrument is visible and legible without any fabricated traction. When real
// ventures exist, the empty seed is replaced by the live Grove (one Cambium per
// venture, read from the bridge).

import Link from "next/link";
import Cambium from "./Cambium";

const BG = "radial-gradient(ellipse at 50% 30%, #2a1240 0%, #150821 70%)";

const EXAMPLE = {
  pith: { evidenceCount: 3 },
  rings: [
    { key: "idea", dwellRatio: 0.3, magnitude: 0.2, brightness: 0.2 },
    { key: "pre_seed", dwellRatio: 0.5, magnitude: 0.35, brightness: 0.42 },
    { key: "seed", dwellRatio: 0.85, magnitude: 0.6, brightness: 0.62 },
  ],
  live: { stage: "series_a", timeRatio: 0.45, stalled: false },
  investors: [{ stage: "seed" }, { stage: "series_a" }],
  status: "active",
};

const LEGEND = [
  { c: "#1D9E75", t: "Öz (pith)", d: "donmuş koruma kanıtı — her şey buradan dışa büyür" },
  { c: "#E5722B", t: "Büyüme halkaları", d: "tamamlanan her fonlama turu = bir halka; kalınlık ~ tur büyüklüğü, yay ~ o evrede geçen süre" },
  { c: "#FFE08A", t: "Kambiyum (canlı kenar)", d: "şu anki evre; nefes alır, takılınca griye döner" },
  { c: "#FFD79B", t: "Damar ışınları", d: "yatırımcılar — girdikleri halkaya uzanır" },
  { c: "#9b8c74", t: "Kabuk (off-ramp)", d: "paused (kesik halka) · passed (çentik) · exit (açan halka)" },
];

const STAGES = ["Idea", "Pre-seed", "Seed", "Series A", "Series B+", "Growth", "Exit"];

function Stat({ n, label }) {
  return (
    <div>
      <div style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 26, fontWeight: 700, color: "#FFE6BC" }}>{n}</div>
      <div style={{ fontSize: 11, color: "#C8B89E" }}>{label}</div>
    </div>
  );
}

export default function LifecycleRoute() {
  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#f3e8d3", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: "28px 22px 64px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Link href="/exchange" style={{ fontSize: 11, color: "#FFD79B", textDecoration: "none" }}>← Venn Exchange</Link>

        <header style={{ marginTop: 16, marginBottom: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#FFD79B", fontWeight: 600 }}>venture lifecycle · The Cambium</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: "8px 0 0", color: "#FFE6BC", letterSpacing: -0.5 }}>Yaşam döngüsü, halka halka</h1>
          <p style={{ fontSize: 13.5, color: "#E7D3B3", marginTop: 8, maxWidth: 720, lineHeight: 1.6 }}>
            Her girişimi bir <strong>gövde kesiti</strong> gibi okursun: merkezde donmuş
            kanıt çekirdeği, her fonlama turunda dışa doğru bir <strong>büyüme halkası</strong>,
            canlı kenarda nefes alan <strong>kambiyum</strong>. Fikir → tohum-öncesi → tohum →
            Seri A → … → exit. Halkalar yalan söyleyemez — geri büyüyemezler.
          </p>
        </header>

        {/* oversight — honest zeros */}
        <div style={{ display: "flex", gap: 34, padding: "14px 20px", borderRadius: 12, background: "rgba(28,12,44,0.5)", border: "1px solid rgba(245,166,35,0.18)", marginBottom: 18, flexWrap: "wrap" }}>
          <Stat n="0" label="büyüyen girişim" />
          <Stat n="0" label="fonlama turu" />
          <Stat n="—" label="dönüşüm (tur→tur)" />
          <Stat n="—" label="takılan girişim" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
          {/* the honest empty seed */}
          <div style={{ padding: "18px", borderRadius: 16, background: "rgba(20,8,33,0.5)", border: "1px solid rgba(245,166,35,0.18)", textAlign: "center" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#C8B89E", fontWeight: 700, marginBottom: 8 }}>Şu an — büyümemiş tohum</div>
            <Cambium venture={{}} size={300} />
            <div style={{ fontSize: 12.5, color: "#C8B89E", lineHeight: 1.6, marginTop: 10, fontStyle: "italic" }}>
              Henüz büyüyen bir girişim yok. İlk doğrulanmış değer çıktısı bir kapı açtığında, ilk halka buraya işlenir.
            </div>
          </div>

          {/* the labelled example */}
          <div style={{ padding: "18px", borderRadius: 16, background: "rgba(20,8,33,0.5)", border: "1px dashed rgba(245,166,35,0.45)", textAlign: "center" }}>
            <div style={{ display: "inline-block", fontSize: 9, padding: "2px 8px", borderRadius: 99, background: "#FFF4D6", color: "#6b4e00", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>ÖRNEK · gerçek veri değil</div>
            <Cambium venture={EXAMPLE} size={300} />
            <div style={{ fontSize: 12.5, color: "#C8B89E", lineHeight: 1.6, marginTop: 10 }}>
              Fikir → tohum-öncesi → tohum'u tamamlamış, şu an <strong>Seri A</strong>'da canlı
              büyüyen örnek bir girişim. İki yatırımcı ışını bağlı. Sayılar illüstratiftir.
            </div>
          </div>
        </div>

        {/* legend + stages */}
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
          <div style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(28,12,44,0.5)", border: "1px solid rgba(245,166,35,0.18)" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#FFD79B", fontWeight: 700, marginBottom: 12 }}>Nasıl okunur</div>
            {LEGEND.map((l) => (
              <div key={l.t} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 9 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: l.c, flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, lineHeight: 1.5 }}><strong style={{ color: "#FFE6BC" }}>{l.t}</strong> <span style={{ color: "#C8B89E" }}>— {l.d}</span></div>
              </div>
            ))}
          </div>
          <div style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(125,168,111,0.08)", border: "1px solid rgba(125,168,111,0.28)" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#A8C49C", fontWeight: 700, marginBottom: 10 }}>Halkalar (içten dışa)</div>
            {STAGES.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", fontSize: 12.5, color: "#E7D3B3" }}>
                <span style={{ width: 18, textAlign: "right", color: "#8a6f56" }}>{i + 1}</span>{s}
              </div>
            ))}
            <div style={{ fontSize: 11, color: "#C8B89E", marginTop: 10, lineHeight: 1.5 }}>
              Yarıçap = evre, açı = o evrede geçen süre. Değer yeşil kanıttan <strong>dışa</strong> büyür; asla içeri geri büyüyemez — firewall geometride.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
