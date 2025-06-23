import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
  experimental: {
    dynamicIO: true,
    ppr: true,
    authInterrupts: true,
  },
};

export default nextConfig;
