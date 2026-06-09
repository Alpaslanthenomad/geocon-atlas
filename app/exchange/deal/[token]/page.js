import TokenDealRoom from "../../../../components/exchange/TokenDealRoom";

// The tokenized, no-login VC deal room. The token is the access control
// (revocable + expiring); the page is PII-free and noindex (a private link).
export const metadata = {
  title: "Venn Exchange — deal room",
  robots: { index: false, follow: false },
};

export default function TokenDealPage({ params }) {
  return <TokenDealRoom token={params.token} />;
}
