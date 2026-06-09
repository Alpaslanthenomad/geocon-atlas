import VentureDetailRoute from "../../../../components/geocon/VentureDetailRoute";

export const metadata = {
  title: "Venn Exchange — Opportunity (admin)",
  robots: { index: false, follow: false },
};

export default function ExchangeDeskDetailPage({ params }) {
  return (
    <div data-theme="light" style={{ minHeight: "100vh", background: "var(--gx-bg)" }}>
      <VentureDetailRoute opportunityId={params.id} />
    </div>
  );
}
