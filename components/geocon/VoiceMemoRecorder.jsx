"use client";
// v4.2-b — Voice memo recorder for Field Notebook.
//
// MediaRecorder API → records webm/opus blob. Uploads to Supabase
// Storage 'voice-memos' bucket (must exist + be private; signed URLs
// generated on read). After upload, calls attach_voice_to_observation
// against the observation_id passed from the parent so the row picks
// up the URL. Cron then transcribes it overnight.
//
// Storage bucket creation is a one-time admin task. If the bucket
// does not exist, the upload fails silently and the parent shows a
// friendly hint.
//
// Browser support: Chrome/Firefox/Edge/Safari 14.1+. iOS Safari needs
// webm fallback to mp4; we let the MediaRecorder pick the best
// supported mimeType.

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

const BUCKET = "voice-memos";

function pickMime() {
  if (typeof window === "undefined") return "audio/webm";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const m of candidates) {
    try { if (window.MediaRecorder && window.MediaRecorder.isTypeSupported(m)) return m; }
    catch {}
  }
  return "audio/webm";
}

export default function VoiceMemoRecorder({ onAttached }) {
  const [state, setState] = useState("idle"); // idle | recording | preview | uploading | done | error
  const [error, setError] = useState(null);
  const [blob, setBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const tickRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => () => {
    if (recorderRef.current && state === "recording") recorderRef.current.stop();
    clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mime });
        setBlob(b);
        setState("preview");
        // Stop microphone tracks to release the mic indicator
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(tickRef.current);
      };
      recorderRef.current = mr;
      mr.start();
      setState("recording");
      setDuration(0);
      tickRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (e) {
      setError(e?.message || "Microphone permission denied");
      setState("error");
    }
  }

  function stop() {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  }

  function discard() {
    setBlob(null);
    setDuration(0);
    setState("idle");
  }

  async function upload() {
    if (!blob) return;
    setState("uploading");
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u?.user?.id || "anon";
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const filename = `${userId}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from(BUCKET).upload(filename, blob, {
        contentType: blob.type, upsert: false,
      });
      if (up.error) throw up.error;
      // Get a public URL (assuming bucket is configured public, or use signed)
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
      const voiceUrl = pub?.publicUrl || null;
      if (!voiceUrl) throw new Error("could not resolve voice URL");
      // Tell the parent — it owns the observation_id + decides when to attach.
      if (onAttached) onAttached(voiceUrl);
      setState("done");
    } catch (e) {
      setError(e?.message || String(e));
      setState("error");
    }
  }

  function fmt(s) {
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, "0");
    return `${m}:${ss}`;
  }

  return (
    <div style={{
      padding: 10,
      background: "var(--gx-surface-2)",
      border: "1px dashed color-mix(in srgb, var(--gx-accent-azure) 25%, transparent)",
      borderRadius: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Mic size={11} strokeWidth={2.2} style={{ color: "var(--gx-accent-azure)" }} />
        <strong style={{ fontSize: 11, color: "var(--gx-ink-soft)", letterSpacing: 0.4 }}>
          Voice memo (transcribed overnight)
        </strong>
      </div>

      {state === "idle" && (
        <button onClick={start} style={primaryBtn}>
          <Mic size={11} strokeWidth={2.2} /> Start recording
        </button>
      )}

      {state === "recording" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={stop} style={{ ...primaryBtn, background: "var(--gx-danger)" }}>
            <Square size={11} strokeWidth={2.4} /> Stop
          </button>
          <span style={{
            fontFamily: "var(--gx-font-mono)", fontSize: 12, fontWeight: 700,
            color: "var(--gx-danger)",
          }}>
            ● {fmt(duration)}
          </span>
        </div>
      )}

      {state === "preview" && blob && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <audio ref={audioRef} controls src={URL.createObjectURL(blob)}
            style={{ width: "100%", maxWidth: 360 }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={upload} style={primaryBtn}>
              Use this memo
            </button>
            <button onClick={discard} style={ghostBtn}>
              <Trash2 size={11} strokeWidth={2} /> Discard
            </button>
            <button onClick={start} style={ghostBtn}>
              Re-record
            </button>
          </div>
        </div>
      )}

      {state === "uploading" && (
        <div style={{ fontSize: 11, color: "var(--gx-ink-soft)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Loader2 size={12} strokeWidth={2} style={{ animation: "spin 1.2s linear infinite" }} />
          Uploading…
        </div>
      )}

      {state === "done" && (
        <div style={{
          fontSize: 11, color: "var(--gx-success)", fontWeight: 600,
        }}>
          ✓ Memo attached. Whisper transcribes it overnight.
        </div>
      )}

      {state === "error" && error && (
        <div style={{
          padding: 8, background: "var(--gx-danger-soft)", color: "var(--gx-danger)",
          borderRadius: 7, fontSize: 11,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

const primaryBtn = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "7px 13px",
  background: "var(--gx-accent-azure)", color: "#fff",
  fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
  border: "none", borderRadius: 7, cursor: "pointer",
};
const ghostBtn = {
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "6px 11px",
  background: "transparent", color: "var(--gx-ink-soft)",
  fontSize: 11, fontWeight: 600,
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 7, cursor: "pointer",
};
