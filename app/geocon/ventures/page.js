import { redirect } from "next/navigation";

// Ventures left GEOCON — commerce now lives at the BEE platform level.
// Kept as a permanent redirect so existing deep-links stay alive.
export default function VenturesPage() {
  redirect("/exchange/desk");
}
