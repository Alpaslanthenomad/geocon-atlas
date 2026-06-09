// components/exchange/DealRoom.jsx
//
// The VC-facing deal room — the evidence-first artifact a specific investor opens
// (later via a tokenized no-login link). This is the RENDER LAYER only; it takes a
// payload and shows it. No DB, no PII, no conservation interior — it shows the
// frozen-evidence story + the ask + a Venn-mediated CTA. The real token-gated
// get_deal_room RPC is built only once a real verified opportunity exists.
//
// When `example` is true, a loud banner makes clear this is a LAYOUT ILLUSTRATION,
// not a real listing and not real data — so it can never read as fabricated traction.

const INK = "#1f2430";
const MUT = "#5f6675";
const LINE = "#e7e9ee";

function Block({ label, children }) {
  return (
    <section style={{ marginTop: 18 }}>
      <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", color: MUT, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      {children}
    </section>
  );
}

export default function DealRoom({ payload, example = false }) {
  const d = payload || {};
  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", padding: "28px 16px 64px", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: INK }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {example && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "#FFF4D6", border: "1px solid #E5B23B", fontSize: 12.5, color: "#6b4e00", lineHeight: 1.5 }}>
            <strong>ÖRNEK GÖRÜNÜM</strong> — bu gerçek bir ilan veya veri değildir. Sistem boşken, doğrulanmış bir çıktı listelendiğinde bir yatırımcının göreceği düzeni gösterir. Hiçbir uydurma sayı yoktur; doldurulacak alanlar [EKLE:] ile işaretlidir.
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid " + LINE, boxShadow: "0 8px 30px rgba(20,25,40,0.06)", padding: "28px 30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#1D9E75", fontWeight: 700 }}>Venn Exchange · verified value output</div>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: "8px 0 0", lineHeight: 1.15 }}>{d.title || "[EKLE: output title]"}</h1>
            </div>
            {d.vertical && <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, background: "#EEF6F2", color: "#085041", fontWeight: 600, whiteSpace: "nowrap" }}>{d.vertical}</span>}
          </div>

          <Block label="The ask">
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{d.ask || "[EKLE: kind + amount + use of funds]"}</div>
          </Block>

          <Block label="The evidence (frozen, verifiable)">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
              {(d.evidence || [
                { k: "IUCN status", v: "[EKLE:]" },
                { k: "Verification", v: "venn_verified" },
                { k: "Endorsements", v: "[EKLE:]" },
                { k: "Source", v: "[EKLE: DOI]" },
              ]).map((e) => (
                <div key={e.k} style={{ padding: "10px 12px", borderRadius: 10, background: "#F7FAF8", border: "1px solid #E2EFE8" }}>
                  <div style={{ fontSize: 9, color: MUT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{e.k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{e.v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: MUT, marginTop: 8, fontStyle: "italic" }}>
              Frozen at door-open and immutable — your diligence team can trust this record was not money-edited.
            </div>
          </Block>

          <Block label="Commercial thesis">
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{d.thesis || "[EKLE: buyer segments, application — no invented market size]"}</div>
          </Block>

          <Block label="Team">
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{d.team || "[EKLE: public attribution only — names / ORCID, no private contact]"}</div>
          </Block>

          <div style={{ marginTop: 26, paddingTop: 18, borderTop: "1px solid " + LINE, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: MUT, lineHeight: 1.5, maxWidth: 380 }}>
              The conservation evidence stays inside its firewall. This brief cites it
              read-only and one-directional. No prices or market data cross back.
            </div>
            <button disabled={example} style={{ padding: "11px 20px", borderRadius: 10, border: "none", background: example ? "#cbd0d9" : "#1D9E75", color: "#fff", fontSize: 13, fontWeight: 700, cursor: example ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
              Request a conversation with VENN →
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 10, color: "#9aa0ad", letterSpacing: 0.5 }}>
          Venn BioVentures OÜ · evidence-first, curated dealflow
        </div>
      </div>
    </div>
  );
}
