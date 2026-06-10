"use client";
// components/geocon/AssertFact.jsx
//
// THE VERB (Phase 0). A signed-in user does ONE real piece of work: pick a species,
// assert one provenance-labelled, DOI-backed fact, and mint a Provenance Receipt with
// their name on it -- one evidenced fact moved from 0 to 1. The money-blind CHECK on
// chain_evidence fires server-side, so the firewall holds. No fabrication: a real DOI
// is required and resolved before the receipt mints.

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const NODES = [
  { id: "e13cc6d0-29e6-425f-a6ca-4c88e2062e29", label: "Metabolite", hint: "a compound this species is documented to produce", field: "compound", ph: "e.g. galantamine" },
  { id: "481d32b2-53f1-49a5-b57b-eb121cdb8b27", label: "Bioactivity", hint: "a documented biological activity of the species or its extract", field: "activity", ph: "e.g. acetylcholinesterase inhibition" },
  { id: "0080906e-6c47-4453-9e6d-f0664bbb64ba", label: "Phenology", hint: "flowering / phenology timing", field: "detail", ph: "e.g. flowers Feb–Mar in the wild" },
  { id: "02afecbc-5cb4-4ad8-839c-05d375c2183d", label: "Conservation / threat", hint: "a conservation or threat fact (no money)", field: "detail", ph: "e.g. wild population fragmented by collection" },
  { id: "04a0f9e7-6ed4-42bd-930a-067a474111e8", label: "DNA barcode", hint: "a sequenced barcode marker", field: "detail", ph: "e.g. rbcL + matK deposited, GenBank ..." },
  { id: "12f78f27-b3d8-4a9d-9a2f-d1083ba6e553", label: "Seed banking", hint: "an ex-situ seed-banking fact", field: "detail", ph: "e.g. seeds orthodox, viable after drying" },
  { id: "38c6ad27-683d-4180-baff-7b58a60705e8", label: "Traditional use", hint: "a recorded traditional / ethnobotanical use (a report, never a clinical claim)", field: "use", ph: "e.g. bulb decoction recorded for ..." },
];

export default function AssertFact() {
  const { user, loading: authLoading } = useAuthContext();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [species, setSpecies] = useState(null);
  const [node, setNode] = useState(NODES[0]);
  const [claim, setClaim] = useState("");
  const [extra, setExtra] = useState("");
  const [doi, setDoi] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null); // { pid, reused }

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUser(data?.user || null)); }, []);

  useEffect(() => {
    if (!q || q.length < 3 || species) { setResults([]); return; }
    let on = true;
    const t = setTimeout(() => {
      supabase.from("species").select("id, accepted_name, family, vertical_id").ilike("accepted_name", "%" + q + "%").limit(8)
        .then(({ data }) => { if (on) setResults(data || []); }).catch(() => {});
    }, 220);
    return () => { on = true; clearTimeout(t); };
  }, [q, species]);

  async function submit() {
    setErr(null);
    if (!species) return setErr("Pick a species first.");
    if (!claim.trim()) return setErr("State the fact in a sentence.");
    if (!/^10\.\d{4,9}\//.test(doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, ""))) return setErr("A real DOI (10.xxxx/…) is required — facts must be evidence-backed.");
    setBusy(true);
    try {
      const cleanDoi = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
      // resolve + validate the DOI before minting (no fabrication)
      const r = await fetch("/api/geocon/resolve-doi?doi=" + encodeURIComponent(cleanDoi));
      const j = await r.json();
      if (!r.ok || !j.csl) throw new Error("That DOI could not be resolved. Check it and try again.");
      const value = { claim: claim.trim(), provenance: "user-asserted, primary literature" };
      if (extra.trim()) value[node.field] = extra.trim();
      const { data, error } = await supabase.rpc("assert_fact_and_mint", {
        p_species_id: species.id, p_link_type_id: node.id, p_value: value,
        p_doi: cleanDoi, p_crossref: j.csl,
      });
      if (error) throw error;
      setDone(data);
    } catch (e) { setErr(e.message || "Could not mint the receipt."); }
    finally { setBusy(false); }
  }

  if (authLoading) return <Shell><div style={{ color: MUT, padding: 30, textAlign: "center" }}>…</div></Shell>;
  if (!user) return (
    <Shell>
      <h1 style={h1}>Move one fact from 0 to 1</h1>
      <p style={lede}>Assert one real, evidence-backed fact about a threatened plant and leave with a citable Provenance Receipt with your name on it. First, sign in.</p>
      <a href="/" style={cta}>Sign in via BEE →</a>
    </Shell>
  );

  if (done) return (
    <Shell>
      <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: GREEN, fontWeight: 800 }}>{done.reused ? "Already on record" : "Minted"}</div>
      <h1 style={h1}>One fact, from 0 to 1.</h1>
      <p style={lede}>Your evidenced fact about <em>{species?.accepted_name}</em> is now a money-blind, citable Provenance Receipt — with your name on it.</p>
      <a href={"/receipt/" + done.pid} style={cta}>Open your receipt — {done.pid} →</a>
      <button onClick={() => { setDone(null); setSpecies(null); setQ(""); setClaim(""); setExtra(""); setDoi(""); }} style={ghost}>Assert another fact</button>
    </Shell>
  );

  return (
    <Shell>
      <h1 style={h1}>Assert a fact</h1>
      <p style={lede}>One real species, one provenance-labelled fact, one DOI source. Mint a Provenance Receipt with your name on it — and move the atlas from 0.</p>

      {/* 1. species */}
      <Step n="1" t="Pick a species">
        {species ? (
          <div style={chip}><em>{species.accepted_name}</em> <span style={{ color: MUT }}>· {species.family}{species.vertical_id === "medicinal_plants" ? " · ETHNOFLORA" : ""}</span>
            <button onClick={() => { setSpecies(null); setQ(""); }} style={x}>×</button></div>
        ) : (
          <>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by scientific name…" style={input} autoFocus />
            {results.length > 0 && (
              <div style={{ marginTop: 6, border: "1px solid " + LINE, borderRadius: 10, overflow: "hidden" }}>
                {results.map((s) => (
                  <button key={s.id} onClick={() => { setSpecies(s); setResults([]); }} style={rowBtn}>
                    <em>{s.accepted_name}</em> <span style={{ color: MUT, fontSize: 11 }}>{s.family}{s.vertical_id === "medicinal_plants" ? " · medicinal" : ""}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </Step>

      {/* 2. node */}
      <Step n="2" t="What kind of fact">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {NODES.map((nd) => (
            <button key={nd.id} onClick={() => setNode(nd)} style={pill(node.id === nd.id)}>{nd.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: MUT, marginTop: 7 }}>{node.hint}</div>
      </Step>

      {/* 3. the fact */}
      <Step n="3" t="State the fact">
        <textarea value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="In one sentence, what is true? (provenance-labelled; never a clinical claim)" rows={2} style={{ ...input, resize: "vertical" }} />
        <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={node.ph} style={{ ...input, marginTop: 7 }} />
      </Step>

      {/* 4. evidence */}
      <Step n="4" t="The evidence (DOI)">
        <input value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="10.xxxx/…  (required — the source the fact rests on)" style={input} />
      </Step>

      {err && <div style={{ fontSize: 12.5, color: "#c0392b", marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(192,57,43,0.07)" }}>{err}</div>}

      <button onClick={submit} disabled={busy} style={{ ...cta, marginTop: 16, opacity: busy ? 0.6 : 1, cursor: busy ? "wait" : "pointer" }}>
        {busy ? "Resolving DOI + minting…" : "Mint my Provenance Receipt →"}
      </button>
      <div style={{ fontSize: 11, color: MUT, marginTop: 10, lineHeight: 1.6 }}>
        The DOI is resolved against CrossRef before anything is minted. The receipt is money-blind by construction (the conservation substrate carries zero money columns) and carries your name as the asserting researcher.
      </div>
    </Shell>
  );
}

const GREEN = "#1B5E20", INK = "#15302A", BODY = "#3E5852", MUT = "#7C948D", LINE = "#DCE9E4", TEAL = "#0E9C8A";
const h1 = { fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, letterSpacing: -0.8, color: INK, margin: "8px 0 0" };
const lede = { fontSize: 14.5, color: BODY, lineHeight: 1.6, margin: "12px 0 22px", maxWidth: 560 };
const cta = { display: "inline-block", fontSize: 14, fontWeight: 700, color: "#fff", background: GREEN, border: "none", padding: "12px 20px", borderRadius: 11, textDecoration: "none", cursor: "pointer" };
const ghost = { display: "block", marginTop: 12, fontSize: 12.5, color: BODY, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" };
const input = { width: "100%", boxSizing: "border-box", fontSize: 14, padding: "10px 13px", borderRadius: 10, border: "1px solid " + LINE, background: "#fff", color: INK };
const chip = { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, padding: "8px 12px", borderRadius: 10, background: "rgba(14,156,138,0.08)", border: "1px solid " + LINE, color: INK };
const x = { fontSize: 16, color: MUT, background: "none", border: "none", cursor: "pointer", lineHeight: 1 };
const rowBtn = { display: "block", width: "100%", textAlign: "left", padding: "9px 12px", background: "#fff", border: "none", borderBottom: "1px solid " + LINE, cursor: "pointer", color: INK };
const pill = (on) => ({ fontSize: 12.5, padding: "6px 12px", borderRadius: 99, cursor: "pointer", border: "1px solid " + (on ? GREEN : LINE), background: on ? "rgba(27,94,32,0.08)" : "#fff", color: on ? GREEN : BODY, fontWeight: on ? 700 : 500 });

function Step({ n, t, children }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
        <span style={{ width: 22, height: 22, borderRadius: 99, background: GREEN, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
        <span style={{ fontSize: 12.5, letterSpacing: 0.5, textTransform: "uppercase", color: INK, fontWeight: 700 }}>{t}</span>
      </div>
      {children}
    </div>
  );
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(178deg, #F6FBF9 0%, #ECF5F1 100%)", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "40px 22px 80px" }}>
        <a href="/geocon" style={{ fontSize: 11, color: MUT, textDecoration: "none", letterSpacing: 1, textTransform: "uppercase" }}>← GEOCON</a>
        <div style={{ marginTop: 18 }}>{children}</div>
      </div>
    </div>
  );
}
