import CompareRoute from "../../../components/geocon/CompareRoute";

const TITLE = "Compare species — GEOCON";
const DESC  = "Side-by-side comparison of any two species in the atlas.";

export const metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: "website" },
  twitter:   { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function ComparePage({ searchParams }) {
  const a = searchParams?.a || "";
  const b = searchParams?.b || "";
  return <CompareRoute initialA={a} initialB={b} />;
}
