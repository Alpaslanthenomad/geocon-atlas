import AskRoute from "../../../components/geocon/AskRoute";

const TITLE = "Ask GEOCON — natural language atlas search";
const DESC = "Type a question or speak it: GEOCON parses IUCN tiers, families, genera, and countries, then runs the right query.";

export const metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: "website" },
  twitter:   { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function AskPage() {
  return <AskRoute />;
}
