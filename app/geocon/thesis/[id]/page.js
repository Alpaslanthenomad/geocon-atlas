import ThesisDetailRoute from "../../../../components/geocon/ThesisDetailRoute";

export default function ThesisDetailPage({ params }) {
  return <ThesisDetailRoute thesisId={params.id} />;
}
