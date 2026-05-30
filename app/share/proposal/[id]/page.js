import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

async function fetchProposal(id) {
  const { data, error } = await supabase.rpc("get_public_proposal", { p_id: id });
  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }) {
  const p = await fetchProposal(params.id);
  if (!p) return { title: "Proposal — GEOCON" };
  const title = `${p.title} — GEOCON open call`;
  const description = (p.description || "").slice(0, 180);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://geocon-atlas.vercel.app/share/proposal/${params.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const BG =
  "radial-gradient(ellipse at 12% 18%, rgba(229, 114, 43, 0.18) 0%, transparent 45%)," +
  "radial-gradient(ellipse at 88% 82%, rgba(86, 142, 80, 0.18) 0%, transparent 50%)," +
  "radial-gradient(ellipse at 50% 50%, #2a1240 0%, #150821 100%)";

const GRADIENT = "linear-gradient(135deg, #FFD15C 0%, #F5A623 35%, #C2611A 75%, #6B3010 100%)";
const STRONG = '"Arial Black", "Helvetica Neue", Helvetica, system-ui, sans-serif';

export default async function SharedProposalPage({ params }) {
  const proposal = await fetchProposal(params.id);

  if (!proposal) {
    return (
      <div style={{ minHeight: "100vh", background: BG, color: "#FFE6BC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <div style={{ fontSize: 13, color: "rgba(255,215,155,0.75)" }}>
            This proposal is no longer publicly shareable.
          </div>
          <Link href="/geocon/proposals/open" style={{ marginTop: 14, display: "inline-block", color: "#FFD15C", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
            Browse open calls →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: BG,
      color: "#FFE6BC",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: "36px 24px 60px",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link href="/geocon" style={{
          fontSize: 10,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "#FFD79B",
          fontWeight: 600,
          textDecoration: "none",
        }}>
          GEOCON
        </Link>

        <div style={{ marginTop: 18, marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Pill tint="rgba(245,166,35,0.22)" color="#FFE6BC">📣 Open call</Pill>
          {proposal.proposal_type && (
            <Pill tint="rgba(83,74,183,0.25)" color="#D4CFFA">{proposal.proposal_type}</Pill>
          )}
          {proposal.status && (
            <Pill tint="rgba(255,255,255,0.08)" color="#FFE6BC">{proposal.status}</Pill>
          )}
        </div>

        <h1 style={{
          fontFamily: "Georgia, serif",
          fontSize: "clamp(26px, 4vw, 40px)",
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.2,
          color: "#FFE6BC",
        }}>
          {proposal.title}
        </h1>

        {proposal.initiator_name && (
          <div style={{ fontSize: 13, color: "rgba(255,215,155,0.75)", marginTop: 10 }}>
            from <strong style={{ color: "#FFE6BC" }}>{proposal.initiator_name}</strong>
          </div>
        )}

        {proposal.description && (
          <div style={{
            marginTop: 22,
            padding: 22,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(245,166,35,0.22)",
            borderRadius: 14,
            fontSize: 15,
            lineHeight: 1.65,
            color: "#FFE6BC",
            whiteSpace: "pre-wrap",
          }}>
            {proposal.description}
          </div>
        )}

        <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href={`/geocon/proposals/${proposal.id}`}
            style={{
              padding: "12px 22px",
              fontWeight: 700,
              fontSize: 13,
              color: "#1a0d2e",
              background: GRADIENT,
              borderRadius: 10,
              textDecoration: "none",
              letterSpacing: 0.4,
            }}
          >
            🤝 Respond on GEOCON →
          </Link>
          <Link
            href="/geocon/proposals/open"
            style={{
              padding: "12px 22px",
              fontWeight: 600,
              fontSize: 13,
              color: "#FFE6BC",
              background: "transparent",
              border: "1px solid rgba(245,166,35,0.35)",
              borderRadius: 10,
              textDecoration: "none",
              letterSpacing: 0.4,
            }}
          >
            Browse all open calls
          </Link>
        </div>

        <div style={{ marginTop: 40, paddingTop: 18, borderTop: "1px solid rgba(245,166,35,0.18)", fontSize: 11, color: "rgba(255,215,155,0.55)" }}>
          Shared from{" "}
          <Link href="/geocon/about" style={{ color: "#FFD15C", textDecoration: "none" }}>GEOCON</Link>
          {" "}— endemic geophyte intelligence.
        </div>
      </div>
    </div>
  );
}

function Pill({ children, tint, color }) {
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
      padding: "4px 10px",
      borderRadius: 999,
      background: tint,
      color: color,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}
