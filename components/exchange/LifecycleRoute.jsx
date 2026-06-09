"use client";
// components/exchange/LifecycleRoute.jsx
//
// The Cambium layer — its own page inside ExchangeShell. With 0 ventures it shows
// the honest empty state (an un-grown evidence seed) beside a clearly-labelled
// EXAMPLE cross-section + a how-to-read legend. Light biotech-venture skin.

import ExchangeShell from "./ExchangeShell";
import Cambium from "./Cambium";
import { T } from "./theme";

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
  { c: "#0E9C8A", t: "Büyüme halkaları", d: "tamamlanan her fonlama turu = bir halka; kalınlık ~ tur büyüklüğü, yay ~ o evrede geçen süre" },
  { c: "#15C2A8", t: "Kambiyum (canlı kenar)", d: "şu anki evre; nefes alır, takılınca griye döner" },
  { c: "#B5852F", t: "Damar ışınları", d: "yatırımcılar — girdikleri halkaya uzanır" },
  { c: "#9aa39d", t: "Kabuk (off-ramp)", d: "paused (kesik halka) · passed (çentik) · exit (açan halka)" },
];
const STAGES = ["Idea", "Pre-seed", "Seed", "Series A", "Series B+", "Growth", "Exit"];

function Stat({ n, label }) {
  return (
    <div>
      <div style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 26, fontWeight: 700, color: T.ink }}>{n}</div>
      <div style={{ fontSize: 11, color: T.muted }}>{label}</div>
    </div>
  );
}

export default function LifecycleRoute() {
  return (
    <ExchangeShell
      title="The Cambium"
      tagline="Yaşam döngüsü, halka halka. Her girişimi bir gövde kesiti gibi okursun: merkezde donmuş kanıt çekirdeği, her fonlama turunda dışa doğru bir büyüme halkası, canlı kenarda nefes alan kambiyum. Fikir → tohum-öncesi → tohum → Seri A → … → exit. Halkalar geri büyüyemez."
      wide
    >
      <div style={{ display: "flex", gap: 34, padding: "14px 20px", borderRadius: 12, background: T.surface, border: "1px solid " + T.line, marginBottom: 18, flexWrap: "wrap" }}>
        <Stat n="0" label="büyüyen girişim" />
        <Stat n="0" label="fonlama turu" />
        <Stat n="—" label="dönüşüm (tur→tur)" />
        <Stat n="—" label="takılan girişim" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
        <div style={{ padding: "18px", borderRadius: 16, background: T.surface, border: "1px solid " + T.line, textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: T.muted, fontWeight: 700, marginBottom: 8 }}>Şu an — büyümemiş tohum</div>
          <Cambium venture={{}} size={320} />
          <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.6, marginTop: 10, fontStyle: "italic" }}>
            Henüz büyüyen bir girişim yok. İlk doğrulanmış değer çıktısı bir kapı açtığında, ilk halka buraya işlenir.
          </div>
        </div>
        <div style={{ padding: "18px", borderRadius: 16, background: T.surface, border: "1px dashed " + T.teal, textAlign: "center" }}>
          <div style={{ display: "inline-block", fontSize: 9, padding: "2px 8px", borderRadius: 99, background: "#FBEFD6", color: "#7a5713", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>ÖRNEK · gerçek veri değil</div>
          <Cambium venture={EXAMPLE} size={320} />
          <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.6, marginTop: 10 }}>
            Fikir → tohum-öncesi → tohum'u tamamlamış, şu an <strong style={{ color: T.body }}>Seri A</strong>'da canlı büyüyen örnek bir girişim. İki yatırımcı ışını bağlı. Sayılar illüstratiftir.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        <div style={{ padding: "16px 20px", borderRadius: 14, background: T.surface, border: "1px solid " + T.line }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: T.tealDeep, fontWeight: 700, marginBottom: 12 }}>Nasıl okunur</div>
          {LEGEND.map((l) => (
            <div key={l.t} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 9 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: l.c, flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, lineHeight: 1.5 }}><strong style={{ color: T.ink }}>{l.t}</strong> <span style={{ color: T.body }}>— {l.d}</span></div>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(29,158,117,0.07)", border: "1px solid rgba(29,158,117,0.25)" }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: T.emerald, fontWeight: 700, marginBottom: 10 }}>Halkalar (içten dışa)</div>
          {STAGES.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", fontSize: 12.5, color: T.body }}>
              <span style={{ width: 18, textAlign: "right", color: T.faint }}>{i + 1}</span>{s}
            </div>
          ))}
          <div style={{ fontSize: 11, color: T.muted, marginTop: 10, lineHeight: 1.5 }}>
            Yarıçap = evre, açı = o evrede geçen süre. Değer yeşil kanıttan <strong style={{ color: T.body }}>dışa</strong> büyür; firewall geometride.
          </div>
        </div>
      </div>
    </ExchangeShell>
  );
}
