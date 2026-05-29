import OrganizationDetailRoute from "../../../../components/geocon/OrganizationDetailRoute";

export const metadata = { title: "Organization — GEOCON" };

export default function OrganizationDetailPage({ params }) {
  return <OrganizationDetailRoute orgId={params.id} />;
}
