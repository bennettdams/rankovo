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
import { cacheTag } from "next/cache";
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

  // Fetch reviews for the ranked products using the shared helper
  const reviews = await createReviewsQuery({
    productIdsFilter: productIdsOfRankings,
    limit: numOfReviewsForAverage,
    onlyCurrentReviews: true,
  });

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

export function subqueryRankings(
  filters: FiltersRankings,
  specificProductId?: number,
) {
  // Initialize all filter arrays
  const sqlFiltersProducts: (SQL | undefined)[] = [];
  const sqlFiltersPlaces: (SQL | undefined)[] = [];
  const sqlFiltersReviews: SQL[] = [];
  const sqlFiltersCrossTable: (SQL | undefined)[] = [];

  if (specificProductId !== undefined) {
    // SPECIFIC PRODUCT CASE: Only filter by the product ID, ignore all other filters
    sqlFiltersProducts.push(eq(productsTable.id, specificProductId));
    // All other filter arrays remain empty for specific product queries
  } else {
    // GENERAL FILTERING CASE: Apply all the normal filters

    // FILTERS for products only
    if (filters.categories) {
      // custom condition if categories are given because we use the active categories as default (instead of ALL categories)
      sqlFiltersProducts.push(
        inArray(productsTable.category, filters.categories),
      );
    } else {
      sqlFiltersProducts.push(
        inArray(productsTable.category, categoriesActive),
      );
    }

    // FILTERS for places only
    if (filters.cities) {
      sqlFiltersPlaces.push(inArray(placesTable.city, filters.cities));
    }

    // FILTERS that span multiple tables (products + places)
    if (!!filters.q && filters.q.length >= minCharsSearch) {
      const searchConditions = conditionsSearchProducts(filters.q);
      if (searchConditions) sqlFiltersCrossTable.push(...searchConditions);
    }

    // FILTERS for reviews
    if (filters.critics)
      sqlFiltersReviews.push(inArray(usersTable.name, filters.critics));
    if (filters["rating-min"])
      sqlFiltersReviews.push(gte(reviewsTable.rating, filters["rating-min"]));
    if (filters["rating-max"])
      sqlFiltersReviews.push(lte(reviewsTable.rating, filters["rating-max"]));
  }

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
      .where(and(eq(reviewsTable.isCurrent, true), ...sqlFiltersReviews)),
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

  /** Get top products by rating - limit to 1 if specific product, 10 otherwise */
  const qTopProducts = db.$with("queryTopProducts").as(
    db
      .select({
        productId: qProductRatings.productId,
        ratingAvg: qProductRatings.ratingAvg,
        lastReviewedAt: qProductRatings.lastReviewedAt,
        numOfReviews: qProductRatings.numOfReviews,
      })
      .from(qProductRatings)
      // sorted by product ID as tiebreaker from same average rating
      .orderBy(desc(qProductRatings.ratingAvg), asc(qProductRatings.productId))
      .limit(specificProductId !== undefined ? 1 : 10),
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
    // sorted by product ID as tiebreaker from same average rating
    .orderBy(desc(qTopProducts.ratingAvg), asc(qTopProducts.productId))
    .as("queryRankings");

  return qRankings;
}

const pageSizeReviews = 20;

function createReviewsQuery(options: {
  page?: number;
  userIdFilter?: string | null;
  productIdsFilter?: number[];
  limit?: number;
  onlyCurrentReviews?: boolean;
}) {
  const {
    page = 1,
    userIdFilter = null,
    productIdsFilter,
    limit,
    onlyCurrentReviews = true,
  } = options;

  const whereConditions: SQL[] = [];

  // Add user filter if provided
  if (userIdFilter !== null) {
    whereConditions.push(eq(reviewsTable.authorId, userIdFilter));
  }

  // Add multiple products filter if provided
  if (productIdsFilter !== undefined && productIdsFilter.length > 0) {
    whereConditions.push(inArray(reviewsTable.productId, productIdsFilter));
  }

  // Add current reviews filter if requested (default true for rankings)
  if (onlyCurrentReviews) {
    whereConditions.push(eq(reviewsTable.isCurrent, true));
  }

  return db
    .select({
      id: reviewsTable.id,
      rating: reviewsTable.rating,
      note: reviewsTable.note,
      createdAt: reviewsTable.createdAt,
      updatedAt: reviewsTable.updatedAt,
      urlSource: reviewsTable.urlSource,
      productId: reviewsTable.productId,
      productName: productsTable.name,
      placeName: placesTable.name,
      username: usersTable.name,
      city: placesTable.city,
      reviewedAt: reviewsTable.reviewedAt,
      isCurrent: reviewsTable.isCurrent,
      authorId: reviewsTable.authorId,
    })
    .from(reviewsTable)
    .where(and(...whereConditions))
    .innerJoin(productsTable, eq(reviewsTable.productId, productsTable.id))
    .innerJoin(usersTable, eq(reviewsTable.authorId, usersTable.id))
    .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
    .orderBy(
      desc(reviewsTable.reviewedAt),
      desc(reviewsTable.updatedAt),
      // order by ID for pagination
      asc(reviewsTable.id),
    )
    .limit(limit || pageSizeReviews)
    .offset(limit ? 0 : (page - 1) * pageSizeReviews);
}

async function reviews(page = 1, userIdFilter: string | null = null) {
  "use cache";
  cacheTag(
    cacheKeys.reviews,
    ...(userIdFilter ? [cacheKeys.user(userIdFilter)] : []),
  );
  console.debug(`🟦 QUERY reviews | User ID: ${userIdFilter}`);

  return await createReviewsQuery({
    page,
    userIdFilter,
    // When fetching reviews for a specific user, show ALL their reviews (not just current)
    // When fetching general reviews, only show current reviews
    onlyCurrentReviews: userIdFilter === null,
  });
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
  console.debug(`🟦 QUERY searchPlaces | Place: ${placeName}`);

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
  console.debug(`🟦 QUERY userForId | User ID: ${userId}`);

  const userForQuery = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (userForQuery.length > 1)
    throw new Error("Multiple users found for user ID: " + userId);
  if (!userForQuery[0]) notFound();

  return userForQuery[0];
}

async function rankingForProductId(productId: number) {
  "use cache";
  cacheTag(cacheKeys.rankings, cacheKeys.reviews, cacheKeys.ranking(productId));
  console.debug(`🟦 QUERY rankingForProductId | Product ${productId}`);

  // Create minimal filters and pass the specific product ID
  const filters: FiltersRankings = {
    categories: null,
    cities: null,
    critics: null,
    "rating-min": null,
    "rating-max": null,
    q: null,
  };

  const qRankings = subqueryRankings(filters, productId);
  const rankingsData = await db.select().from(qRankings);

  if (rankingsData.length === 0 || !rankingsData[0]) {
    throw new Error("No ranking data found for product ID: " + productId);
  }

  const ranking = rankingsData[0];

  const reviews = await createReviewsQuery({
    productIdsFilter: [productId],
    limit: numOfReviewsForAverage,
  });

  return {
    ...ranking,
    reviews: reviews,
  };
}

export const queries = {
  rankings,
  rankingsWithReviews,
  rankingForProductId,
  reviews,
  critics,
  searchPlaces,
  userForId,
};
