import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.10.212",
    "192.168.20.53",
  ],
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }

    const destinationBase = (
      process.env.INTERNAL_API_URL || "http://127.0.0.1:5000/api/v1"
    ).replace(/\/+$/, "");

    return [
      {
        source: "/api/v1/:path*",
        destination: `${destinationBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
