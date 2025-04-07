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
  "pasta",
  "pizza",
  "salad",
  "sandwich",
  "seafood",
  "snack",
  "soup",
  "sushi",
] as const;

export type Category = (typeof categories)[number];

export const ratingLowest = 0;
export const ratingHighest = 5;

export const cacheKeys = {
  rankings: "rankings",
  reviews: "reviews",
  critics: "critics",
  products: "products",
  places: "places",
};

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
