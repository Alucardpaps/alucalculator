import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Stable IDs in dev avoid spurious HMR invalidation from config reloads.
const buildTimestamp = isDev ? "dev" : new Date().toISOString();
const buildId = isDev ? "dev-local" : `build-${Date.now()}`;

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  env: {
    BUILD_ID: buildId,
    NEXT_PUBLIC_BUILD_ID: buildId,
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
  webpack: (config: any, { isServer, dev }: { isServer: boolean; dev: boolean }) => {
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
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.next/**',
          '**/node_modules/**',
          '**/scripts/**',
          '**/data/reference_books/**',
          '**/.next_old_*/**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
