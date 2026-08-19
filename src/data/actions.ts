"use server";

import type {
  FormStateUpdatePlace,
  FormStateUpdateProduct,
} from "@/app/admin/admin.client";
import type {
  FormStateCreatePlace,
  FormStateCreateProduct,
} from "@/app/review/create/create-product-form.client";
import { type FormStateChangeUsername } from "@/app/welcome/form-username-change";
import type { FormStateCreateReview } from "@/components/review-form.client";
import {
  lower,
  placeCitiesTable,
  type PlaceCreateDb,
  placesTable,
  type PlaceUpdateDb,
  type ProductCreateDb,
  productsTable,
  type ProductUpdateDb,
  type Review,
  type ReviewCreate,
  type ReviewCreateDb,
  reviewsTable,
  type ReviewUpdateDb,
  schemaCreatePlace,
  schemaCreateProduct,
  schemaCreateReview,
  schemaPlaceId,
  schemaProductId,
  schemaUpdatePlace,
  schemaUpdateProduct,
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
import { sqlCitiesForPlace } from "./place-cities";
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

  const { cities: citiesSelected, ...placeValues } = placeParsed;
  const citiesUnique = [...new Set(citiesSelected)];

  const placeCreated = await db.transaction(async (tx) => {
    const placeCreatedRows = await tx
      .insert(placesTable)
      .values({
        ...placeValues,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: placesTable.id });

    const place = placeCreatedRows[0];
    if (!place) return null;

    if (citiesUnique.length > 0) {
      await tx.insert(placeCitiesTable).values(
        citiesUnique.map((city) => ({
          placeId: place.id,
          city,
        })),
      );
    }

    return place;
  });

  if (!placeCreated) {
    return {
      status: "ERROR",
      formState,
      rootErrors: ["Restaurant konnte nicht gespeichert werden"],
    } satisfies ActionStateError;
  }

  updateTag(cacheKeys.places);

  return {
    status: "SUCCESS",
    formState,
    data: {
      placeIdCreated: placeCreated.id,
    },
  } satisfies ActionStateSuccess;
}

export async function actionAdminUpdatePlace(
  formState: FormStateUpdatePlace,
  placeId: number,
  placeToUpdate: PlaceUpdateDb,
) {
  await assertAdmin(await headers());

  const placeIdResult = schemaPlaceId.safeParse(placeId);
  if (!placeIdResult.success) {
    return {
      status: "ERROR",
      formState,
      rootErrors: ["Ungültige Restaurant-ID"],
    } satisfies ActionStateError<FormStateUpdatePlace>;
  }

  const placeResult = schemaUpdatePlace.safeParse(placeToUpdate);
  if (!placeResult.success) {
    return {
      status: "ERROR",
      formState,
      errors: placeResult.error.flatten().fieldErrors,
    } satisfies ActionStateError<FormStateUpdatePlace>;
  }

  const { name, cities: selectedCities } = placeResult.data;
  const uniqueCities = [...new Set(selectedCities)];
  const placeUpdated = await db.transaction(async (tx) => {
    const updatedRows = await tx
      .update(placesTable)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(placesTable.id, placeIdResult.data))
      .returning({ id: placesTable.id });

    const updatedPlace = updatedRows[0];
    if (!updatedPlace) return false;

    await tx
      .delete(placeCitiesTable)
      .where(eq(placeCitiesTable.placeId, updatedPlace.id));

    if (uniqueCities.length > 0) {
      await tx.insert(placeCitiesTable).values(
        uniqueCities.map((city) => ({
          placeId: updatedPlace.id,
          city,
        })),
      );
    }

    return true;
  });

  if (!placeUpdated) {
    return {
      status: "ERROR",
      formState,
      rootErrors: ["Restaurant wurde nicht gefunden"],
    } satisfies ActionStateError<FormStateUpdatePlace>;
  }

  updateTag(cacheKeys.places);
  updateTag(cacheKeys.products);
  updateTag(cacheKeys.rankings);
  updateTag(cacheKeys.reviews);

  return {
    status: "SUCCESS",
    formState,
    data: null,
  } satisfies ActionStateSuccess;
}

export async function actionCreateReview(
  formState: FormStateCreateReview,
  reviewToCreate: ReviewCreate,
) {
  console.debug("🟦 ACTION create review");

  const headersVar = await headers();
  const userAuth = await getUserAuthGated(headersVar);

  const {
    success,
    data: reviewParsed,
    error,
  } = schemaCreateReview.safeParse(reviewToCreate);

  if (!success) {
    return {
      status: "ERROR",
      formState,
      errors: error.flatten().fieldErrors,
    } satisfies ActionStateError;
  }

  const { overwriteAuthorId, ...reviewFields } = reviewParsed;

  // Check if admin is trying to override author
  let authorId: string;

  if (overwriteAuthorId === null) {
    authorId = userAuth.id;
  } else {
    await assertAdmin(headersVar);
    console.debug(
      `Admin overriding author ID for review creation. New: ${overwriteAuthorId}`,
    );
    authorId = overwriteAuthorId;
  }

  // it is important to use the "DB" type here to avoid forgetting fields that were not part of the form
  const reviewToCreateFixed: ReviewCreateDb = {
    ...reviewFields,
    authorId,
    isCurrent: true,
  };

  await db.transaction(async (tx) => {
    // Mark any existing review as not current for the target author
    await tx
      .update(reviewsTable)
      .set({ isCurrent: false })
      .where(
        and(
          eq(reviewsTable.productId, reviewToCreateFixed.productId),
          eq(reviewsTable.authorId, authorId),
          eq(reviewsTable.isCurrent, true),
        ),
      );

    // Insert new review as current
    await tx.insert(reviewsTable).values({
      ...reviewToCreateFixed,
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
      cities: sqlCitiesForPlace(),
    })
    .from(productInsertQuery)
    .leftJoin(placesTable, eq(productInsertQuery.placeId, placesTable.id));

  const productCreated = productCreatedRows[0];
  if (!productCreated) {
    return {
      status: "ERROR",
      formState,
      rootErrors: ["Produkt konnte nicht gespeichert werden"],
    } satisfies ActionStateError;
  }

  updateTag(cacheKeys.products);

  return {
    status: "SUCCESS",
    formState,
    data: {
      productCreated,
    },
  } satisfies ActionStateSuccess;
}

export async function actionAdminUpdateProduct(
  formState: FormStateUpdateProduct,
  productId: number,
  productToUpdate: ProductUpdateDb,
) {
  await assertAdmin(await headers());

  const productIdResult = schemaProductId.safeParse(productId);
  if (!productIdResult.success) {
    return {
      status: "ERROR",
      formState,
      rootErrors: ["Ungültige Produkt-ID"],
    } satisfies ActionStateError<FormStateUpdateProduct>;
  }

  const productResult = schemaUpdateProduct.safeParse(productToUpdate);
  if (!productResult.success) {
    return {
      status: "ERROR",
      formState,
      errors: productResult.error.flatten().fieldErrors,
    } satisfies ActionStateError<FormStateUpdateProduct>;
  }

  const { name, note, placeId } = productResult.data;

  const updateResult = await db.transaction(async (tx) => {
    if (placeId !== null) {
      const places = await tx
        .select({ id: placesTable.id })
        .from(placesTable)
        .where(eq(placesTable.id, placeId))
        .limit(1);

      if (places.length === 0) return "place-not-found" as const;
    }

    const updatedRows = await tx
      .update(productsTable)
      .set({
        name,
        note,
        placeId,
        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, productIdResult.data))
      .returning({ id: productsTable.id });

    if (!updatedRows[0]) return "product-not-found" as const;
    return "updated" as const;
  });

  if (updateResult === "place-not-found") {
    return {
      status: "ERROR",
      formState,
      errors: {
        placeId: ["Restaurant wurde nicht gefunden"],
      },
    } satisfies ActionStateError<FormStateUpdateProduct>;
  }

  if (updateResult === "product-not-found") {
    return {
      status: "ERROR",
      formState,
      rootErrors: ["Produkt wurde nicht gefunden"],
    } satisfies ActionStateError<FormStateUpdateProduct>;
  }

  updateTag(cacheKeys.products);
  updateTag(cacheKeys.rankings);
  updateTag(cacheKeys.reviews);

  return {
    status: "SUCCESS",
    formState,
    data: null,
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
      errors: { [formKeyName]: ["Bitte wähle einen neuen Namen"] },
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
      errors: { [formKeyName]: ["Benutzername bereits vergeben"] },
    } satisfies ActionStateError;
  }

  const existingUser = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    // `lower` is used to make the username case-insensitive
    .where(eq(lower(usersTable.name), usernameNew.toLowerCase()));

  if (existingUser.length > 0) {
    return {
      status: "ERROR",
      formState,
      errors: { [formKeyName]: ["Benutzername bereits vergeben"] },
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
      rootErrors: ["Nutzername konnte nicht gespeichert werden"],
    } satisfies ActionStateError;
  }

  return {
    status: "SUCCESS",
    formState,
    data: null,
  } satisfies ActionStateSuccess;
}
