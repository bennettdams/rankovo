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

const productNames: string[] = [
  "Cheeseburger Deluxe",
  "Fries",
  "Soda",
  "Salad",
  "Ice Cream",
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

function pickRandomFromArray<T>(array: T[]): T {
  const res = array[Math.floor(Math.random() * array.length)];
  if (!res) throw new Error("No random element found");
  return res;
}

export type Ranking = {
  id: string;
  restaurantName: string;
  rating: number;
  product: string;
  reviewedAt: Date;
  note: string;
};

export function createRankings(): Ranking[] {
  return restaurantNames.map((restaurantName, index) => ({
    id: (index + 1).toString(),
    restaurantName,
    rating: createRandomNumberBetween({ min: 0, max: 10, decimalPlaces: 1 }),
    product: pickRandomFromArray(productNames),
    note: "Delicious",
    reviewedAt: new Date(),
  }));
}
