import AboutRoute from "../../../components/geocon/AboutRoute";

export const metadata = {
  title: "GEOCON — Endemic geophyte intelligence",
  description:
    "Every endemic geophyte on Earth, indexed and linked. Built for researchers, gardens, conservation NGOs, and biotech ventures.",
  openGraph: {
    title: "GEOCON — Endemic geophyte intelligence",
    description:
      "Every endemic geophyte on Earth, indexed and linked. Built for researchers, gardens, conservation NGOs, and biotech ventures.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GEOCON — Endemic geophyte intelligence",
    description:
      "Every endemic geophyte on Earth, indexed and linked. Built for researchers, gardens, conservation NGOs, and biotech ventures.",
  },
};

export default function GeoconAboutPage() {
  return <AboutRoute />;
}
