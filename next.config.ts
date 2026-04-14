import type { NextConfig } from "next";

const buildTimestamp = new Date().toISOString();
const buildId = `build-${Date.now()}`;

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  env: {
    BUILD_ID: buildId,
    NEXT_PUBLIC_BUILD_TIMESTAMP: buildTimestamp,
  },
  generateBuildId: async () => buildId,
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: require.resolve('path-browserify'),
        url: require.resolve('url'),
        module: false,
        'a': false,
      };
    }
    return config;
  },
};


export default nextConfig;
