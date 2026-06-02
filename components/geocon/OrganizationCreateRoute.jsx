"use client";
// components/geocon/OrganizationCreateRoute.jsx
//
// /geocon/organizations/new — single-form registration. Signed-in users only.
// Calls create_organization RPC; the creator is auto-added as admin member.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../lib/authContext";

const KINDS = [
  { v: "university",         label: "University" },
  { v: "research_institute", label: "Research institute" },
  { v: "government",         label: "Government body" },
  { v: "company",            label: "Company (R&D / commercial)" },
  { v: "ngo",                label: "NGO" },
  { v: "foundation",         label: "Foundation" },
  { v: "nursery",            label: "Nursery / producer" },
  { v: "cooperative",        label: "Cooperative" },
  { v: "consortium",         label: "Consortium" },
  { v: "other",              label: "Other" },
];

const CAPABILITY_SUGGESTIONS = [
  "field_collection", "ex_situ_conservation", "tissue_culture", "seed_banking",
  "morphology", "molecular", "metabolite_analysis", "bioactivity_screening",
  "formulation", "regulatory", "commercialisation", "biomass_supply",
  "propagation", "nursery_production", "funding", "distribution",
];

export default function OrganizationCreateRoute() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [form, setForm] = useState({
    name: "",
    short_name: "",
    kind: "company",
    industry: "",
    country: "",
    website: "",
    description: "",
    capabilities: [],
    interests: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function up(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function toggleCap(cap) {
    setForm((f) => ({
      ...f,
      capabilities: f.capabilities.includes(cap)
        ? f.capabilities.filter((c) => c !== cap)
        : [...f.capabilities, cap],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (form.name.trim().length < 2) { setError("Organization name is required."); return; }
    setBusy(true); setError(null);
    try {
      const interests = form.interests
        .split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
      const { data, error: rpcErr } = await supabase.rpc("create_organization", {
        p_name:          form.name.trim(),
        p_kind:          form.kind,
        p_short_name:    form.short_name.trim() || null,
        p_country:       form.country.trim() || null,
        p_website:       form.website.trim() || null,
        p_description:   form.description.trim() || null,
        p_industry:      form.industry.trim() || null,
        p_capabilities:  form.capabilities,
        p_interests:     interests,
        p_institution_id: null,
      });
      if (rpcErr) throw rpcErr;
      router.push(`/geocon/organizations/${data}`);
    } catch (err) {
      setError(err.message || "Failed to register organization.");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) return <div style={{ padding: 20, color: "#888", fontSize: 12 }}>Loading…</div>;

  if (!user) {
    return (
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 30, background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 22, margin: 0, color: "var(--gx-ink)" }}>Register an organization</h1>
        <p style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
          You need to be signed in to register an organization.
        </p>
        <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "8px 14px", fontSize: 12, fontWeight: 600, background: "#0a4a3e", color: "#fff", borderRadius: 7, textDecoration: "none" }}>
          Sign in via BEE
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <Link href="/geocon/organizations" style={{ fontSize: 11, color: "#888", textDecoration: "none" }}>← Organizations</Link>
        <h1 style={{ fontFamily: "var(--gx-font-serif)", fontSize: 26, fontWeight: 700, color: "var(--gx-ink)", margin: "4px 0 4px" }}>
          Register an organization
        </h1>
        <div style={{ fontSize: 12, color: "#888" }}>
          You'll be auto-added as the first admin. Others can request to join after.
        </div>
      </div>

      <form onSubmit={submit} style={{ background: "var(--gx-card-bg)", border: "1px solid var(--gx-card-border)", borderRadius: 12, padding: 20 }}>
        <Field label="Name *">
          <input required value={form.name} onChange={up("name")} placeholder="e.g. Boğaziçi University" style={input} />
        </Field>
        <Row>
          <Field label="Short name / acronym">
            <input value={form.short_name} onChange={up("short_name")} placeholder="e.g. BU" style={input} />
          </Field>
          <Field label="Kind *">
            <select value={form.kind} onChange={up("kind")} style={input}>
              {KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="Industry / sub-category">
            <input value={form.industry} onChange={up("industry")} placeholder="e.g. pharmaceutical R&D" style={input} />
          </Field>
          <Field label="Country (ISO-2)">
            <input value={form.country} onChange={up("country")} placeholder="TR" maxLength={2} style={{ ...input, textTransform: "uppercase" }} />
          </Field>
        </Row>
        <Field label="Website">
          <input type="url" value={form.website} onChange={up("website")} placeholder="https://…" style={input} />
        </Field>
        <Field label="Description" hint="A few sentences on what this organization does.">
          <textarea rows={4} value={form.description} onChange={up("description")} placeholder="What this org brings to the platform…" style={{ ...input, resize: "vertical" }} />
        </Field>

        <Field label="Capabilities" hint="What can this org contribute to a collaboration?">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CAPABILITY_SUGGESTIONS.map((cap) => {
              const on = form.capabilities.includes(cap);
              return (
                <button
                  key={cap}
                  type="button"
                  onClick={() => toggleCap(cap)}
                  style={{
                    fontSize: 11,
                    padding: "5px 9px",
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: on ? "#0a4a3e" : "#e8e6e1",
                    background: on ? "#0a4a3e" : "#fff",
                    color: on ? "#fff" : "#555",
                    cursor: "pointer",
                  }}
                >
                  {cap}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Areas of interest" hint="Comma-separated taxa, applications, or themes.">
          <input value={form.interests} onChange={up("interests")} placeholder="e.g. Crocus, Iridaceae, antimicrobial, propagation" style={input} />
        </Field>

        {error && (
          <div style={{ marginTop: 8, padding: 10, background: "#fdecec", border: "1px solid #fcc", borderRadius: 6, fontSize: 11, color: "#A32D2D" }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Link href="/geocon/organizations" style={{ padding: "9px 14px", fontSize: 12, color: "#666", textDecoration: "none", borderRadius: 7 }}>Cancel</Link>
          <button
            type="submit"
            disabled={busy}
            style={{
              padding: "9px 16px",
              fontSize: 12,
              fontWeight: 600,
              background: busy ? "#bfbfbf" : "#0a4a3e",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Registering…" : "Register organization"}
          </button>
        </div>
      </form>
    </div>
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

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: "#aaa", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}
