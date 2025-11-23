"use server";

import type {
  FormStateCreatePlace,
  FormStateCreateProduct,
} from "@/app/review/create/create-product-form.client";
import { type FormStateChangeUsername } from "@/app/welcome/form-username-change";
import type { FormStateCreateReview } from "@/components/review-form.client";
import {
  lower,
  type PlaceCreateDb,
  placesTable,
  type ProductCreateDb,
  productsTable,
  type Review,
  type ReviewCreateDb,
  reviewsTable,
  type ReviewUpdateDb,
  schemaCreatePlace,
  schemaCreateProduct,
  schemaCreateReview,
  schemaUpdateReview,
  schemaUpdateUsername,
  usersTable,
  type UserUpdate,
} from "@/db/db-schema";
import { db } from "@/db/drizzle-setup";
import type {
  ActionDataExtract,
  ActionStateError,
  ActionStateSuccess,
} from "@/lib/action-utils";
import {
  assertAdmin,
  assertAuthenticated,
  assertUserForEntity,
  getUserAuthGated,
} from "@/lib/auth-server";
import { takeUniqueOrThrow } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { cacheKeys, usernamesReserved } from "./static";

export type PlaceCreate = PlaceCreateDb;

export async function actionCreatePlace(
  formState: FormStateCreatePlace,
  placeToCreate: PlaceCreate,
) {
  console.debug("🟦 ACTION create place");

  await assertAuthenticated(await headers());

  const {
    success,
    error,
    data: placeParsed,
  } = schemaCreatePlace.safeParse(placeToCreate);

  if (!success) {
    return {
      status: "ERROR",
      formState,
      errors: error.flatten().fieldErrors,
    } satisfies ActionStateError;
  }

  const placeCreatedRows = await db
    .insert(placesTable)
    .values({
      ...placeParsed,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: placesTable.id });

  const placeCreated = placeCreatedRows[0];
  if (!placeCreated) throw new Error("No created place");

  updateTag(cacheKeys.places);

  return {
    status: "SUCCESS",
    formState,
    data: {
      placeIdCreated: placeCreated.id,
    },
  } satisfies ActionStateSuccess;
}

export type ReviewCreate = Omit<ReviewCreateDb, "authorId" | "isCurrent">;
export async function actionCreateReview(
  formState: FormStateCreateReview,
  reviewToCreate: ReviewCreate,
) {
  console.debug("🟦 ACTION create review");

  const headersVar = await headers();
  const userAuth = await getUserAuthGated(headersVar);

  let authorId: string | null = null;

  // Check if admin is trying to override author
  const overwriteAuthorId = formState.overwriteAuthorId;

  if (overwriteAuthorId === null) {
    authorId = userAuth.id;
  } else {
    await assertAdmin(headersVar);

    const res = schemaCreateReview
      .pick({ authorId: true })
      .safeParse({ authorId: overwriteAuthorId });

    if (res.success) {
      console.debug(
        `Admin overriding author ID for review creation. New: ${res.data.authorId}`,
      );
      authorId = res.data.authorId;
    } else {
      return {
        status: "ERROR",
        formState,
        errors: {
          overwriteAuthorId: ["Invalid user ID"],
        } as Partial<Record<keyof FormStateCreateReview, string[]>>,
      } satisfies ActionStateError;
    }
  }

  const reviewToCreateFixed: ReviewCreateDb = {
    ...reviewToCreate,
    authorId,
    isCurrent: true,
  };

  const {
    success,
    error,
    data: reviewParsed,
  } = schemaCreateReview.safeParse(reviewToCreateFixed);

  if (!success) {
    return {
      status: "ERROR",
      formState,
      errors: error.flatten().fieldErrors,
    } satisfies ActionStateError;
  }

  await db.transaction(async (tx) => {
    // Mark any existing review as not current for the target author
    await tx
      .update(reviewsTable)
      .set({ isCurrent: false })
      .where(
        and(
          eq(reviewsTable.productId, reviewParsed.productId),
          eq(reviewsTable.authorId, authorId),
          eq(reviewsTable.isCurrent, true),
        ),
      );

    // Insert new review as current
    await tx.insert(reviewsTable).values({
      ...reviewParsed,
      authorId,
      isCurrent: true,
      reviewedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  updateTag(cacheKeys.reviews);
  updateTag(cacheKeys.rankings);

  return {
    status: "SUCCESS",
    formState,
    data: null,
  } satisfies ActionStateSuccess;
}

export async function actionUpdateReview(
  id: Review["id"],
  reviewToUpdate: ReviewUpdateDb,
) {
  console.debug("🟦 ACTION update review");

  await assertUserForEntity(await headers(), async () => {
    const reviewFromDb = await db
      .select({ authorId: reviewsTable.authorId })
      .from(reviewsTable)
      .where(eq(reviewsTable.id, id))
      .then((values) =>
        takeUniqueOrThrow(
          values,
          "Found more than one review with the same ID",
          "No review found with the given ID",
        ),
      );

    return reviewFromDb.authorId;
  });

  const reviewParsed = schemaUpdateReview.parse(reviewToUpdate);

  await db
    .update(reviewsTable)
    .set({ ...reviewParsed, updatedAt: new Date() })
    .where(eq(reviewsTable.id, id));

  updateTag(cacheKeys.reviews);
  updateTag(cacheKeys.rankings);
  return true;
}

export type ProductCreate = ProductCreateDb;

export type ProductCreatedByAction = ActionDataExtract<
  typeof actionCreateProduct
>["productCreated"];

export async function actionCreateProduct(
  formState: FormStateCreateProduct,
  productToCreate: ProductCreate,
) {
  console.debug("🟦 ACTION create product");

  await assertAuthenticated(await headers());

  const {
    success,
    error,
    data: productParsed,
  } = schemaCreateProduct.safeParse(productToCreate);

  if (!success) {
    return {
      status: "ERROR",
      formState,
      errors: error.flatten().fieldErrors,
    } satisfies ActionStateError;
  }

  const productInsertQuery = db.$with("productInsertQuery").as(
    db
      .insert(productsTable)
      .values({
        ...productParsed,
        createdAt: new Date(),
        updatedAt: new Date(),
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

  updateTag(cacheKeys.products);

  return {
    status: "SUCCESS",
    formState,
    data: {
      productCreated,
    },
  } satisfies ActionStateSuccess;
}

export type UsernameChange = Pick<UserUpdate, "name">;
export async function actionChangeUsername(
  formState: FormStateChangeUsername,
  userToUpdate: UsernameChange,
  formKeyName: keyof FormStateChangeUsername,
) {
  console.debug("🟦 ACTION change username");

  const userAuth = await getUserAuthGated(await headers());

  const {
    success,
    error,
    data: userParsed,
  } = schemaUpdateUsername.safeParse(userToUpdate);

  if (!success) {
    return {
      status: "ERROR",
      formState,
      errors: error.flatten().fieldErrors,
    } satisfies ActionStateError;
  }

  const usernameNew = userParsed.name;

  if (usernameNew === userAuth.username) {
    return {
      status: "ERROR",
      formState,
      errors: { [formKeyName]: ["Please select a new name"] },
    } satisfies ActionStateError;
  }

  if (
    usernamesReserved
      .map((username) => username.toLowerCase())
      .includes(usernameNew.toLocaleLowerCase())
  ) {
    return {
      status: "ERROR",
      formState,
      errors: { [formKeyName]: ["Username already taken"] },
    } satisfies ActionStateError;
  }

  const existingUser = await db
    .select()
    .from(usersTable)
    // `lower` is used to make the username case-insensitive
    .where(eq(lower(usersTable.name), usernameNew.toLowerCase()));

  if (existingUser.length > 0) {
    return {
      status: "ERROR",
      formState,
      errors: { [formKeyName]: ["Username already taken"] },
    } satisfies ActionStateError;
  }

  // try-catch for unique username constraint, just to make sure
  try {
    await db
      .update(usersTable)
      .set({ name: usernameNew })
      .where(eq(usersTable.id, userAuth.id));
  } catch (error) {
    console.error("Error updating username:", error);

    return {
      status: "ERROR",
      formState,
      errors: { [formKeyName]: ["Username already taken"] },
    } satisfies ActionStateError;
  }

  return {
    status: "SUCCESS",
    formState,
    data: null,
  } satisfies ActionStateSuccess;
}
