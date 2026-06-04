import ResearcherPassportRoute from "../../../components/geocon/ResearcherPassportRoute";

export const dynamic = "force-dynamic";

export default function PassportPage({ params }) {
  return <ResearcherPassportRoute handle={params?.handle} />;
}
