import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // --- Standalone Output for Docker Production Builds ---
  output: "standalone",

  // --- Allowed Dev Origins for Network Development ---
  allowedDevOrigins: ["192.168.0.106", "localhost", "192.168.0.106:3000", "localhost:3000"],

  // --- Security Headers ---
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(self), geolocation=(self), payment=()",
          },
        ],
      },
    ];
  },

  // --- Image Optimization ---
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tile.openstreetmap.org",
      },
    ],
  },

  // --- Environment ---
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  },
};

export default nextConfig;
