import Link from "next/link";

export const metadata = {
  title: "BEE — Biodiversity Execution Engine",
  description:
    "The engine that runs structured, multi-actor, multi-stage biological programs from foundation to application.",
};

const COSMIC_BG =
  "radial-gradient(ellipse at 20% 10%, #1a2540 0%, transparent 55%)," +
  "radial-gradient(ellipse at 85% 90%, #0d1f2e 0%, transparent 60%)," +
  "radial-gradient(ellipse at 50% 50%, #06080f 0%, #03050a 100%)";

export default function BEELanding() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: COSMIC_BG,
        color: "#e8e6e1",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 48px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes bee-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.6); }
          50%      { opacity: 0.55; box-shadow: 0 0 0 6px rgba(45, 212, 191, 0); }
        }
        .bee-card:hover {
          border-color: rgba(45, 212, 191, 0.45);
          background: rgba(20, 30, 45, 0.65);
        }
        .bee-card:hover .bee-enter { color: #5eead4; }
      `}</style>

      {/* Subtle starfield via box-shadow dots — decorative, fixed */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,0.35) 50%, transparent 51%)," +
            "radial-gradient(1px 1px at 38% 78%, rgba(255,255,255,0.25) 50%, transparent 51%)," +
            "radial-gradient(1px 1px at 67% 14%, rgba(255,255,255,0.30) 50%, transparent 51%)," +
            "radial-gradient(1px 1px at 82% 64%, rgba(255,255,255,0.22) 50%, transparent 51%)," +
            "radial-gradient(1px 1px at 55% 42%, rgba(255,255,255,0.18) 50%, transparent 51%)," +
            "radial-gradient(1px 1px at 92% 30%, rgba(255,255,255,0.28) 50%, transparent 51%)," +
            "radial-gradient(1px 1px at 8% 88%, rgba(255,255,255,0.20) 50%, transparent 51%)",
        }}
      />

      {/* Main content */}
      <main
        style={{
          position: "relative",
          maxWidth: 1080,
          margin: "0 auto",
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 40,
        }}
      >
        <header style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: "italic",
              fontSize: "clamp(120px, 22vw, 280px)",
              lineHeight: 0.9,
              fontWeight: 400,
              letterSpacing: -6,
              margin: 0,
              color: "#f5f3ee",
              textShadow: "0 0 40px rgba(94, 234, 212, 0.08)",
            }}
          >
            BEE
          </h1>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: "#8a9bb4",
              marginTop: 18,
              fontWeight: 500,
            }}
          >
            Biodiversity Execution Engine
          </div>
          <p
            style={{
              fontStyle: "italic",
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 18,
              color: "#c9d3e2",
              margin: "28px 0 0",
              letterSpacing: 0.2,
            }}
          >
            biological knowledge becomes biological action
          </p>
          <p
            style={{
              maxWidth: 620,
              margin: "20px auto 0",
              fontSize: 14,
              lineHeight: 1.7,
              color: "#9aa6bd",
            }}
          >
            The engine that runs structured, multi-actor, multi-stage biological
            programs from foundation to application.
          </p>
        </header>

        {/* Vertical card */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Link
            href="/geocon"
            className="bee-card"
            style={{
              display: "block",
              width: "100%",
              maxWidth: 460,
              padding: "26px 28px",
              border: "1px solid rgba(140, 160, 190, 0.18)",
              borderRadius: 16,
              background: "rgba(15, 22, 36, 0.55)",
              backdropFilter: "blur(8px)",
              textDecoration: "none",
              color: "inherit",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#2dd4bf",
                  display: "inline-block",
                  animation: "bee-pulse 2.2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  color: "#5eead4",
                  fontWeight: 600,
                }}
              >
                Active vertical
              </span>
            </div>

            <div
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 38,
                fontWeight: 700,
                letterSpacing: -1,
                color: "#f5f3ee",
                marginBottom: 6,
              }}
            >
              GEOCON
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#b8c2d6",
                marginBottom: 14,
              }}
            >
              Endemic geophytes of Turkey
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#7a8aa4",
                letterSpacing: 0.4,
                marginBottom: 22,
              }}
            >
              436 species · 3 active programs
            </div>

            <div
              className="bee-enter"
              style={{
                fontSize: 12,
                color: "#9aa6bd",
                letterSpacing: 1,
                fontWeight: 500,
                transition: "color 0.2s ease",
              }}
            >
              Enter →
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          position: "relative",
          textAlign: "right",
          fontSize: 10,
          color: "#5e6a85",
          letterSpacing: 0.5,
          marginTop: 24,
        }}
      >
        Powered by Venn BioVentures OÜ
      </footer>
    </div>
  );
}
