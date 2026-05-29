import ProposalDetailRoute from "../../../../components/geocon/ProposalDetailRoute";

export const metadata = { title: "Proposal — GEOCON" };

export default function ProposalDetailPage({ params }) {
  return <ProposalDetailRoute proposalId={params.id} />;
}
