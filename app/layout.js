import "./globals.css";
import GlobalErrorHandler from "../components/shared/GlobalErrorHandler";

export const metadata = {
  title: 'GEOCON ATLAS — Global Geophyte Intelligence Platform',
  description: 'Species intelligence, conservation scoring, and market analysis for threatened geophytic plants. Powered by Venn BioVentures.',
}

// Inline early-init script. Runs synchronously in <head> BEFORE any
// React component mounts, so it catches rejection/error events that
// happen during hydration or before our GlobalErrorHandler effect
// gets a chance to attach its listeners.
//
// Specifically suppresses:
//   - "ResizeObserver loop limit exceeded" and getBoundingClientRect
//     null reads from 3rd-party widgets (Vercel Feedback, etc.)
//   - Generic unhandled promise rejections from useEffect IIFEs
//
// Logs everything to the console so debugging stays possible.
const earlyHandlers = `
(function(){
  if (typeof window === "undefined") return;
  var resizeRe = /ResizeObserver|getBoundingClientRect/i;
  function onErr(e){
    try {
      var msg = (e && (e.message || (e.error && e.error.message))) || "";
      if (resizeRe.test(msg)) {
        e.stopImmediatePropagation && e.stopImmediatePropagation();
        e.preventDefault && e.preventDefault();
        return;
      }
      if (e.error || e.message) console.warn("[early window.error]", msg);
    } catch(_){}
  }
  function onRej(e){
    try {
      var r = e && e.reason;
      var msg = (r && r.message) || String(r || "");
      if (resizeRe.test(msg)) {
        e.preventDefault && e.preventDefault();
        return;
      }
      console.warn("[early unhandledrejection]", msg);
      e.preventDefault && e.preventDefault();
    } catch(_){}
  }
  window.addEventListener("error", onErr, true);
  window.addEventListener("unhandledrejection", onRej);
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a0d2e" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Typography — Crimson Pro for display/serif, Inter for body */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: earlyHandlers }} />
      </head>
      <body style={{ margin: 0, fontFamily: 'var(--gx-font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)' }}>
        <GlobalErrorHandler />
        {children}
      </body>
    </html>
  )
}
