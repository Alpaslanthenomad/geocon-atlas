import BriefComposerRoute from "../../../../components/geocon/BriefComposerRoute";

const TITLE = "New Open Brief — GEOCON";
const DESC  = "Issue a research demand signal across the network.";

export const metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: "website" },
  twitter:   { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function NewBriefPage() {
  return <BriefComposerRoute />;
}
