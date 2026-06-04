import IucnAssessmentEditor from "../../../../components/geocon/IucnAssessmentEditor";

export const metadata = {
  title: "IUCN assessment editor — GEOCON",
  description: "Draft a Red List assessment.",
};

export default function IucnAssessmentPage({ params }) {
  return <IucnAssessmentEditor assessmentId={params.id} />;
}
