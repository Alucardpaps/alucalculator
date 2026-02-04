import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // Static export for Hostinger deployment
  trailingSlash: true,
  skipMiddlewareUrlNormalize: true,
  /* config options here */
};

export default nextConfig;

