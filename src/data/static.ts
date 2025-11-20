export const categories = [
  "bread & bakery",
  "breakfast",
  "burger",
  "chicken",
  "dessert",
  "drinks",
  "grill & barbecue",
  "kebab",
  "noodles",
  "pizza",
  "salad",
  "sandwich",
  "seafood",
  "snack",
  "soup",
  "sushi",
] as const;

export type Category = (typeof categories)[number];

export const categoriesActive = [
  "burger",
  "chicken",
  "kebab",
  "pizza",
  "sandwich",
] as const satisfies Category[];

export type CategoryActive = (typeof categoriesActive)[number];

export const ratingLowest = 0;
export const ratingHighest = 10;
export const ratingMiddle = 5;

export const cacheKeys = {
  rankings: "rankings",
  reviews: "reviews",
  critics: "critics",
  products: "products",
  places: "places",
  user: (userId: string) => `user:${userId}`,
  ranking: (productId: number) => `ranking:${productId}`,
};

export const roles = ["user", "admin"] as const;
export type Role = (typeof roles)[number];
export function assertAuthRole(role: unknown): asserts role is Role {
  if (role !== "user" && role !== "admin") {
    throw new Error(
      `Invalid role: ${role}. This indicates a data integrity issue.`,
    );
  }
}

export const cities = [
  // top by population
  "Berlin",
  "Bremen",
  "Dortmund",
  "Düsseldorf",
  "Frankfurt",
  "Hamburg",
  "Köln",
  "Leipzig",
  "München",
  "Stuttgart",
  // custom
  "Hannover",
] as const;
export type City = (typeof cities)[number];

export const minCharsSearch = 3;

export const reviewSources = {
  YouTube: "youtube.com",
  Instagram: "instagram.com",
} as const;
export type ReviewSource = keyof typeof reviewSources;

// Critics
export const usernameHolle = "Holle21614";
export const usernameJFG = "JunkFoodGuru";
export const usernameFranklin = "The Franklin";
export const usernameReeze = "Reeze";
export const usernameSturmwaffel = "Sturmwaffel";
export const usernameHenryGibert = "Henry Gibert";

export const usernamesReserved = [
  "Bennett",
  usernameHolle,
  usernameJFG,
  usernameFranklin,
  usernameReeze,
  usernameSturmwaffel,
  usernameHenryGibert,
];
