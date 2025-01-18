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

export const dataKeys = {
  rankings: "rankings",
  reviews: "reviews",
  critics: "critics",
};
