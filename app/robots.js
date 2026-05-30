export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/api/", "/embed/", "/upload-admin", "/geocon/admin"],
      },
    ],
    sitemap: "https://geocon-atlas.vercel.app/sitemap.xml",
  };
}
