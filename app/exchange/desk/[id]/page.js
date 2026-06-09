import VentureDetailRoute from "../../../../components/geocon/VentureDetailRoute";

export const metadata = {
  title: "Venn Exchange — Opportunity (admin)",
  robots: { index: false, follow: false },
};

export default function ExchangeDeskDetailPage({ params }) {
  return <VentureDetailRoute opportunityId={params.id} />;
}
