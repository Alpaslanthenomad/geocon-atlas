"use client";
// /geocon/observe — field-mode observation capture. Browser GPS,
// optional photo URL, optional species pick via fulltext search.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { GlassCard } from "../shared";

export default function ObserveRoute() {
  const { user, researcher, profile } = useAuthContext();
  const [coords, setCoords] = useState(null);
  const [coordsErr, setCoordsErr] = useState(null);
  const [gettingFix, setGettingFix] = useState(false);

  const [speciesQ, setSpeciesQ] = useState("");
  const [hits, setHits] = useState([]);
  const [picked, setPicked] = useState(null);
  const [proposedName, setProposedName] = useState("");

  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const [err, setErr] = useState(null);

  function getFix() {
    if (!navigator.geolocation) {
      setCoordsErr("Geolocation not supported by this browser.");
      return;
    }
    setGettingFix(true); setCoordsErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 0),
        });
        setGettingFix(false);
      },
      (e) => {
        setCoordsErr(e.message || "Could not get a fix");
        setGettingFix(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  useEffect(() => {
    const q = speciesQ.trim();
    if (q.length < 2) { setHits([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("search_species_fulltext", { p_query: q, p_limit: 8 });
      if (!cancelled) setHits(Array.isArray(data) ? data : []);
    }, 180);
    return () => { cancelled = true; clearTimeout(t); };
  }, [speciesQ]);

  async function submit() {
    setErr(null); setSubmitting(true);
    try {
      const observerName =
        researcher?.name || profile?.full_name || user?.email?.split("@")[0] || "Member";
      const { data: id, error } = await supabase.rpc("submit_field_observation", {
        p_species_id: picked?.id || null,
        p_proposed_name: !picked ? (proposedName || null) : null,
        p_lat: coords?.lat ?? null,
        p_lng: coords?.lng ?? null,
        p_accuracy_m: coords?.accuracy ?? null,
        p_photo_url: photoUrl || null,
        p_notes: notes || null,
        p_observer_name: observerName,
      });
      if (error) throw error;
      setSubmittedId(id);
    } catch (e) {
      setErr(e?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <GlassCard style={{ padding: 26, maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 22, fontWeight: 700, color: "var(--gx-ink)" }}>
          Sign in to record observations
        </h1>
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 6 }}>
          Field observations are tied to your researcher profile so curators can credit you.
        </div>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "10px 18px", fontSize: 12, fontWeight: 700, color: "#1a0d2e", background: "linear-gradient(135deg, #FFD15C 0%, #F5A623 100%)", borderRadius: 8, textDecoration: "none" }}>
          Sign in via BEE →
        </Link>
      </GlassCard>
    );
  }

  if (submittedId) {
    return (
      <GlassCard style={{ padding: 24, maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
        <div style={{ fontSize: 30 }}>✅</div>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 20, color: "var(--gx-ink)", marginTop: 8 }}>Observation logged</h1>
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 6 }}>
          Thank you — a curator will review the record. You can{" "}
          <button onClick={() => {
            setSubmittedId(null); setCoords(null); setPicked(null); setProposedName(""); setPhotoUrl(""); setNotes(""); setSpeciesQ("");
          }} style={{ background: "none", border: "none", color: "var(--gx-accent-bio-green)", cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 12 }}>
            log another
          </button>{" "}
          right now.
        </div>
      </GlassCard>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 60 }}>
      <div className="gx-rise">
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 26, fontWeight: 700, color: "var(--gx-ink)", margin: 0 }}>
          📍 Field observation
        </h1>
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4 }}>
          Quickly log a sighting from your phone. GPS is optional but encouraged.
        </div>
      </div>

      <GlassCard style={{ padding: 18, marginTop: 16 }} className="gx-rise gx-rise-1">
        <Section title="1 · Species">
          {picked ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 10, background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)", borderRadius: 8 }}>
              <div>
                <div style={{ fontFamily: "var(--gx-font-serif)", fontStyle: "italic", fontWeight: 700, fontSize: 14, color: "var(--gx-ink)" }}>{picked.accepted_name}</div>
                <div style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>{picked.family} {picked.iucn_status && `· ${picked.iucn_status}`}</div>
              </div>
              <button onClick={() => setPicked(null)} style={{ background: "transparent", border: "1px solid var(--gx-border-soft)", color: "var(--gx-ink-soft)", padding: "4px 8px", fontSize: 10, borderRadius: 6, cursor: "pointer" }}>Change</button>
            </div>
          ) : (
            <>
              <input
                value={speciesQ}
                onChange={(e) => setSpeciesQ(e.target.value)}
                placeholder="Type accepted name or genus…"
                style={inputStyle}
              />
              {hits.length > 0 && (
                <div style={{ marginTop: 6, border: "1px solid var(--gx-border-soft)", borderRadius: 8, overflow: "hidden" }}>
                  {hits.map((h) => (
                    <button key={h.id} onClick={() => setPicked(h)} style={hitStyle}>
                      <span style={{ fontFamily: "var(--gx-font-serif)", fontStyle: "italic", fontWeight: 700 }}>{h.accepted_name}</span>
                      <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>{h.family || ""} {h.iucn_status && `· ${h.iucn_status}`}</span>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 10, color: "var(--gx-ink-muted)", marginTop: 8 }}>
                Don&apos;t see it? Type a proposed name and a curator will resolve it:
              </div>
              <input
                value={proposedName}
                onChange={(e) => setProposedName(e.target.value)}
                placeholder="e.g. Crocus cf. mathewii"
                style={{ ...inputStyle, marginTop: 4 }}
              />
            </>
          )}
        </Section>

        <Section title="2 · Location">
          {coords ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 10, background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)", borderRadius: 8, fontSize: 12, color: "var(--gx-ink)" }}>
              <div>
                <strong>Fix:</strong> {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}{" "}
                <span style={{ color: "var(--gx-ink-muted)" }}>· ±{coords.accuracy}m</span>
              </div>
              <button onClick={() => setCoords(null)} style={{ background: "transparent", border: "1px solid var(--gx-border-soft)", color: "var(--gx-ink-soft)", padding: "4px 8px", fontSize: 10, borderRadius: 6, cursor: "pointer" }}>Clear</button>
            </div>
          ) : (
            <button onClick={getFix} disabled={gettingFix} style={{
              padding: "10px 14px", fontSize: 12, fontWeight: 700,
              background: "var(--gx-accent-bio-green)", color: "#fff",
              border: "none", borderRadius: 8, cursor: gettingFix ? "default" : "pointer",
              opacity: gettingFix ? 0.6 : 1,
            }}>
              {gettingFix ? "Locating…" : "📡 Use my location"}
            </button>
          )}
          {coordsErr && <div style={{ fontSize: 11, color: "var(--gx-accent-rose)", marginTop: 6 }}>{coordsErr}</div>}
        </Section>

        <Section title="3 · Photo (optional)">
          <input
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="Paste an image URL (we'll add direct upload soon)"
            style={inputStyle}
          />
        </Section>

        <Section title="4 · Notes (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Habitat, phenology, threats observed…"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </Section>

        <button
          onClick={submit}
          disabled={submitting || (!picked && !proposedName)}
          className="gx-btn"
          style={{
            marginTop: 4,
            width: "100%",
            padding: "12px 18px",
            fontSize: 13,
            fontWeight: 700,
            background: "linear-gradient(135deg, #FFD15C 0%, #F5A623 100%)",
            color: "#1a0d2e",
            border: "none",
            borderRadius: 10,
            cursor: submitting ? "default" : "pointer",
            opacity: (submitting || (!picked && !proposedName)) ? 0.5 : 1,
            letterSpacing: 0.4,
          }}
        >
          {submitting ? "Submitting…" : "📍 Log observation"}
        </button>
        {err && <div style={{ marginTop: 8, fontSize: 11, color: "var(--gx-accent-rose)" }}>{err}</div>}
      </GlassCard>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gx-ink-muted)", marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 13,
  background: "var(--gx-surface-2)",
  color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 8,
  outline: "none",
  boxSizing: "border-box",
};

const hitStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "9px 12px",
  background: "var(--gx-surface)",
  border: "none",
  borderBottom: "1px solid var(--gx-border-soft)",
  cursor: "pointer",
  textAlign: "left",
  color: "var(--gx-ink)",
};
