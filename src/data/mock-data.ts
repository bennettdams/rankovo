import type { Category } from "./static";

const restaurantNames: string[] = [
  "Thyme & Again",
  "Fork & Dagger",
  "The Daily Grind",
  "Searious Eats",
  "Pour Decisions",
  "Basil & Barrel",
  "Chop House Rules",
  "The Roasted Palette",
  "Cask & Cleaver",
  "Ember & Oak",
];

const products: { name: string; category: Category }[] = [
  {
    name: "Cheeseburger Deluxe",
    category: "burger",
  },
  {
    name: "Fried Fries",
    category: "side dish",
  },
  {
    name: "Fish & Chips",
    category: "fish",
  },
  {
    name: "Ceasar Salad",
    category: "salad",
  },
];

function createRandomNumberBetween({
  min,
  max,
  decimalPlaces = 0,
}: {
  min: number;
  max: number;
  decimalPlaces?: number;
}): number {
  const res = Math.random() * (max - min) + min;
  if (decimalPlaces === 0) {
    return res;
  } else {
    const multiplier = decimalPlaces * 10;
    return Math.round(res * multiplier) / multiplier;
  }
}

function pickRandomFromArray<T>(array: T[] | Readonly<T[]>): T {
  const res = array[Math.floor(Math.random() * array.length)];
  if (!res) throw new Error("No random element found");
  return res;
}

export type Ranking = {
  id: string;
  restaurantName: string;
  rating: number;
  product: string;
  catgory: Category;
  reviewedAt: Date;
  note: string;
};

export function createRankings(): Ranking[] {
  return restaurantNames.map((restaurantName, index) => {
    const product = pickRandomFromArray(products);
    return {
      id: (index + 1).toString(),
      restaurantName,
      rating: createRandomNumberBetween({ min: 0, max: 5, decimalPlaces: 1 }),
      product: product.name,
      catgory: product.category,
      note: "Delicious",
      reviewedAt: new Date(),
    };
  });
}
