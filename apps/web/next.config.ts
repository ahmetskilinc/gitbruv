import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true,
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
