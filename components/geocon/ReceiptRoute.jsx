"use client";
// components/geocon/ReceiptRoute.jsx
//
// THE PROVENANCE RECEIPT — the public, citable face of a closed knowledge-gap.
// A persistent-identifier-bearing evidence object whose provenance was provably
// never money-edited (the firewall is a wall in Postgres). Reads the money-free,
// PII-free get_chain_receipt(pid) RPC. This is the artifact that converts a
// project-management tool into an inimitable scientific record.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const INK = "#15302A", BODY = "#3E5852", MUT = "#7C948D", LINE = "#DCE9E4";
const GREEN = "#1B5E20", TEAL = "#0E9C8A";
const BG = "linear-gradient(178deg, #F6FBF9 0%, #ECF5F1 100%)";

function strengthLabel(s) {
  if (s >= 0.9) return "verified";
  if (s >= 0.7) return "strong";
  if (s >= 0.4) return "moderate";
  return "weak";
}

export default function ReceiptRoute({ pid }) {
  const [r, setR] = useState(undefined); // undefined=loading, null=not found
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const chain = await supabase.rpc("get_chain_receipt", { p_pid: pid });
        if (!on) return;
        if (chain?.data) { setR(chain.data); return; }
        // fall back to a thesis analysis-run receipt (work-becomes-a-receipt)
        const runR = await supabase.rpc("get_run_receipt", { p_pid: pid });
        if (!on) return;
        setR(runR?.data || null);
      } catch (e) { if (on) setR(null); }
    })();
    return () => { on = false; };
  }, [pid]);

  if (r === undefined) return <Frame><div style={{ color: MUT, textAlign: "center", padding: 60 }}>Yükleniyor…</div></Frame>;
  if (r === null) return <Frame><div style={{ color: MUT, textAlign: "center", padding: 60 }}>Bu kimliğe ait bir receipt bulunamadı.</div></Frame>;
  if (r.kind === "analysis") return <RunReceipt r={r} />;

  const ev = r.evidence || {}, cit = ev.citation || {}, fact = r.fact || {};
  const doiUrl = ev.doi ? "https://doi.org/" + ev.doi : null;

  const copy = async () => {
    try { await navigator.clipboard.writeText(r.citation_string || ""); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (e) {}
  };

  return (
    <Frame>
      <div style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 18, boxShadow: "0 10px 40px rgba(16,90,78,0.08)", overflow: "hidden" }}>
        {/* seal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 26px", borderBottom: "1px solid " + LINE, background: "rgba(27,94,32,0.04)" }}>
          <div style={{ fontSize: 10.5, letterSpacing: 2.5, textTransform: "uppercase", color: GREEN, fontWeight: 800 }}>Provenance Receipt</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12, color: BODY }}>{r.pid}</span>
            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: "rgba(14,156,138,0.12)", color: TEAL, fontWeight: 700 }}>v{r.version} · VERIFIED</span>
          </div>
        </div>

        <div style={{ padding: "26px 30px 30px" }}>
          {/* species + node */}
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: MUT, fontWeight: 700 }}>{r.node}</div>
          <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: "italic", fontSize: 30, fontWeight: 700, color: INK, margin: "6px 0 0", lineHeight: 1.1 }}>
            {r.species?.accepted_name}
          </h1>

          {/* the verified fact */}
          <div style={{ marginTop: 20, padding: "16px 18px", borderRadius: 12, background: "#F7FBF9", border: "1px solid " + LINE }}>
            <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: TEAL, fontWeight: 700, marginBottom: 8 }}>The verified fact</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>{fact.compound || "—"}{fact.compound_class ? <span style={{ fontSize: 12, fontWeight: 500, color: MUT }}> · {fact.compound_class}</span> : null}</div>
            {fact.activity && <div style={{ fontSize: 13.5, color: BODY, marginTop: 5, lineHeight: 1.5 }}>{fact.activity}</div>}
            {fact.therapeutic && <div style={{ fontSize: 13, color: BODY, marginTop: 3 }}>{fact.therapeutic}</div>}
            {fact.species_note && <div style={{ fontSize: 12, color: MUT, marginTop: 6, fontStyle: "italic" }}>{fact.species_note}</div>}
          </div>

          {/* evidence */}
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            <Cell k="Evidence class" v={ev.class || "—"} />
            <Cell k="Provenance weight" v={(ev.strength != null ? ev.strength.toFixed(2) : "—") + " · " + strengthLabel(ev.strength || 0)} />
            <Cell k="State" v={ev.fill_state || "—"} />
            <Cell k="DOI" v={ev.doi || "—"} mono />
          </div>

          {/* canonical citation */}
          {(cit.title || cit.authors) && (
            <div style={{ marginTop: 16, fontSize: 13, color: BODY, lineHeight: 1.6 }}>
              <span style={{ fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: MUT, fontWeight: 700, display: "block", marginBottom: 6 }}>Source — CrossRef-resolved</span>
              {cit.authors} {cit.year ? "(" + cit.year + ")." : ""} <strong style={{ color: INK }}>{cit.title}</strong> {cit.journal}{cit.volume ? ", " + cit.volume : ""}{cit.page ? ":" + cit.page : ""}.
              {doiUrl && <> <a href={doiUrl} target="_blank" rel="noopener noreferrer" style={{ color: TEAL, textDecoration: "none", fontWeight: 600 }}>doi.org/{ev.doi} →</a></>}
            </div>
          )}

          {/* firewall guarantee */}
          <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 12, background: "rgba(27,94,32,0.07)", border: "1px solid rgba(27,94,32,0.22)" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: GREEN, fontWeight: 800, marginBottom: 6 }}>Money-blind · firewall guarantee</div>
            <div style={{ fontSize: 12.5, color: BODY, lineHeight: 1.6 }}>{r.firewall}</div>
          </div>

          {/* cite this */}
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid " + LINE }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: MUT, fontWeight: 700 }}>Cite this</span>
              <button onClick={copy} style={{ fontSize: 12, fontWeight: 700, color: copied ? GREEN : "#fff", background: copied ? "rgba(27,94,32,0.12)" : TEAL, border: "none", padding: "7px 14px", borderRadius: 8, cursor: "pointer" }}>{copied ? "Copied ✓" : "Copy citation"}</button>
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, color: BODY, lineHeight: 1.6, fontFamily: "ui-monospace, Menlo, Consolas, monospace", background: "#F4F8F6", border: "1px solid " + LINE, borderRadius: 10, padding: "12px 14px" }}>
              {r.citation_string}
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 16, fontSize: 10.5, color: MUT }}>
        GEOCON Atlas · Venn BioVentures · minted {r.minted_at ? new Date(r.minted_at).toISOString().slice(0, 10) : ""}
      </div>
    </Frame>
  );
}

function RunReceipt({ r }) {
  const [copied, setCopied] = useState(false);
  const p = r.projection || {};
  const stats = p.statistics || {};
  const copy = async () => { try { await navigator.clipboard.writeText(r.citation_string || ""); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (e) {} };
  return (
    <Frame>
      <div style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 18, boxShadow: "0 10px 40px rgba(16,90,78,0.08)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 26px", borderBottom: "1px solid " + LINE, background: "rgba(27,94,32,0.04)" }}>
          <div style={{ fontSize: 10.5, letterSpacing: 2.5, textTransform: "uppercase", color: GREEN, fontWeight: 800 }}>Provenance Receipt</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12, color: BODY }}>{r.pid}</span>
            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: "rgba(14,156,138,0.12)", color: TEAL, fontWeight: 700 }}>ANALYSIS · REPRODUCIBLE</span>
          </div>
        </div>
        <div style={{ padding: "26px 30px 30px" }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: MUT, fontWeight: 700 }}>{p.method} · thesis analysis</div>
          {p.species && (
            <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: "italic", fontSize: 26, fontWeight: 700, color: INK, margin: "6px 0 0", lineHeight: 1.15 }}>{p.species}</h1>
          )}

          <div style={{ marginTop: 18, padding: "16px 18px", borderRadius: 12, background: "#F7FBF9", border: "1px solid " + LINE }}>
            <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: TEAL, fontWeight: 700, marginBottom: 8 }}>The finding</div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: INK, lineHeight: 1.45, fontFamily: "ui-monospace, Menlo, Consolas, monospace" }}>{p.finding}</div>
          </div>

          {Object.keys(stats).length > 0 && (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
              {Object.entries(stats).map(([k, v]) => <Cell key={k} k={k.replace(/_/g, " ")} v={String(v)} mono />)}
            </div>
          )}

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {p.institution && <Cell k="Institution" v={p.institution} />}
            {p.thesis_title && <Cell k="Thesis" v={p.thesis_title} />}
            {p.dataset_hash && <Cell k="Dataset hash" v={p.dataset_hash} mono />}
            <Cell k="Reproducible" v={p.reproducible ? "yes · re-runnable" : "—"} />
          </div>

          <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 12, background: "rgba(27,94,32,0.07)", border: "1px solid rgba(27,94,32,0.22)" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: GREEN, fontWeight: 800, marginBottom: 6 }}>Money-blind · firewall guarantee</div>
            <div style={{ fontSize: 12.5, color: BODY, lineHeight: 1.6 }}>{r.firewall}</div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid " + LINE }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: MUT, fontWeight: 700 }}>Cite this</span>
              <button onClick={copy} style={{ fontSize: 12, fontWeight: 700, color: copied ? GREEN : "#fff", background: copied ? "rgba(27,94,32,0.12)" : TEAL, border: "none", padding: "7px 14px", borderRadius: 8, cursor: "pointer" }}>{copied ? "Copied ✓" : "Copy citation"}</button>
            </div>
            <div style={{ marginTop: 10, fontSize: 11.5, color: BODY, lineHeight: 1.6, fontFamily: "ui-monospace, Menlo, Consolas, monospace", background: "#F4F8F6", border: "1px solid " + LINE, borderRadius: 10, padding: "12px 14px" }}>{r.citation_string}</div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 10.5, color: MUT }}>
        GEOCON Atlas · Venn BioVentures · minted {r.minted_at ? new Date(r.minted_at).toISOString().slice(0, 10) : ""}
      </div>
    </Frame>
  );
}

function Cell({ k, v, mono }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 10, background: "#F7FBF9", border: "1px solid " + LINE }}>
      <div style={{ fontSize: 9, color: MUT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{k}</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: INK, fontFamily: mono ? "ui-monospace, Menlo, Consolas, monospace" : "inherit", wordBreak: "break-all" }}>{v}</div>
    </div>
  );
}

function Frame({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "36px 18px 64px", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>{children}</div>
    </div>
  );
}
