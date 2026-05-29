import PublicationDetailRoute from "../../../../components/geocon/PublicationDetailRoute";

export const metadata = { title: "Publication — GEOCON" };

export default function PublicationDetailPage({ params }) {
  return <PublicationDetailRoute publicationId={params.id} />;
}
