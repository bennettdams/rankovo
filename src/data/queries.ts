import type { FiltersRankings } from "@/app/page";
import {
  criticsTable,
  lower,
  placeCitiesTable,
  placesTable,
  productsTable,
  reviewsTable,
  usersTable,
} from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import { assertAdmin } from "@/lib/auth-server";
import {
  pageFromSearchParam,
  pageOffset,
  type PageSearchParam,
} from "@/lib/pagination";
import {
  and,
  asc,
  avg,
  count,
  desc,
  eq,
  exists,
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
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { sqlCitiesForPlace } from "./place-cities";
import { cacheKeys, categoriesActive, minCharsSearch } from "./static";

/**
 * Pattern for a case-insensitive "contains" `ILIKE`.
 *
 * Postgres `ILIKE` treats `%` as "any text", `_` as "any one character", and
 * `\` as the default escape. Wrapping the raw query in `%…%` would turn those
 * characters into wildcards: searching `100%` would match `1000` and
 * `100 extra`, not names that contain a percent sign.
 *
 * Escape `\`, `%`, and `_` first, then wrap in `%…%`, so search means "name
 * contains this text".
 *
 * @example
 * ilikeContains("döner")
 * // "%döner%" — still a contains search
 *
 * @example
 * ilikeContains("100%")
 * // "%100\\%%" — matches "100%", not "100" + anything
 *
 * @example
 * ilikeContains("A_B")
 * // "%A\\_B%" — matches "A_B", not "AXB"
 *
 * @example
 * ilike(productsTable.name, ilikeContains(q))
 */
export function ilikeContains(value: string): string {
  const escaped = value
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");

  return `%${escaped}%`;
}

const numOfReviewsForAverage = 20;

/**
 * `EXISTS (SELECT place_id FROM place_cities … WHERE …)` — true if the outer
 * place has at least one matching city row.
 *
 * Why EXISTS instead of joining `place_cities` in the main FROM?
 * - A join would duplicate product rows (one per matching city).
 * - EXISTS only checks “is there ≥1 matching row?” and keeps one product row.
 *
 * The subquery selects a real column (`placeId`) so the builder stays typed;
 * EXISTS ignores the selected values and only cares whether any row matches.
 * `eq(placeCitiesTable.placeId, placesTable.id)` correlates to the outer
 * `places` row (the parent query must already join `places`).
 */
function existsPlaceCityMatching(cityCondition: SQL) {
  return exists(
    db
      .select({ placeId: placeCitiesTable.placeId })
      .from(placeCitiesTable)
      .where(and(eq(placeCitiesTable.placeId, placesTable.id), cityCondition)),
  );
}

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
    const wildcardTerm = ilikeContains(term);

    return or(
      // PRODUCTS: Always search in product fields (these are never null)
      ilike(productsTable.name, wildcardTerm),
      ilike(productsTable.note, wildcardTerm),
      ilike(productsTable.category, wildcardTerm),
      // PLACES: Only search in place fields if they exist (not null)
      and(isNotNull(placesTable.name), ilike(placesTable.name, wildcardTerm)),
      // Match if any linked city name contains the search term (see existsPlaceCityMatching).
      existsPlaceCityMatching(ilike(placeCitiesTable.city, wildcardTerm)),
    );
  });

  return searchConditions;
}

async function rankingsWithReviews(filters: FiltersRankings) {
  "use cache";
  cacheTag(cacheKeys.rankings, cacheKeys.reviews);
  console.debug("🟦 QUERY rankingsWithReviews", JSON.stringify(filters));

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
    // SPECIFIC PRODUCT ID CASE: Only filter by the product ID, ignore all other filters
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
      // Place matches if any of its cities is in the selected filter set.
      // See existsPlaceCityMatching for why we use EXISTS here.
      sqlFiltersPlaces.push(
        existsPlaceCityMatching(inArray(placeCitiesTable.city, filters.cities)),
      );
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

  const sqlNumOfReviews = sql<number>`max(${qReviewsWithAnalytics.totalReviews})`;

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
        numOfReviews: sqlNumOfReviews.mapWith(Number).as("numOfReviews"),
      })
      .from(qReviewsWithAnalytics)
      .where(lte(qReviewsWithAnalytics.rowNumber, numOfReviewsForAverage))
      .groupBy(qReviewsWithAnalytics.productId)
      .having(
        filters["reviews-min"] === null
          ? undefined
          : gte(sqlNumOfReviews, filters["reviews-min"]),
      ),
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
  const citiesHack = "cities";

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
      [citiesHack]: sqlCitiesForPlace().as(citiesHack),
      [placeNameHack]: sql<string | null>`${placesTable.name}`.as(
        placeNameHack,
      ),
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

  const citiesHack = "cities";

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
      [citiesHack]: sqlCitiesForPlace().as(citiesHack),
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
    filtersSQL.push(ilike(placesTable.name, ilikeContains(placeName)));

  const citiesHack = "cities";

  return await db
    .select({
      id: placesTable.id,
      name: placesTable.name,
      [citiesHack]: sqlCitiesForPlace().as(citiesHack),
    })
    .from(placesTable)
    .where(and(...filtersSQL));
}

export type PlaceSearchQuery = Awaited<ReturnType<typeof searchPlaces>>[number];

async function searchProducts(searchQuery: string) {
  "use cache";
  cacheTag(cacheKeys.products);
  console.debug(`🟦 QUERY searchProducts | Query: ${searchQuery}`);

  const searchConditions = conditionsSearchProducts(searchQuery);

  if (!searchConditions) {
    return [];
  }

  const placeNameHack = "placeName";
  const citiesHack = "cities";

  return await db
    .select({
      productId: productsTable.id,
      productName: productsTable.name,
      productCategory: productsTable.category,
      productNote: productsTable.note,
      placeId: productsTable.placeId,
      [placeNameHack]: sql<string | null>`${placesTable.name}`.as(
        placeNameHack,
      ),
      [citiesHack]: sqlCitiesForPlace().as(citiesHack),
    })
    .from(productsTable)
    .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
    .where(and(...searchConditions))
    .orderBy(asc(productsTable.name))
    .limit(10);
}

export type ProductSearchQuery = Awaited<
  ReturnType<typeof searchProducts>
>[number];

async function userForId(userId: string) {
  "use cache";
  cacheTag(cacheKeys.user(userId));
  console.debug(`🟦 QUERY userForId | User ID: ${userId}`);

  const userForQuery = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (userForQuery.length > 1)
    throw new Error("Multiple users found for user ID: " + userId);
  if (!userForQuery[0]) notFound();

  return userForQuery[0];
}
export type UserForId = Awaited<ReturnType<typeof userForId>>;

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
    "reviews-min": null,
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

const pageSizeAdmin = 25;

async function asAdmin<T>(query: () => Promise<T>): Promise<T> {
  await assertAdmin(await headers());
  return query();
}

function wrapAdmin<TArgs extends unknown[], TResult>(
  query: (...args: TArgs) => Promise<TResult>,
) {
  return (...args: TArgs) => asAdmin(() => query(...args));
}

async function queryAdminProducts({
  q,
  page,
}: {
  q: string | null;
  page: PageSearchParam;
}) {
  "use cache";
  cacheTag(cacheKeys.products, cacheKeys.places);

  const pageNumber = pageFromSearchParam(page);
  const where = q ? ilike(productsTable.name, ilikeContains(q)) : undefined;

  const citiesHack = "cities";

  const [items, totalRows] = await Promise.all([
    db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        category: productsTable.category,
        placeName: placesTable.name,
        [citiesHack]: sqlCitiesForPlace().as(citiesHack),
      })
      .from(productsTable)
      .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
      .where(where)
      .orderBy(asc(lower(productsTable.name)), asc(productsTable.id))
      .limit(pageSizeAdmin)
      .offset(pageOffset(pageNumber, pageSizeAdmin)),
    db.select({ value: count() }).from(productsTable).where(where),
  ]);

  return {
    items,
    total: totalRows[0]?.value ?? 0,
    pageSize: pageSizeAdmin,
  };
}

async function queryAdminPlaces({
  q,
  page,
}: {
  q: string | null;
  page: PageSearchParam;
}) {
  "use cache";
  cacheTag(cacheKeys.places);

  const pageNumber = pageFromSearchParam(page);
  const where = q ? ilike(placesTable.name, ilikeContains(q)) : undefined;

  const citiesHack = "cities";

  const [items, totalRows] = await Promise.all([
    db
      .select({
        id: placesTable.id,
        name: placesTable.name,
        [citiesHack]: sqlCitiesForPlace().as(citiesHack),
      })
      .from(placesTable)
      .where(where)
      .orderBy(asc(lower(placesTable.name)), asc(placesTable.id))
      .limit(pageSizeAdmin)
      .offset(pageOffset(pageNumber, pageSizeAdmin)),
    db.select({ value: count() }).from(placesTable).where(where),
  ]);

  return {
    items,
    total: totalRows[0]?.value ?? 0,
    pageSize: pageSizeAdmin,
  };
}

async function queryAdminProductForId(id: number) {
  "use cache";
  cacheTag(cacheKeys.products, cacheKeys.places);

  const citiesHack = "cities";

  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      note: productsTable.note,
      category: productsTable.category,
      placeId: productsTable.placeId,
      placeName: placesTable.name,
      [citiesHack]: sqlCitiesForPlace().as(citiesHack),
    })
    .from(productsTable)
    .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
    .where(eq(productsTable.id, id));

  return rows[0] ?? null;
}

async function queryAdminPlaceForId(id: number) {
  "use cache";
  cacheTag(cacheKeys.places);

  const citiesHack = "cities";

  const rows = await db
    .select({
      id: placesTable.id,
      name: placesTable.name,
      [citiesHack]: sqlCitiesForPlace().as(citiesHack),
    })
    .from(placesTable)
    .where(eq(placesTable.id, id));

  return rows[0] ?? null;
}

export type AdminProduct = NonNullable<
  Awaited<ReturnType<typeof queryAdminProductForId>>
>;

export type AdminPlace = NonNullable<
  Awaited<ReturnType<typeof queryAdminPlaceForId>>
>;

export const queries = {
  rankings,
  rankingsWithReviews,
  rankingForProductId,
  reviews,
  critics,
  searchPlaces,
  searchProducts,
  userForId,
  adminProducts: wrapAdmin(queryAdminProducts),
  adminPlaces: wrapAdmin(queryAdminPlaces),
  adminProductForId: wrapAdmin(queryAdminProductForId),
  adminPlaceForId: wrapAdmin(queryAdminPlaceForId),
};
