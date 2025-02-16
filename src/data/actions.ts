"use server";

import { FormStateCreateProduct } from "@/app/review/create/create-product-form.client";
import type { FormStateCreateReview } from "@/app/review/create/create-review-form.client";
import {
  placesTable,
  ProductCreateDb,
  productsTable,
  type Review,
  type ReviewCreateDb,
  reviewsTable,
  type ReviewUpdate,
  schemaCreateProduct,
  schemaCreateReview,
  schemaUpdateReview,
} from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { cacheKeys } from "./static";

const userIdFake = 1;

export type ReviewCreate = Omit<ReviewCreateDb, "authorId">;
export async function actionCreateReview(
  reviewToCreate: ReviewCreate,
  formState: FormStateCreateReview,
) {
  console.debug("🟦 ACTION create review");

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

  revalidateTag(cacheKeys.reviews);
  revalidateTag(cacheKeys.rankings);

  return {
    success: true,
  };
}

export async function actionUpdateReview(
  id: Review["id"],
  reviewToUpdate: ReviewUpdate,
) {
  console.debug("🟦 ACTION update review");

  const reviewParsed = schemaUpdateReview.parse(reviewToUpdate);

  await db
    .update(reviewsTable)
    .set({ ...reviewParsed, updatedAt: new Date() })
    .where(eq(reviewsTable.id, id));

  revalidateTag(cacheKeys.reviews);
  revalidateTag(cacheKeys.rankings);
  return true;
}

export type ProductCreate = ProductCreateDb;
export async function actionCreateProduct(
  productToCreate: ProductCreate,
  formState: FormStateCreateProduct,
) {
  console.debug("🟦 ACTION create product");

  const {
    success,
    error,
    data: productParsed,
  } = schemaCreateProduct.safeParse(productToCreate);

  if (!success) {
    return {
      errors: error.flatten().fieldErrors,
      values: formState,
    };
  }

  const productInsertQuery = db.$with("productInsertQuery").as(
    db
      .insert(productsTable)
      .values({
        ...productParsed,
        createdAt: new Date(),
        updatedAt: null,
      })
      .returning(),
  );
  const productCreatedRows = await db
    .with(productInsertQuery)
    .select({
      id: productInsertQuery.id,
      name: productInsertQuery.name,
      category: productInsertQuery.category,
      note: productInsertQuery.note,
      placeName: placesTable.name,
      city: placesTable.city,
    })
    .from(productInsertQuery)
    .leftJoin(placesTable, eq(productInsertQuery.placeId, placesTable.id));

  const productCreated = productCreatedRows[0];
  if (!productCreated) throw new Error("No created product");

  revalidateTag(cacheKeys.products);

  return {
    success: true,
    productCreated,
  };
}

export type ProductCreatedAction = NonNullable<
  Awaited<ReturnType<typeof actionCreateProduct>>["productCreated"]
>;
