import ProgramDetailRoute from "../../../../components/geocon/ProgramDetailRoute";

export default function ProgramDetailPage({ params }) {
  return <ProgramDetailRoute programId={params.id} />;
}
