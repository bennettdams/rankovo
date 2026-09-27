import { describe, expect, test } from "bun:test";
import { visitErrorsByReviewId } from "./visit-errors";

describe(visitErrorsByReviewId.name, () => {
  test("keys review issues by the draft id instead of the payload index", () => {
    expect(
      visitErrorsByReviewId(
        [
          {
            path: ["reviews", 1, "product", "name"],
            message: "Produktname fehlt",
          },
          {
            path: ["reviews", 1, "rating"],
            message: "Bewertung fehlt",
          },
        ],
        [{ id: "product-21" }, { id: "new-4" }],
      ),
    ).toEqual({
      "new-4.product.name": "Produktname fehlt",
      "new-4.rating": "Bewertung fehlt",
    });
  });

  test("keeps non-review issues at their original path", () => {
    expect(
      visitErrorsByReviewId(
        [{ path: ["place", "name"], message: "Restaurantname fehlt" }],
        [{ id: "product-21" }],
      ),
    ).toEqual({ "place.name": "Restaurantname fehlt" });
  });
});
