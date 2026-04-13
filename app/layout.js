export const metadata = {
  title: 'GEOCON ATLAS — Global Geophyte Intelligence Platform',
  description: 'Species intelligence, conservation scoring, and market analysis for threatened geophytic plants. Powered by Venn BioVentures.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#f8f7f4' }}>
        {children}
      </body>
    </html>
  )
}
