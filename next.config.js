// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Waiting for usePathname to be type-safe: https://github.com/vercel/next.js/issues/83092
  typedRoutes: false,
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

module.exports = nextConfig;
