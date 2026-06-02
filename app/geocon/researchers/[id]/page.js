import ResearcherDetailRoute from "../../../../components/geocon/ResearcherDetailRoute";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon";

async function fetchResearcherForMeta(id) {
  if (!SUPABASE_URL || !SUPABASE_ANON || !id) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/researchers?select=id,name,institution,country,expertise_area,h_index,publications_count&id=eq.${encodeURIComponent(id)}&limit=1`;
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
      next: { revalidate: 60 },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch { return null; }
}

export async function generateMetadata({ params }) {
  const r = await fetchResearcherForMeta(params.id);
  if (!r) return { title: "Researcher — GEOCON" };
  const title = `${r.name} · Researcher · GEOCON`;
  const tagParts = [
    r.expertise_area,
    r.institution,
    r.country,
    r.h_index ? `h-index ${r.h_index}` : null,
    r.publications_count ? `${r.publications_count} publications` : null,
  ].filter(Boolean);
  const description = tagParts.length
    ? tagParts.join(" · ")
    : "A researcher in the GEOCON network.";
  return {
    title, description,
    openGraph: { title, description, type: "profile", siteName: "GEOCON" },
    twitter:   { card: "summary", title, description },
  };
}

export default function ResearcherDetailPage({ params }) {
  return <ResearcherDetailRoute researcherId={params.id} />;
}
