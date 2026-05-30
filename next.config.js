/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled because react-globe.gl creates a Three.js WebGL canvas context
  // on mount, and Strict Mode's double-mount in dev triggers a "Canvas has
  // an existing context of a different type" error on the second mount.
  // Production builds don't double-mount, so this only affects dev.
  reactStrictMode: false,

  // Cache + optimize external species thumbnails (iNaturalist, GBIF,
  // Wikipedia). next/image needs an explicit allow list.
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24, // 24h
    remotePatterns: [
      { protocol: "https", hostname: "inaturalist-open-data.s3.amazonaws.com" },
      { protocol: "https", hostname: "static.inaturalist.org" },
      { protocol: "https", hostname: "api.gbif.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
    ],
    deviceSizes: [320, 480, 640, 800, 1080, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
module.exports = nextConfig;
