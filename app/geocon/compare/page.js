import CompareRoute from "../../../components/geocon/CompareRoute";

export const metadata = {
  title: "Compare species — GEOCON",
  description: "Side-by-side comparison of any two species in the atlas.",
};

export default function ComparePage({ searchParams }) {
  const a = searchParams?.a || "";
  const b = searchParams?.b || "";
  return <CompareRoute initialA={a} initialB={b} />;
}
