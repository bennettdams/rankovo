import type { FiltersRankings } from "@/app/page";
import {
  criticsTable,
  placesTable,
  productsTable,
  reviewsTable,
  usersTable,
} from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import {
  and,
  asc,
  avg,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { cacheKeys, minCharsSearch, type Category, type City } from "./static";

export type Ranking = {
  id: number;
  ratingAvg: number;
  productId: number;
  productName: string;
  productNote: string | null;
  productCategory: Category;
  placeName: string | null;
  city: City | null;
  numOfReviews: number;
  // TODO remove null check when all reviews have a date
  lastReviewedAt: Date | null;
  reviews: {
    id: number;
    rating: number;
    note: string | null;
    username: string | null;
    // TODO remove null check when all reviews have a date
    reviewedAt: Date | null;
    urlSource: string | null;
  }[];
};

const numOfReviewsForAverage = 20;

async function rankings(filters: FiltersRankings) {
  "use cache";
  cacheTag(cacheKeys.rankings);
  console.debug("🟦 QUERY rankings");

  // FILTERS for products
  const filtersForProductsSQL: SQL[] = [];
  if (filters.categories)
    filtersForProductsSQL.push(
      inArray(productsTable.category, filters.categories),
    );
  if (filters.cities)
    filtersForProductsSQL.push(inArray(placesTable.city, filters.cities));
  if (!!filters.productName && filters.productName.length >= minCharsSearch)
    filtersForProductsSQL.push(
      ilike(productsTable.name, `%${filters.productName}%`),
    );

  // FILTERS for reviews
  const filtersForReviewsSQL: SQL[] = [];
  if (filters.critics)
    filtersForReviewsSQL.push(inArray(usersTable.name, filters.critics));
  if (filters.ratingMin)
    filtersForReviewsSQL.push(gte(reviewsTable.rating, filters.ratingMin));
  if (filters.ratingMax)
    filtersForReviewsSQL.push(lte(reviewsTable.rating, filters.ratingMax));

  const qProductsFiltered = db
    .select({
      productId: productsTable.id,
    })
    .from(productsTable)
    .where(and(...filtersForProductsSQL))
    // join needed for filtering by place name (via filtersSQL)
    .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
    .as("queryProductsFiltered");

  /** last X reviews for each product */
  const qReviewsForProducts = db
    .select({
      id: reviewsTable.id,
      productId: reviewsTable.productId,
      rating: reviewsTable.rating,
      reviewedAt: reviewsTable.reviewedAt,
      urlSource: reviewsTable.urlSource,
      note: reviewsTable.note,
      username: usersTable.name,
      rowNumber: sql<number>`row_number() over (
        partition by ${reviewsTable.productId}
        order by ${reviewsTable.reviewedAt} desc
      )`
        .mapWith(Number)
        .as("rowNumber"),
    })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.isCurrent, true), ...filtersForReviewsSQL))
    .innerJoin(
      qProductsFiltered,
      eq(reviewsTable.productId, qProductsFiltered.productId),
    )
    // join needed for filtering by username (via filtersSQL)
    .innerJoin(usersTable, eq(reviewsTable.authorId, usersTable.id))
    .orderBy(desc(reviewsTable.reviewedAt))
    .as("queryReviewsForProducts");

  const qProductsWithRatings = db
    .select({
      productId: qProductsFiltered.productId,
      ratingAvg: avg(qReviewsForProducts.rating)
        .mapWith(Number)
        .as("ratingAvg"),
      lastReviewedAt: sql<Date>`MAX(${qReviewsForProducts.reviewedAt})`
        .mapWith(qReviewsForProducts.reviewedAt)
        .as("lastReviewedAt"),
    })
    .from(qReviewsForProducts)
    .where(lte(qReviewsForProducts.rowNumber, numOfReviewsForAverage))
    .innerJoin(
      qProductsFiltered,
      eq(qReviewsForProducts.productId, qProductsFiltered.productId),
    )
    .groupBy(qProductsFiltered.productId)
    .as("queryProductsWithRatings");

  const qProductsLimited = db
    .select({
      productId: qProductsWithRatings.productId,
      ratingAvg: qProductsWithRatings.ratingAvg,
      lastReviewedAt: qProductsWithRatings.lastReviewedAt,
    })
    .from(qProductsWithRatings)
    .orderBy(desc(qProductsWithRatings.ratingAvg))
    // only 10 products needed for rankings
    .limit(10)
    .as("queryProductsLimited");

  // 2025-05
  // "placesTable.name" and "productsTable.name" would create a Drizzle error for ambiguous column names.
  // Using "as" below to rename the column in the query.
  // See: https://github.com/drizzle-team/drizzle-orm/issues/2772
  const placeNameHack = "placeName";

  const qRankings = db
    .with(qProductsLimited)
    .select({
      productName: productsTable.name,
      productCategory: productsTable.category,
      productNote: productsTable.note,
      placeId: productsTable.placeId,
      productId: qProductsLimited.productId,
      ratingAvg: qProductsLimited.ratingAvg,
      lastReviewedAt: qProductsLimited.lastReviewedAt,
      city: placesTable.city,
      [placeNameHack]: sql<string>`${placesTable.name}`.as(placeNameHack),
    })
    .from(qProductsLimited)
    .innerJoin(productsTable, eq(qProductsLimited.productId, productsTable.id))
    .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
    .orderBy(desc(qProductsLimited.ratingAvg))
    .as("queryRankings");

  const rankingsData = await db.select().from(qRankings);

  // TODO Is there a way to do this in one query instead of getting the reviews separately?
  const reviews = await db
    .select({
      id: reviewsTable.id,
      note: reviewsTable.note,
      reviewedAt: reviewsTable.reviewedAt,
      urlSource: reviewsTable.urlSource,
      rating: reviewsTable.rating,
      productId: qProductsLimited.productId,
      username: usersTable.name,
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.isCurrent, true))
    .innerJoin(
      qProductsLimited,
      eq(reviewsTable.productId, qProductsLimited.productId),
    )
    .innerJoin(usersTable, eq(usersTable.id, reviewsTable.authorId))
    .orderBy(desc(reviewsTable.reviewedAt))
    .limit(numOfReviewsForAverage);

  const rankingsCombined = rankingsData.map((ranking) => {
    const reviewsForProduct = reviews.filter(
      (review) => review.productId === ranking.productId,
    );
    return {
      ...ranking,
      reviews: reviewsForProduct,
      numOfReviews: reviewsForProduct.length,
    };
  });

  return { rankings: rankingsCombined, queriedAt: new Date() };
}

const pageSizeReviews = 20;

async function reviews(page = 1) {
  "use cache";
  cacheTag(cacheKeys.reviews);
  console.debug("🟦 QUERY reviews");

  return await db
    .select({
      id: reviewsTable.id,
      rating: reviewsTable.rating,
      note: reviewsTable.note,
      createdAt: reviewsTable.createdAt,
      updatedAt: reviewsTable.updatedAt,
      urlSource: reviewsTable.urlSource,
      productName: productsTable.name,
      placeName: placesTable.name,
      username: usersTable.name,
      city: placesTable.city,
      reviewedAt: reviewsTable.reviewedAt,
      isCurrent: reviewsTable.isCurrent,
    })
    .from(reviewsTable)
    .innerJoin(productsTable, eq(reviewsTable.productId, productsTable.id))
    .innerJoin(usersTable, eq(reviewsTable.authorId, usersTable.id))
    .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
    .orderBy(
      desc(reviewsTable.reviewedAt),
      desc(reviewsTable.updatedAt),
      // order by ID for pagination
      asc(reviewsTable.id),
    )
    .limit(pageSizeReviews)
    .offset((page - 1) * pageSizeReviews);
}
export type ReviewQuery = Awaited<ReturnType<typeof reviews>>[number];

async function critics() {
  "use cache";
  cacheTag(cacheKeys.critics);
  console.debug("🟦 QUERY critics");

  return await db
    .select({ id: criticsTable.id, name: usersTable.name })
    .from(criticsTable)
    .innerJoin(usersTable, eq(criticsTable.userId, usersTable.id));
}
export type CriticQuery = Awaited<ReturnType<typeof critics>>[number];

async function searchProduct({
  productName,
  placeName,
}: {
  productName: string | null;
  placeName: string | null;
}) {
  "use cache";
  cacheTag(cacheKeys.products);
  console.debug(
    "🟦 QUERY searchProduct",
    " product: ",
    productName,
    " place: ",
    placeName,
  );

  const filtersSQL: SQL[] = [];
  if (!!productName && productName.length >= minCharsSearch)
    filtersSQL.push(ilike(productsTable.name, `%${productName}%`));
  if (!!placeName && placeName.length >= minCharsSearch)
    filtersSQL.push(ilike(placesTable.name, `%${placeName}%`));

  /** products & places for given filters */
  const queryProductsFiltered = db
    .select({
      id: productsTable.id,
    })
    .from(productsTable)
    .where(and(...filtersSQL))
    // join is needed for filtering by place name (via filtersSQL)
    .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
    .as("queryProductsFiltered");

  /** ranked reviews for each product */
  const queryReviewsRanked = db
    .select({
      productId: queryProductsFiltered.id,
      rating: reviewsTable.rating,
      rowNumber: sql<number>`row_number() over (
        partition by ${reviewsTable.productId}
        order by ${reviewsTable.reviewedAt} desc
      )`.as("rowNumber"),
    })
    .from(queryProductsFiltered)
    .leftJoin(
      reviewsTable,
      eq(queryProductsFiltered.id, reviewsTable.productId),
    )
    .as("queryReviewsRanked");

  /**
   * rating aggregation, so it later can also be used for ordering after grouping
   *
   * TODO would it make sense to use queryProductsFiltered instead of productsTable here?
   */
  const queryProductsAggregated = db
    .select({
      id: productsTable.id,
      productName: productsTable.name,
      category: productsTable.category,
      placeId: productsTable.placeId,
      note: productsTable.note,
      ratingAvg: sql`avg(${queryReviewsRanked.rating})`
        .mapWith(Number)
        .as("ratingAvg"),
    })
    .from(productsTable)
    .innerJoin(
      queryReviewsRanked,
      and(
        eq(productsTable.id, queryReviewsRanked.productId),
        lte(queryReviewsRanked.rowNumber, numOfReviewsForAverage),
      ),
    )
    .groupBy(productsTable.id)
    .as("queryProductsAggregated");

  const queryProductsFinal = db
    .select({
      id: queryProductsAggregated.id,
      name: queryProductsAggregated.productName,
      category: queryProductsAggregated.category,
      note: queryProductsAggregated.note,
      placeName: placesTable.name,
      city: placesTable.city,
      ratingAvg: queryProductsAggregated.ratingAvg,
    })
    .from(queryProductsAggregated)
    .orderBy(desc(queryProductsAggregated.ratingAvg))
    .leftJoin(placesTable, eq(queryProductsAggregated.placeId, placesTable.id));

  return await queryProductsFinal;
}

export type ProductSearchQuery = Awaited<
  ReturnType<typeof searchProduct>
>[number];

async function searchPlaces(placeName: string) {
  "use cache";
  cacheTag(cacheKeys.places);
  console.debug("🟦 QUERY searchPlace", " place: ", placeName);

  const filtersSQL: SQL[] = [];
  if (!!placeName && placeName.length >= minCharsSearch)
    filtersSQL.push(ilike(placesTable.name, `%${placeName}%`));

  return await db
    .select()
    .from(placesTable)
    .where(and(...filtersSQL));
}

export type PlaceSearchQuery = Awaited<ReturnType<typeof searchPlaces>>[number];

export const queries = {
  rankings,
  reviews,
  critics,
  searchProduct,
  searchPlaces,
};
