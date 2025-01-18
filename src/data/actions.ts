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

const userIdFake = 1;

export async function actionCreateReview(
  reviewToCreate: Omit<ReviewCreate, "authorId">,
) {
  console.debug("🟦 ACTION create review");

  await new Promise((r) => setTimeout(r, 1000));

  const reviewToCreateFixed: ReviewCreate = {
    ...reviewToCreate,
    authorId: userIdFake,
  };
  const reviewParsed = schemaCreateReview.parse(reviewToCreateFixed);

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
