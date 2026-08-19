export const routes = {
  home: "/",
  admin: "/admin",
  rankings: "/",
  reviews: "/reviews",
  reviewCreate: "/review/create",
  user: (userId: string) => `/user/${userId}`,
  aboutUs: "/about-us",
  champions: "/champions",
} as const;
