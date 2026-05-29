import FamilyRoute from "../../../../components/geocon/FamilyRoute";

export default function FamilyPage({ params }) {
  return <FamilyRoute name={decodeURIComponent(params.name)} />;
}
