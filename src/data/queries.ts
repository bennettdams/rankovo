import {
  placesTable,
  productsTable,
  type Review,
  reviewsTable,
} from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import type { FiltersRankings } from "@/lib/schemas";
import { desc, eq, inArray } from "drizzle-orm";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { type Category, dataKeys } from "./static";

export type Ranking = {
  id: number;
  placeName: string;
  rating: number;
  productId: number;
  productName: string;
  productNote: string | null;
  productCategory: Category;
  numOfReviews: number;
  lastReviewedAt: Date;
  reviews: {
    id: number;
    rating: number;
    note: string | null;
    reviewedAt: Date;
  }[];
};

async function rankings(filters: FiltersRankings) {
  "use cache";
  cacheTag(dataKeys.rankings);
  console.debug("🟦 QUERY rankings");

  await new Promise((r) => setTimeout(r, 1000));

  const reviewsWithProducts = await db
    .select({
      id: reviewsTable.id,
      productId: reviewsTable.productId,
      rating: reviewsTable.rating,
      note: reviewsTable.note,
      productName: productsTable.name,
      productCategory: productsTable.category,
      productNote: productsTable.note,
      placeName: placesTable.name,
      reviewedAt: reviewsTable.reviewedAt,
    })
    .from(reviewsTable)
    .where(
      !filters.categories
        ? undefined
        : inArray(productsTable.category, filters.categories),
    )
    .innerJoin(productsTable, eq(reviewsTable.productId, productsTable.id))
    .innerJoin(placesTable, eq(productsTable.placeId, placesTable.id));

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
      ranking.reviews.push(review);
    } else {
      rankingsMap.set(review.productId, {
        id: key,
        placeName: review.placeName,
        rating: review.rating,
        productId: review.productId,
        productName: review.productName,
        productNote: review.productNote,
        productCategory: review.productCategory,
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

async function reviews() {
  "use cache";
  cacheTag(dataKeys.reviews);
  console.debug("🟦 QUERY reviews");

  return await db
    .select()
    .from(reviewsTable)
    .orderBy(desc(reviewsTable.reviewedAt), desc(reviewsTable.updatedAt));
}

export const queries = { rankings, reviews };
