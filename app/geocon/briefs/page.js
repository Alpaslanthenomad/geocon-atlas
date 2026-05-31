import BriefsRoute from "../../../components/geocon/BriefsRoute";

const TITLE = "Open Briefs — GEOCON";
const DESC  = "Research, conservation, capability, production, partner, and service briefs from across the GEOCON network.";

export const metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: "website" },
  twitter:   { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function BriefsPage() {
  return <BriefsRoute />;
}
