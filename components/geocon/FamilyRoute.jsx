"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { countryName } from "../../lib/countryNames";
import { flag, familyTokens } from "../../lib/atlas/format";

const IUCN_COLORS = {
  CR: "#FF1744", EN: "#FF9100", VU: "#FFD600",
  NT: "#80CBC4", LC: "#66BB6A", DD: "#B0BEC5", NE: "#78909C",
};
const IUCN_LABEL = {
  CR: "Critically endangered",
  EN: "Endangered",
  VU: "Vulnerable",
  NT: "Near threatened",
  LC: "Least concern",
  DD: "Data deficient",
  NE: "Not evaluated",
};
const MODULE_COLORS = {
  Origin: "#1D9E75", Forge: "#BA7517", Mesh: "#185FA5",
  Exchange: "#D85A30", Accord: "#5F5E5A",
};

export default function FamilyRoute({ name }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tok = familyTokens(name);

  useEffect(() => {
    let cancelled = false;
    if (!name) return;
    setLoading(true);
    (async () => {
      try {
        const { data: payload, error } = await supabase.rpc("get_family_dashboard", {
          p_family: name,
          p_top: 24,
        });
        if (cancelled) return;
        if (error) throw error;
        setData(payload);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e.message || "Failed to load");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [name]);

  if (loading) return <Skeleton />;
  if (error) return <ErrorBox family={name} message={error} />;
  if (!data) return null;

  const summary = data.summary || {};
  const top = data.top || [];
  const countries = data.countries || [];
  const programs = data.programs || [];
  const total = summary.total || 0;
  const tierCounts = {
    CR: summary.cr_count || 0,
    EN: summary.en_count || 0,
    VU: summary.vu_count || 0,
    NT: summary.nt_count || 0,
    LC: summary.lc_count || 0,
    DD: summary.dd_count || 0,
    NE: (summary.ne_count || 0) + (summary.null_count || 0),
  };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <Link href="/geocon/species" style={{ fontSize: 11, color: "#888", textDecoration: "none", letterSpacing: 0.5 }}>
        ← ATLAS
      </Link>

      <section
        style={{
          marginTop: 12,
          marginBottom: 18,
          padding: "20px 24px",
          borderRadius: 14,
          background: tok.bg,
          borderLeft: `5px solid ${tok.border}`,
        }}
      >
        <div style={{ fontSize: 10, color: tok.text, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
          Family
        </div>
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 42,
            fontWeight: 700,
            color: tok.text,
            letterSpacing: -0.8,
            margin: 0,
            lineHeight: 1,
          }}
        >
          {name}
        </h1>
        <div style={{ fontSize: 13, color: tok.text, opacity: 0.85, marginTop: 8 }}>
          {total.toLocaleString()} species in the atlas
          {summary.endemic_count > 0 && <> · {summary.endemic_count} endemic</>}
        </div>
      </section>

      {total === 0 ? (
        <div style={{ padding: 28, border: "1px dashed #ece9e2", borderRadius: 12, textAlign: "center", color: "#888" }}>
          No species in <strong>{name}</strong> yet.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, alignItems: "start" }}>
          <main style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Section title={`Highlight species · ${top.length}`}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                {top.map((s) => <SpeciesMiniCard key={s.id} s={s} />)}
              </div>
              <div style={{ marginTop: 12, textAlign: "right" }}>
                <Link
                  href={`/geocon/species?family=${encodeURIComponent(name)}`}
                  style={{ fontSize: 11, color: "#1D9E75", textDecoration: "none", fontWeight: 600 }}
                >
                  Browse all {total.toLocaleString()} in ATLAS →
                </Link>
              </div>
            </Section>

            {programs.length > 0 && (
              <Section title={`Programs · ${programs.length}`}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {programs.map((p) => <ProgramRow key={p.id} p={p} />)}
                </div>
              </Section>
            )}
          </main>

          <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <Heading>IUCN breakdown</Heading>
              <TierBars tierCounts={tierCounts} />
            </Card>

            {countries.length > 0 && (
              <Card>
                <Heading>Top countries</Heading>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {countries.map((c) => (
                    <Link
                      key={c.country}
                      href={`/geocon/countries/${c.country}`}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: 6, background: "#f4f3ef", color: "#2c2c2a", textDecoration: "none", fontSize: 11 }}
                    >
                      <span><span style={{ marginRight: 6 }}>{flag(c.country)}</span>{countryName(c.country)}</span>
                      <span style={{ color: "#888" }}>{c.count.toLocaleString()}</span>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function SpeciesMiniCard({ s }) {
  const tier = s.iucn_status;
  const tierColor = IUCN_COLORS[tier];
  return (
    <Link
      href={`/geocon/species/${s.id}`}
      style={{
        display: "block",
        background: "#fff",
        border: "1px solid #ece9e2",
        borderRadius: 8,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "1/1", background: "#f4f3ef", overflow: "hidden" }}>
        {s.thumbnail_url ? (
          <img src={s.thumbnail_url} alt={s.accepted_name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#b4b2a9", letterSpacing: 1 }}>no image</div>
        )}
        {tier && (
          <span style={{ position: "absolute", top: 6, right: 6, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: tierColor, color: "#fff" }}>{tier}</span>
        )}
        {s.country_focus && (
          <span style={{ position: "absolute", bottom: 6, left: 6, fontSize: 10, padding: "1px 6px", borderRadius: 999, background: "rgba(255,255,255,0.85)", color: "#2c2c2a", letterSpacing: 0.4 }}>
            {flag(s.country_focus)} {s.country_focus}
          </span>
        )}
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12, color: "#2c2c2a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.15 }}>
          {s.accepted_name}
        </div>
      </div>
    </Link>
  );
}

function ProgramRow({ p }) {
  const mod = MODULE_COLORS[p.current_module] || "#888";
  return (
    <Link
      href={`/geocon/programs/${p.id}`}
      style={{
        display: "block",
        background: "#fff",
        border: "1px solid #ece9e2",
        borderLeft: `4px solid ${mod}`,
        borderRadius: 10,
        padding: "10px 14px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{p.program_name}</div>
      <div style={{ fontSize: 11, color: "#9a978f", marginTop: 2 }}>
        {p.species_name && <span style={{ fontStyle: "italic" }}>{p.species_name}</span>}
        {p.current_module && <span> · {p.current_module}</span>}
        {p.status && <span> · {p.status}</span>}
      </div>
    </Link>
  );
}

function TierBars({ tierCounts }) {
  const entries = Object.entries(tierCounts).filter(([, v]) => v > 0);
  if (entries.length === 0) return <div style={{ fontSize: 11, color: "#888" }}>—</div>;
  const max = Math.max(...entries.map(([, v]) => v));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {entries.map(([tier, count]) => (
        <div key={tier}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#5f5e5a", marginBottom: 3 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: IUCN_COLORS[tier] }} />
              {tier}
            </span>
            <span style={{ color: "#2c2c2a", fontWeight: 600 }}>{count.toLocaleString()}</span>
          </div>
          <div style={{ height: 5, background: "#f4f3ef", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: IUCN_COLORS[tier], borderRadius: 99 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 12, padding: 16 }}>
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#2c2c2a", margin: "0 0 12px" }}>{title}</h3>
      {children}
    </section>
  );
}

function Card({ children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ece9e2", borderRadius: 12, padding: 14 }}>
      {children}
    </div>
  );
}

function Heading({ children }) {
  return (
    <div style={{ fontSize: 10, color: "#b4b2a9", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{children}</div>
  );
}

function Skeleton() {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: 14 }}>
      <div style={{ height: 90, background: "#f4f3ef", borderRadius: 14, marginBottom: 12, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 240, background: "#f4f3ef", borderRadius: 14 }} />
    </div>
  );
}

function ErrorBox({ family, message }) {
  return (
    <div style={{ maxWidth: 720, margin: "60px auto", padding: 24, border: "1px solid #FCEBEB", background: "#FFF6F6", borderRadius: 12, color: "#A32D2D" }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>Couldn't load {family}</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>{message}</div>
      <Link href="/geocon/species" style={{ display: "inline-block", marginTop: 14, fontSize: 12, color: "#1D9E75" }}>
        ← Back to ATLAS
      </Link>
    </div>
  );
}
