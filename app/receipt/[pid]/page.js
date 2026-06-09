import ReceiptRoute from "../../../components/geocon/ReceiptRoute";

// A Provenance Receipt is a public, citable, shareable artifact — top-level (no
// GeoconShell chrome), indexable, so a scientist or investor can open it from the
// citation URL and trust it cold. Money-free + PII-free by the RPC.
export const metadata = {
  title: "Provenance Receipt — GEOCON Atlas",
  description:
    "A verified, money-blind, citable evidence record from the GEOCON conservation atlas.",
};

export default function ReceiptPage({ params }) {
  return <ReceiptRoute pid={params.pid} />;
}
