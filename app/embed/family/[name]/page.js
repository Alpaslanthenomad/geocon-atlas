import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon"
);

const SITE = "https://geocon-atlas.vercel.app";

export const metadata = { robots: { index: false, follow: false } };

async function fetchSummary(name) {
  const { data } = await supabase.rpc("get_family_summary", { p_family: name });
  return data;
}

export default async function FamilyEmbedPage({ params }) {
  const name = decodeURIComponent(params.name || "");
  const summary = await fetchSummary(name);

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 9, letterSpacing: 2.5, textTransform: "uppercase", color: "#85651A", fontWeight: 700 }}>
          🌳 GEOCON family
        </div>
        <h1 style={{
          fontFamily: "Georgia, serif",
          fontSize: 22,
          fontWeight: 700,
          color: "#2c2c2a",
          margin: "6px 0 4px",
          letterSpacing: -0.6,
        }}>
          {name}
        </h1>
        {summary ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 10 }}>
            <Stat label="Species"     value={summary.total_species} />
            <Stat label="Threatened"  value={summary.threatened_count} tint="#A32D2D" />
            <Stat label="Countries"   value={summary.country_count} />
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#888", marginTop: 8 }}>Family not found.</div>
        )}
        <a
          href={`${SITE}/geocon/families/${encodeURIComponent(name)}`}
          target="_top"
          rel="noopener noreferrer"
          style={cta}
        >
          Open family page →
        </a>
        <div style={{ marginTop: 6, fontSize: 9, color: "#aaa", textAlign: "center" }}>
          powered by GEOCON
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tint }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: '"Arial Black", system-ui, sans-serif', fontSize: 22, fontWeight: 900, color: tint || "#2c2c2a", letterSpacing: -1, lineHeight: 1 }}>
        {Number(value || 0).toLocaleString()}
      </div>
      <div style={{ fontSize: 9, color: "#888", marginTop: 3, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  margin: 0,
  padding: 12,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  background: "transparent",
};
const cardStyle = {
  padding: 14,
  background: "#fff",
  border: "1px solid #ece9e2",
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};
const cta = {
  display: "block",
  marginTop: 12,
  padding: "8px 10px",
  textAlign: "center",
  fontSize: 11,
  fontWeight: 700,
  color: "#1a0d2e",
  background: "linear-gradient(135deg, #FFD15C 0%, #F5A623 60%, #C2611A 100%)",
  borderRadius: 8,
  textDecoration: "none",
  letterSpacing: 0.4,
};
