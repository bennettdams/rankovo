import {
  ratingHighest,
  ratingLowest,
  reviewSources,
  usernameFranklin,
  usernameHenryGibert,
  usernameHolle,
  usernameJFG,
  usernameReeze,
  usernameSturmwaffel,
} from "@/data/static";
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
  type UserCreate,
  usersTable,
} from "./db-schema";
import { db } from "./drizzle-setup";

const numOfReviews = 10_000;

type Mode = "real" | "bulk" | "specific";
const mode: Mode = "real";
// const mode: Mode = "specific";
// const mode: Mode = "bulk";

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
  // await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`);

  await createUsers();
  await createCritics();

  if (mode === "real") {
    await createReviewsReal();
  } else {
    await createPlaces();
    await createProducts();

    if (mode === "bulk") await createReviewsBulk();
    if (mode === "specific") await createReviewsSpecific();
  }

  console.info("########## Seeding done");

  process.exit(0);
}

async function createReviewsSpecific() {
  console.info("Create reviews (specific)");

  const products = await db.select().from(productsTable).limit(2);
  const users = await db.select().from(usersTable).limit(3);

  const productId = products.at(0)?.id;
  const productId2 = products.at(1)?.id;
  const userId = users.at(0)?.id;
  const userId2 = users.at(1)?.id;
  const userId3 = users.at(2)?.id;
  if (!productId || !productId2 || !userId || !userId2 || !userId3)
    throw new Error("No product or user found");

  // 3 reviews
  await db.insert(reviewsTable).values([
    {
      rating: 6,
      note: null,
      productId,
      authorId: userId,
      reviewedAt: new Date(),
      isCurrent: true,
    },
    {
      rating: 2,
      note: null,
      productId,
      authorId: userId2,
      reviewedAt: new Date(),
      isCurrent: true,
    },
    {
      rating: 4,
      note: null,
      productId,
      authorId: userId3,
      reviewedAt: new Date(),
      isCurrent: true,
    },
  ]);

  // 2 reviews (via isCurrent)
  await db.insert(reviewsTable).values([
    {
      rating: 6,
      note: null,
      productId: productId2,
      authorId: userId,
      reviewedAt: new Date(),
      isCurrent: true,
    },
    {
      rating: 2,
      note: null,
      productId: productId2,
      authorId: userId2,
      reviewedAt: new Date(),
    },
    {
      rating: 2,
      note: null,
      productId: productId2,
      authorId: userId2,
      reviewedAt: new Date(),
    },
    {
      rating: 3,
      note: null,
      productId: productId2,
      authorId: userId2,
      reviewedAt: new Date(),
      isCurrent: true,
    },
  ]);
}

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
      reviewedAt: new Date(),
      isCurrent: true,
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

  async function createReview(review: Omit<ReviewCreateDb, "isCurrent">) {
    const reviewCreated = await db
      .insert(reviewsTable)
      .values({ ...review, isCurrent: true })
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

  const userIdSturmi = (
    await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(sql`${usersTable.name} = ${usernameSturmwaffel}`)
  ).at(0)?.id;
  if (!userIdSturmi) throw new Error("No user found");

  const userIdHenry = (
    await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(sql`${usersTable.name} = ${usernameHenryGibert}`)
  ).at(0)?.id;
  if (!userIdHenry) throw new Error("No user found");

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
  const placeMcDonId = place.id;

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
  const placeIdRobs = place.id;

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

  // ###############

  place = await createPlace({
    name: "Chingu Westfield",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Korean Chicken Burger",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-04-10"),
    rating: 8.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=NKGoLFV63EQ",
  });

  // ###############

  product = await createProduct({
    name: "McWrap Chicken Mango-Curry",
    category: "sandwich",
    placeId: placeMcDonId,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-04-18"),
    rating: 8.0,
    authorId: userIdJFG,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=ZBAufZypGWI",
  });

  // ###############

  place = await createPlace({
    name: "Pastalich",
    city: "Hannover",
  });

  product = await createProduct({
    name: "Genoveser Pesto",
    category: "noodles",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-04-17"),
    rating: 9.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=Tkg34gBb2DI",
  });

  product = await createProduct({
    name: "Trüffel-Crème",
    category: "noodles",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-04-17"),
    rating: 9.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=Tkg34gBb2DI",
  });

  // ###############

  place = await createPlace({
    name: "JOKOLADE",
    city: null,
  });

  product = await createProduct({
    name: "JOKOLADE Peanuts süß",
    category: "snack",
    placeId: place.id,
    note: "Beutel",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-04-27"),
    rating: 8.0,
    authorId: userIdSturmi,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=q0DCeo9agg8",
  });

  product = await createProduct({
    name: "JOKOLADE Peanuts salzig",
    category: "snack",
    placeId: place.id,
    note: "Beutel",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-04-27"),
    rating: 9.0,
    authorId: userIdSturmi,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=q0DCeo9agg8",
  });

  // ###############

  place = await createPlace({
    name: "Burgermeister",
    city: null,
  });

  product = await createProduct({
    name: "Cheeseburger",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: "Hannover",
    reviewedAt: new Date("2025-04-24"),
    rating: 7.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=1bgfegIOSXU",
  });

  product = await createProduct({
    name: "Fleischermeister",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: "Hannover",
    reviewedAt: new Date("2025-04-24"),
    rating: 8.2,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=1bgfegIOSXU",
  });

  product = await createProduct({
    name: "Meister aller Klassen",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: "Hannover",
    reviewedAt: new Date("2025-04-24"),
    rating: 8.2,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=1bgfegIOSXU",
  });

  // ###############

  place = await createPlace({
    name: "BETR Burger",
    city: "Hamburg",
  });
  const placeIdBETR = place.id;

  product = await createProduct({
    name: "BETR Chicken",
    category: "burger",
    placeId: place.id,
    note: "vegan",
  });
  const productIdBETRChicken = product.id;

  await createReview({
    note: null,
    reviewedAt: new Date("2025-05-04"),
    rating: 8.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=pI3r4yChWZE",
  });

  product = await createProduct({
    name: "BETR Wasabi",
    category: "burger",
    placeId: place.id,
    note: "vegan",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-05-04"),
    rating: 8.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=pI3r4yChWZE",
  });

  product = await createProduct({
    name: "Nuggets",
    category: "snack",
    placeId: place.id,
    note: "vegan",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-05-04"),
    rating: 8.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=pI3r4yChWZE",
  });

  product = await createProduct({
    name: "BETR Mac",
    category: "burger",
    placeId: place.id,
    note: "vegan",
  });
  const productIdBETRMac = product.id;

  await createReview({
    note: null,
    reviewedAt: new Date("2025-05-04"),
    rating: 7.0,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=pI3r4yChWZE",
  });

  // ###############

  place = await createPlace({
    name: "HOB's Hut of Burger",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Hot Chilli Burger",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-06-11"),
    rating: 9.2,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=PTVnMI3A2eE",
  });

  product = await createProduct({
    name: "BBQ Burger",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-06-11"),
    rating: 9.1,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=PTVnMI3A2eE",
  });

  product = await createProduct({
    name: "Smash Cheeseburger",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-06-11"),
    rating: 8.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=PTVnMI3A2eE",
  });

  product = await createProduct({
    name: "Italian Club",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2023-07-09"),
    rating: 9.2,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=zk1sv_OUpj0",
  });

  // ###############

  place = await createPlace({
    name: "köfte23",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Elazig Köfte",
    category: "sandwich",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-05-15"),
    rating: 8.0,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=SvM-qNh1EJI",
  });

  // ###############

  place = await createPlace({
    name: "Soulkebab",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Döner Kalb",
    category: "kebab",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-05-15"),
    rating: 7.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=SvM-qNh1EJI",
  });

  product = await createProduct({
    name: "Dönerteller Kalb",
    category: "grill & barbecue",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-05-15"),
    rating: 7.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=SvM-qNh1EJI",
  });

  // ###############

  product = await createProduct({
    name: "BETR Cheeze",
    category: "burger",
    placeId: placeIdBETR,
    note: null,
  });
  const productIdBETRCheeze = product.id;

  await createReview({
    note: null,
    reviewedAt: new Date("2025-05-12"),
    rating: 7.7,
    authorId: userIdHenry,
    productId: product.id,
    urlSource: "https://www.youtube.com/shorts/X5A0b7fG2KE",
  });

  // ###############

  place = await createPlace({
    name: "Bobby's Burger",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Smashburger",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: "gutes Preis-Leistungs-Verhältnis",
    reviewedAt: new Date("2025-05-25"),
    rating: 7.9,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=UMKdpNKevjs",
  });

  // ###############

  product = await createProduct({
    name: "Chicken BigMac",
    category: "burger",
    placeId: placeMcDonId,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-05-25"),
    rating: 4.0,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=UMKdpNKevjs",
  });

  // ###############

  await createReview({
    note: null,
    reviewedAt: new Date("2025-05-18"),
    rating: 9.0,
    authorId: userIdReeze,
    productId: productIdBETRChicken,
    urlSource: "https://www.youtube.com/watch?v=z3lluNxj9iA",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-05-18"),
    rating: 9.0,
    authorId: userIdReeze,
    productId: productIdBETRMac,
    urlSource: "https://www.youtube.com/watch?v=z3lluNxj9iA",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-05-18"),
    rating: 8.7,
    authorId: userIdReeze,
    productId: productIdBETRCheeze,
    urlSource: "https://www.youtube.com/watch?v=z3lluNxj9iA",
  });

  // ###############

  place = await createPlace({
    name: "Koz Tantuni Street Food",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Tantuni Dürüm",
    category: "grill & barbecue",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-05"),
    rating: 9.0,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=zjuDnBT4jbo",
  });

  // ###############

  place = await createPlace({
    name: "Antep Kebab House",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Döner Kalb",
    category: "kebab",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-05"),
    rating: 9.0,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=zjuDnBT4jbo",
  });

  // ###############

  place = await createPlace({
    name: "Crockpot's",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Boneless Wings",
    category: "chicken",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-08"),
    rating: 8.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=SzADTkasL10",
  });

  // ###############

  place = await createPlace({
    name: "La Noodle",
    city: "Düsseldorf",
  });

  product = await createProduct({
    name: "Biang Biang Beef",
    category: "noodles",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-15"),
    rating: 8.7,
    authorId: userIdReeze,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=VE-Zcse_WIg",
  });

  // ###############

  place = await createPlace({
    name: "goldies",
    city: null,
  });
  const placeIdGoldies = place.id;

  product = await createProduct({
    name: "Cheeseburger",
    category: "burger",
    placeId: place.id,
    note: "Smashburger",
  });
  const productIdGoldiesCheeseburger = product.id;

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-15"),
    rating: 9.0,
    authorId: userIdReeze,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=VE-Zcse_WIg",
  });

  product = await createProduct({
    name: "Super Smash TS",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: "mit Bacon Jam",
    reviewedAt: new Date("2025-06-15"),
    rating: 9.5,
    authorId: userIdReeze,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=VE-Zcse_WIg",
  });

  // ###############

  place = await createPlace({
    name: "TAKE - THE GOOD FOOD",
    city: null,
  });

  product = await createProduct({
    name: "Drip Burger",
    category: "burger",
    placeId: place.id,
    note: "mit Knochen",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-15"),
    rating: 8.3,
    authorId: userIdReeze,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=VE-Zcse_WIg",
  });

  // ###############

  await createReview({
    note: null,
    reviewedAt: new Date("2023-11-02"),
    rating: 9.4,
    authorId: userIdHolle,
    productId: productIdGoldiesCheeseburger,
    urlSource: "https://www.youtube.com/watch?v=acgeXaqOpYo",
  });

  // ###############

  product = await createProduct({
    name: "Cheeeseburger (Double)",
    category: "burger",
    placeId: placeIdGoldies,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2023-11-02"),
    rating: 9.0,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=acgeXaqOpYo",
  });

  // ###############

  place = await createPlace({
    name: "Five Guys",
    city: null,
  });

  product = await createProduct({
    name: "Bacon Cheeseburger",
    category: "burger",
    placeId: place.id,
    note: "mit Jalapenos",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-12"),
    rating: 7.9,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=sElLsSRzH3w",
  });

  // ###############

  place = await createPlace({
    name: "Joe & The Juice",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "The Steak",
    category: "sandwich",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-12"),
    rating: 7.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=sElLsSRzH3w",
  });

  // ###############

  place = await createPlace({
    name: "Frittenwerk",
    city: null,
  });

  product = await createProduct({
    name: "Planted Steak Fries",
    category: "grill & barbecue",
    placeId: place.id,
    note: "vegan",
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-12"),
    rating: 8.3,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=sElLsSRzH3w",
  });

  // ###############

  place = await createPlace({
    name: "Block House",
    city: null,
  });

  product = await createProduct({
    name: "Steak Pfanne Kräuter",
    category: "grill & barbecue",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-19"),
    rating: 7.5,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=6-A9-t1za3Y",
  });

  // ###############

  product = await createProduct({
    name: "Crunchy Puffs Spicy Paprika",
    category: "snack",
    placeId: placeIdRobs,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-19"),
    rating: 9.0,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=6-A9-t1za3Y",
  });

  // ###############

  place = await createPlace({
    name: "Superbad",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Superbad Brother Double",
    category: "burger",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-22"),
    rating: 7.9,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=IoASNy82gm8",
  });

  // ###############

  place = await createPlace({
    name: "Chingu St. Pauli",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Chicken Wings",
    category: "chicken",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-26"),
    rating: 8.3,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=uW6vU3qVOL8",
  });

  // ###############

  place = await createPlace({
    name: "The Salli's",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Döner Hähnchen",
    category: "kebab",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-06-29"),
    rating: 7.1,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=JzRe-WeDfqk",
  });

  // ###############

  place = await createPlace({
    name: "Siggys Gemüse Kebap",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Gemüsedöner",
    category: "kebab",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-07-03"),
    rating: 9.0,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=lljaIh8jqxA",
  });

  product = await createProduct({
    name: "Dürüm Steak",
    category: "kebab",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-07-03"),
    rating: 8.7,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=lljaIh8jqxA",
  });

  // ###############

  place = await createPlace({
    name: "Erika's Eck",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Schnitzel Wiener Art",
    category: "grill & barbecue",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-07-13"),
    rating: 8.2,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=QfQeHCQFKFc",
  });

  product = await createProduct({
    name: "Currywurst XXL",
    category: "grill & barbecue",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-07-13"),
    rating: 8.1,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=QfQeHCQFKFc",
  });

  // ###############

  place = await createPlace({
    name: "Mis Tantuni & Döner",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Döner Kalb",
    category: "kebab",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2025-07-31"),
    rating: 8.7,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=CUBIVLhqxpA",
  });

  // ###############

  place = await createPlace({
    name: "Papa Johns",
    city: null,
  });

  product = await createProduct({
    name: "Pizzabrötchen Cheese Rolls",
    category: "pizza",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-02-27"),
    rating: 8.8,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=GGKdSTr-lww",
  });

  // ###############

  place = await createPlace({
    name: "L'Antica Pizzeria da Michele",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Pizza Margherita",
    category: "pizza",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-12-22"),
    rating: 9.1,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=fek3lr4Pnsc",
  });

  // ###############

  place = await createPlace({
    name: "Spezzagrano",
    city: "Hamburg",
  });

  product = await createProduct({
    name: "Pizza Margherita",
    category: "pizza",
    placeId: place.id,
    note: null,
  });

  await createReview({
    note: null,
    reviewedAt: new Date("2024-12-22"),
    rating: 9.3,
    authorId: userIdHolle,
    productId: product.id,
    urlSource: "https://www.youtube.com/watch?v=fek3lr4Pnsc",
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
      category: "noodles",
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

  await db.insert(criticsTable).values(
    usersCriticsSeed.map((user) => ({
      userId: user.id,
      url: user.url,
    })),
  );
}

const usersCriticsSeed: (UserCreate & { url: string })[] = [
  {
    id: "1-temp",
    name: usernameHolle,
    email: `${usernameHolle}@example.com`,
    url: "https://www.youtube.com/c/Holle21614",
  },
  {
    id: "2-temp",
    name: usernameJFG,
    email: `${usernameJFG}@example.com`,
    url: "https://www.youtube.com/c/JunkFoodGuru",
  },
  {
    id: "3-temp",
    name: usernameFranklin,
    email: `${usernameFranklin}@example.com`,
    url: "https://www.youtube.com/@the.franklin",
  },
  {
    id: "4-temp",
    name: usernameReeze,
    email: `${usernameReeze}@example.com`,
    url: "https://www.youtube.com/@Reeze",
  },
  {
    id: "5-temp",
    name: usernameSturmwaffel,
    email: `${usernameSturmwaffel}@example.com`,
    url: "https://www.youtube.com/@SturmwaffelLP",
  },
  {
    id: "6-temp",
    name: usernameHenryGibert,
    email: `${usernameHenryGibert}@example.com`,
    url: "https://www.youtube.com/@henry.gibert",
  },
];

async function createUsers() {
  console.info("Create users");

  await db.insert(usersTable).values(
    usersCriticsSeed.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    })),
  );
}

main();
