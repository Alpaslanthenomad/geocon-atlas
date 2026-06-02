import ProposalDetailRoute from "../../../../components/geocon/ProposalDetailRoute";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon";

const TYPE_LABEL = {
  research_collaboration: "Research collaboration",
  rd_partnership:         "R&D partnership",
  licensing:              "Licensing",
  feedstock_supply:       "Feedstock supply",
  propagation_service:    "Propagation service",
  knowledge_transfer:     "Knowledge transfer",
  joint_venture:          "Joint venture",
  sponsorship:            "Sponsorship",
};

// Fetch a minimal slice of the proposal server-side via the Supabase REST
// API so we can populate <title>, <meta description>, and OG/Twitter tags
// without shipping the auth-y supabase-js bundle to the metadata pass.
async function fetchProposalForMeta(id) {
  if (!SUPABASE_URL || !SUPABASE_ANON || !id) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/collaboration_proposals?select=proposal_code,title,description,proposal_type,status&id=eq.${encodeURIComponent(id)}&limit=1`;
    const r = await fetch(url, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
      // Revalidate quickly so freshly-sent proposals show up; metadata is
      // cheap to refetch and the title can change on edit.
      next: { revalidate: 30 },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const p = await fetchProposalForMeta(params.id);
  if (!p) {
    return { title: "Proposal — GEOCON" };
  }
  const typeLabel = TYPE_LABEL[p.proposal_type] || p.proposal_type;
  const title = `${p.title} · ${typeLabel} · GEOCON`;
  const description =
    (p.description && p.description.replace(/\s+/g, " ").trim().slice(0, 180)) ||
    `An open ${typeLabel.toLowerCase()} proposal on GEOCON · ${p.proposal_code}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "GEOCON",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function ProposalDetailPage({ params }) {
  return <ProposalDetailRoute proposalId={params.id} />;
}
