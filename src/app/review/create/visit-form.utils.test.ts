import { describe, expect, test } from "bun:test";
import {
  categoryForReview,
  initialReviews,
  moveReviewToExisting,
  productWithName,
  toggleReviewExisting,
  type ReviewDraft,
} from "./visit-form.utils";

describe("visit form draft helpers", () => {
  test("starts with a preselected product or one empty new product", () => {
    expect(
      initialReviews(7, [{ id: 7 }]),
    ).toEqual([
      {
        id: "product-7",
        product: { kind: "existing", id: 7 },
        rating: null,
        note: null,
      },
    ]);

    expect(initialReviews(null, [])).toEqual([
      {
        id: "new-0",
        product: { kind: "new", name: "", category: null },
        rating: null,
        note: null,
      },
    ]);
  });

  test("toggles an existing product review", () => {
    const added = toggleReviewExisting([], 7);
    expect(added).toHaveLength(1);
    expect(toggleReviewExisting(added, 7)).toEqual([]);
  });

  test("keeps an explicit category and guesses a missing one", () => {
    const review = {
      id: "new-0",
      product: { kind: "new", name: "Chicken Wings", category: null },
      rating: null,
      note: null,
    } satisfies Extract<ReviewDraft, { id: `new-${number}` }>;

    expect(categoryForReview(review.product)).toBe("chicken");
    expect(
      categoryForReview({ ...review.product, category: "burger" }),
    ).toBe("burger");
  });

  test("finds products by trimmed, case-insensitive name", () => {
    expect(
      productWithName([{ id: 7, name: "  Burger  ", note: null }], " burger "),
    ).toEqual({ id: 7, name: "  Burger  ", note: null });
    expect(productWithName([], "burger")).toBeUndefined();
  });

  test("moves a new review to an existing product without losing its fields", () => {
    const review: ReviewDraft = {
      id: "new-0",
      product: { kind: "new", name: "Burger", category: "burger" },
      rating: 8,
      note: "Extra sauce",
    };

    expect(moveReviewToExisting([review], review, 7)).toEqual([
      {
        id: "product-7",
        product: { kind: "existing", id: 7 },
        rating: 8,
        note: "Extra sauce",
      },
    ]);
  });
});
