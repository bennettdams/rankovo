"use server";

import { ReviewCreate, reviewsTable } from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import { revalidateTag } from "next/cache";
import { type Ranking, rankings } from "./mock-data";
import { dataKeys } from "./static";

export async function actionUpdateRanking(rankingUpdated: Ranking) {
  console.debug("🟦 ACTION update ranking");

  await new Promise((r) => setTimeout(r, 1000));

  const index = rankings.findIndex(
    (ranking) => ranking.id === rankingUpdated.id,
  );
  if (index !== -1) {
    rankings[index] = rankingUpdated;
  }

  revalidateTag(dataKeys.rankings);
  return true;
}

export async function actionCreateReview(
  review: Omit<ReviewCreate, "reviewedAt">,
) {
  console.debug("🟦 ACTION create review");

  await new Promise((r) => setTimeout(r, 1000));
  const reviewToCreate: ReviewCreate = {
    ...review,
    reviewedAt: new Date(),
  };

  await db.insert(reviewsTable).values(reviewToCreate);

  revalidateTag(dataKeys.reviews);
  return true;
}
