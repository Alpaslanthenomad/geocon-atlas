"use client";
// Indigenous Knowledge + TK Labels channel — A3.
//
// Two ethical surfaces on a species page:
//
//   1. Local-name pill chips (per language) — low-friction crowd-sourced
//      vernacular. Backed by species_local_names + list_species_local_names.
//
//   2. A knowledge-entries log with community attribution, use-kind tag,
//      italic markdown description and a TK Label chip (Local Contexts
//      Traditional Knowledge License Framework). Restricted entries are
//      hidden from public read by RLS; signed-in contributors can flag
//      a row as restricted at submit time and only they + admins can
//      see it afterwards.
//
// We deliberately do NOT host the actual restricted content as anything
// more than a stub when restricted=true — GEOCON is a citation registry,
// not a vault of sacred knowledge. The "restricted" flag is the on-ramp
// to community-governed access controls; this UI just respects the bit.

import { useEffect, useMemo, useState } from "react";
import { Leaf, ShieldCheck, Globe2, Plus, X, Info } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";
import { EmptyState } from "../shared";
import { useToast } from "../ui";
import Markdown from "./Markdown";

// ---------------------------------------------------------------
// TK Labels — Local Contexts Traditional Knowledge License Framework.
// https://localcontexts.org/labels/traditional-knowledge-labels/
// These five are the cohort used inside GEOCON; a contributor may also
// type a free-form label (e.g. "TK CO — Community Voice") and it will
// still render, just without a tinted chip.
// ---------------------------------------------------------------
export const TK_LABELS = {
  "TK A": {
    label: "TK A",
    name: "Attribution",
    tint: "#185FA5",
    help: "The community must be cited when this knowledge is referenced or used.",
  },
  "TK NC": {
    label: "TK NC",
    name: "Non-Commercial",
    tint: "#0F6E56",
    help: "This knowledge may not be used for commercial purposes without consent of the originating community.",
  },
  "TK NV": {
    label: "TK NV",
    name: "No-Versioning",
    tint: "#BA7517",
    help: "This knowledge should not be modified, remixed, or adapted from its original form.",
  },
  "TK SO": {
    label: "TK SO",
    name: "Seasonal / Sacred Only",
    tint: "#A32D2D",
    help: "This knowledge may only be shared, performed, or used during specific seasons or by specific people.",
  },
  "TK CL": {
    label: "TK CL",
    name: "Community-Licensed",
    tint: "#534AB7",
    help: "Use is governed by the originating community's own licensing protocol; ask before any downstream use.",
  },
};

const USE_KIND_META = {
  food:      { icon: "🌾", label: "Food",        tint: "#0F6E56" },
  medicine:  { icon: "⚕",  label: "Medicine",    tint: "#A32D2D" },
  ritual:    { icon: "🕯", label: "Ritual",      tint: "#534AB7" },
  dye:       { icon: "🎨", label: "Dye",         tint: "#BA7517" },
  fiber:     { icon: "🧵", label: "Fiber",       tint: "#85651A" },
  craft:     { icon: "🪡", label: "Craft",       tint: "#185FA5" },
  symbolic:  { icon: "✦",  label: "Symbolic",    tint: "#5F5E5A" },
  other:     { icon: "•",  label: "Other",       tint: "var(--gx-ink-muted)" },
};

export default function IndigenousKnowledge({ speciesId, speciesName }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [localNames, setLocalNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [k, n] = await Promise.all([
        supabase.rpc("list_species_knowledge", { p_species_id: speciesId }),
        supabase.rpc("list_species_local_names", { p_species_id: speciesId }),
      ]);
      if (k.error) throw k.error;
      if (n.error) throw n.error;
      setEntries(Array.isArray(k.data) ? k.data : []);
      setLocalNames(Array.isArray(n.data) ? n.data : []);
    } catch (e) {
      toast.error("Indigenous knowledge yüklenemedi", { detail: e?.message || String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!speciesId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speciesId]);

  // Group local names by language code for the pill cluster.
  const grouped = useMemo(() => {
    const m = new Map();
    for (const row of localNames) {
      const code = (row.language_code || "?").toUpperCase();
      if (!m.has(code)) m.set(code, []);
      m.get(code).push(row);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [localNames]);

  return (
    <section
      style={{
        marginTop: 18,
        padding: 16,
        background: "var(--gx-card-bg, var(--gx-surface))",
        border: "1px solid var(--gx-card-border, var(--gx-border))",
        borderRadius: "var(--gx-card-radius, var(--gx-radius-4))",
      }}
    >
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div className="gx-overline" style={{ marginBottom: 4, color: "var(--gx-accent-bio-leaf, #1D9E75)" }}>
            Ethical layer · Indigenous knowledge
          </div>
          <h2
            className="gx-h1"
            style={{
              fontFamily: "var(--gx-font-serif)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--gx-ink)",
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Leaf size={18} strokeWidth={1.6} style={{ color: "var(--gx-accent-bio-leaf, #1D9E75)" }} />
            Traditional knowledge {speciesName ? `· ${speciesName}` : ""}
          </h2>
        </div>
        {user && (
          <button
            type="button"
            onClick={() => setComposing((v) => !v)}
            className="gx-btn"
            style={{
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              background: composing ? "var(--gx-surface-3)" : "var(--gx-accent-bio-leaf, #1D9E75)",
              color: composing ? "var(--gx-ink-soft)" : "#fff",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {composing ? <><X size={13} strokeWidth={2} /> Cancel</> : <><Plus size={13} strokeWidth={2.4} /> Contribute</>}
          </button>
        )}
      </header>

      {composing && user && (
        <SubmitForm
          speciesId={speciesId}
          onCreated={() => { setComposing(false); load(); }}
        />
      )}

      <SovereigntyBanner />

      <LocalNamesBlock loading={loading} grouped={grouped} />

      <div style={{ marginTop: 16 }}>
        <SectionLabel icon={<ShieldCheck size={11} strokeWidth={2} />}>
          Knowledge entries
        </SectionLabel>
        {loading ? (
          <div className="gx-skeleton" style={{ height: 80, borderRadius: 10, marginTop: 6 }} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon="🌿"
            title="No traditional-knowledge entries yet"
            hint={
              user
                ? "Hold space for community voices. If you have community consent to share a use, name, or attribution, contribute above."
                : "Sign in to contribute a community-attributed entry. GEOCON respects restricted (sacred / seasonal) knowledge — it never auto-publishes."
            }
            style={{ marginTop: 6 }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
            {entries.map((e) => <EntryRow key={e.id} entry={e} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function SovereigntyBanner() {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 12px",
        marginBottom: 12,
        background: "var(--gx-surface-2)",
        border: "1px solid var(--gx-border-soft)",
        borderLeft: "3px solid var(--gx-accent-bio-leaf, #1D9E75)",
        borderRadius: 10,
        fontSize: 11,
        color: "var(--gx-ink-soft)",
        lineHeight: 1.5,
      }}
    >
      <Info size={14} strokeWidth={1.8} style={{ flexShrink: 0, color: "var(--gx-accent-bio-leaf, #1D9E75)", marginTop: 1 }} />
      <div>
        Traditional knowledge belongs to its originating community. GEOCON
        records citations and respects TK Labels — it does not grant
        downstream rights. If you want to use any entry below for research,
        commerce or publication, contact the community directly under the
        terms of its TK Label.
      </div>
    </div>
  );
}

function LocalNamesBlock({ loading, grouped }) {
  return (
    <div>
      <SectionLabel icon={<Globe2 size={11} strokeWidth={2} />}>
        Local names · vernacular
      </SectionLabel>
      {loading ? (
        <div className="gx-skeleton" style={{ height: 38, borderRadius: 10, marginTop: 6 }} />
      ) : grouped.length === 0 ? (
        <div
          style={{
            marginTop: 6,
            padding: "10px 12px",
            border: "1px dashed var(--gx-border)",
            borderRadius: 10,
            fontSize: 11,
            color: "var(--gx-ink-muted)",
            fontStyle: "italic",
          }}
        >
          No local names recorded yet. Vernacular naming is a low-friction
          way to start — TR, KU, EN, FA, AR… anything counts.
        </div>
      ) : (
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
          {grouped.map(([code, rows]) => (
            <div key={code} style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: "var(--gx-surface-3)",
                  color: "var(--gx-ink-soft)",
                  fontFamily: "var(--gx-font-mono)",
                  flexShrink: 0,
                }}
              >
                {code}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {rows.map((r, i) => (
                  <span
                    key={`${r.local_name}-${i}`}
                    title={r.region ? `${r.region}` : undefined}
                    style={{
                      fontSize: 12,
                      padding: "3px 9px",
                      borderRadius: 999,
                      background: "var(--gx-surface)",
                      border: "1px solid var(--gx-border-soft)",
                      color: "var(--gx-ink)",
                      fontStyle: "italic",
                    }}
                  >
                    {r.local_name}
                    {r.region && (
                      <span style={{ marginLeft: 6, fontSize: 9, fontStyle: "normal", color: "var(--gx-ink-muted)", letterSpacing: 0.4 }}>
                        · {r.region}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EntryRow({ entry }) {
  const useMeta = USE_KIND_META[entry.use_kind] || USE_KIND_META.other;
  const tk = entry.tk_label ? TK_LABELS[entry.tk_label] : null;
  return (
    <article
      style={{
        padding: 12,
        background: "var(--gx-surface-2)",
        border: "1px solid var(--gx-border-soft)",
        borderLeft: `3px solid ${useMeta.tint}`,
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            padding: "2px 7px",
            borderRadius: 999,
            background: `${useMeta.tint}1a`,
            color: useMeta.tint,
          }}
        >
          {useMeta.icon} {useMeta.label}
        </span>
        {tk ? (
          <span
            title={`${tk.label} — ${tk.name}. ${tk.help}`}
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              padding: "2px 7px",
              borderRadius: 999,
              background: tk.tint,
              color: "#fff",
              fontFamily: "var(--gx-font-mono)",
            }}
          >
            {tk.label} · {tk.name}
          </span>
        ) : entry.tk_label ? (
          <span
            title={entry.tk_label}
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              padding: "2px 7px",
              borderRadius: 999,
              background: "var(--gx-surface-3)",
              color: "var(--gx-ink-soft)",
              fontFamily: "var(--gx-font-mono)",
            }}
          >
            {entry.tk_label}
          </span>
        ) : null}
        {entry.restricted && (
          <span
            title="Restricted — visible only to contributor and admins per community sovereignty."
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              padding: "2px 7px",
              borderRadius: 999,
              background: "#A32D2D",
              color: "#fff",
            }}
          >
            🔒 Restricted
          </span>
        )}
        {entry.contributed_at && (
          <span style={{ fontSize: 10, color: "var(--gx-ink-muted)" }}>
            {new Date(entry.contributed_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Community attribution is the most important thing — prominent. */}
      {entry.community_name && (
        <div
          style={{
            fontFamily: "var(--gx-font-serif)",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--gx-ink)",
            lineHeight: 1.3,
          }}
        >
          {entry.community_name}
          {entry.region && (
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--gx-ink-muted)", marginLeft: 8 }}>
              · {entry.region}
            </span>
          )}
        </div>
      )}

      {(entry.local_name || entry.language_code) && (
        <div style={{ marginTop: 4, fontSize: 13, color: "var(--gx-ink-soft)" }}>
          {entry.language_code && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                padding: "1px 6px",
                borderRadius: 999,
                background: "var(--gx-surface-3)",
                color: "var(--gx-ink-muted)",
                fontFamily: "var(--gx-font-mono)",
                marginRight: 6,
              }}
            >
              {entry.language_code}
            </span>
          )}
          {entry.local_name && (
            <em style={{ color: "var(--gx-ink)" }}>{entry.local_name}</em>
          )}
        </div>
      )}

      {entry.use_description_md && (
        <div style={{ marginTop: 8 }}>
          <Markdown style={{ fontSize: 12, color: "var(--gx-ink-soft)", fontStyle: "italic" }}>
            {entry.use_description_md}
          </Markdown>
        </div>
      )}

      {(entry.source || entry.attribution_md || entry.contributor_name) && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: "1px solid var(--gx-border-soft)",
            fontSize: 10,
            color: "var(--gx-ink-muted)",
            lineHeight: 1.5,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {entry.attribution_md && (
            <span style={{ fontStyle: "italic" }}>“{entry.attribution_md}”</span>
          )}
          {entry.source && (
            <span>
              source ·{" "}
              {/^https?:\/\//.test(entry.source) ? (
                <a
                  href={entry.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--gx-accent-azure, #185FA5)", textDecoration: "none" }}
                >
                  {entry.source}
                </a>
              ) : entry.source}
            </span>
          )}
          {entry.contributor_name && (
            <span>contributed by · <strong style={{ color: "var(--gx-ink-soft)" }}>{entry.contributor_name}</strong></span>
          )}
        </div>
      )}
    </article>
  );
}

function SubmitForm({ speciesId, onCreated }) {
  const [communityName, setCommunityName] = useState("");
  const [region, setRegion] = useState("");
  const [languageCode, setLanguageCode] = useState("");
  const [localName, setLocalName] = useState("");
  const [useKind, setUseKind] = useState("other");
  const [description, setDescription] = useState("");
  const [tkLabel, setTkLabel] = useState("TK A");
  const [source, setSource] = useState("");
  const [attribution, setAttribution] = useState("");
  const [restricted, setRestricted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const tkMeta = TK_LABELS[tkLabel];

  async function submit(e) {
    e?.preventDefault?.();
    setErr(null);
    if (!communityName.trim() && !localName.trim()) {
      setErr("At least a community name or a local name is required.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("submit_indigenous_entry", {
        p_species_id: speciesId,
        p_community_name: communityName.trim() || null,
        p_language_code: languageCode.trim() || null,
        p_local_name: localName.trim() || null,
        p_use_kind: useKind || null,
        p_use_description_md: description.trim() || null,
        p_tk_label: tkLabel || null,
        p_source: source.trim() || null,
        p_attribution_md: attribution.trim() || null,
        p_restricted: !!restricted,
        p_region: region.trim() || null,
      });
      if (error) throw error;
      onCreated?.();
    } catch (e2) {
      setErr(e2?.message || "Could not submit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        padding: 14,
        marginBottom: 14,
        background: "var(--gx-surface-2)",
        border: "1px solid var(--gx-border-soft)",
        borderLeft: "3px solid var(--gx-accent-bio-leaf, #1D9E75)",
        borderRadius: 10,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="Community / source">
          <input
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
            placeholder="e.g. Yörük, Kurdish elders of Hakkari, Karatav region"
            style={inputStyle}
          />
        </Field>
        <Field label="Region (optional)">
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. Eastern Anatolia"
            style={inputStyle}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, marginTop: 8 }}>
        <Field label="Language">
          <input
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="TR · KU · FA · EN"
            style={{ ...inputStyle, fontFamily: "var(--gx-font-mono)", textTransform: "uppercase" }}
          />
        </Field>
        <Field label="Local name">
          <input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="e.g. Karata sarımsağı"
            style={{ ...inputStyle, fontStyle: "italic" }}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <Field label="Traditional use">
          <select value={useKind} onChange={(e) => setUseKind(e.target.value)} style={inputStyle}>
            {Object.entries(USE_KIND_META).map(([k, m]) => (
              <option key={k} value={k}>{m.icon} {m.label}</option>
            ))}
          </select>
        </Field>
        <Field label="TK Label">
          <select value={tkLabel} onChange={(e) => setTkLabel(e.target.value)} style={inputStyle}>
            {Object.entries(TK_LABELS).map(([k, m]) => (
              <option key={k} value={k}>{m.label} — {m.name}</option>
            ))}
          </select>
        </Field>
      </div>

      {tkMeta && (
        <div
          style={{
            marginTop: 6,
            padding: "8px 10px",
            background: `${tkMeta.tint}14`,
            border: `1px solid ${tkMeta.tint}55`,
            borderRadius: 8,
            fontSize: 11,
            color: "var(--gx-ink-soft)",
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: tkMeta.tint }}>{tkMeta.label} — {tkMeta.name}.</strong>{" "}
          {tkMeta.help}
        </div>
      )}

      <Field label="Description (markdown, will render italic)" style={{ marginTop: 8 }}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="How is this species traditionally used? Quote community voices wherever possible."
          style={{
            ...inputStyle,
            width: "100%",
            resize: "vertical",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
        <Field label="Source (URL, citation, oral tradition note)">
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="DOI, URL, or 'oral, recorded 2024-06'"
            style={{ ...inputStyle, fontFamily: "var(--gx-font-mono)", fontSize: 11 }}
          />
        </Field>
        <Field label="Attribution line (italic credit)">
          <input
            value={attribution}
            onChange={(e) => setAttribution(e.target.value)}
            placeholder="Knowledge shared with permission by …"
            style={inputStyle}
          />
        </Field>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          marginTop: 10,
          padding: "8px 10px",
          background: restricted ? "#A32D2D14" : "var(--gx-surface)",
          border: `1px solid ${restricted ? "#A32D2D55" : "var(--gx-border-soft)"}`,
          borderRadius: 8,
          fontSize: 11,
          color: "var(--gx-ink-soft)",
          lineHeight: 1.5,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={restricted}
          onChange={(e) => setRestricted(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span>
          <strong style={{ color: restricted ? "#A32D2D" : "var(--gx-ink)" }}>Mark as restricted.</strong>{" "}
          Only you and admins will see this entry, and it will not be
          mirrored to public local-name chips. Use for seasonal, sacred,
          or community-veto material.
        </span>
      </label>

      {err && (
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--gx-accent-rose, #A32D2D)" }}>
          {err}
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button
          type="submit"
          disabled={saving}
          className="gx-btn"
          style={{
            padding: "7px 14px",
            fontSize: 11,
            fontWeight: 700,
            background: "var(--gx-accent-bio-leaf, #1D9E75)",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Submitting…" : "Submit entry"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, style }) {
  return (
    <label style={{ display: "block", ...style }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "var(--gx-ink-muted)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

function SectionLabel({ icon, children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: "var(--gx-ink-muted)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {icon}
      {children}
    </div>
  );
}

const inputStyle = {
  padding: "7px 10px",
  fontSize: 12,
  background: "var(--gx-surface)",
  color: "var(--gx-ink)",
  border: "1px solid var(--gx-border-soft)",
  borderRadius: 7,
  width: "100%",
  boxSizing: "border-box",
};
