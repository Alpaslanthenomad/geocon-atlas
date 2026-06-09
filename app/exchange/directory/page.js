import ExchangeDirectory from "../../../components/exchange/ExchangeDirectory";

export const metadata = {
  title: "Venn Exchange — Directory",
  robots: { index: false, follow: false },
};

export default function DirectoryPage() {
  return <ExchangeDirectory />;
}
