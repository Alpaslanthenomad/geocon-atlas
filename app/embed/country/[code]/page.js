import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const SITE = "https://geocon-atlas.vercel.app";

export const metadata = { robots: { index: false, follow: false } };

async function fetchDashboard(code) {
  const { data } = await supabase.rpc("get_country_dashboard", { p_country: code, p_top: 5 });
  return data;
}

export default async function CountryEmbedPage({ params }) {
  const code = (params.code || "").toUpperCase();
  const data = await fetchDashboard(code);
  const summary = data?.summary;

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 9, letterSpacing: 2.5, textTransform: "uppercase", color: "#85651A", fontWeight: 700 }}>
          🗺 GEOCON country
        </div>
        <h1 style={{
          fontFamily: '"Arial Black", system-ui, sans-serif',
          fontWeight: 900,
          fontSize: 26,
          color: "#2c2c2a",
          margin: "4px 0 6px",
          letterSpacing: -1,
        }}>
          {code}
        </h1>
        {summary ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
            <Stat label="Species"     value={summary.total} />
            <Stat label="CR"          value={summary.cr_count} tint="#A32D2D" />
            <Stat label="EN"          value={summary.en_count} tint="#BA7517" />
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#888", marginTop: 8 }}>Country not found.</div>
        )}
        <a
          href={`${SITE}/geocon/countries/${code}`}
          target="_top"
          rel="noopener noreferrer"
          style={cta}
        >
          Open country dashboard →
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
