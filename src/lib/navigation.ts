export const routes = {
  home: "/",
  rankings: "/",
  reviews: "/reviews",
  reviewCreate: "/review/create",
  user: (userId: string) => `/user/${userId}`,
  aboutUs: "/about-us",
} as const;
