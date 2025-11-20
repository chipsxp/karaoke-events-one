
import type { NextConfig } from 'next'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  experimental: {
    typedEnv: true,
  },
  reactStrictMode: true,
  // Allow cross-origin requests from WSL/Docker/network IPs during development
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://localhost',
    'http://127.0.0.1:3000',
    'http://127.0.0.1',
  ],
};

module.exports = nextConfig;
