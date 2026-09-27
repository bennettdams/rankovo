"use server";

import type {
  FormStateUpdatePlace,
  FormStateUpdateProduct,
} from "@/app/admin/admin.shared";
import { visitErrorsByReviewId } from "@/app/review/create/visit-errors";
import { type FormStateChangeUsername } from "@/app/welcome/form-username-change";
import type { FormStateCreateReview } from "@/components/review-form.client";
import {
  indexProductsPlaceNameUnique,
  indexReviewsOneCurrent,
  lower,
  placeCitiesTable,
  placesTable,
  type PlaceUpdateDb,
  productsTable,
  type ProductUpdateDb,
  type Review,
  type ReviewCreate,
  type ReviewCreateDb,
  reviewsTable,
  type ReviewUpdateDb,
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
import {
  type ActionStateError,
  type ActionStateSuccess,
} from "@/lib/action-utils";
import {
  assertAdmin,
  assertUserForEntity,
  createDevLoginSession,
  getUserAuthGated,
} from "@/lib/auth-server";
import { isDevLoginEnabled } from "@/lib/dev-login";
import {
  isForeignKeyViolation,
  uniqueViolationConstraint,
} from "@/lib/postgres-errors";
import { schemaCreateVisit, type VisitCreate } from "@/lib/schemas";
import { Prettify, takeUniqueOrThrow } from "@/lib/utils";
import { and, eq, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { forbidden } from "next/navigation";
import { z } from "zod";
import { cacheKeys, devUsers, type Role, usernamesReserved } from "./static";

export async function actionAdminUpdatePlace(
  formState: FormStateUpdatePlace,
  placeId: number,
  placeToUpdate: PlaceUpdateDb,
) {
  console.debug("🟦 ACTION admin update place", placeId);
  await assertAdmin();

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
      errors: z.flattenError(placeResult.error).fieldErrors,
    } satisfies ActionStateError<FormStateUpdatePlace>;
  }

  const { name, cities: selectedCities } = placeResult.data;
  const uniqueCities = [...new Set(selectedCities)];
  let placeUpdated;
  try {
    placeUpdated = await db.transaction(async (tx) => {
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
  } catch (error) {
    console.error("Error updating place:", error);

    return {
      status: "ERROR",
      formState,
      rootErrors: ["Restaurant konnte nicht gespeichert werden"],
    } satisfies ActionStateError<FormStateUpdatePlace>;
  }

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

  const userAuth = await getUserAuthGated();

  const {
    success,
    data: reviewParsed,
    error,
  } = schemaCreateReview.safeParse(reviewToCreate);

  if (!success) {
    return {
      status: "ERROR",
      formState,
      errors: z.flattenError(error).fieldErrors,
    } satisfies ActionStateError;
  }

  const { overwriteAuthorId, ...reviewFields } = reviewParsed;

  // Check if admin is trying to override author
  let authorId: string;

  if (overwriteAuthorId === null) {
    authorId = userAuth.id;
  } else {
    await assertAdmin();
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

  try {
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
  } catch (error) {
    // The partial unique index is the final arbiter when two saves race
    // between the update above and their current-review inserts.
    if (uniqueViolationConstraint(error) === indexReviewsOneCurrent) {
      const errors: Partial<Record<keyof FormStateCreateReview, string[]>> = {};
      return {
        status: "ERROR",
        formState,
        errors,
        rootErrors: [
          "Diese Bewertung wurde gerade aktualisiert. Lade die Seite neu und versuche es erneut.",
        ],
      } satisfies ActionStateError<FormStateCreateReview>;
    }
    throw error;
  }

  updateTag(cacheKeys.reviews);
  updateTag(cacheKeys.rankings);
  updateTag(cacheKeys.user(authorId));

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

  const authorIdForCache = await assertUserForEntity(async () => {
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
  updateTag(cacheKeys.user(authorIdForCache));
  return true;
}

export type VisitSaved = {
  placeId: number;
  placeName: string;
  reviews: { productId: number; productName: string; rating: number }[];
};

export type VisitActionResult =
  | { status: "SUCCESS"; data: VisitSaved }
  | {
      status: "ERROR";
      /** Keyed by review draft ID, e.g. `new-4.product.name`. */
      errors: Record<string, string>;
      rootErrors: string[];
    };

class VisitConflictError extends Error {
  constructor(readonly errors: Record<string, string>) {
    super("Visit conflicts with existing data");
  }
}

/**
 * Creates the place (if new), every new product and all reviews of one
 * restaurant visit in a single transaction, so an aborted flow never leaves a
 * place without products or a product without a review.
 */
export async function actionCreateVisit(
  visitToCreate: VisitCreate,
): Promise<VisitActionResult> {
  console.debug("🟦 ACTION create visit");

  const userAuth = await getUserAuthGated();

  const visitResult = schemaCreateVisit.safeParse(visitToCreate);
  if (!visitResult.success) {
    return {
      status: "ERROR",
      errors: visitErrorsByReviewId(
        visitResult.error.issues,
        visitToCreate.reviews,
      ),
      rootErrors: [],
    };
  }

  const { place, reviews, urlSource, overwriteAuthorId } = visitResult.data;

  let authorId = userAuth.id;
  if (overwriteAuthorId !== null) {
    await assertAdmin();
    console.debug(
      `Admin overriding author ID for visit creation. New: ${overwriteAuthorId}`,
    );
    authorId = overwriteAuthorId;
  }

  let visitSaved: VisitSaved;
  try {
    visitSaved = await db.transaction(async (tx) => {
      const now = new Date();
      let placeSaved: { id: number; name: string };

      if (place.kind === "existing") {
        const placeFound = await tx
          .select({ id: placesTable.id, name: placesTable.name })
          .from(placesTable)
          .where(eq(placesTable.id, place.id))
          .then((rows) => rows[0]);
        if (!placeFound) {
          throw new VisitConflictError({
            place: "Restaurant wurde nicht gefunden",
          });
        }
        placeSaved = placeFound;
      } else {
        const placeCreated = await tx
          .insert(placesTable)
          .values({ name: place.name, createdAt: now, updatedAt: now })
          .returning({ id: placesTable.id, name: placesTable.name })
          .then((rows) => rows[0]);
        if (!placeCreated) throw new Error("No place returned after insert");

        const citiesUnique = [...new Set(place.cities)];
        if (citiesUnique.length > 0) {
          await tx
            .insert(placeCitiesTable)
            .values(
              citiesUnique.map((city) => ({ placeId: placeCreated.id, city })),
            );
        }
        placeSaved = placeCreated;
      }

      const productsAtPlace = await tx
        .select({ id: productsTable.id, name: productsTable.name })
        .from(productsTable)
        .where(eq(productsTable.placeId, placeSaved.id));
      const productsById = new Map(productsAtPlace.map((p) => [p.id, p]));
      const productsByName = new Map(
        productsAtPlace.map((p) => [p.name.toLowerCase(), p]),
      );

      const conflicts: Record<string, string> = {};
      const reviewsResolved: Prettify<
        VisitSaved["reviews"][number] & {
          note: string | null;
        }
      >[] = [];

      for (const review of reviews) {
        const { product } = review;

        switch (product.kind) {
          case "existing": {
            const productFound = productsById.get(product.id);
            if (!productFound) {
              conflicts[`${review.id}.product`] =
                "Produkt gehört nicht zu diesem Restaurant";
              continue;
            }

            reviewsResolved.push({
              productId: productFound.id,
              productName: productFound.name,
              rating: review.rating,
              note: review.note,
            });
            continue;
          }
          case "new": {
            const productSameName = productsByName.get(
              product.name.toLowerCase(),
            );
            if (productSameName) {
              conflicts[`${review.id}.product.name`] =
                `"${productSameName.name}" gibt es hier schon. Bewerte es in der Liste oben.`;
              continue;
            }

            const productCreated = await tx
              .insert(productsTable)
              .values({
                name: product.name,
                category: product.category,
                note: null,
                placeId: placeSaved.id,
                createdAt: now,
                updatedAt: now,
              })
              .returning({ id: productsTable.id, name: productsTable.name })
              .then((rows) => rows[0]);
            if (!productCreated)
              throw new Error("No product returned after insert");

            reviewsResolved.push({
              productId: productCreated.id,
              productName: productCreated.name,
              rating: review.rating,
              note: review.note,
            });
            continue;
          }
          default: {
            const exhaustiveCheck: never = product;
            throw new Error(`Unhandled visit product kind: ${exhaustiveCheck}`);
          }
        }
      }

      if (Object.keys(conflicts).length > 0) {
        throw new VisitConflictError(conflicts);
      }

      await tx
        .update(reviewsTable)
        .set({ isCurrent: false })
        .where(
          and(
            inArray(
              reviewsTable.productId,
              reviewsResolved.map((review) => review.productId),
            ),
            eq(reviewsTable.authorId, authorId),
            eq(reviewsTable.isCurrent, true),
          ),
        );

      await tx.insert(reviewsTable).values(
        reviewsResolved.map((review) => ({
          productId: review.productId,
          rating: review.rating,
          note: review.note,
          urlSource,
          authorId,
          isCurrent: true,
          reviewedAt: now,
          createdAt: now,
          updatedAt: now,
        })),
      );

      return {
        placeId: placeSaved.id,
        placeName: placeSaved.name,
        reviews: reviewsResolved.map((review) => ({
          productId: review.productId,
          productName: review.productName,
          rating: review.rating,
        })),
      };
    });
  } catch (error) {
    if (error instanceof VisitConflictError) {
      return { status: "ERROR", errors: error.errors, rootErrors: [] };
    }

    // The checks inside the transaction miss rows that a parallel request
    // inserted in the meantime, the unique indexes catch those.
    const constraintViolated = uniqueViolationConstraint(error);
    if (constraintViolated === indexProductsPlaceNameUnique) {
      return {
        status: "ERROR",
        errors: {},
        rootErrors: [
          "Eines der neuen Produkte wurde gerade von jemand anderem angelegt. Lade die Seite neu und bewerte es in der Liste.",
        ],
      };
    }
    // A competing visit can win the current-review insert. The transaction
    // rolls back, so returning a retry prompt avoids reporting a partial save.
    if (constraintViolated === indexReviewsOneCurrent) {
      return {
        status: "ERROR",
        errors: {},
        rootErrors: [
          "Eine deiner Bewertungen wurde gerade aktualisiert. Lade die Seite neu und versuche es erneut.",
        ],
      };
    }
    if (overwriteAuthorId !== null && isForeignKeyViolation(error)) {
      return {
        status: "ERROR",
        errors: { overwriteAuthorId: "Diesen User gibt es nicht" },
        rootErrors: [],
      };
    }

    console.error("Error creating visit:", error);
    return {
      status: "ERROR",
      errors: {},
      rootErrors: ["Bewertungen konnten nicht gespeichert werden"],
    };
  }

  if (place.kind === "new") updateTag(cacheKeys.places);
  if (reviews.some((review) => review.product.kind === "new")) {
    updateTag(cacheKeys.products);
  }
  updateTag(cacheKeys.reviews);
  updateTag(cacheKeys.rankings);
  updateTag(cacheKeys.user(authorId));

  return { status: "SUCCESS", data: visitSaved };
}

export async function actionAdminUpdateProduct(
  formState: FormStateUpdateProduct,
  productId: number,
  productToUpdate: ProductUpdateDb,
) {
  console.debug("🟦 ACTION admin update product", productId);
  await assertAdmin();

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
      errors: z.flattenError(productResult.error).fieldErrors,
    } satisfies ActionStateError<FormStateUpdateProduct>;
  }

  const { name, note, category, placeId } = productResult.data;

  try {
    const updatedRows = await db
      .update(productsTable)
      .set({
        name,
        note,
        category,
        placeId,
        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, productIdResult.data))
      .returning({ id: productsTable.id });

    if (!updatedRows[0]) {
      return {
        status: "ERROR",
        formState,
        rootErrors: ["Produkt wurde nicht gefunden"],
      } satisfies ActionStateError<FormStateUpdateProduct>;
    }
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return {
        status: "ERROR",
        formState,
        errors: {
          placeId: ["Restaurant wurde nicht gefunden"],
        },
      } satisfies ActionStateError<FormStateUpdateProduct>;
    }
    if (uniqueViolationConstraint(error) === indexProductsPlaceNameUnique) {
      return {
        status: "ERROR",
        formState,
        errors: {
          name: [
            "Ein Produkt mit diesem Namen gibt es in diesem Restaurant schon",
          ],
        },
      } satisfies ActionStateError<FormStateUpdateProduct>;
    }

    console.error("Error updating product:", error);

    return {
      status: "ERROR",
      formState,
      rootErrors: ["Produkt konnte nicht gespeichert werden"],
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

  const userAuth = await getUserAuthGated();

  const {
    success,
    error,
    data: userParsed,
  } = schemaUpdateUsername.safeParse(userToUpdate);

  if (!success) {
    return {
      status: "ERROR",
      formState,
      errors: z.flattenError(error).fieldErrors,
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
      rootErrors: ["Benutzername konnte nicht gespeichert werden"],
    } satisfies ActionStateError;
  }

  return {
    status: "SUCCESS",
    formState,
    data: null,
  } satisfies ActionStateSuccess;
}

export async function actionSignInDev(
  role: Role,
): Promise<{ status: "SUCCESS" } | { status: "ERROR"; message: string }> {
  console.debug("🟦 ACTION sign in dev");

  if (!isDevLoginEnabled()) {
    forbidden();
  }

  const user = devUsers.find((candidate) => candidate.role === role);
  if (!user) {
    return { status: "ERROR", message: "Unknown dev role" };
  }

  try {
    const signedIn = await createDevLoginSession(user.id);
    if (!signedIn) {
      return {
        status: "ERROR",
        message: "Sign in failed. Run `bun run db:seed` and try again.",
      };
    }

    return { status: "SUCCESS" };
  } catch (error) {
    console.error("Dev sign-in failed:", error);
    return {
      status: "ERROR",
      message: "Sign in failed. Run `bun run db:seed` and try again.",
    };
  }
}
