import { randomUUID } from "crypto";
import type { Category } from "./static";

export type Ranking = {
  id: string;
  restaurantName: string;
  rating: number;
  productId: string;
  productName: string;
  productNote: string;
  productCategory: Category;
  reviews: Review[];
  numOfReviews: number;
  lastReviewedAt: Date;
};

type Product = {
  id: string;
  name: string;
  note: string;
  category: Category;
  restaurant: Restaurant;
};

type Review = {
  id: string;
  rating: number;
  product: Product;
  reviewedAt: Date;
  note: string;
};

type Restaurant = {
  id: string;
  name: string;
};

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

const restaurants: Restaurant[] = restaurantNames.map((name, index) => ({
  id: (index + 1).toString(),
  name,
}));

const products: Product[] = [
  {
    id: "1",
    name: "Cheeseburger Deluxe",
    category: "burger",
    note: "Some product note",
    restaurant: pickRandomFromArray(restaurants),
  },
  {
    id: "2",
    name: "Fried Fries",
    category: "snack",
    note: "Some product note",
    restaurant: pickRandomFromArray(restaurants),
  },
  {
    id: "3",
    name: "Gemüsedöner",
    category: "kebab",
    note: "Some product note",
    restaurant: pickRandomFromArray(restaurants),
  },
  {
    id: "4",
    name: "Fish & Chips",
    category: "seafood",
    note: "Some product note",
    restaurant: pickRandomFromArray(restaurants),
  },
  {
    id: "5",
    name: "Ceasar Salad",
    category: "salad",
    note: "Some product note",
    restaurant: pickRandomFromArray(restaurants),
  },
  {
    id: "6",
    name: "Avocado Toast",
    category: "sandwich",
    note: "Some product note",
    restaurant: pickRandomFromArray(restaurants),
  },
  {
    id: "7",
    name: "Pasta Carbonara",
    category: "pasta",
    note: "Some product note",
    restaurant: pickRandomFromArray(restaurants),
  },
  {
    id: "8",
    name: "Sushi Set",
    category: "sushi",
    note: "Some product note",
    restaurant: pickRandomFromArray(restaurants),
  },
  {
    id: "9",
    name: "Pizza Margherita",
    category: "pizza",
    note: "Some product note",
    restaurant: pickRandomFromArray(restaurants),
  },
  {
    id: "10",
    name: "Falafel Wrap",
    category: "sandwich",
    note: "Some product note",
    restaurant: pickRandomFromArray(restaurants),
  },
  {
    id: "11",
    name: "Chicken Wings",
    category: "chicken",
    note: "Some product note",
    restaurant: pickRandomFromArray(restaurants),
  },
  {
    id: "12",
    name: "Ice Cream",
    category: "dessert",
    note: "Some product note",
    restaurant: pickRandomFromArray(restaurants),
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
  const entry = array[Math.floor(Math.random() * array.length)];
  if (!entry) throw new Error("No random element found");
  return entry;
}

function createMockRankings(reviews: Review[]): Ranking[] {
  const rankingsMap = new Map<Ranking["productId"], Ranking>();

  reviews.forEach((review) => {
    const ranking = rankingsMap.get(review.product.id);
    if (ranking) {
      // We recalculate the rating for every iteration. It should be checked whether just summing up and calculating the
      // average later is more efficient (as it would probably need more object creation).
      ranking.rating =
        Math.round(
          ((ranking.rating * ranking.numOfReviews + review.rating) /
            (ranking.numOfReviews + 1)) *
            100,
        ) / 100;
      ranking.numOfReviews++;
      ranking.reviews.push(review);
    } else {
      rankingsMap.set(review.product.id, {
        id: randomUUID(),
        restaurantName: review.product.restaurant.name,
        rating: review.rating,
        productId: review.product.id,
        productName: review.product.name,
        productNote: review.note,
        productCategory: review.product.category,
        numOfReviews: 1,
        lastReviewedAt: review.reviewedAt,
        reviews: [review],
      });
    }
  });

  return Array.from(rankingsMap.values());
}

function createMockReviews(): Review[] {
  return Array(100)
    .fill(null)
    .map((_, index) => {
      const product = pickRandomFromArray(products);

      const review: Review = {
        id: (index + 1).toString(),
        rating: createRandomNumberBetween({
          min: 0,
          max: 5,
          decimalPlaces: 1,
        }),
        product,
        reviewedAt: new Date(),
        note: "Some review note",
      };

      return review;
    });
}

export const rankings = createMockRankings(createMockReviews());
