import CountryRoute from "../../../../components/geocon/CountryRoute";

export default function CountryPage({ params }) {
  return <CountryRoute code={params.code} />;
}
