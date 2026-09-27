"use client";

import { CategoryIcon } from "@/components/category-icon";
import { CitiesSelection } from "@/components/cities-selection";
import { FilterButton } from "@/components/filter-button";
import { FieldError } from "@/components/form";
import { NumberFormatted } from "@/components/number-formatted";
import { RatingInput } from "@/components/rating-input.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  actionCreateVisit,
  type VisitActionResult,
  type VisitSaved,
} from "@/data/actions";
import type {
  PlaceWithProductsQuery,
  UserReviewAtPlaceQuery,
} from "@/data/queries";
import {
  categoriesActive,
  type CategoryActive,
  type City,
  type Role,
} from "@/data/static";
import { guessCategoryFromName } from "@/lib/business-utils";
import { formatCitiesFull } from "@/lib/cities";
import { t } from "@/lib/i18n";
import { routes } from "@/lib/navigation";
import { schemaCreateVisit } from "@/lib/schemas";
import { ArrowLeft, CheckCircle2, Plus, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useRef, useState } from "react";
import { visitErrorsByReviewId } from "./visit-errors";
import {
  categoryForReview,
  emptyNewReview,
  initialReviews,
  moveReviewToExisting as moveReviewToExistingDrafts,
  productWithName,
  reviewIdExisting,
  reviewIdNew,
  toggleReviewExisting as toggleReviewExistingDrafts,
  type NewReviewDraft,
  type ReviewDraft,
  type ReviewId,
  type ReviewIdNew,
} from "./visit-form.utils";

type PlaceForVisit =
  | { kind: "existing"; id: number; name: string; cities: City[] }
  | { kind: "new"; name: string };

type ProductAtPlace = PlaceWithProductsQuery["products"][number];

type VisitFormProps = {
  place: PlaceForVisit;
  products: ProductAtPlace[];
  userReviews: UserReviewAtPlaceQuery[];
  productIdPreselected: number | null;
  userRole: Role | null;
};

type VisitSubmitState = { attempt: number } & (
  | { status: "IDLE" }
  | VisitActionResult
);
type VisitSubmitAction = FormData | { type: "RESET" };

const initialVisitSubmitState: VisitSubmitState = {
  status: "IDLE",
  attempt: 0,
};

function reviewsLabel(count: number) {
  return count === 1 ? "Bewertung" : "Bewertungen";
}

export function VisitFormForExistingPlace({
  place,
  ...props
}: Omit<VisitFormProps, "place"> & {
  place: Extract<PlaceForVisit, { kind: "existing" }>;
}) {
  return (
    <VisitForm
      key={`existing-${place.id}-${props.productIdPreselected ?? "none"}`}
      place={place}
      {...props}
    />
  );
}

export function VisitFormForNewPlace({
  placeName,
  ...props
}: Omit<VisitFormProps, "place"> & { placeName: string }) {
  return (
    <VisitForm
      key={`new-${placeName.toLowerCase()}`}
      place={{ kind: "new", name: placeName }}
      {...props}
    />
  );
}

function VisitForm({
  place,
  products,
  userReviews,
  productIdPreselected,
  userRole,
}: VisitFormProps) {
  const router = useRouter();

  const keyNext = useRef(1);

  const [reviews, setReviews] = useState<ReviewDraft[]>(() =>
    initialReviews(productIdPreselected, products),
  );
  const keyFocusNext = useRef<ReviewIdNew | null>(
    products.length === 0 ? "new-0" : null,
  );
  const [citiesSelected, setCitiesSelected] = useState<City[]>([]);
  const [showUrlSource, setShowUrlSource] = useState(false);

  const isSignedIn = userRole !== null;
  const ratingByProductId = new Map(
    userReviews.map((review) => [review.productId, review.rating]),
  );

  const numOfReviews = reviews.length;
  const reviewsNew = reviews.filter(
    (review): review is NewReviewDraft => review.product.kind === "new",
  );
  const citiesLabel =
    place.kind === "existing" ? formatCitiesFull(place.cities) : null;

  const focusNextNewReview = useCallback((node: HTMLInputElement | null) => {
    if (node?.dataset.reviewId !== keyFocusNext.current) return;
    node.focus();
    keyFocusNext.current = null;
  }, []);

  async function submitVisit(
    previousState: VisitSubmitState,
    action: VisitSubmitAction,
  ): Promise<VisitSubmitState> {
    if (!(action instanceof FormData)) return initialVisitSubmitState;

    const attempt = previousState.attempt + 1;
    const urlSource = action.get("urlSource");
    const authorIdOverride = action.get("overwriteAuthorId");

    const reviewsPayload = reviews.map((review) => ({
      id: review.id,
      product:
        review.product.kind === "existing"
          ? review.product
          : {
              ...review.product,
              category: categoryForReview(review.product),
            },
      rating: review.rating,
      note: review.note,
    }));

    const visitParsed = schemaCreateVisit.safeParse({
      place:
        place.kind === "existing"
          ? { kind: "existing", id: place.id }
          : { kind: "new", name: place.name, cities: citiesSelected },
      reviews: reviewsPayload,
      urlSource:
        typeof urlSource === "string" && urlSource !== "" ? urlSource : null,
      overwriteAuthorId:
        typeof authorIdOverride === "string"
          ? authorIdOverride.trim() || null
          : null,
    });

    if (!visitParsed.success) {
      return {
        status: "ERROR",
        attempt,
        errors: visitErrorsByReviewId(visitParsed.error.issues, reviewsPayload),
        rootErrors: [],
      };
    }

    const result = await actionCreateVisit(visitParsed.data);
    if (result.status === "SUCCESS") {
      if (place.kind === "new") {
        window.history.replaceState(
          null,
          "",
          routes.reviewCreateAtPlace(result.data.placeId),
        );
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return { ...result, attempt };
  }

  const [submitState, dispatchSubmit, isSaving] = useActionState(
    submitVisit,
    initialVisitSubmitState,
  );
  const errors = submitState.status === "ERROR" ? submitState.errors : {};
  const rootErrors =
    submitState.status === "ERROR" ? submitState.rootErrors : [];
  const visitSaved = submitState.status === "SUCCESS" ? submitState.data : null;

  function toggleReviewExisting(productId: number) {
    setReviews((reviewsPrev) =>
      toggleReviewExistingDrafts(reviewsPrev, productId),
    );
  }

  function updateReviewExisting(
    productId: number,
    update: Partial<Pick<ReviewDraft, "rating" | "note">>,
  ) {
    const id = reviewIdExisting(productId);
    setReviews((reviewsPrev) =>
      reviewsPrev.map((review) =>
        review.id === id ? { ...review, ...update } : review,
      ),
    );
  }

  function addNewReview() {
    const id = reviewIdNew(keyNext.current++);
    setReviews((reviewsPrev) => [...reviewsPrev, emptyNewReview(id)]);
    keyFocusNext.current = id;
  }

  function updateNewReview(
    id: ReviewIdNew,
    update: {
      name?: string;
      category?: CategoryActive | null;
      rating?: number | null;
      note?: string | null;
    },
  ) {
    setReviews((reviewsPrev) =>
      reviewsPrev.map((review) => {
        if (review.id !== id) return review;
        const { name, category, ...reviewUpdate } = update;
        return {
          ...review,
          ...reviewUpdate,
          product: {
            ...review.product,
            ...(name === undefined ? {} : { name }),
            ...(category === undefined ? {} : { category }),
          },
        };
      }),
    );
  }

  function removeNewReview(id: ReviewIdNew) {
    setReviews((reviewsPrev) =>
      reviewsPrev.filter((review) => review.id !== id),
    );
  }

  function moveReviewToExisting(reviewDraft: ReviewDraft, productId: number) {
    setReviews((reviewsPrev) =>
      moveReviewToExistingDrafts(reviewsPrev, reviewDraft, productId),
    );
  }

  function resetForMoreReviews() {
    setReviews([]);
    setShowUrlSource(false);
    dispatchSubmit({ type: "RESET" });
  }

  const scrollToError = useCallback(
    (node: HTMLFormElement | null) => {
      if (submitState.status !== "ERROR" || submitState.attempt === 0) return;
      node
        ?.querySelector("[data-field-error]")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    },
    [submitState.status, submitState.attempt],
  );

  if (visitSaved) {
    return (
      <VisitSavedPanel
        visitSaved={visitSaved}
        onRateMore={() => {
          resetForMoreReviews();
          router.replace(routes.reviewCreateAtPlace(visitSaved.placeId), {
            scroll: false,
          });
        }}
      />
    );
  }

  return (
    <form
      ref={scrollToError}
      action={dispatchSubmit}
      className="animate-appear space-y-8"
      noValidate
    >
      <header className="space-y-3">
        <Link
          href={
            place.kind === "new"
              ? routes.reviewCreateSearch(place.name)
              : routes.reviewCreate
          }
          className="inline-flex items-center gap-1 text-sm text-secondary hover:underline"
        >
          <ArrowLeft className="size-4" />
          {place.kind === "new" ? "Zurück zur Suche" : "Anderes Restaurant"}
        </Link>
        <h1 className="flex flex-wrap items-center gap-3 text-4xl font-bold text-fg md:text-5xl">
          {place.name}
          {place.kind === "new" && (
            <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-fg">
              Neu
            </span>
          )}
        </h1>
        <FieldError errorMsg={errors["place.name"] ?? errors.place} />
        <p className="text-lg text-dark-gray">
          {citiesLabel ? `${citiesLabel} · ` : ""}Was hattest du?
        </p>
      </header>

      {!isSignedIn && (
        <p className="rounded-lg bg-primary/10 px-4 py-3 text-sm ring-1 ring-primary/30">
          Melde dich an, um Bewertungen zu speichern.
        </p>
      )}

      {place.kind === "new" && (
        <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="font-medium">In welcher Stadt?</h2>
          <p className="text-sm text-dark-gray">
            Mehrere möglich. Keine Auswahl heißt, das Restaurant ist an keine
            Stadt gebunden.
          </p>
          <CitiesSelection
            citiesActive={citiesSelected}
            onClick={(city) =>
              setCitiesSelected((prev) =>
                prev.includes(city)
                  ? prev.filter((c) => c !== city)
                  : [...prev, city],
              )
            }
          />
          <FieldError errorMsg={errors["place.cities"]} />
        </section>
      )}

      <section className="space-y-3" aria-label="Produkte">
        {products.length > 0 && (
          <ul className="space-y-3">
            {products.map((product) => {
              const reviewId = reviewIdExisting(product.id);
              const reviewDraft = reviews.find(
                (review) => review.id === reviewId,
              );
              const ratingByUser = ratingByProductId.get(product.id) ?? null;
              return (
                <li key={product.id}>
                  {reviewDraft ? (
                    <ReviewCard
                      onRemove={() => toggleReviewExisting(product.id)}
                    >
                      <div className="space-y-2">
                        <ProductHeading product={product} />
                        {ratingByUser !== null && (
                          <RatingByUserChip
                            label="Bisher von dir"
                            rating={ratingByUser}
                          />
                        )}
                      </div>
                      <ReviewRatingFields
                        reviewId={reviewId}
                        reviewDraft={reviewDraft}
                        errors={errors}
                        onChange={(update) =>
                          updateReviewExisting(product.id, update)
                        }
                        productName={product.name}
                      />
                      <FieldError errorMsg={errors[`${reviewId}.product`]} />
                    </ReviewCard>
                  ) : (
                    <ProductReviewClosed
                      product={product}
                      ratingByUser={ratingByUser}
                      onOpen={() => toggleReviewExisting(product.id)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {reviewsNew.length > 0 && (
          <ul className="space-y-3">
            {reviewsNew.map((reviewDraft) => {
              const reviewId = reviewDraft.id;
              const categoryGuessed =
                reviewDraft.product.category === null
                  ? guessCategoryFromName(reviewDraft.product.name)
                  : null;
              const categoryEffective = categoryForReview(reviewDraft.product);
              const productSameName = productWithName(
                products,
                reviewDraft.product.name,
              );
              return (
                <li key={reviewDraft.id}>
                  <ReviewCard onRemove={() => removeNewReview(reviewDraft.id)}>
                    <div className="space-y-2">
                      <Label htmlFor={`${reviewId}-name`}>
                        Was hattest du?
                      </Label>
                      <Input
                        ref={focusNextNewReview}
                        id={`${reviewId}-name`}
                        data-review-id={reviewId}
                        value={reviewDraft.product.name}
                        placeholder="z. B. Crispy Chili Burger"
                        onChange={(e) =>
                          updateNewReview(reviewDraft.id, {
                            name: e.target.value,
                          })
                        }
                        className="bg-white"
                      />
                      {productSameName ? (
                        <p className="flex flex-wrap items-center gap-x-2 text-sm text-dark-gray">
                          {productSameName.name} gibt es hier schon.
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto px-0 text-primary"
                            onClick={() =>
                              moveReviewToExisting(
                                reviewDraft,
                                productSameName.id,
                              )
                            }
                          >
                            Stattdessen das bewerten
                          </Button>
                        </p>
                      ) : (
                        <FieldError
                          errorMsg={errors[`${reviewId}.product.name`]}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Kategorie
                        {categoryGuessed && (
                          <span className="ml-2 font-normal text-dark-gray">
                            aus dem Namen erkannt
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {categoriesActive.map((category) => (
                          <FilterButton
                            key={category}
                            isActive={categoryEffective === category}
                            onClick={() =>
                              updateNewReview(reviewDraft.id, { category })
                            }
                          >
                            <CategoryIcon category={category} size="sm" />
                            <span className="ml-1">{t[category]}</span>
                          </FilterButton>
                        ))}
                      </div>
                      <FieldError
                        errorMsg={
                          categoryEffective
                            ? undefined
                            : errors[`${reviewId}.product.category`]
                        }
                      />
                    </div>

                    <ReviewRatingFields
                      reviewId={reviewId}
                      reviewDraft={reviewDraft}
                      errors={errors}
                      onChange={(update) =>
                        updateNewReview(reviewDraft.id, update)
                      }
                      productName={
                        reviewDraft.product.name || "das neue Produkt"
                      }
                    />
                  </ReviewCard>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={addNewReview}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 px-4 py-4 font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5"
        >
          <Plus className="size-5" />
          {products.length === 0 && reviews.length === 0
            ? "Produkt hinzufügen"
            : "Etwas anderes gegessen?"}
        </button>
      </section>

      <section className="space-y-4">
        {!showUrlSource ? (
          <Button
            type="button"
            variant="ghost"
            className="px-0 text-secondary"
            onClick={() => setShowUrlSource(true)}
          >
            Quelle hinzufügen
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="visit-url-source">
                URL-Quelle, gilt für alle Bewertungen
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowUrlSource(false)}
              >
                Entfernen
              </Button>
            </div>
            <Input
              id="visit-url-source"
              name="urlSource"
              placeholder="z. B. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              className="bg-white"
            />
            <FieldError errorMsg={errors.urlSource} />
          </div>
        )}

        {userRole === "admin" && (
          <div className="space-y-2">
            <Label htmlFor="visit-author-override">
              User ID Override (Admin)
            </Label>
            <Input
              id="visit-author-override"
              name="overwriteAuthorId"
              placeholder="User-ID, um im Namen eines Kritikers zu bewerten"
              className="bg-white"
            />
            <FieldError errorMsg={errors.overwriteAuthorId} />
          </div>
        )}
      </section>

      <div className="sticky bottom-4 z-10 space-y-2 rounded-2xl bg-bg/95 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
        <FieldError
          errorMsg={[
            ...rootErrors,
            ...(errors.reviews ? [errors.reviews] : []),
          ]}
          className="px-1 text-sm"
        />
        <Button
          type="submit"
          size="lg"
          className="w-full text-base shadow-md"
          disabled={!isSignedIn || isSaving || numOfReviews === 0}
        >
          <Save className="mr-2" />
          {isSaving
            ? "Wird gespeichert..."
            : numOfReviews === 0
              ? "Tippe ein Produkt an, um es zu bewerten"
              : `${numOfReviews} ${reviewsLabel(numOfReviews)} speichern`}
        </Button>
      </div>
    </form>
  );
}

function ProductHeading({ product }: { product: ProductAtPlace }) {
  return (
    <div className="min-w-0">
      <p className="font-semibold">{product.name}</p>
      {product.note && <p className="text-sm text-dark-gray">{product.note}</p>}
    </div>
  );
}

function ProductReviewClosed({
  product,
  ratingByUser,
  onOpen,
}: {
  product: ProductAtPlace;
  ratingByUser: number | null;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-black/5 transition-colors hover:bg-primary/5 hover:ring-primary/30"
    >
      <div className="min-w-0 flex-1">
        <ProductHeading product={product} />
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-dark-gray">
          {product.ratingAvg === null ? (
            <span>Noch keine Bewertung</span>
          ) : (
            <span>
              Ø <NumberFormatted num={product.ratingAvg} min={1} max={1} /> ·{" "}
              {product.numOfReviews} {reviewsLabel(product.numOfReviews)}
            </span>
          )}
          {ratingByUser !== null && (
            <RatingByUserChip label="Du" rating={ratingByUser} />
          )}
        </span>
      </div>
      <span className="shrink-0 rounded-full border border-primary/40 px-3 py-1 text-sm font-medium text-primary">
        {ratingByUser === null ? "Bewerten" : "Neu bewerten"}
      </span>
    </button>
  );
}

function RatingByUserChip({
  label,
  rating,
}: {
  label: string;
  rating: number;
}) {
  return (
    <span className="inline-block rounded-full bg-secondary/15 px-2 py-0.5 text-sm font-medium text-secondary">
      {label}: <NumberFormatted num={rating} min={1} max={1} />
    </span>
  );
}

function ReviewCard({
  onRemove,
  children,
}: {
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative space-y-5 rounded-xl bg-primary/5 p-4 ring-2 ring-primary/40">
      <button
        type="button"
        onClick={onRemove}
        aria-label="Entfernen"
        className="absolute top-3 right-3 rounded-full p-1 text-dark-gray transition-colors hover:bg-gray hover:text-fg"
      >
        <X className="size-5" />
      </button>
      <div className="space-y-5 pr-8">{children}</div>
    </div>
  );
}

function ReviewRatingFields({
  reviewId,
  reviewDraft,
  errors,
  onChange,
  productName,
}: {
  reviewId: ReviewId;
  reviewDraft: ReviewDraft;
  errors: Record<string, string>;
  onChange: (update: Partial<Pick<ReviewDraft, "rating" | "note">>) => void;
  productName: string;
}) {
  return (
    <>
      <div>
        <RatingInput
          size="medium"
          value={reviewDraft.rating}
          onChange={(rating) => onChange({ rating })}
          ariaLabel={`Bewertung für ${productName} von 0 bis 10`}
        />
        <FieldError
          errorMsg={errors[`${reviewId}.rating`]}
          className="mt-2 text-center"
        />
      </div>

      {reviewDraft.note === null ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-0 text-secondary"
          onClick={() => onChange({ note: "" })}
        >
          <Plus className="size-4" /> Notiz
        </Button>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={`${reviewId}-note`}>Notiz</Label>
          <Textarea
            id={`${reviewId}-note`}
            value={reviewDraft.note}
            placeholder="Besonderheiten, Anmerkungen, .."
            onChange={(e) => onChange({ note: e.target.value })}
            className="min-h-20 resize-none bg-white"
          />
          <FieldError errorMsg={errors[`${reviewId}.note`]} />
        </div>
      )}
    </>
  );
}

function VisitSavedPanel({
  visitSaved,
  onRateMore,
}: {
  visitSaved: VisitSaved;
  onRateMore: () => void;
}) {
  const count = visitSaved.reviews.length;

  return (
    <div className="animate-appear space-y-8">
      <header className="space-y-3">
        <p
          aria-live="polite"
          className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 font-medium text-green-700 ring-1 ring-green-200"
        >
          <CheckCircle2 className="size-5" />
          {count} {reviewsLabel(count)} gespeichert
        </p>
        <h1 className="text-4xl font-bold text-fg md:text-5xl">
          {visitSaved.placeName}
        </h1>
      </header>

      <ul className="divide-y divide-light-gray overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        {visitSaved.reviews.map((review) => (
          <li
            key={review.productId}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <span className="font-medium">{review.productName}</span>
            <span className="text-2xl font-semibold tabular-nums">
              <NumberFormatted num={review.rating} min={1} max={1} />
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href={routes.home}>Zur Rangliste</Link>
        </Button>
        <Button type="button" variant="secondary" onClick={onRateMore}>
          Mehr bei {visitSaved.placeName} bewerten
        </Button>
        <Button asChild variant="ghost">
          <Link href={routes.reviewCreate}>Anderes Restaurant</Link>
        </Button>
      </div>
    </div>
  );
}
