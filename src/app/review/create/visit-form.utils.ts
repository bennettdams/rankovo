import type { CategoryActive } from "@/data/static";
import { guessCategoryFromName } from "@/lib/business-utils";
import type { VisitCreate } from "@/lib/schemas";

export type VisitReviewPayload = VisitCreate["reviews"][number];
export type ExistingProductPayload = Extract<
  VisitReviewPayload["product"],
  { kind: "existing" }
>;
export type NewProductPayload = Extract<
  VisitReviewPayload["product"],
  { kind: "new" }
>;

export type ReviewId = VisitReviewPayload["id"];
export type ReviewIdExisting = Extract<ReviewId, `product-${number}`>;
export type ReviewIdNew = Extract<ReviewId, `new-${number}`>;

type ReviewDraftFields = {
  rating: VisitReviewPayload["rating"] | null;
  note: VisitReviewPayload["note"];
};

export type ExistingReviewDraft = ReviewDraftFields & {
  id: ReviewIdExisting;
  product: ExistingProductPayload;
};

export type NewReviewDraft = ReviewDraftFields & {
  id: ReviewIdNew;
  product: Omit<NewProductPayload, "category"> & {
    category: CategoryActive | null;
  };
};

export type ReviewDraft = ExistingReviewDraft | NewReviewDraft;

export function reviewIdExisting(productId: number): ReviewIdExisting {
  return `product-${productId}`;
}

export function reviewIdNew(key: number): ReviewIdNew {
  return `new-${key}`;
}

export function emptyNewReview(id: ReviewIdNew): NewReviewDraft {
  return {
    id,
    product: { kind: "new", name: "", category: null },
    rating: null,
    note: null,
  };
}

export function initialReviews(
  productIdPreselected: number | null,
  products: readonly { id: number }[],
): ReviewDraft[] {
  if (
    productIdPreselected !== null &&
    products.some((product) => product.id === productIdPreselected)
  ) {
    return [
      {
        id: reviewIdExisting(productIdPreselected),
        product: { kind: "existing", id: productIdPreselected },
        rating: null,
        note: null,
      },
    ];
  }

  return products.length === 0 ? [emptyNewReview(reviewIdNew(0))] : [];
}

export function categoryForReview(
  product: NewReviewDraft["product"],
): CategoryActive | null {
  return product.category ?? guessCategoryFromName(product.name);
}

export function toggleReviewExisting(
  reviews: readonly ReviewDraft[],
  productId: number,
): ReviewDraft[] {
  const id = reviewIdExisting(productId);
  const reviewExisting = reviews.find((review) => review.id === id);

  return reviewExisting
    ? reviews.filter((review) => review.id !== id)
    : [
        ...reviews,
        {
          id,
          product: { kind: "existing", id: productId },
          rating: null,
          note: null,
        },
      ];
}

export function productWithName<T extends { name: string }>(
  products: readonly T[],
  name: string,
): T | undefined {
  const nameNormalized = name.trim().toLowerCase();
  if (!nameNormalized) return undefined;

  return products.find(
    (product) => product.name.trim().toLowerCase() === nameNormalized,
  );
}

export function moveReviewToExisting(
  reviews: readonly ReviewDraft[],
  reviewDraft: ReviewDraft,
  productId: number,
): ReviewDraft[] {
  const existingId = reviewIdExisting(productId);
  const reviewExisting = reviews.find((review) => review.id === existingId);

  return reviewExisting
    ? reviews.filter((review) => review.id !== reviewDraft.id)
    : reviews.map((review) =>
        review.id === reviewDraft.id
          ? {
              id: existingId,
              product: { kind: "existing", id: productId },
              rating: review.rating,
              note: review.note,
            }
          : review,
      );
}
