"use client";
// T3.a — Field Notebook (mobile-first).
//
// Drop a pin from wherever you are. Photo optional. Species_id
// optional (if unknown, leave the proposed_name field free-text and
// admin / community can identify later). GPS captured via
// navigator.geolocation (Permission API'sini ister, üzücü deneyim
// olmaması için kullanıcıya tek-buton-ile-yakala mantığı).
//
// Offline write fallback: when submit fails (navigator.onLine false
// or network error), the observation is queued in localStorage and
// retried on next page load when online.
//
// Camera / photo upload: HTML <input type="file" accept="image/*"
// capture="environment"> — tetikler mobile native camera. Photo upload
// için Supabase Storage gerekli — bu sürümde **stub**, env var ile
// kapatılır. Photo URL boş bırakılır.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Camera, Send, Wifi, WifiOff, ChevronDown } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { useToast } from "../ui";
import { track } from "../../lib/analytics";

const QUEUE_KEY = "gx_field_obs_queue";

function readQueue() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(QUEUE_KEY) || "[]"); }
  catch { return []; }
}
function writeQueue(q) {
  try { window.localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {}
}

export default function FieldRoute() {
  const { user } = useAuthContext();
  const toast = useToast();
  const [coords, setCoords] = useState(null);
  const [coordsErr, setCoordsErr] = useState(null);
  const [speciesQuery, setSpeciesQuery] = useState("");
  const [speciesResults, setSpeciesResults] = useState([]);
  const [pickedSpecies, setPickedSpecies] = useState(null); // {id, accepted_name}
  const [proposedName, setProposedName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [online, setOnline] = useState(true);
  const [recent, setRecent] = useState([]);
  const [queueLen, setQueueLen] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = () => setOnline(navigator.onLine);
    u();
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => {
      window.removeEventListener("online", u);
      window.removeEventListener("offline", u);
    };
  }, []);

  useEffect(() => { setQueueLen(readQueue().length); }, []);

  // Initial GPS capture — silently. User can tap to retry.
  function captureGPS() {
    setCoordsErr(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setCoordsErr("Bu cihazda GPS bulunamadı");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }),
      (err) => setCoordsErr(err.message || "Konum alınamadı"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }
  useEffect(() => { captureGPS(); }, []);

  // Load recent observations
  async function loadRecent() {
    if (!user) return;
    const { data } = await supabase.rpc("list_my_field_observations", { p_limit: 8 });
    setRecent(Array.isArray(data) ? data : []);
  }
  useEffect(() => { loadRecent(); }, [user]);

  // Live species search
  useEffect(() => {
    const q = speciesQuery.trim();
    if (!q || q.length < 2) { setSpeciesResults([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("species")
        .select("id, accepted_name, family")
        .ilike("accepted_name", `${q}%`)
        .limit(8);
      if (!cancelled) setSpeciesResults(data || []);
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [speciesQuery]);

  async function flushQueue() {
    const q = readQueue();
    if (q.length === 0) return;
    const ok = [];
    for (const item of q) {
      try {
        const { error } = await supabase.rpc("submit_field_observation", item);
        if (error) ok.push(item);  // keep for next retry
      } catch { ok.push(item); }
    }
    writeQueue(ok);
    setQueueLen(ok.length);
    if (ok.length === 0 && q.length > 0) {
      toast.success(`${q.length} bekleyen kayıt gönderildi`);
      loadRecent();
    }
  }
  useEffect(() => { if (online) flushQueue(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [online]);

  async function submit() {
    if (!coords) { toast.warning("Önce konumu yakala (GPS)"); return; }
    if (!pickedSpecies && !proposedName.trim()) {
      toast.warning("Species seç veya bir isim yaz");
      return;
    }
    const payload = {
      p_species_id: pickedSpecies?.id || null,
      p_proposed_name: pickedSpecies ? null : proposedName.trim(),
      p_lat: coords.lat,
      p_lng: coords.lng,
      p_accuracy_m: coords.accuracy || null,
      p_photo_url: null, // photo upload — stub, env-gated for future
      p_notes: notes || null,
      p_observed_at: new Date().toISOString(),
    };

    setSubmitting(true);
    if (!online) {
      const q = readQueue();
      q.push(payload);
      writeQueue(q);
      setQueueLen(q.length);
      toast.info("Çevrimdışısın — kayıt kuyruğa alındı, online olunca gönderilecek");
      setSubmitting(false);
      resetForm();
      return;
    }
    try {
      const { error } = await supabase.rpc("submit_field_observation", payload);
      if (error) throw error;
      track("field_observation_submit", { payload: { species_id: payload.p_species_id, has_proposed: !!payload.p_proposed_name } });
      toast.success("Kayıt gönderildi");
      resetForm();
      loadRecent();
    } catch (e) {
      // Network fail — queue
      const q = readQueue();
      q.push(payload);
      writeQueue(q);
      setQueueLen(q.length);
      toast.warning("Network sorunu — kayıt kuyruğa alındı", { detail: e?.message });
    } finally {
      setSubmitting(false);
    }
  }
  function resetForm() {
    setPickedSpecies(null);
    setProposedName("");
    setSpeciesQuery("");
    setNotes("");
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", padding: 32, textAlign: "center",
                    background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)",
                    borderRadius: "var(--gx-card-radius)" }}>
        <MapPin size={28} strokeWidth={1.5} style={{ color: "var(--gx-ink-muted)" }} />
        <h1 style={{ fontFamily: "var(--gx-font-display)", fontSize: 22, marginTop: 10 }}>Field Notebook</h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 8, lineHeight: 1.5 }}>
          Saha gözlemini GPS + foto + not olarak kaydet. Girişten sonra hazır.
        </p>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "9px 16px",
                                fontSize: 12, fontWeight: 700,
                                background: "var(--gx-success)", color: "#fff",
                                borderRadius: 8, textDecoration: "none" }}>
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <header style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div className="gx-overline" style={{ marginBottom: 4 }}>Tools</div>
            <h1 className="gx-h1" style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              Field Notebook
            </h1>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
            padding: "3px 8px", borderRadius: 999,
            background: online ? "var(--gx-success-soft)" : "var(--gx-warning-soft)",
            color: online ? "var(--gx-success)" : "var(--gx-warning)",
          }}>
            {online ? <Wifi size={10} strokeWidth={2.4} /> : <WifiOff size={10} strokeWidth={2.4} />}
            {online ? "ONLINE" : "OFFLINE"}
            {queueLen > 0 && ` · ${queueLen} queued`}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 4, lineHeight: 1.5 }}>
          Sahada bir species'i kaydet — GPS + opsiyonel foto + not. Çevrimdışıyken kayıtlar kuyruğa alınır.
        </p>
      </header>

      {/* GPS */}
      <section style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="gx-overline">Konum</div>
          <button onClick={captureGPS} style={ghostBtn}>↻ Yenile</button>
        </div>
        {coords ? (
          <div style={{ marginTop: 6, fontFamily: "var(--gx-font-mono)", fontSize: 13 }}>
            <strong style={{ color: "var(--gx-ink)" }}>{coords.lat.toFixed(5)}°, {coords.lng.toFixed(5)}°</strong>
            {coords.accuracy && <span style={{ marginLeft: 8, fontSize: 11, color: "var(--gx-ink-muted)" }}>±{coords.accuracy}m</span>}
          </div>
        ) : (
          <div style={{ marginTop: 6, fontSize: 12, color: coordsErr ? "var(--gx-danger)" : "var(--gx-ink-muted)" }}>
            {coordsErr || "Konum alınıyor…"}
          </div>
        )}
      </section>

      {/* Species */}
      <section style={cardStyle}>
        <div className="gx-overline" style={{ marginBottom: 6 }}>Species</div>
        {pickedSpecies ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px",
                        background: "var(--gx-surface-2)", borderRadius: 7 }}>
            <span style={{ fontFamily: "var(--gx-font-serif)", fontStyle: "italic", fontWeight: 700, color: "var(--gx-ink)" }}>
              {pickedSpecies.accepted_name}
            </span>
            <button onClick={() => setPickedSpecies(null)} style={ghostBtn}>✕</button>
          </div>
        ) : (
          <>
            <input value={speciesQuery}
              onChange={(e) => setSpeciesQuery(e.target.value)}
              placeholder="Allium, Crocus, …"
              style={inputStyle}
            />
            {speciesResults.length > 0 && (
              <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 1 }}>
                {speciesResults.map((s) => (
                  <button key={s.id} onClick={() => { setPickedSpecies(s); setSpeciesQuery(""); setSpeciesResults([]); }}
                    style={{
                      fontSize: 12, padding: "7px 10px", textAlign: "left",
                      background: "var(--gx-surface-2)", border: "1px solid var(--gx-border-soft)",
                      borderRadius: 6, color: "var(--gx-ink)", cursor: "pointer",
                      fontFamily: "var(--gx-font-serif)", fontStyle: "italic", fontWeight: 600,
                    }}>
                    {s.accepted_name}
                    <span style={{ marginLeft: 8, fontSize: 10, color: "var(--gx-ink-muted)", fontStyle: "normal", fontFamily: "var(--gx-font-body)", fontWeight: 400 }}>{s.family}</span>
                  </button>
                ))}
              </div>
            )}
            {speciesQuery.trim().length > 1 && speciesResults.length === 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: "var(--gx-ink-muted)" }}>
                Eşleşme yok. Şu metni "tanımlanmamış" olarak kaydedeceğim:
                <div style={{ marginTop: 4, padding: "5px 8px", background: "var(--gx-surface-2)", borderRadius: 6,
                              fontFamily: "var(--gx-font-mono)", fontSize: 11, color: "var(--gx-ink)" }}>
                  {speciesQuery}
                </div>
                <button onClick={() => { setProposedName(speciesQuery); setSpeciesQuery(""); }}
                  style={{ marginTop: 6, fontSize: 11, fontWeight: 700, padding: "5px 10px",
                           background: "var(--gx-accent-violet)", color: "#fff", border: "none",
                           borderRadius: 7, cursor: "pointer" }}>
                  Bu adı kullan
                </button>
              </div>
            )}
            {proposedName && !pickedSpecies && (
              <div style={{ marginTop: 6, padding: "7px 10px",
                            background: "var(--gx-warning-soft)", color: "var(--gx-warning)",
                            borderRadius: 7, fontSize: 11 }}>
                Önerilen ad: <strong>{proposedName}</strong> · sonradan eşleştirilecek
                <button onClick={() => setProposedName("")} style={{ ...ghostBtn, marginLeft: 6 }}>✕</button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Notes */}
      <section style={cardStyle}>
        <div className="gx-overline" style={{ marginBottom: 6 }}>Notlar</div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Habitat, çiçek durumu, koloni büyüklüğü…"
          rows={3}
          style={{ ...inputStyle, fontFamily: "var(--gx-font-body)", resize: "vertical" }}
        />
      </section>

      <button onClick={submit} disabled={submitting || !coords}
        style={{
          marginTop: 10, width: "100%", padding: "13px 16px",
          fontSize: 14, fontWeight: 700, letterSpacing: 0.3,
          background: "var(--gx-success)", color: "#fff",
          border: "none", borderRadius: 10, cursor: "pointer",
          opacity: (submitting || !coords) ? 0.6 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
        <Send size={14} strokeWidth={2.2} />
        {submitting ? "Gönderiliyor…" : online ? "Kaydı gönder" : "Kuyruğa al"}
      </button>

      {/* Recent observations */}
      {recent.length > 0 && (
        <section style={{ ...cardStyle, marginTop: 14 }}>
          <div className="gx-overline" style={{ marginBottom: 8 }}>
            Son kayıtlarım · {recent.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recent.map((r) => (
              <div key={r.id} style={{ padding: "7px 9px", background: "var(--gx-surface-2)",
                                       border: "1px solid var(--gx-border-soft)", borderRadius: 7,
                                       fontSize: 11, color: "var(--gx-ink-soft)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                  <span style={{ fontFamily: "var(--gx-font-serif)", fontStyle: "italic", fontWeight: 700, color: "var(--gx-ink)" }}>
                    {r.accepted_name || r.proposed_name || "(unknown)"}
                  </span>
                  <span style={{ fontFamily: "var(--gx-font-mono)", fontSize: 10, color: "var(--gx-ink-muted)" }}>
                    {new Date(r.observed_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ marginTop: 3, fontSize: 10, color: "var(--gx-ink-muted)", fontFamily: "var(--gx-font-mono)" }}>
                  {r.lat?.toFixed?.(3)}°, {r.lng?.toFixed?.(3)}°
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const cardStyle = {
  marginTop: 12,
  padding: "var(--gx-card-pad-sm)",
  background: "var(--gx-card-bg)",
  border: "1px solid var(--gx-card-border)",
  borderRadius: "var(--gx-card-radius)",
};
const inputStyle = {
  width: "100%", boxSizing: "border-box",
  fontSize: 14, padding: "10px 12px",
  background: "var(--gx-surface-2)", color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 8, outline: "none",
  fontFamily: "var(--gx-font-mono)",
};
const ghostBtn = {
  fontSize: 11, fontWeight: 600,
  background: "transparent", color: "var(--gx-ink-soft)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 6, padding: "4px 9px", cursor: "pointer",
};
