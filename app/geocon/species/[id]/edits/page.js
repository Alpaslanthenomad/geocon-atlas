import SpeciesEditsRoute from "../../../../../components/geocon/SpeciesEditsRoute";

export const metadata = {
  title: "Pending edits — GEOCON",
  description: "Community-proposed corrections to species data, with up/down voting.",
};

export default function SpeciesEditsPage({ params }) {
  return <SpeciesEditsRoute speciesId={params.id} />;
}
