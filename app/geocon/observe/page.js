import ObserveRoute from "../../../components/geocon/ObserveRoute";

const TITLE = "Field observe — GEOCON";
const DESC = "Capture a GPS-tagged field observation of a geophyte.";

export const metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: "website" },
  twitter:   { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function ObservePage() {
  return <ObserveRoute />;
}
