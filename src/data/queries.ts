import {
  criticsTable,
  placesTable,
  productsTable,
  reviewsTable,
  usersTable,
  type Review,
} from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import type { FiltersRankings } from "@/lib/schemas";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { dataKeys, type Category } from "./static";

export type Ranking = {
  id: number;
  rating: number;
  productId: number;
  productName: string;
  productNote: string | null;
  productCategory: Category;
  placeName: string | null;
  city: string | null;
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

  const sub = await db.select().from(latestReviews);
  console.log("sub", sub);

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
    .where(
      !filters.categories
        ? undefined
        : inArray(productsTable.category, filters.categories),
    )
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

  return rankingsFiltered.sort((a, b) => b.rating - a.rating);
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
      username: usersTable.name,
      reviewedAt: reviewsTable.reviewedAt,
    })
    .from(reviewsTable)
    .innerJoin(productsTable, eq(reviewsTable.productId, productsTable.id))
    .innerJoin(usersTable, eq(reviewsTable.authorId, usersTable.id))
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

export const queries = { rankings, reviews, critics };
