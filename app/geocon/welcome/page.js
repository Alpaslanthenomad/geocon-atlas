import { Suspense } from "react";
import WelcomeRoute from "../../../components/geocon/WelcomeRoute";

export const metadata = {
  title: "Welcome to GEOCON",
  description:
    "Connect your ORCID to import your atlas history and unlock the personalized GEOCON dashboard.",
};

// useSearchParams() inside WelcomeRoute requires a Suspense boundary
// for static prerender; the fallback is what the page shows before the
// search params are hydrated client-side.
export default function Page() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 32, fontSize: 12, color: "#888" }}>
        Yükleniyor…
      </div>
    }>
      <WelcomeRoute />
    </Suspense>
  );
}
