"use server";

import { type Review, type ReviewCreate, reviewsTable } from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { dataKeys } from "./static";

export async function actionCreateReview(
  reviewToCreate: Omit<ReviewCreate, "reviewedAt" | "createdAt" | "updatedAt">,
) {
  console.debug("🟦 ACTION create review");

  await new Promise((r) => setTimeout(r, 1000));

  const reviewToCreateDb: ReviewCreate = {
    ...reviewToCreate,
    reviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: null,
  };

  await db.insert(reviewsTable).values(reviewToCreateDb);

  revalidateTag(dataKeys.reviews);
  return true;
}

export async function actionUpdateReview(
  reviewToUpdate: Omit<Review, "reviewedAt" | "createdAt" | "updatedAt">,
) {
  console.debug("🟦 ACTION update review");

  await new Promise((r) => setTimeout(r, 1000));
  const { id, ...rest } = reviewToUpdate;

  await db
    .update(reviewsTable)
    .set({ ...rest, updatedAt: new Date() })
    .where(eq(reviewsTable.id, id));

  revalidateTag(dataKeys.reviews);
  return true;
}
