import { ratingHighest, ratingLowest } from "@/data/static";
import { createRandomNumberBetween, pickRandomFromArray } from "@/lib/utils";
import {
  placesTable,
  productsTable,
  ReviewCreate,
  reviewsTable,
} from "./db-schema";
import { db } from "./drizzle-setup";

async function main() {
  console.log("########## Seeding");

  console.log("Delete all data");
  await db.delete(reviewsTable).execute();
  await db.delete(productsTable).execute();
  await db.delete(placesTable).execute();

  await createPlaces();
  await createProducts();
  await createReviews();

  console.log("########## Seeding done");
}

async function createReviews() {
  console.log("Create reviews");

  const products = await db.select().from(productsTable);

  const reviewsMock = Array(100)
    .fill(null)
    .map(() => {
      const product = pickRandomFromArray(products);

      const review: ReviewCreate = {
        rating: createRandomNumberBetween({
          min: ratingLowest,
          max: ratingHighest,
          decimalPlaces: 1,
        }),
        note: Math.random() > 0.5 ? "Some review note" : null,
        productId: product.id,
        reviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: null,
      };

      return review;
    });

  await db.insert(reviewsTable).values(reviewsMock);
}

async function createProducts() {
  console.log("Create products");

  const places = await db.select().from(placesTable);

  await db.insert(productsTable).values([
    {
      name: "Cheeseburger Deluxe",
      category: "burger",
      note: Math.random() > 0.5 ? "Some product note" : null,
      placeId: pickRandomFromArray(places).id,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      name: "Fried Fries",
      category: "snack",
      note: Math.random() > 0.5 ? "Some product note" : null,
      placeId: pickRandomFromArray(places).id,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      name: "Gemüsedöner",
      category: "kebab",
      note: Math.random() > 0.5 ? "Some product note" : null,
      placeId: pickRandomFromArray(places).id,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      name: "Fish & Chips",
      category: "seafood",
      note: Math.random() > 0.5 ? "Some product note" : null,
      placeId: pickRandomFromArray(places).id,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      name: "Ceasar Salad",
      category: "salad",
      note: Math.random() > 0.5 ? "Some product note" : null,
      placeId: pickRandomFromArray(places).id,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      name: "Avocado Toast",
      category: "sandwich",
      note: Math.random() > 0.5 ? "Some product note" : null,
      placeId: pickRandomFromArray(places).id,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      name: "Pasta Carbonara",
      category: "pasta",
      note: Math.random() > 0.5 ? "Some product note" : null,
      placeId: pickRandomFromArray(places).id,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      name: "Sushi Set",
      category: "sushi",
      note: Math.random() > 0.5 ? "Some product note" : null,
      placeId: pickRandomFromArray(places).id,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      name: "Pizza Margherita",
      category: "pizza",
      note: Math.random() > 0.5 ? "Some product note" : null,
      placeId: pickRandomFromArray(places).id,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      name: "Falafel Wrap",
      category: "sandwich",
      note: Math.random() > 0.5 ? "Some product note" : null,
      placeId: pickRandomFromArray(places).id,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      name: "Chicken Wings",
      category: "chicken",
      note: Math.random() > 0.5 ? "Some product note" : null,
      placeId: pickRandomFromArray(places).id,
      createdAt: new Date(),
      updatedAt: null,
    },
    {
      name: "Ice Cream",
      category: "dessert",
      note: Math.random() > 0.5 ? "Some product note" : null,
      placeId: pickRandomFromArray(places).id,
      createdAt: new Date(),
      updatedAt: null,
    },
  ]);
}

async function createPlaces() {
  console.log("Create places");

  await db
    .insert(placesTable)
    .values(
      [
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
      ].map((name) => ({ name })),
    );
}

main();
