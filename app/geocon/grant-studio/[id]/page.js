import GrantProposalEditorRoute from "../../../../components/geocon/GrantProposalEditorRoute";

export default function GrantProposalEditorPage({ params }) {
  return <GrantProposalEditorRoute proposalId={params.id} />;
}
