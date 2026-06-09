import VenturesRoute from "../../../components/geocon/VenturesRoute";

export const metadata = {
  title: "Venn Exchange — Desk (admin)",
  robots: { index: false, follow: false },
};

// The admin back office for Venn Exchange. The deal-prep tool (formerly the
// GEOCON "Ventures" / Garden) lives here now, at the BEE platform level, not
// inside the conservation atlas. Data is admin-gated at the RPC layer
// (_bridge_require_admin), so a non-admin sees no opportunities/investors.
// Forced light: Venn Exchange has its own light identity, so the desk stays light
// even when the app is in dark mode (VenturesRoute is --gx token-driven).
export default function ExchangeDeskPage() {
  return (
    <div data-theme="light" style={{ minHeight: "100vh", background: "var(--gx-bg)" }}>
      <VenturesRoute />
    </div>
  );
}
