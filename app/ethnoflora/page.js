// ETHNOFLORA — Vertical 3 on BEE: endemic medicinal-plant conservation, GEOCON-
// parallel on the shared rails. This is the honest "forming" face: the vision +
// the structural differences + the firewall posture. NO fabricated species — the
// atlas is registered as a rail (verticals.id='medicinal_plants', is_public=false)
// and does not go public until one real evidenced loop is closed, exactly as
// GEOCON proved.

import EthnofloraLive from "../../components/ethnoflora/EthnofloraLive";

const GREEN = "#138A6E";
const DEEP = "#0C5E4C";
const INK = "#10302A";
const BODY = "#3E5852";
const MUT = "#75918A";
const LINE = "#D8E9E3";
const BG = "linear-gradient(175deg, #F5FBF9 0%, #EAF4F0 60%, #E3F0EB 100%)";

export const metadata = {
  title: "ETHNOFLORA — endemic medicinal plant conservation",
  description:
    "The open conservation atlas of the world's threatened medicinal plants — where demand itself is the extinction driver. 361 real species and counting, provenance-labelled, money-blind, consent-gated.",
};

const DIFFERENCES = [
  { t: "Demand is the extinction driver", d: "For medicinal plants the threat is inverted: harvest itself drives decline, and the harvested organ is often the whole individual — roots, bark, tubers, resins. Conservation here means protecting a species from the very value it carries." },
  { t: "A third, consent-gated axis", d: "Beyond safeguard and knowledge, ETHNOFLORA records traditional/ethnobotanical use — and every use-fact carries Nagoya PIC/MAT consent provenance. A second firewall (ABS): the commerce door fails closed without benefit-sharing. An ethnobotanical 'used for X' is never a clinical claim." },
  { t: "A larger, more urgent gap", d: "Roughly four in five assessed medicinal-and-aromatic species have no conservation status at all — a wider unknown than the geophyte stubs. The gap is, again, the product." },
];

const SOURCES = ["Wikidata SPARQL (medication source, CC0)", "GBIF (taxonomy + native distribution, CC-BY)", "IUCN Red List (status, via Wikidata)", "WCVP / POWO (endemism arbiter, CC-BY) — next", "MPNS / Kew (medicinal names) — next", "Dr Duke USDA (phytochemistry, CC0) — next"];

function Card({ children, accent }) {
  return (
    <div style={{ padding: "20px 22px", borderRadius: 16, background: "#fff", border: "1px solid " + LINE, borderTop: "3px solid " + (accent || GREEN), boxShadow: "0 4px 16px rgba(12,94,76,0.05)" }}>
      {children}
    </div>
  );
}

export default function EthnofloraLanding() {
  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 72px" }}>
        <a href="/" style={{ fontSize: 11, color: MUT, textDecoration: "none", letterSpacing: 1, textTransform: "uppercase" }}>← BEE</a>

        <header style={{ marginTop: 22 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 10.5, letterSpacing: 2.5, textTransform: "uppercase", color: DEEP, fontWeight: 700 }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: GREEN }} /> Vertical 3 on BEE · live · v1 (beta)
          </div>
          <h1 style={{ fontSize: "clamp(40px, 6vw, 66px)", fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.02, margin: "14px 0 0", color: INK }}>ETHNOFLORA</h1>
          <p style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: "italic", fontSize: 17, color: BODY, margin: "16px 0 0", maxWidth: 660, lineHeight: 1.55 }}>
            The open conservation atlas of what we do not yet know about saving the world's threatened endemic
            <strong style={{ fontStyle: "normal", color: DEEP }}> medicinal</strong> plants — where demand itself is the extinction driver.
          </p>
        </header>

        <section style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: DEEP, fontWeight: 700, marginBottom: 14 }}>Why it is not a geophyte clone</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {DIFFERENCES.map((x) => (
              <Card key={x.t}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: INK, marginBottom: 8 }}>{x.t}</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: BODY }}>{x.d}</div>
              </Card>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 30, display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
          <Card accent={DEEP}>
            <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: DEEP, fontWeight: 700, marginBottom: 10 }}>Same rails, same firewall</div>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: BODY }}>
              ETHNOFLORA runs on the same engine as GEOCON — the program engine, the evidence graph, the vertical
              system — so it is a genuine second instantiation, not a fork. Conservation stays pure: zero money
              columns; commerce may only cite verified outputs, read-only and one-directional. On top of that sits a
              <strong style={{ color: INK }}> second firewall</strong> for traditional knowledge (ABS / Nagoya), so value can never flow from a
              community's knowledge without consent and benefit-sharing.
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: DEEP, fontWeight: 700, marginBottom: 10 }}>Reference data</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {SOURCES.map((s) => (
                <div key={s} style={{ fontSize: 12.5, color: BODY, display: "flex", gap: 8 }}><span style={{ color: GREEN }}>·</span>{s}</div>
              ))}
            </div>
          </Card>
        </section>

        <EthnofloraLive />

        <section style={{ marginTop: 30, padding: "18px 22px", borderRadius: 14, background: "rgba(19,138,110,0.07)", border: "1px solid rgba(19,138,110,0.25)" }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: DEEP, fontWeight: 700, marginBottom: 8 }}>Honest by construction</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.7, color: BODY }}>
            Every species above is real and provenance-labelled — no fabricated species, no invented data; distribution
            gaps are flagged, not filled. The ABS / Nagoya consent substrate is <strong style={{ color: INK }}>fail-closed</strong>: an ethnobotanical
            use-fact cannot reach commerce without recorded PIC/MAT consent. The Anatolian-endemic deepening and the
            first consent-gated loop are the next steps. The gap is the product; the receipt is the proof.
          </div>
        </section>
      </div>
    </div>
  );
}
