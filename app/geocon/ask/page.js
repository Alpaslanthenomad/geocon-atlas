import AskRoute from "../../../components/geocon/AskRoute";

export const metadata = {
  title: "Ask GEOCON — natural language atlas search",
  description:
    "Type a question or speak it: GEOCON parses IUCN tiers, families, genera, and countries, then runs the right query.",
};

export default function AskPage() {
  return <AskRoute />;
}
