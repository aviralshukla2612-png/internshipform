import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@recruitment/shared"],
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://localhost:4000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
