import PropagationStudio from "../../../../../components/programs/v2/studio/PropagationStudio";

export default function PropagationStudioPage({ params }) {
  return <PropagationStudio programId={params.id} />;
}
