import { ratingHighest, ratingLowest, reviewSources } from "@/data/static";
import {
  createRandomNumberBetween,
  pickRandomFromArray,
  pickRandomValueFromObject,
} from "@/lib/utils";
import { asc, sql } from "drizzle-orm";
import {
  criticsTable,
  type PlaceCreateDb,
  placesTable,
  type ProductCreateDb,
  productsTable,
  type ReviewCreateDb,
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
  // await createReviewsBulk();
  await createReviewsReal();

  console.info("########## Seeding done");

  process.exit(0);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createReviewsSpecific() {
  console.log("Create reviews (specific)");

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createReviewsBulk() {
  console.info("Create reviews (bulk)");

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

async function createReviewsReal() {
  console.info("Create reviews (real)");

  async function createPlace(place: PlaceCreateDb) {
    const placeCreated = (
      await db.insert(placesTable).values(place).returning()
    ).at(0);

    if (!placeCreated) throw new Error("Place not created");

    return placeCreated;
  }

  async function createProduct(product: ProductCreateDb) {
    const productCreated = (
      await db.insert(productsTable).values(product).returning()
    ).at(0);

    if (!productCreated) throw new Error("Product not created");

    return productCreated;
  }

  async function createReview(review: ReviewCreateDb) {
    const reviewCreated = await db
      .insert(reviewsTable)
      .values(review)
      .returning();

    if (!reviewCreated) throw new Error("Review not created");

    return reviewCreated;
  }

  const userIdHolle = (
    await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(sql`${usersTable.name} = ${usernameHolle}`)
  ).at(0)?.id;
  if (!userIdHolle) throw new Error("No user found");

  const userIdJFG = (
    await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(sql`${usersTable.name} = ${usernameJFG}`)
  ).at(0)?.id;
  if (!userIdJFG) throw new Error("No user found");

  const userIdFranklin = (
    await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(sql`${usersTable.name} = ${usernameFranklin}`)
  ).at(0)?.id;
  if (!userIdFranklin) throw new Error("No user found");

  const userIdReeze = (
    await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(sql`${usersTable.name} = ${usernameReeze}`)
  ).at(0)?.id;
  if (!userIdReeze) throw new Error("No user found");

  let place;
  let product;

  place = await createPlace({
    name: "Lister Döner",
    city: "Hannover",
  });

  product = await createProduct({
    name: "Döner Hähnchen",
    category: "kebab",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-04-06"),
    rating: 8.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=NzdoZXEyXMA",
  });

  product = await createProduct({
    name: "Döner Steak",
    category: "kebab",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-04-06"),
    rating: 8.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=NzdoZXEyXMA",
  });

  // ###############

  place = await createPlace({
    name: "SISI Smashburger",
    city: "Bremen",
  });

  product = await createProduct({
    name: "SISI Original Double",
    category: "burger",
    placeId: place.id,
    note: "Smashburger",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-03-30"),
    rating: 9.2,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=kbANNGCDlrc",
  });

  // ###############

  place = await createPlace({
    name: "moodburger",
    city: "Bremen",
  });

  product = await createProduct({
    name: "Mood Double",
    category: "burger",
    placeId: place.id,
    note: "Smashburger",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-03-30"),
    rating: 9.1,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=kbANNGCDlrc",
  });

  // ###############

  place = await createPlace({
    name: "Hendl & Glut",
    city: "Hannover",
  });

  product = await createProduct({
    name: "Backhendl",
    category: "chicken",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-03-27"),
    rating: 9.0,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=ALxNKz10FYE",
  });

  // ###############

  place = await createPlace({
    name: "Wagner",
    city: null,
  });

  product = await createProduct({
    name: "Bella Napoli Diavola",
    category: "pizza",
    placeId: place.id,
    note: "Tiefkühlpizza",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-03-06"),
    rating: 7.9,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=oMBDFoujUAI",
  });

  // ###############

  place = await createPlace({
    name: "Roberto di Frosty",
    city: null,
  });

  product = await createProduct({
    name: "Spicy Diavola",
    category: "pizza",
    placeId: place.id,
    note: "Tiefkühlpizza",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-03-06"),
    rating: 8.3,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=oMBDFoujUAI",
  });

  // ###############

  place = await createPlace({
    name: "Guller BBQ",
    city: "Stuttgart",
  });

  product = await createProduct({
    name: "Pulled Pork",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-02-20"),
    rating: 9.0,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=Gq1sJQ7GhYQ",
  });

  product = await createProduct({
    name: "BBQ Tablett",
    category: "grill & barbecue",
    placeId: place.id,
    note: "Platte mit verschiedenen BBQ-Gerichten",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-02-20"),
    rating: 9.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=Gq1sJQ7GhYQ",
  });

  // ###############

  place = await createPlace({
    name: "Saman",
    city: "Köln",
  });

  product = await createProduct({
    name: "Döner Kalb",
    category: "kebab",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-02-02"),
    rating: 8.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=6_v5KupeVkc",
  });

  // ###############

  place = await createPlace({
    name: "Gyros Manufaktur Pepe",
    city: "Düsseldorf",
  });

  product = await createProduct({
    name: "Gyros Teller",
    category: "grill & barbecue",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: "Spät am Abend, daher trockener",
    reviewedAt: new Date("2025-01-30"),
    rating: 9.0,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=Pu53kG01t6w",
  });

  // ###############

  place = await createPlace({
    name: "Magnum",
    city: null,
  });

  product = await createProduct({
    name: "Utopia Double Hazelnut",
    category: "dessert",
    placeId: place.id,
    note: "Becher",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-03-01"),
    rating: 9.0,
    authorId: userIdJFG,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=P0OTbI4G0Ng",
  });

  // ###############

  place = await createPlace({
    name: "McDonald's",
    city: null,
  });

  product = await createProduct({
    name: "McCrispy Curry",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-02-21"),
    rating: 8.0,
    authorId: userIdJFG,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=iWirHCdJ5xc",
  });

  // ###############

  place = await createPlace({
    name: "Kinder",
    city: null,
  });

  product = await createProduct({
    name: "Milchschnitte Blaubeere",
    category: "snack",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-01-25"),
    rating: 9.0,
    authorId: userIdJFG,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=06n7aqdrvC8",
  });

  // ###############

  place = await createPlace({
    name: "ROB's",
    city: null,
  });

  product = await createProduct({
    name: "Crunchy Puffs Churro",
    category: "snack",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-12-13"),
    rating: 9.0,
    authorId: userIdJFG,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=4Qu1PK2TVM0",
  });

  // ###############

  place = await createPlace({
    name: "funny-frisch",
    city: null,
  });

  product = await createProduct({
    name: "Chitos Parika",
    category: "snack",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-12-02"),
    rating: 9.0,
    authorId: userIdJFG,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=FidH4rz1LnI",
  });

  product = await createProduct({
    name: "Chitos Chili Cheese",
    category: "snack",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-12-02"),
    rating: 8.0,
    authorId: userIdJFG,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=FidH4rz1LnI",
  });

  // ###############

  place = await createPlace({
    name: "Melrose by Fairfax Express",
    city: "München",
  });

  product = await createProduct({
    name: "MVP Turkey Sandwich",
    category: "sandwich",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-03-16"),
    rating: 8.5,
    authorId: userIdFranklin,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=CXIj_-CpO_0",
  });

  product = await createProduct({
    name: "Shrimp Roll",
    category: "sandwich",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-03-16"),
    rating: 7.0,
    authorId: userIdFranklin,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=CXIj_-CpO_0",
  });

  // ###############

  place = await createPlace({
    name: "BioDöner by MonsterFit",
    city: "Frankfurt",
  });

  product = await createProduct({
    name: "Bio Döner Steak",
    category: "kebab",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-01-26"),
    rating: 8.7,
    authorId: userIdFranklin,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=rsDen44Awi8",
  });

  // ###############

  place = await createPlace({
    name: "Honest Kebab",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Döner (Signature Brot)",
    category: "kebab",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-04-09"),
    rating: 9.5,
    authorId: userIdReeze,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=r5PUjsrvSlk",
  });

  product = await createProduct({
    name: "Döner (Sylter Fladenbrot)",
    category: "kebab",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-04-09"),
    rating: 9.75,
    authorId: userIdReeze,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=r5PUjsrvSlk",
  });

  // ###############

  place = await createPlace({
    name: "Dr. Smusy",
    city: "Köln",
  });

  product = await createProduct({
    name: "The Signature smoothie",
    category: "drinks",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-07-01"),
    rating: 7.0,
    authorId: userIdReeze,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=hkc72K60o48",
  });

  product = await createProduct({
    name: "Post Workout smoothie",
    category: "drinks",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-07-01"),
    rating: 9.0,
    authorId: userIdReeze,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=hkc72K60o48",
  });

  product = await createProduct({
    name: "Superbrain smoothie",
    category: "drinks",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-07-01"),
    rating: 6.5,
    authorId: userIdReeze,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=hkc72K60o48",
  });

  product = await createProduct({
    name: "Bring me down smoothie",
    category: "drinks",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-07-01"),
    rating: 6.5,
    authorId: userIdReeze,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=hkc72K60o48",
  });
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
      userId: userIdFirst + 1,
      url: "https://www.youtube.com/c/Holle21614",
    },
    { userId: userIdFirst + 2, url: "https://www.youtube.com/c/JunkFoodGuru" },
    {
      userId: userIdFirst + 3,
      url: "https://www.youtube.com/playlist?list=PLsksxTH4pR3JcsqeJahL_3JMwPgAf1DsX",
    },
    {
      userId: userIdFirst + 4,
      url: "https://www.youtube.com/@the.franklin",
    },
    {
      userId: userIdFirst + 5,
      url: "https://www.youtube.com/@Reeze",
    },
  ]);
}

const usernameHolle = "Holle21614";
const usernameJFG = "JunkFoodGuru";
const usernameFranklin = "The Franklin";
const usernameReeze = "Reeze";

async function createUsers() {
  console.info("Create users");

  await db
    .insert(usersTable)
    .values([
      { name: "Bennett" },
      { name: usernameHolle },
      { name: usernameJFG },
      { name: "Colin Gäbel" },
      { name: usernameFranklin },
      { name: usernameReeze },
      { name: "Rust Cohle" },
      { name: "Denis Villeneuve" },
      { name: "David Fincher" },
    ]);
}

//reeeze, sturmwaffel

main();
