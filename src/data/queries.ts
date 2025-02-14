import type { FiltersRankings } from "@/app/page";
import {
  criticsTable,
  placesTable,
  productsTable,
  reviewsTable,
  usersTable,
  type Review,
} from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  lte,
  sql,
  type SQL,
} from "drizzle-orm";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { dataKeys, minCharsSearch, type Category, type City } from "./static";

export type Ranking = {
  id: number;
  rating: number;
  productId: number;
  productName: string;
  productNote: string | null;
  productCategory: Category;
  placeName: string | null;
  city: City | null;
  numOfReviews: number;
  lastReviewedAt: Date;
  reviews: {
    id: number;
    rating: number;
    note: string | null;
    username: string | null;
    reviewedAt: Date;
  }[];
};

// WIP query for rankings
export async function test() {
  const latestReviews = db
    .select({
      productId: reviewsTable.productId,
      authorId: reviewsTable.authorId,
      latestReviewedAt: sql`MAX(${reviewsTable.reviewedAt})`.as(
        "latestReviewedAt",
      ),
    })
    .from(reviewsTable)
    .groupBy(reviewsTable.productId, reviewsTable.authorId)
    .as("latestReviews");

  // Join products with the filtered reviews and calculate the average rating
  const averageRatings = db
    .select({
      productId: productsTable.id,
      productName: productsTable.name,
      averageRating: sql`AVG(${reviewsTable.rating})`,
    })
    .from(productsTable)
    .leftJoin(latestReviews, eq(productsTable.id, latestReviews.productId))
    .leftJoin(
      reviewsTable,
      and(
        eq(productsTable.id, reviewsTable.productId),
        eq(reviewsTable.reviewedAt, latestReviews.latestReviewedAt),
        eq(reviewsTable.authorId, latestReviews.authorId),
      ),
    )
    .groupBy(productsTable.id, productsTable.name)
    .orderBy(productsTable.id);

  return averageRatings;
}

async function rankings(filters: FiltersRankings) {
  "use cache";
  cacheTag(dataKeys.rankings);
  console.debug("🟦 QUERY rankings");

  await new Promise((r) => setTimeout(r, 1000));

  const filtersSQL: SQL[] = [];
  if (filters.categories)
    filtersSQL.push(inArray(productsTable.category, filters.categories));
  if (filters.cities)
    filtersSQL.push(inArray(placesTable.city, filters.cities));
  if (filters.critics)
    filtersSQL.push(inArray(usersTable.name, filters.critics));
  if (!!filters.productName && filters.productName.length >= minCharsSearch)
    filtersSQL.push(ilike(productsTable.name, `%${filters.productName}%`));

  // TODO: Make sure to only take the latest review of each user
  const reviewsWithProducts = await db
    .select({
      id: reviewsTable.id,
      productId: reviewsTable.productId,
      rating: reviewsTable.rating,
      note: reviewsTable.note,
      productName: productsTable.name,
      productCategory: productsTable.category,
      productNote: productsTable.note,
      username: usersTable.name,
      placeName: placesTable.name,
      city: placesTable.city,
      reviewedAt: reviewsTable.reviewedAt,
    })
    .from(reviewsTable)
    .where(and(...filtersSQL))
    // Ordering is not done here for performance reasons. We later cut off the reviews and then it is sorted.
    // .orderBy(desc(reviewsTable.reviewedAt))
    // -----------
    // Joins ordered from largest to smallest tables for better performance
    .innerJoin(productsTable, eq(reviewsTable.productId, productsTable.id))
    .innerJoin(usersTable, eq(usersTable.id, reviewsTable.authorId))
    // LEFT JOIN at the end as it's less restrictive
    .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id));

  const rankingsMap = new Map<Review["productId"], Ranking>();

  reviewsWithProducts.forEach((review) => {
    const key = review.productId;
    const ranking = rankingsMap.get(key);

    if (ranking) {
      // We recalculate the rating for every iteration. It should be checked whether just summing up and calculating the
      // average later is more efficient (as it would probably need more object creation).
      ranking.rating =
        Math.round(
          ((ranking.rating * ranking.numOfReviews + review.rating) /
            (ranking.numOfReviews + 1)) *
            100,
        ) / 100;
      ranking.numOfReviews++;

      // We don't want to show all reviews for each ranking, so we only keep the last 20 reviews. This could be done without
      // limit via pagination instead in the future, but it would need to have a way to apply it to a specific ranking – maybe with an
      // intercepting route.
      if (ranking.reviews.length <= 20) ranking.reviews.push(review);
    } else {
      rankingsMap.set(review.productId, {
        id: key,
        placeName: review.placeName,
        rating: review.rating,
        productId: review.productId,
        productName: review.productName,
        productNote: review.productNote,
        productCategory: review.productCategory,
        city: review.city,
        numOfReviews: 1,
        lastReviewedAt: review.reviewedAt,
        reviews: [review],
      });
    }
  });

  const rankings = Array.from(rankingsMap.values());

  /*
   * These filters are not applied in the SQL query because users are just supposed to filter for visbility,
   * but the actual reviews are still needed to calculate the average rating.
   */
  const rankingsFiltered = rankings.filter((ranking) => {
    if (!!filters.ratingMin && ranking.rating < filters.ratingMin) {
      return false;
    }
    if (!!filters.ratingMax && ranking.rating > filters.ratingMax) {
      return false;
    }

    return true;
  });

  return rankingsFiltered.sort((a, b) => b.rating - a.rating).slice(0, 10);
}

const pageSizeReviews = 20;

async function reviews(page = 1) {
  "use cache";
  cacheTag(dataKeys.reviews);
  console.debug("🟦 QUERY reviews");

  return await db
    .select({
      id: reviewsTable.id,
      rating: reviewsTable.rating,
      note: reviewsTable.note,
      createdAt: reviewsTable.createdAt,
      updatedAt: reviewsTable.updatedAt,
      productName: productsTable.name,
      placeName: placesTable.name,
      username: usersTable.name,
      city: placesTable.city,
      reviewedAt: reviewsTable.reviewedAt,
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
  cacheTag(dataKeys.critics);
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

  const numOfReviews = 10;

  /** products & places for given filters */
  const queryProductsFiltered = db
    .select({
      id: productsTable.id,
    })
    .from(productsTable)
    .where(and(...filtersSQL))
    .leftJoin(placesTable, eq(productsTable.placeId, placesTable.id))
    .as("queryProductsFiltered");

  /** 10 last reviews for each product */
  const queryReviewsRanked = db
    .select({
      productId: reviewsTable.productId,
      rating: reviewsTable.rating,
      rowNumber: sql<number>`row_number() over (
        partition by ${reviewsTable.productId}
        order by ${reviewsTable.reviewedAt} desc
      )`.as("rowNumber"),
    })
    .from(reviewsTable)
    .innerJoin(
      queryProductsFiltered,
      eq(reviewsTable.productId, queryProductsFiltered.id),
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
      averageRating: sql`avg(${queryReviewsRanked.rating})`
        .mapWith(Number)
        .as("averageRating"),
    })
    .from(productsTable)
    .innerJoin(
      queryReviewsRanked,
      and(
        eq(productsTable.id, queryReviewsRanked.productId),
        lte(queryReviewsRanked.rowNumber, numOfReviews),
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
      averageRating: queryProductsAggregated.averageRating,
    })
    .from(queryProductsAggregated)
    .orderBy(desc(queryProductsAggregated.averageRating))
    .leftJoin(placesTable, eq(queryProductsAggregated.placeId, placesTable.id));

  return await queryProductsFinal;
}

export type ProductSearchQuery = Awaited<
  ReturnType<typeof searchProduct>
>[number];

async function searchPlaces(placeName: string) {
  // "use cache";
  // cacheTag(....);
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
