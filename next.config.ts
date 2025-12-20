import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useCache: true,
    serverActions: {
      bodySizeLimit: "999mb",
    },
  },
};

export default nextConfig;
