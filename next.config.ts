import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://172.29.30.80:3000',
  ],
  eslint: {
    // Allow production builds with warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds with type warnings  
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
