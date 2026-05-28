import Link from "next/link";

export const metadata = {
  title: "BEE — Biodiversity Execution Engine",
  description:
    "The engine that runs structured, multi-actor, multi-stage biological programs from foundation to application.",
};

// Deep purple base with warm orange + natural-green radial accents
const BIO_BG =
  "radial-gradient(ellipse at 12% 18%, rgba(229, 114, 43, 0.18) 0%, transparent 45%)," +
  "radial-gradient(ellipse at 88% 82%, rgba(86, 142, 80, 0.16) 0%, transparent 50%)," +
  "radial-gradient(ellipse at 50% 50%, #2a1240 0%, #150821 100%)";

// Bee-warmth gradient for the wordmark
const BEE_GRADIENT =
  "linear-gradient(140deg, #FFD15C 0%, #F5A623 35%, #E5722B 75%, #C24E17 100%)";

const STRONG_DISPLAY =
  '"Arial Black", "Helvetica Neue", Helvetica, "Segoe UI Black", system-ui, sans-serif';

function HexBackground() {
  // Pointy-top honeycomb. Generated server-side, static SVG.
  const R = 38; // circumradius
  const dx = R * Math.sqrt(3); // horizontal pitch
  const dy = R * 1.5; // vertical pitch
  const cols = 30;
  const rows = 22;

  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const xOff = row % 2 === 0 ? 0 : dx / 2;
      const cx = col * dx + xOff;
      const cy = row * dy + R;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = cx + R * Math.cos(angle);
        const py = cy + R * Math.sin(angle);
        pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }
      cells.push(<polygon key={`${row}-${col}`} points={pts.join(" ")} />);
    }
  }

  const width = cols * dx;
  const height = rows * dy + R;

  return (
    <svg
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <defs>
        {/* Radial mask: brighter hex strokes in centre, fade toward edges */}
        <radialGradient id="hexMask" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.15" />
        </radialGradient>
        <mask id="hexFade">
          <rect width={width} height={height} fill="url(#hexMask)" />
        </mask>
      </defs>
      <g
        mask="url(#hexFade)"
        stroke="rgba(245, 166, 35, 0.18)"
        fill="none"
        strokeWidth="1.1"
      >
        {cells}
      </g>
    </svg>
  );
}

export default function BEELanding() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: BIO_BG,
        color: "#f3e8d3",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 48px",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes bee-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(245, 166, 35, 0.55); }
          50%      { opacity: 0.55; box-shadow: 0 0 0 7px rgba(245, 166, 35, 0); }
        }
        .bee-card { transition: all 0.2s ease; }
        .bee-card:hover {
          border-color: rgba(245, 166, 35, 0.55);
          background: rgba(40, 18, 60, 0.7);
          transform: translateY(-1px);
        }
        .bee-card:hover .bee-enter { color: #FFD15C; }
        .bee-word {
          background: ${BEE_GRADIENT};
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <HexBackground />

      {/* Main content */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1080,
          margin: "0 auto",
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 36,
        }}
      >
        <header style={{ textAlign: "center" }}>
          <h1
            className="bee-word"
            style={{
              fontFamily: STRONG_DISPLAY,
              fontStyle: "normal",
              fontWeight: 900,
              fontSize: "clamp(140px, 24vw, 320px)",
              lineHeight: 0.88,
              letterSpacing: -8,
              margin: 0,
              filter: "drop-shadow(0 6px 24px rgba(245, 166, 35, 0.18))",
            }}
          >
            BEE
          </h1>

          <div
            style={{
              fontSize: 11,
              letterSpacing: 5.5,
              textTransform: "uppercase",
              color: "#FFD79B",
              marginTop: 22,
              fontWeight: 600,
            }}
          >
            Biodiversity Execution Engine
          </div>

          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: "italic",
              fontSize: 14,
              color: "#A8C49C",
              margin: "16px auto 0",
              maxWidth: 540,
              letterSpacing: 0.3,
            }}
          >
            Like the bee — pollinator of biodiversity, carrier of life across the field.
          </p>

          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: "italic",
              fontSize: 18,
              color: "#F0D9B6",
              margin: "26px 0 0",
              letterSpacing: 0.2,
            }}
          >
            biological knowledge becomes biological action
          </p>

          <p
            style={{
              maxWidth: 640,
              margin: "20px auto 0",
              fontSize: 14,
              lineHeight: 1.75,
              color: "#cdbb9c",
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
              maxWidth: 480,
              padding: "28px 30px",
              border: "1px solid rgba(245, 166, 35, 0.25)",
              borderRadius: 18,
              background: "rgba(28, 12, 44, 0.6)",
              backdropFilter: "blur(10px)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#F5A623",
                  display: "inline-block",
                  animation: "bee-pulse 2.2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  color: "#FFD15C",
                  fontWeight: 700,
                }}
              >
                Active vertical
              </span>
            </div>

            <div
              style={{
                fontFamily: STRONG_DISPLAY,
                fontSize: 42,
                fontWeight: 900,
                letterSpacing: -1.2,
                color: "#f8eecf",
                marginBottom: 6,
                lineHeight: 1,
              }}
            >
              GEOCON
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#A8C49C",
                marginBottom: 14,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: "italic",
              }}
            >
              Endemic geophytes of Turkey
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#b09681",
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
                color: "#cdbb9c",
                letterSpacing: 1,
                fontWeight: 600,
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
          zIndex: 1,
          textAlign: "right",
          fontSize: 10,
          color: "#8a6f56",
          letterSpacing: 0.6,
          marginTop: 24,
        }}
      >
        Powered by Venn BioVentures OÜ
      </footer>
    </div>
  );
}
