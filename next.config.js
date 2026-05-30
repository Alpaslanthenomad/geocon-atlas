const { withSentryConfig } = require("@sentry/nextjs");

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

// Sentry build-time wrapper. Source maps + release tagging only kick in
// when SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT are configured.
// Without them, withSentryConfig is a near-zero-cost identity wrapper.
const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
};

module.exports = (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN)
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;
