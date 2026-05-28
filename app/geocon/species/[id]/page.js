import SpeciesDetailRoute from "../../../../components/geocon/SpeciesDetailRoute";

export default function SpeciesDetailPage({ params }) {
  return <SpeciesDetailRoute speciesId={params.id} />;
}
