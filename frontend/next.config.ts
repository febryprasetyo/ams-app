import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.10.212",
  ],
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:5000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
