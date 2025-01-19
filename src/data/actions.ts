"use server";

import type { FormState } from "@/app/review/create/page";
import {
  type Review,
  type ReviewCreateDb,
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

export type ReviewCreate = Omit<ReviewCreateDb, "authorId">;
export async function actionCreateReview(
  reviewToCreate: ReviewCreate,
  formState: FormState,
) {
  console.debug("🟦 ACTION create review");

  await new Promise((r) => setTimeout(r, 1000));

  const reviewToCreateFixed: ReviewCreateDb = {
    ...reviewToCreate,
    authorId: userIdFake,
  };
  const {
    success,
    error,
    data: reviewParsed,
  } = schemaCreateReview.safeParse(reviewToCreateFixed);

  if (!success) {
    return {
      errors: error.flatten().fieldErrors,
      values: formState,
    };
  }

  await db.insert(reviewsTable).values({
    ...reviewParsed,
    authorId: userIdFake,
    reviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: null,
  });

  revalidateTag(dataKeys.reviews);

  return {
    success: true,
  };
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
