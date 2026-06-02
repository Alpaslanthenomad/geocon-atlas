import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "anon"
);

async function fetchProposal(id) {
  const { data, error } = await supabase.rpc("get_public_proposal", { p_id: id });
  if (error || !data) return null;
  return data;
}

export const metadata = {
  // Embed iframes shouldn't crowd indexes
  robots: { index: false, follow: false },
};

const SITE = "https://geocon-atlas.vercel.app";

export default async function ProposalEmbedPage({ params }) {
  const proposal = await fetchProposal(params.id);

  const inner = proposal ? (
    <>
      <div style={{ fontSize: 9, letterSpacing: 2.5, textTransform: "uppercase", color: "#85651A", fontWeight: 700 }}>
        📣 GEOCON open call
      </div>
      <div style={{
        fontFamily: "Georgia, serif",
        fontSize: 16,
        fontWeight: 700,
        color: "#2c2c2a",
        marginTop: 6,
        lineHeight: 1.25,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {proposal.title}
      </div>
      {proposal.description && (
        <div style={{
          fontSize: 12,
          color: "#5f5e5a",
          marginTop: 6,
          lineHeight: 1.55,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {proposal.description}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {proposal.proposal_type && (
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 999,
            background: "#EEEDFE",
            color: "#534AB7",
          }}>
            {proposal.proposal_type}
          </span>
        )}
        {proposal.initiator_name && (
          <span style={{ fontSize: 11, color: "#888" }}>
            from <strong style={{ color: "#2c2c2a" }}>{proposal.initiator_name}</strong>
          </span>
        )}
      </div>
      <a
        href={`${SITE}/share/proposal/${proposal.id}`}
        target="_top"
        rel="noopener noreferrer"
        style={{
          display: "block",
          marginTop: 10,
          padding: "8px 12px",
          textAlign: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "#1a0d2e",
          background: "linear-gradient(135deg, #FFD15C 0%, #F5A623 60%, #C2611A 100%)",
          borderRadius: 8,
          textDecoration: "none",
          letterSpacing: 0.5,
        }}
      >
        Respond on GEOCON →
      </a>
    </>
  ) : (
    <>
      <div style={{ fontSize: 11, color: "#888", textAlign: "center" }}>
        This open call is no longer available.
      </div>
      <a href={`${SITE}/geocon/proposals/open`}
        target="_top"
        rel="noopener noreferrer"
        style={{
          display: "block",
          marginTop: 10,
          padding: "8px 12px",
          textAlign: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "#534AB7",
          background: "#EEEDFE",
          borderRadius: 8,
          textDecoration: "none",
        }}>
        Browse all open calls
      </a>
    </>
  );

  return (
    <div style={{
      minHeight: "100vh",
      margin: 0,
      padding: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: "transparent",
    }}>
      <div style={{
        padding: 14,
        background: "#fff",
        border: "1px solid #ece9e2",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}>
        {inner}
      </div>
    </div>
  );
}
