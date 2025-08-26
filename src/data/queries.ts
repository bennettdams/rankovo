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
  isNotNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { cacheKeys, categoriesActive, minCharsSearch } from "./static";

const numOfReviewsForAverage = 20;

export type QueryRankingWithReviews = ReturnType<typeof rankingsWithReviews>;
export type RankingWithReviewsQuery = Awaited<
  ReturnType<typeof rankingsWithReviews>
>["rankings"][number];

export function conditionsSearchProducts(searchQuery: string) {
  // Clean and split the search query
  const searchTerms = searchQuery
    .trim()
    .toLowerCase()
    .split(/\s+/) // Split by whitespace
    .filter((term) => {
      // Remove empty strings
      if (term.length === 0) return false;
      // Exclude common search term conjunction (e.g. "Burger in Berlin")
      if (term === "in") return false;

      return true;
    });

  if (searchTerms.length === 0) {
    return undefined;
  }

  // Create ILIKE conditions for each search term across all searchable fields
  const searchConditions = searchTerms.map((term) => {
    const wildcardTerm = `%${term}%`;

    return or(
      // PRODUCTS: Always search in product fields (these are never null)
      ilike(productsTable.name, wildcardTerm),
      ilike(productsTable.note, wildcardTerm),
      ilike(productsTable.category, wildcardTerm),
      // PLACES: Only search in place fields if they exist (not null)
      and(isNotNull(placesTable.name), ilike(placesTable.name, wildcardTerm)),
      and(isNotNull(placesTable.city), ilike(placesTable.city, wildcardTerm)),
    );
  });

  return searchConditions;
}

async function rankingsWithReviews(filters: FiltersRankings) {
  "use cache";
  cacheTag(cacheKeys.rankings, cacheKeys.reviews);
  console.debug("🟦 QUERY rankingsWithReviews");

  const qRankings = subqueryRankings(filters);

  const rankingsData = await db.select().from(qRankings);

  const productIdsOfRankings = rankingsData.map((ranking) => ranking.productId);

  if (productIdsOfRankings.length === 0) {
    return { rankings: [], queriedAt: new Date() };
  }

  // TODO 2025-05 Is there a nice way to do this in one query instead of getting the reviews separately?
  const reviews = await db
    .select({
      id: reviewsTable.id,
      note: reviewsTable.note,
      authorId: reviewsTable.authorId,
      reviewedAt: reviewsTable.reviewedAt,
      urlSource: reviewsTable.urlSource,
      rating: reviewsTable.rating,
      productId: reviewsTable.productId,
      username: usersTable.name,
    })
    .from(reviewsTable)
    .where(
      and(
        eq(reviewsTable.isCurrent, true),
        inArray(reviewsTable.productId, productIdsOfRankings),
      ),
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

export function subqueryRankings(filters: FiltersRankings) {
  // FILTERS for products only
  const sqlFiltersProducts: (SQL | undefined)[] = [];
  if (filters.categories) {
    sqlFiltersProducts.push(
      inArray(productsTable.category, filters.categories),
    );
  } else {
    sqlFiltersProducts.push(inArray(productsTable.category, categoriesActive));
  }

  // FILTERS for places only
  const sqlFiltersPlaces: (SQL | undefined)[] = [];
  if (filters.cities)
    sqlFiltersPlaces.push(inArray(placesTable.city, filters.cities));

  // FILTERS that span multiple tables (products + places)
  const sqlFiltersCrossTable: (SQL | undefined)[] = [];
  if (!!filters.q && filters.q.length >= minCharsSearch) {
    const searchConditions = conditionsSearchProducts(filters.q);
    if (searchConditions) sqlFiltersCrossTable.push(...searchConditions);
  }

  // FILTERS for reviews
  const filtersForReviewsSQL: SQL[] = [];
  if (filters.critics)
    filtersForReviewsSQL.push(inArray(usersTable.name, filters.critics));
  if (filters["rating-min"])
    filtersForReviewsSQL.push(gte(reviewsTable.rating, filters["rating-min"]));
  if (filters["rating-max"])
    filtersForReviewsSQL.push(lte(reviewsTable.rating, filters["rating-max"]));

  /** Get filtered product IDs that match all criteria */
  const qFilteredProducts = db.$with("queryFilteredProducts").as(
    db
      .select({ productId: productsTable.id })
      .from(productsTable)
      .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
      .where(
        and(
          ...sqlFiltersProducts,
          ...sqlFiltersPlaces,
          ...sqlFiltersCrossTable,
        ),
      ),
  );

  /** Get all reviews with analytics in one step */
  const qReviewsWithAnalytics = db.$with("queryReviewsWithAnalytics").as(
    db
      .select({
        productId: reviewsTable.productId,
        rating: reviewsTable.rating,
        reviewedAt: reviewsTable.reviewedAt,
        // Calculate row number for limiting to most recent reviews
        rowNumber: sql<number>`row_number() over (
          partition by ${reviewsTable.productId}
          order by ${reviewsTable.reviewedAt} desc
        )`
          .mapWith(Number)
          .as("rowNumber"),
        // Calculate total reviews count per product
        totalReviews:
          sql<number>`count(*) over (partition by ${reviewsTable.productId})`
            .mapWith(Number)
            .as("totalReviews"),
      })
      .from(reviewsTable)
      .innerJoin(usersTable, eq(reviewsTable.authorId, usersTable.id))
      .innerJoin(
        qFilteredProducts,
        eq(reviewsTable.productId, qFilteredProducts.productId),
      )
      .where(and(eq(reviewsTable.isCurrent, true), ...filtersForReviewsSQL)),
  );

  /** Calculate product ratings from the limited review set */
  const qProductRatings = db.$with("queryProductRatings").as(
    db
      .select({
        productId: qReviewsWithAnalytics.productId,
        ratingAvg: avg(qReviewsWithAnalytics.rating)
          .mapWith(Number)
          .as("ratingAvg"),
        lastReviewedAt: sql<Date>`max(${qReviewsWithAnalytics.reviewedAt})`
          .mapWith(qReviewsWithAnalytics.reviewedAt)
          .as("lastReviewedAt"),
        numOfReviews: sql<number>`max(${qReviewsWithAnalytics.totalReviews})`
          .mapWith(Number)
          .as("numOfReviews"),
      })
      .from(qReviewsWithAnalytics)
      .where(lte(qReviewsWithAnalytics.rowNumber, numOfReviewsForAverage))
      .groupBy(qReviewsWithAnalytics.productId),
  );

  /** Get top 10 products by rating */
  const qTopProducts = db.$with("queryTopProducts").as(
    db
      .select({
        productId: qProductRatings.productId,
        ratingAvg: qProductRatings.ratingAvg,
        lastReviewedAt: qProductRatings.lastReviewedAt,
        numOfReviews: qProductRatings.numOfReviews,
      })
      .from(qProductRatings)
      .orderBy(desc(qProductRatings.ratingAvg))
      .limit(10),
  );

  // 2025-05
  // "placesTable.name" and "productsTable.name" would create a Drizzle error for ambiguous column names.
  // Using "as" below to rename the column in the query.
  // See: https://github.com/drizzle-team/drizzle-orm/issues/2772
  const placeNameHack = "placeName";

  const qRankings = db
    .with(
      qFilteredProducts,
      qReviewsWithAnalytics,
      qProductRatings,
      qTopProducts,
    )
    .select({
      productName: productsTable.name,
      productCategory: productsTable.category,
      productNote: productsTable.note,
      placeId: productsTable.placeId,
      productId: qTopProducts.productId,
      ratingAvg: qTopProducts.ratingAvg,
      lastReviewedAt: qTopProducts.lastReviewedAt,
      city: placesTable.city,
      [placeNameHack]: sql<string>`${placesTable.name}`.as(placeNameHack),
      numOfReviews: qTopProducts.numOfReviews,
    })
    .from(qTopProducts)
    .innerJoin(productsTable, eq(qTopProducts.productId, productsTable.id))
    .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
    .orderBy(desc(qTopProducts.ratingAvg))
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
