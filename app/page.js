import Link from "next/link";
import BEEAuthBar from "../components/bee/AuthBar";

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
  // Pointy-top honeycomb with biotech accents.
  // All randomness is deterministic via (row, col) seed → no SSR/CSR hydration mismatch.
  const R = 38;
  const dx = R * Math.sqrt(3);
  const dy = R * 1.5;
  const cols = 30;
  const rows = 22;

  const hexes = [];
  const nuclei = [];
  const vertexDots = [];
  const seenVertices = new Set();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const xOff = row % 2 === 0 ? 0 : dx / 2;
      const cx = col * dx + xOff;
      const cy = row * dy + R;
      const seed = (row * 31 + col * 17 + 7) % 100;

      const pts = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = cx + R * Math.cos(angle);
        const py = cy + R * Math.sin(angle);
        pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
        // Molecular vertex dots — only for select hexes, dedupe shared vertices
        if (seed % 7 === 0) {
          const key = `${px.toFixed(0)}_${py.toFixed(0)}`;
          if (!seenVertices.has(key)) {
            seenVertices.add(key);
            vertexDots.push(
              <circle key={`v-${key}`} cx={px.toFixed(1)} cy={py.toFixed(1)} r="1.3" fill="rgba(255, 215, 155, 0.45)" />
            );
          }
        }
      }

      // Living-tissue feel: stroke opacity varies per hex
      const strokeOpacity = seed < 9 ? 0.44 : seed < 22 ? 0.27 : 0.14;
      hexes.push(
        <polygon
          key={`h-${row}-${col}`}
          points={pts.join(" ")}
          stroke={`rgba(245, 166, 35, ${strokeOpacity})`}
          fill="none"
          strokeWidth="1.1"
        />
      );

      // Cell nucleus — filled accent for ~10% of cells
      if (seed < 9) {
        const isHot = seed < 3;
        nuclei.push(
          <circle
            key={`n-${row}-${col}`}
            cx={cx.toFixed(1)}
            cy={cy.toFixed(1)}
            r={isHot ? 4.2 : 2.8}
            fill={isHot ? "url(#hotCell)" : "url(#coolCell)"}
            opacity={isHot ? 0.65 : 0.5}
          />
        );
      }
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
        <radialGradient id="hexMask" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
        </radialGradient>
        <mask id="hexFade">
          <rect width={width} height={height} fill="url(#hexMask)" />
        </mask>
        <radialGradient id="hotCell" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE0A8" />
          <stop offset="55%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#E5722B" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="coolCell" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C8E2BB" />
          <stop offset="60%" stopColor="#7BA86F" />
          <stop offset="100%" stopColor="#3F6B3A" stopOpacity="0" />
        </radialGradient>
        {/* Subtle "bond" curves — strands of life crossing the field */}
        <linearGradient id="strand" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(245, 166, 35, 0.32)" />
          <stop offset="100%" stopColor="rgba(125, 168, 111, 0.18)" />
        </linearGradient>
      </defs>

      {/* Sweeping organic bond curves */}
      <g mask="url(#hexFade)" fill="none" stroke="url(#strand)" strokeWidth="0.9">
        <path d={`M ${width * 0.06} ${height * 0.78} Q ${width * 0.35} ${height * 0.35}, ${width * 0.62} ${height * 0.55} T ${width * 0.96} ${height * 0.22}`} />
        <path d={`M ${width * 0.08} ${height * 0.18} Q ${width * 0.4} ${height * 0.62}, ${width * 0.7} ${height * 0.48} T ${width * 0.97} ${height * 0.78}`} opacity="0.6" />
      </g>

      <g mask="url(#hexFade)">{hexes}</g>
      <g mask="url(#hexFade)">{nuclei}</g>
      <g mask="url(#hexFade)">{vertexDots}</g>
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

      <BEEAuthBar />

      {/* Main content — visual-first, minimal copy */}
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
          gap: 44,
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
              marginTop: 24,
              fontWeight: 600,
            }}
          >
            Biodiversity Execution Engine
          </div>

          <p
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: "italic",
              fontSize: 17,
              color: "#F0D9B6",
              margin: "30px 0 0",
              letterSpacing: 0.2,
            }}
          >
            biological knowledge becomes biological action
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
              Endemic geophyte intelligence · global atlas
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
