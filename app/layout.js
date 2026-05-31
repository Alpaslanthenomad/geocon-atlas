import "./globals.css";
import GlobalErrorHandler from "../components/shared/GlobalErrorHandler";

export const metadata = {
  title: 'GEOCON ATLAS — Global Geophyte Intelligence Platform',
  description: 'Species intelligence, conservation scoring, and market analysis for threatened geophytic plants. Powered by Venn BioVentures.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a0d2e" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: 'var(--gx-font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)' }}>
        <GlobalErrorHandler />
        {children}
      </body>
    </html>
  )
}
