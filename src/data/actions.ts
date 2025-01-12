"use server";

import {
  type Review,
  type ReviewCreate,
  reviewsTable,
  type ReviewUpdate,
  schemaCreateReview,
  schemaUpdateReview,
} from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { dataKeys } from "./static";

export async function actionCreateReview(reviewToCreate: ReviewCreate) {
  console.debug("🟦 ACTION create review");

  await new Promise((r) => setTimeout(r, 1000));

  const reviewParsed = schemaCreateReview.parse(reviewToCreate);

  await db.insert(reviewsTable).values({
    ...reviewParsed,
    reviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: null,
  });

  revalidateTag(dataKeys.reviews);
  return true;
}

export async function actionUpdateReview(
  id: Review["id"],
  reviewToUpdate: ReviewUpdate,
) {
  console.debug("🟦 ACTION update review");

  await new Promise((r) => setTimeout(r, 1000));

  const reviewParsed = schemaUpdateReview.parse(reviewToUpdate);

  await db
    .update(reviewsTable)
    .set({ ...reviewParsed, updatedAt: new Date() })
    .where(eq(reviewsTable.id, id));

  revalidateTag(dataKeys.reviews);
  return true;
}
