import SpeciesListRoute from "../../../components/geocon/SpeciesListRoute";

export const metadata = {
  title: "ATLAS — GEOCON",
  description: "Every geophyte species in the GEOCON atlas, filterable by family, IUCN tier and country.",
};

export default function SpeciesListPage() {
  return <SpeciesListRoute />;
}
