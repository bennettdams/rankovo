import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
  experimental: {
    ppr: true,
    cacheComponents: true,
    authInterrupts: true,
  },
};

export default nextConfig;
