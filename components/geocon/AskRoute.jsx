"use client";
// /geocon/ask — natural-language atlas query. Currently rule-based
// (lib/ask/parser.js) so it ships without any LLM dependency.
// Voice input via Web Speech API when available.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { parseAsk, summarizeQuery } from "../../lib/ask/parser";
import { GlassCard } from "../shared";

const SUGGESTIONS_EN = [
  "Show me critically endangered Crocus in Iran",
  "Open calls for Lilium",
  "Vulnerable species from Greece",
  "Endangered Iridaceae in Turkey",
];
const SUGGESTIONS_TR = [
  "İran'da kritik tehlikede Crocus türleri",
  "Crocus için açık çağrılar",
  "Yunanistan'dan hassas türler",
  "Türkiye'de tehlikede Iridaceae",
];

const IUCN_TINT = {
  CR: "#FF8B96", EN: "#FFB870", VU: "#FFE875",
  NT: "#B2DFDB", LC: "#A5D6A7", DD: "#CFD8DC", NE: "#90A4AE",
};

export default function AskRoute() {
  const [input, setInput] = useState("");
  const [vocab, setVocab] = useState({ families: [], genera: [] });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  // Load the family + genus vocab once so the parser can detect them
  useEffect(() => {
    (async () => {
      const [famsRes, gensRes] = await Promise.all([
        supabase.rpc("get_atlas_family_counts"),
        supabase.rpc("list_atlas_genera"),
      ]);
      const families = Array.isArray(famsRes.data) ? famsRes.data.map((r) => r.family) : [];
      const genera   = Array.isArray(gensRes.data) ? gensRes.data.map((r) => r.genus).filter(Boolean) : [];
      setVocab({ families, genera });
    })();
  }, []);

  const parsed = useMemo(() => parseAsk(input, vocab), [input, vocab]);

  async function run(text) {
    const q = text != null ? parseAsk(text, vocab) : parsed;
    setBusy(true); setErr(null); setResult(null);
    try {
      const data = await dispatch(q);
      setResult({ q, data });
    } catch (e) {
      setErr(e?.message || "Query failed.");
    } finally {
      setBusy(false);
    }
  }

  function startVoice(langPref) {
    const Rec = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!Rec) {
      alert("Voice input isn't supported in this browser yet.");
      return;
    }
    const rec = new Rec();
    rec.lang = langPref || (navigator.language || "en-US");
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setInput(transcript);
        // auto-run when voice resolves
        setTimeout(() => run(transcript), 0);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 60 }}>
      <div className="gx-rise">
        <h1 style={{
          fontFamily: "var(--gx-font-display)",
          fontSize: "clamp(36px, 5vw, 60px)",
          letterSpacing: -2,
          margin: "8px 0 0",
          background: "linear-gradient(135deg, var(--gx-accent-bee-gold) 0%, var(--gx-accent-bee-warm) 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
          lineHeight: 0.95,
        }}>
          Ask GEOCON
        </h1>
        <div style={{ fontSize: 13, color: "var(--gx-ink-muted)", marginTop: 6 }}>
          Type or speak a question. The parser extracts IUCN tier, family, genus, country, and intent.
        </div>
      </div>

      <GlassCard style={{ padding: 14, marginTop: 18 }} className="gx-rise gx-rise-1">
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") run(); }}
            placeholder="Ask anything — e.g., 'CR Crocus in Iran with open calls'"
            style={{
              flex: 1,
              padding: "12px 14px",
              fontSize: 15,
              background: "var(--gx-surface)",
              color: "var(--gx-ink)",
              border: "1px solid var(--gx-border-soft)",
              borderRadius: 10,
              outline: "none",
            }}
          />
          <button
            onClick={() => startVoice("en-US")}
            className="gx-btn"
            title="Voice (English)"
            style={voiceBtn(listening)}
          >
            {listening ? "● rec" : "🎙 EN"}
          </button>
          <button
            onClick={() => startVoice("tr-TR")}
            className="gx-btn"
            title="Sesle (Türkçe)"
            style={voiceBtn(listening)}
          >
            🎙 TR
          </button>
          <button
            onClick={() => run()}
            disabled={busy || !input.trim()}
            className="gx-btn"
            style={{
              padding: "12px 18px",
              fontSize: 13,
              fontWeight: 700,
              background: "linear-gradient(135deg, #FFD15C 0%, #F5A623 100%)",
              color: "#1a0d2e",
              border: "none",
              borderRadius: 10,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.6 : 1,
              letterSpacing: 0.4,
            }}
          >
            {busy ? "…" : "Ask →"}
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: "var(--gx-ink-muted)" }}>
          <strong>Parsed:</strong> {summarizeQuery(parsed)}
        </div>
      </GlassCard>

      {!result && !busy && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--gx-ink-muted)", marginBottom: 8 }}>
            Try
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[...SUGGESTIONS_EN, ...SUGGESTIONS_TR].map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); run(s); }}
                className="gx-btn"
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  background: "var(--gx-surface)",
                  border: "1px solid var(--gx-border-soft)",
                  color: "var(--gx-ink-soft)",
                  borderRadius: 999,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {err && (
        <div style={{ marginTop: 16, padding: 14, background: "#FFF6F6", border: "1px solid #FCEBEB", color: "var(--gx-accent-rose)", borderRadius: 10, fontSize: 12 }}>
          {err}
        </div>
      )}

      {result && (
        <Results result={result} />
      )}
    </div>
  );
}

function voiceBtn(active) {
  return {
    padding: "0 12px",
    fontSize: 12,
    fontWeight: 600,
    background: active ? "#FFE6BC" : "var(--gx-surface)",
    color: active ? "#85651A" : "var(--gx-ink-soft)",
    border: "1px solid var(--gx-border-soft)",
    borderRadius: 10,
    cursor: "pointer",
  };
}

// Dispatch a parsed query to a Supabase call appropriate for the intent.
async function dispatch(q) {
  if (q.intent === "open_calls") {
    const { data, error } = await supabase.rpc("list_open_proposals");
    if (error) throw error;
    return { kind: "open_calls", rows: data || [] };
  }

  // species fallback — apply tiers + family + genus + country filters
  let sel = supabase
    .from("species")
    .select("id, accepted_name, common_name, family, genus, iucn_status, country_focus, thumbnail_url")
    .order("composite_score", { ascending: false, nullsFirst: false })
    .limit(60);

  if (q.tiers?.length)     sel = sel.in("iucn_status", q.tiers);
  if (q.families?.length)  sel = sel.in("family", q.families);
  if (q.genera?.length)    sel = sel.in("genus",  q.genera);
  if (q.countries?.length) sel = sel.in("country_focus", q.countries);

  // If nothing got detected at all, fall back to tsvector search of the raw query
  if (!q.tiers.length && !q.families.length && !q.genera.length && !q.countries.length && q.raw?.trim().length >= 2) {
    const { data, error } = await supabase.rpc("search_species_fulltext", {
      p_query: q.raw,
      p_limit: 30,
    });
    if (error) throw error;
    return { kind: "species", rows: (data || []).map((r) => ({ ...r, country_focus: r.country_focus || null })) };
  }

  const { data, error } = await sel;
  if (error) throw error;
  return { kind: "species", rows: data || [] };
}

function Results({ result }) {
  const { q, data } = result;
  const rows = data.rows || [];
  return (
    <section style={{ marginTop: 18 }} className="gx-rise gx-rise-2">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <h2 style={{
          fontFamily: "var(--gx-font-serif)",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--gx-ink)",
          margin: 0,
        }}>
          {data.kind === "open_calls" ? "Open calls" : "Species"} · {rows.length}
        </h2>
      </div>

      {rows.length === 0 && (
        <div style={{ padding: 30, textAlign: "center", color: "var(--gx-ink-muted)", fontSize: 12, border: "1px dashed var(--gx-border)", borderRadius: 12 }}>
          Nothing matched. Try relaxing filters or rephrasing.
        </div>
      )}

      {data.kind === "species" && rows.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {rows.map((s) => (
            <Link key={s.id} href={`/geocon/species/${s.id}`}
              className="gx-card gx-card-hover"
              style={{ padding: 12, textDecoration: "none", color: "inherit", display: "block" }}>
              <div style={{ fontFamily: "var(--gx-font-serif)", fontStyle: "italic", fontWeight: 700, fontSize: 13, color: "var(--gx-ink)", lineHeight: 1.3 }}>
                {s.accepted_name}
              </div>
              {s.common_name && <div style={{ fontSize: 11, color: "var(--gx-ink-muted)", marginTop: 2 }}>{s.common_name}</div>}
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {s.iucn_status && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                    background: IUCN_TINT[s.iucn_status] || "#ccc", color: "#2c2c2a",
                  }}>{s.iucn_status}</span>
                )}
                {s.family && <span style={{ fontSize: 9, fontWeight: 600, color: "var(--gx-ink-muted)" }}>{s.family}</span>}
                {s.country_focus && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--gx-accent-azure)" }}>{s.country_focus}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {data.kind === "open_calls" && rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.slice(0, 20).map((p) => (
            <Link key={p.id} href={`/geocon/proposals/${p.id}`}
              className="gx-card gx-card-hover"
              style={{ padding: 12, textDecoration: "none", color: "inherit", display: "block" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gx-ink)" }}>{p.title || "(untitled)"}</div>
              {p.description && (
                <div style={{ fontSize: 11, color: "var(--gx-ink-soft)", marginTop: 4, lineHeight: 1.5,
                              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {p.description}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
