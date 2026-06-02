import OrganizationDetailRoute from "../../../../components/geocon/OrganizationDetailRoute";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon";

const KIND_LABEL = {
  university: "University", research_institute: "Research institute",
  government: "Government body", company: "Company", ngo: "NGO",
  foundation: "Foundation", nursery: "Nursery / producer",
  cooperative: "Cooperative", consortium: "Consortium", other: "Organization",
};

async function fetchOrgForMeta(id) {
  if (!SUPABASE_URL || !SUPABASE_ANON || !id) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/organizations?select=name,short_name,kind,industry,country,description,accreditation_status&id=eq.${encodeURIComponent(id)}&limit=1`;
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
      next: { revalidate: 60 },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const o = await fetchOrgForMeta(params.id);
  if (!o) return { title: "Organization — GEOCON" };
  const kindLabel = KIND_LABEL[o.kind] || "Organization";
  const accreditation = o.accreditation_status === "accredited" ? " · ✓ Venn-accredited" : "";
  const title = `${o.name} · ${kindLabel}${accreditation} · GEOCON`;
  const description = (o.description && o.description.replace(/\s+/g, " ").trim().slice(0, 180))
    || `${kindLabel}${o.industry ? " · " + o.industry : ""}${o.country ? " · " + o.country : ""} — on GEOCON.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "GEOCON" },
    twitter:   { card: "summary", title, description },
  };
}

export default function OrganizationDetailPage({ params }) {
  return <OrganizationDetailRoute orgId={params.id} />;
}
