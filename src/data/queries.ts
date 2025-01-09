import { reviewsTable } from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import type { FiltersRankings } from "@/lib/schemas";
import { desc } from "drizzle-orm";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { rankings as rankingsMock } from "./mock-data";
import { dataKeys } from "./static";

async function rankings(filters: FiltersRankings) {
  "use cache";
  cacheTag(dataKeys.rankings);
  console.debug("🟦 QUERY rankings");

  await new Promise((r) => setTimeout(r, 1000));

  const rankingsFiltered = rankingsMock.filter((ranking) => {
    if (
      !!filters.categories &&
      !filters.categories.includes(ranking.productCategory)
    ) {
      return false;
    }
    if (!!filters.ratingMin && ranking.rating < filters.ratingMin) {
      return false;
    }
    if (!!filters.ratingMax && ranking.rating > filters.ratingMax) {
      return false;
    }

    return true;
  });

  return rankingsFiltered;
}

async function reviews() {
  "use cache";
  cacheTag(dataKeys.reviews);
  console.debug("🟦 QUERY reviews");

  return await db
    .select()
    .from(reviewsTable)
    .orderBy(desc(reviewsTable.reviewedAt));
}

export const queries = { rankings, reviews };
