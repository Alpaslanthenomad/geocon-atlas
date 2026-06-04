import DiscoveryFeedRoute from "../../../components/geocon/DiscoveryFeedRoute";

export const metadata = {
  title: "Discovery feed — GEOCON Atlas",
  description:
    "Last 30 days of platform-wide signal: IUCN status changes, peer-endorsed outcomes, high-citation publications, and active programs.",
};

export default function FeedPage() {
  return <DiscoveryFeedRoute />;
}
