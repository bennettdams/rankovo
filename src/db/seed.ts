import { ratingHighest, ratingLowest } from "@/data/static";
import { createRandomNumberBetween, pickRandomFromArray } from "@/lib/utils";
import {
  placesTable,
  productsTable,
  ReviewCreate,
  reviewsTable,
} from "./db-schema";
import { db } from "./drizzle-setup";

const numOfReviews = 10_000;

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

  for (let index = 0; index < numOfReviews; index++) {
    if (index % 1000 === 0) console.log("index: ", index);

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
    };

    await db.insert(reviewsTable).values(review);
  }
}

async function createProducts() {
  console.log("Create products");

  const places = await db.select().from(placesTable);

  await db.insert(productsTable).values([
    {
      name: "Cheeseburger Deluxe",
      category: "burger",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.5 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Fried Fries",
      category: "snack",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.5 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Gemüsedöner",
      category: "kebab",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.5 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Fish & Chips",
      category: "seafood",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.5 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Ceasar Salad",
      category: "salad",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.5 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Avocado Toast",
      category: "sandwich",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.5 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Pasta Carbonara",
      category: "pasta",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.5 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Sushi Set",
      category: "sushi",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.5 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Pizza Margherita",
      category: "pizza",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.5 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Falafel Wrap",
      category: "sandwich",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.5 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Chicken Wings",
      category: "chicken",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.5 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Ice Cream",
      category: "dessert",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.5 ? null : pickRandomFromArray(places).id,
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
