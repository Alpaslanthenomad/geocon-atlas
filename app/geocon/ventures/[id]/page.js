import VentureDetailRoute from "../../../../components/geocon/VentureDetailRoute";

export const metadata = {
  title: "Venture — GEOCON (internal)",
  robots: { index: false, follow: false },
};

export default function VentureDetailPage({ params }) {
  return <VentureDetailRoute opportunityId={params.id} />;
}
