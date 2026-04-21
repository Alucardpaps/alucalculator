import type { NextConfig } from "next";

const buildTimestamp = new Date().toISOString();
const buildId = `build-${Date.now()}`;

const nextConfig: NextConfig = {
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
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'three', '@react-three/fiber', '@react-three/drei'],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // To use webpack config in Next.js 16/Turbopack, we explicitly declare turbopack empty or use --webpack
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
