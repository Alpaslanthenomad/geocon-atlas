import { createClient } from "@supabase/supabase-js";
import { IUCN_TINT } from "../../../../lib/iucn";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon"
);

const SITE = "https://geocon-atlas.vercel.app";

async function fetchSpecies(id) {
  const { data } = await supabase
    .from("species")
    .select("id, accepted_name, common_name, family, genus, iucn_status, country_focus, thumbnail_url")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function SpeciesEmbedPage({ params }) {
  const species = await fetchSpecies(params.id);

  if (!species) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: "#888", textAlign: "center" }}>Species not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{
          height: 140,
          borderRadius: 10,
          background: species.thumbnail_url
            ? `linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%), url(${species.thumbnail_url})`
            : "linear-gradient(145deg, #E1F5EE, #FCE89B)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "flex-end",
          padding: 10,
        }}>
          {species.iucn_status && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: "2px 8px", borderRadius: 999,
              background: IUCN_TINT[species.iucn_status] || "#ccc",
              color: "#1a0d2e",
            }}>
              {species.iucn_status}
            </span>
          )}
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontSize: 16,
            fontWeight: 700,
            color: "#2c2c2a",
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {species.accepted_name}
          </div>
          {species.common_name && (
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{species.common_name}</div>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", fontSize: 10, color: "#888" }}>
            {species.family && <span><strong>{species.family}</strong></span>}
            {species.country_focus && <span>· {species.country_focus}</span>}
          </div>
        </div>
        <a
          href={`${SITE}/geocon/species/${species.id}`}
          target="_top"
          rel="noopener noreferrer"
          style={{
            display: "block",
            marginTop: 10,
            padding: "7px 10px",
            textAlign: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#1a0d2e",
            background: "linear-gradient(135deg, #FFD15C 0%, #F5A623 60%, #C2611A 100%)",
            borderRadius: 8,
            textDecoration: "none",
            letterSpacing: 0.4,
          }}
        >
          Open in GEOCON Atlas →
        </a>
        <div style={{ marginTop: 6, fontSize: 9, color: "#aaa", textAlign: "center" }}>
          powered by GEOCON
        </div>
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
  padding: 12,
  background: "#fff",
  border: "1px solid #ece9e2",
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};
