import MetaboliteDetailRoute from "../../../../components/geocon/MetaboliteDetailRoute";

export const metadata = { title: "Metabolite — GEOCON" };

export default function MetaboliteDetailPage({ params }) {
  return <MetaboliteDetailRoute metaboliteId={params.id} />;
}
