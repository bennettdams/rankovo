import { ratingHighest, ratingLowest, reviewSources } from "@/data/static";
import {
  createRandomNumberBetween,
  pickRandomFromArray,
  pickRandomValueFromObject,
} from "@/lib/utils";
import { asc, sql } from "drizzle-orm";
import {
  criticsTable,
  placesTable,
  productsTable,
  ReviewCreateDb,
  reviewsTable,
  usersTable,
} from "./db-schema";
import { db } from "./drizzle-setup";

const numOfReviews = 1_000;

async function main() {
  console.info("########## Seeding");

  console.info("Delete all data");
  await db.delete(reviewsTable).execute();
  await db.delete(criticsTable).execute();
  await db.delete(usersTable).execute();
  await db.delete(productsTable).execute();
  await db.delete(placesTable).execute();
  // await db.execute(sql`TRUNCATE TABLE ${usersTable} RESTART IDENTITY;`);
  await db.execute(sql`ALTER SEQUENCE products_id_seq RESTART WITH 1`);
  await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`);

  await createPlaces();
  await createProducts();
  await createUsers();
  await createCritics();
  // await createReviewsSpecific();
  await createReviewsBulk();

  console.info("########## Seeding done");

  process.exit(0);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createReviewsSpecific() {
  const products = await db.select().from(productsTable).limit(1);
  const users = await db.select().from(usersTable).limit(2);

  const productId = products.at(0)?.id;
  const userId = users.at(0)?.id;
  const userId2 = users.at(1)?.id;
  if (!productId || !userId || !userId2)
    throw new Error("No product or user found");

  await db.insert(reviewsTable).values([
    {
      rating: 5,
      note: null,
      productId,
      authorId: userId,
      reviewedAt: new Date(),
    },
    {
      rating: 2,
      note: null,
      productId,
      authorId: userId2,
      reviewedAt: new Date(),
    },
    {
      rating: 2,
      note: null,
      productId,
      authorId: userId2,
      reviewedAt: new Date(),
    },
    {
      rating: 2,
      note: null,
      productId,
      authorId: userId2,
      reviewedAt: new Date(),
    },
  ]);
}

async function createReviewsBulk() {
  console.info("Create reviews");

  const products = await db.select().from(productsTable);
  const users = await db.select().from(usersTable);

  for (let index = 0; index < numOfReviews; index++) {
    if (index % (numOfReviews / 10) === 0) console.info("index: ", index);

    const product = pickRandomFromArray(products);
    const user = pickRandomFromArray(users);
    const reviewSourceUrl = pickRandomValueFromObject(reviewSources);

    const review: ReviewCreateDb = {
      rating: createRandomNumberBetween({
        min: ratingLowest,
        max: ratingHighest,
        decimalPlaces: 1,
      }),
      note: Math.random() > 0.5 ? "Some review note" : null,
      productId: product.id,
      authorId: user.id,
      reviewedAt: Math.random() > 0.1 ? new Date() : null,
      urlSource:
        Math.random() > 0.5
          ? `https://${Math.random() > 0.5 ? "www." : ""}${reviewSourceUrl}/test123`
          : null,
    };

    await db.insert(reviewsTable).values(review);
    await new Promise((resolve) => setTimeout(resolve, 3));
  }
}

async function createProducts() {
  console.info("Create products");

  const places = await db.select().from(placesTable);

  await db.insert(productsTable).values([
    {
      name: "Cheeseburger Deluxe",
      category: "burger",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Super Smash Burger",
      category: "burger",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Fried Fries",
      category: "snack",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Gemüsedöner",
      category: "kebab",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Fish & Chips",
      category: "seafood",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Ceasar Salad",
      category: "salad",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Avocado Toast",
      category: "sandwich",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Pasta Carbonara",
      category: "pasta",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Sushi Set",
      category: "sushi",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Pizza Margherita",
      category: "pizza",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Falafel Wrap",
      category: "sandwich",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Chicken Wings",
      category: "chicken",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Ice Cream",
      category: "dessert",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Margarita",
      category: "drinks",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Steak Frites",
      category: "grill & barbecue",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Chocolate Cake",
      category: "dessert",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Vegan Burger",
      category: "burger",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Pancakes",
      category: "breakfast",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
    {
      name: "Cappuccino",
      category: "drinks",
      note: Math.random() > 0.5 ? null : "Some product note",
      placeId: Math.random() > 0.8 ? null : pickRandomFromArray(places).id,
    },
  ]);
}

async function createPlaces() {
  console.info("Create places");

  await db
    .insert(placesTable)
    .values([
      { name: "Bun's", city: "Hamburg" },
      { name: "Batu Noodle Society", city: "Hamburg" },
      { name: "Goldies" },
      { name: "Guten Dag", city: "Berlin" },
      { name: "Breggs", city: "Berlin" },
      { name: "Horváth", city: "Berlin" },
      { name: "TROYKA", city: "Düsseldorf" },
      { name: "Karl Hermann's", city: "Düsseldorf" },
      { name: "Bibis Baguette", city: "Frankfurt" },
      { name: "Happy Pizza" },
      { name: "Domino's" },
      { name: "Five Guys" },
    ]);
}

async function createCritics() {
  console.info("Create critics");

  const userIdFirst = (
    await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .orderBy(asc(usersTable.id))
      .limit(1)
  ).at(0)?.id;
  if (!userIdFirst) throw new Error("No user found");

  await db.insert(criticsTable).values([
    {
      userId: userIdFirst,
      url: "https://www.youtube.com/c/Holle21614",
    },
    { userId: userIdFirst + 1, url: "https://www.instagram.com/critic2" },
    {
      userId: userIdFirst + 2,
      url: "https://www.x.com/critic3",
    },
    {
      userId: userIdFirst + 3,
      url: "https://www.youtube.com/playlist?list=PLsksxTH4pR3JcsqeJahL_3JMwPgAf1DsX",
    },
    {
      userId: userIdFirst + 4,
      url: "https://www.youtube.com/@JunkFoodGuru/videos",
    },
  ]);
}

async function createUsers() {
  console.info("Create users");

  await db
    .insert(usersTable)
    .values([
      { name: "Holle21614" },
      { name: "AbuGoku" },
      { name: "Evanijo" },
      { name: "Colin Gäbel" },
      { name: "JunkFoodGuru" },
      { name: "Bennett" },
      { name: "Rust Cohle" },
      { name: "Denis Villeneuve" },
      { name: "David Fincher" },
    ]);
}

main();
