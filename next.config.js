/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled because react-globe.gl creates a Three.js WebGL canvas context
  // on mount, and Strict Mode's double-mount in dev triggers a "Canvas has
  // an existing context of a different type" error on the second mount.
  // Production builds don't double-mount, so this only affects dev.
  reactStrictMode: false,
};
module.exports = nextConfig;
