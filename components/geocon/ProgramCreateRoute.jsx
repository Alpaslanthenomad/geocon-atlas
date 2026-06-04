"use client";
// components/geocon/ProgramCreateRoute.jsx
//
// /geocon/programs/new — single-form program creation. Signed-in users
// only. Creator is auto-enrolled as owner-member via create_program RPC.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const PROGRAM_TYPES = [
  { v: "Hybrid",    label: "Hybrid — conservation + commercialisation" },
  { v: "Conservation", label: "Conservation focus" },
  { v: "Commercial",  label: "Commercial focus" },
  { v: "Research",   label: "Research focus" },
];

const ENTRY_MODES = [
  { v: "academic",         label: "📚 Academic — peer-reviewed research arc" },
  { v: "industry",         label: "🏭 Industry — commercial / R&D pipeline" },
  { v: "co_initiated",     label: "🤝 Co-initiated — academia + industry partnership" },
  // L3 — surface Studies as a first-class program entry mode. These
  // represent off-platform completed work imported into GEOCON for
  // attribution (K2 ×1.0 multiplier per the Impact Factor spec).
  { v: "external_study",   label: "🧪 External study — off-platform work being attributed (K2 ×1.0)" },
  { v: "field_observation",label: "📍 Field observation — short-term observation campaign" },
];

const SCOPE_TYPES = [
  { v: "single", label: "Single species" },
  { v: "multi",  label: "Multi-species" },
];

export default function ProgramCreateRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <CreateInner />
    </Suspense>
  );
}

function CreateInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { user, loading: authLoading } = useAuthContext();

  const [form, setForm] = useState({
    name: "",
    species_id: "",
    species_label: "",
    program_type: "Hybrid",
    entry_mode: "academic",
    scope_type: "single",
    scope_label: "",
    strategic_rationale: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill from query params (?species_id=…&species_name=…)
  useEffect(() => {
    const sid = sp?.get("species_id");
    const sname = sp?.get("species_name");
    if (sid) setForm((f) => ({ ...f, species_id: sid, species_label: sname || sid, name: f.name || (sname ? `Program around ${sname}` : "") }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) return <Loading />;

  if (!user) {
    return (
      <div style={{ maxWidth: 540, margin: "60px auto", padding: 40, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 22, color: "var(--gx-ink)", margin: 0 }}>Start a new program</h1>
        <p style={{ fontSize: 12, color: "var(--gx-ink-muted)", marginTop: 8 }}>Sign in via BEE to create a program.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "9px 16px", fontSize: 12, fontWeight: 600, background: "#0a4a3e", color: "#fff", borderRadius: 7, textDecoration: "none" }}>
          Sign in via BEE
        </Link>
      </div>
    );
  }

  function up(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (form.name.trim().length < 3) { setError("Program name required."); return; }
    setBusy(true); setError(null);
    try {
      const { data: id, error: rpcErr } = await supabase.rpc("create_program", {
        p_name:                form.name.trim(),
        p_species_id:          form.species_id.trim() || null,
        p_program_type:        form.program_type,
        p_entry_mode:          form.entry_mode,
        p_scope_type:          form.scope_type,
        p_scope_label:         form.scope_label.trim() || null,
        p_strategic_rationale: form.strategic_rationale.trim() || null,
      });
      if (rpcErr) throw rpcErr;
      router.push(`/geocon/programs/${id}`);
    } catch (err) {
      setError(err.message || "Failed to create program.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <Link href="/geocon/programs" style={{ fontSize: 11, color: "var(--gx-ink-muted)", textDecoration: "none" }}>← Programs</Link>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 26, fontWeight: 700, color: "var(--gx-ink)", margin: "4px 0 4px" }}>
          New program
        </h1>
        <div style={{ fontSize: 12, color: "var(--gx-ink-muted)" }}>
          Start as a draft — you can add species, contributors, and pathways once it exists.
        </div>
      </div>

      <form onSubmit={submit} style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: 22 }}>
        <Field label="Program name *">
          <input required value={form.name} onChange={up("name")} placeholder="e.g. Anatolian Crocus Conservation & Propagation Program" style={input} />
        </Field>

        <SpeciesPicker
          value={{ id: form.species_id, label: form.species_label }}
          onChange={(s) => setForm((f) => ({ ...f, species_id: s?.id || "", species_label: s?.label || "" }))}
        />

        <Row>
          <Field label="Program type">
            <select value={form.program_type} onChange={up("program_type")} style={input}>
              {PROGRAM_TYPES.map((p) => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Entry mode">
            <select value={form.entry_mode} onChange={up("entry_mode")} style={input}>
              {ENTRY_MODES.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
            </select>
          </Field>
        </Row>

        <Row>
          <Field label="Scope">
            <select value={form.scope_type} onChange={up("scope_type")} style={input}>
              {SCOPE_TYPES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Scope label" hint='Optional. For multi-species: e.g. "Anatolian Iridaceae".'>
            <input value={form.scope_label} onChange={up("scope_label")} placeholder="optional" style={input} />
          </Field>
        </Row>

        <Field label="Strategic rationale" hint="Why this program, why now. Visible on the program detail page.">
          <textarea rows={4} value={form.strategic_rationale} onChange={up("strategic_rationale")} placeholder="The why — context, opportunity, urgency…" style={{ ...input, resize: "vertical" }} />
        </Field>

        {error && (
          <div style={{ marginTop: 10, padding: 10, background: "#fdecec", border: "1px solid #fcc", borderRadius: 6, fontSize: 11, color: "#A32D2D" }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Link href="/geocon/programs" style={{ padding: "9px 14px", fontSize: 12, color: "#666", textDecoration: "none", borderRadius: 7 }}>
            Cancel
          </Link>
          <button type="submit" disabled={busy} style={{
            padding: "9px 16px", fontSize: 12, fontWeight: 700,
            background: busy ? "#bfbfbf" : "#0a4a3e",
            color: "#fff", border: "none", borderRadius: 7,
            cursor: busy ? "not-allowed" : "pointer",
          }}>
            {busy ? "Creating…" : "Create program"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SpeciesPicker({ value, onChange }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || q.trim().length < 2) { setResults([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("species")
        .select("id, accepted_name, family, iucn_status, thumbnail_url")
        .ilike("accepted_name", `%${q.trim()}%`)
        .order("accepted_name")
        .limit(10);
      if (cancelled) return;
      setResults(data || []);
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, open]);

  if (value?.id) {
    return (
      <Field label="Primary species" hint='The single anchor for this program. Optional — you can pick later.'>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, border: "1px solid var(--gx-card-border)", borderRadius: 7, background: "var(--gx-surface-2)" }}>
          <span style={{ fontStyle: "italic", fontFamily: "var(--gx-font-serif)", fontWeight: 700, color: "var(--gx-ink)" }}>
            🌿 {value.label || value.id}
          </span>
          <button type="button" onClick={() => onChange(null)}
            style={{ marginLeft: "auto", fontSize: 10, color: "#A32D2D", background: "none", border: "1px solid #fcc", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>
            Change
          </button>
        </div>
      </Field>
    );
  }

  return (
    <Field label="Primary species" hint='Optional — the single species this program anchors on. You can also leave it blank and link species later from the program detail "Species" tab.'>
      <div>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search species name…"
          style={input}
        />
        {open && results.length > 0 && (
          <div style={{ marginTop: 4, border: "1px solid var(--gx-card-border)", borderRadius: 7, background: "var(--gx-card-bg)", maxHeight: 260, overflow: "auto" }}>
            {results.map((r) => (
              <button key={r.id} type="button"
                onClick={() => { onChange({ id: r.id, label: r.accepted_name }); setQ(""); setOpen(false); }}
                style={{ display: "flex", gap: 10, alignItems: "center", width: "100%", textAlign: "left", padding: "8px 10px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid #f5f3ec" }}>
                {r.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img loading="lazy" decoding="async" src={r.thumbnail_url} alt="" style={{ width: 30, height: 30, objectFit: "cover", borderRadius: 4 }} />
                )}
                <div>
                  <div style={{ fontStyle: "italic", fontFamily: "var(--gx-font-serif)", fontSize: 12, fontWeight: 700, color: "var(--gx-ink)" }}>
                    {r.accepted_name}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--gx-ink-muted)" }}>
                    {r.family}{r.iucn_status && ` · ${r.iucn_status}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Field>
  );
}

const input = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 12,
  border: "1px solid var(--gx-card-border)",
  borderRadius: 7,
  background: "var(--gx-card-bg)",
  fontFamily: "inherit",
};

function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#444", marginBottom: 4 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: "#999", marginTop: 4, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

function Loading() {
  return <div style={{ padding: 20, fontSize: 12, color: "var(--gx-ink-muted)", textAlign: "center" }}>Loading…</div>;
}
