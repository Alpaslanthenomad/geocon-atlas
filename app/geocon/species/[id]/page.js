import SpeciesDetailRoute from "../../../../components/geocon/SpeciesDetailRoute";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon";

const IUCN_LABEL = {
  CR: "Critically endangered", EN: "Endangered", VU: "Vulnerable",
  NT: "Near threatened", LC: "Least concern", DD: "Data deficient", NE: "Not evaluated",
};

async function fetchSpeciesForMeta(id) {
  if (!SUPABASE_URL || !SUPABASE_ANON || !id) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/species?select=accepted_name,family,iucn_status,country_focus,endemic,thumbnail_url&id=eq.${encodeURIComponent(id)}&limit=1`;
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
      next: { revalidate: 300 },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const s = await fetchSpeciesForMeta(params.id);
  if (!s) return { title: "Species — GEOCON" };
  const tier = s.iucn_status ? ` · ${s.iucn_status}` : "";
  const title = `${s.accepted_name}${tier} · GEOCON Atlas`;
  const tierLabel = IUCN_LABEL[s.iucn_status] || "";
  const description = [
    s.family && `Family: ${s.family}`,
    tierLabel,
    s.endemic && "Endemic",
    s.country_focus && `Country focus: ${s.country_focus}`,
  ].filter(Boolean).join(" · ");
  return {
    title,
    description: description || "A species in the GEOCON Atlas.",
    openGraph: {
      title, description, type: "article", siteName: "GEOCON",
      ...(s.thumbnail_url ? { images: [{ url: s.thumbnail_url }] } : {}),
    },
    twitter: {
      card: s.thumbnail_url ? "summary_large_image" : "summary",
      title, description,
      ...(s.thumbnail_url ? { images: [s.thumbnail_url] } : {}),
    },
  };
}

export default function SpeciesDetailPage({ params }) {
  return <SpeciesDetailRoute speciesId={params.id} />;
}
