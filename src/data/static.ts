export const categories = [
  "kebab",
  "pizza",
  "burger",
  "sushi",
  "pasta",
  "salad",
  "soup",
  "sandwich",
  "fried chicken",
  "steak",
  "side dish",
  "fish",
] as const;

export type Category = (typeof categories)[number];
