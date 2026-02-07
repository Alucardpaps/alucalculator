import type { NextConfig } from "next";

const getBuildId = () => {
  if (process.env.GIT_HASH) {
    return process.env.GIT_HASH;
  }
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse HEAD').toString().trim();
  } catch (e) {
    return `build-${Date.now()}`;
  }
};

const buildId = getBuildId();

const nextConfig: NextConfig = {
  output: 'export',  // Static export for Hostinger deployment
  trailingSlash: true,
  skipMiddlewareUrlNormalize: true,
  env: {
    BUILD_ID: buildId,
  },
  generateBuildId: async () => buildId,
  /* config options here */
};

export default nextConfig;

