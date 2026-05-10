import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Production-ready configuration */

  // Optimize performance
  compress: true,
  poweredByHeader: false, // Remove X-Powered-By for security

  // Image optimization
  images: {
    unoptimized: true, // Required for serverless
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
      {
        source: "/api/health",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/api/egx-stocks",
        headers: [
          { key: "Cache-Control", value: "public, max-age=900" }, // 15 minutes
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/health",
        destination: "/api/health",
        permanent: false,
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Enable strict mode
  reactStrictMode: true,

  // Turbopack configuration for Next.js 16
  turbopack: {},
};

export default nextConfig;


