import { redirect } from "next/navigation";

// Ventures left GEOCON — redirect deep-links to the Venn Exchange desk.
export default function VentureDetailPage({ params }) {
  redirect(`/exchange/desk/${params.id}`);
}
