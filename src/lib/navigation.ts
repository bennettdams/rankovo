export const routes = {
  home: "/",
  rankings: "/",
  reviews: "/reviews",
  reviewCreate: "/review/create",
  user: (userId: string) => `/user/${userId}`,
  contact: "/contact",
} as const;
