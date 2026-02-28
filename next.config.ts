import type { NextConfig } from "next";

const buildTimestamp = new Date().toISOString();
const buildId = `build-${Date.now()}`;

const nextConfig = {
  output: 'export',  // Static export for Hostinger deployment
  trailingSlash: true,
  env: {
    BUILD_ID: buildId,
    NEXT_PUBLIC_BUILD_TIMESTAMP: buildTimestamp,
  },
  generateBuildId: async () => buildId,
  typescript: {
    ignoreBuildErrors: false,
  },

};

export default nextConfig;
