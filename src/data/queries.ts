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
  count,
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
import { notFound } from "next/navigation";
import { cacheKeys, minCharsSearch } from "./static";

const numOfReviewsForAverage = 20;

export type QueryRankingWithReviews = ReturnType<typeof rankingsWithReviews>;
export type RankingWithReviewsQuery = Awaited<
  ReturnType<typeof rankingsWithReviews>
>["rankings"][number];

async function rankingsWithReviews(filters: FiltersRankings) {
  "use cache";
  cacheTag(cacheKeys.rankings, cacheKeys.reviews);
  console.debug("🟦 QUERY rankingsWithReviews");

  const qRankings = subqueryRankings(filters);

  const rankingsData = await db.select().from(qRankings);

  // TODO 2025-05 Is there a nice way to do this in one query instead of getting the reviews separately?
  const reviews = await db
    .with(qRankings)
    .select({
      id: reviewsTable.id,
      note: reviewsTable.note,
      authorId: reviewsTable.authorId,
      reviewedAt: reviewsTable.reviewedAt,
      urlSource: reviewsTable.urlSource,
      rating: reviewsTable.rating,
      productId: qRankings.productId,
      username: usersTable.name,
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.isCurrent, true))
    .innerJoin(qRankings, eq(reviewsTable.productId, qRankings.productId))
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
    };
  });

  return { rankings: rankingsCombined, queriedAt: new Date() };
}

export type RankingQuery = Awaited<ReturnType<typeof rankings>>[number];

async function rankings(filters: FiltersRankings) {
  "use cache";
  cacheTag(cacheKeys.rankings, cacheKeys.reviews);
  console.debug("🟦 QUERY rankings");

  const qRankings = subqueryRankings(filters);

  return await db.select().from(qRankings);
}

function subqueryRankings(filters: FiltersRankings) {
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
  if (!!filters.placeName && filters.placeName.length >= minCharsSearch)
    filtersForProductsSQL.push(
      ilike(placesTable.name, `%${filters.placeName}%`),
    );

  // FILTERS for reviews
  const filtersForReviewsSQL: SQL[] = [];
  if (filters.critics)
    filtersForReviewsSQL.push(inArray(usersTable.name, filters.critics));
  if (filters.ratingMin)
    filtersForReviewsSQL.push(gte(reviewsTable.rating, filters.ratingMin));
  if (filters.ratingMax)
    filtersForReviewsSQL.push(lte(reviewsTable.rating, filters.ratingMax));

  /** Products for filters */
  const qProductsFiltered = db
    .select({
      productId: productsTable.id,
    })
    .from(productsTable)
    .where(and(...filtersForProductsSQL))
    // join needed for filtering by place name (via filtersSQL)
    .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
    .as("queryProductsFiltered");

  /** Filtered reviews for products (all filters, no row number) */
  const qReviewsFiltered = db
    .with(qProductsFiltered)
    .select({
      id: reviewsTable.id,
      productId: reviewsTable.productId,
      rating: reviewsTable.rating,
      reviewedAt: reviewsTable.reviewedAt,
      urlSource: reviewsTable.urlSource,
      note: reviewsTable.note,
      username: usersTable.name,
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
    .as("queryReviewsFiltered");

  /** Reviews for products with row number to limit later */
  const qReviewsForProductsWithSequence = db
    .with(qReviewsFiltered)
    .select({
      id: qReviewsFiltered.id,
      productId: qReviewsFiltered.productId,
      rating: qReviewsFiltered.rating,
      reviewedAt: qReviewsFiltered.reviewedAt,
      urlSource: qReviewsFiltered.urlSource,
      note: qReviewsFiltered.note,
      username: qReviewsFiltered.username,
      rowNumber: sql<number>`row_number() over (
        partition by ${qReviewsFiltered.productId}
        order by ${qReviewsFiltered.reviewedAt} desc
      )`
        .mapWith(Number)
        .as("rowNumber"),
    })
    .from(qReviewsFiltered)
    .as("queryReviewsForProducts");

  /** Total number of reviews per product (not limited by row number) */
  const qNumReviewsPerProduct = db
    .with(qReviewsFiltered)
    .select({
      productId: qReviewsFiltered.productId,
      numOfReviews: count(qReviewsFiltered.id).as("numOfReviews"),
    })
    .from(qReviewsFiltered)
    .groupBy(qReviewsFiltered.productId)
    .as("queryNumReviewsPerProduct");

  /** Products with average rating calculated */
  const qProductsWithRatings = db
    .with(
      qProductsFiltered,
      qReviewsForProductsWithSequence,
      qNumReviewsPerProduct,
    )
    .select({
      productId: qProductsFiltered.productId,
      ratingAvg: avg(qReviewsForProductsWithSequence.rating)
        .mapWith(Number)
        .as("ratingAvg"),
      lastReviewedAt:
        sql<Date>`MAX(${qReviewsForProductsWithSequence.reviewedAt})`
          .mapWith(qReviewsForProductsWithSequence.reviewedAt)
          .as("lastReviewedAt"),
      numOfReviews: qNumReviewsPerProduct.numOfReviews,
    })
    .from(qReviewsForProductsWithSequence)
    .where(
      lte(qReviewsForProductsWithSequence.rowNumber, numOfReviewsForAverage),
    )
    .innerJoin(
      qProductsFiltered,
      eq(
        qReviewsForProductsWithSequence.productId,
        qProductsFiltered.productId,
      ),
    )
    .leftJoin(
      qNumReviewsPerProduct,
      eq(qProductsFiltered.productId, qNumReviewsPerProduct.productId),
    )
    .groupBy(qProductsFiltered.productId, qNumReviewsPerProduct.numOfReviews)
    .as("queryProductsWithRatings");

  /** Products with highest rating and limited to the X best ones */
  const qProductRankingsLimited = db
    .with(qProductsWithRatings)
    .select({
      productId: qProductsWithRatings.productId,
      ratingAvg: qProductsWithRatings.ratingAvg,
      lastReviewedAt: qProductsWithRatings.lastReviewedAt,
      numOfReviews: qProductsWithRatings.numOfReviews,
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
    .with(qProductRankingsLimited)
    .select({
      productName: productsTable.name,
      productCategory: productsTable.category,
      productNote: productsTable.note,
      placeId: productsTable.placeId,
      productId: qProductRankingsLimited.productId,
      ratingAvg: qProductRankingsLimited.ratingAvg,
      lastReviewedAt: qProductRankingsLimited.lastReviewedAt,
      city: placesTable.city,
      [placeNameHack]: sql<string>`${placesTable.name}`.as(placeNameHack),
      numOfReviews: qProductRankingsLimited.numOfReviews,
    })
    .from(qProductRankingsLimited)
    .innerJoin(
      productsTable,
      eq(qProductRankingsLimited.productId, productsTable.id),
    )
    .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
    .orderBy(desc(qProductRankingsLimited.ratingAvg))
    .as("queryRankings");

  return qRankings;
}

const pageSizeReviews = 20;

async function reviews(page = 1, userIdFilter: string | null = null) {
  "use cache";
  // TODO implications of empty string cache tag?
  cacheTag(cacheKeys.reviews, userIdFilter ? cacheKeys.user(userIdFilter) : "");
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
    .where(
      userIdFilter === null
        ? undefined
        : eq(reviewsTable.authorId, userIdFilter),
    )
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

async function userForId(userId: string) {
  "use cache";
  cacheTag(cacheKeys.user(userId));
  console.debug("🟦 QUERY userForId", " userId: ", userId);

  const userForQuery = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (userForQuery.length > 1)
    throw new Error("Multiple users found for user ID: " + userId);
  if (!userForQuery[0]) notFound();

  return userForQuery[0];
}

export const queries = {
  rankings,
  rankingsWithReviews,
  reviews,
  critics,
  searchPlaces,
  userForId,
};
