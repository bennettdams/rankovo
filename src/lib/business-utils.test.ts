import { describe, expect, test } from "bun:test";
import { ratingHighest, ratingLowest } from "@/data/static";
import {
  extractReviewSourceFromUrl,
  guessCategoryFromName,
  isRatingInRange,
} from "./business-utils";

describe(`${extractReviewSourceFromUrl.name}`, () => {
  test("recognizes YouTube and Instagram with protocol and www prefixes stripped", () => {
    expect(
      extractReviewSourceFromUrl("https://www.youtube.com/watch?v=abc"),
    ).toBe("YouTube");
    expect(extractReviewSourceFromUrl("http://youtube.com/shorts/abc")).toBe(
      "YouTube",
    );
    expect(extractReviewSourceFromUrl("https://www.instagram.com/p/abc")).toBe(
      "Instagram",
    );
  });

  test("returns null when the host is not a known review source", () => {
    expect(extractReviewSourceFromUrl("https://example.com/video")).toBeNull();
  });

  test("rejects a lookalike hostname that only prefixes a known source", () => {
    expect(
      extractReviewSourceFromUrl(
        "https://youtube.com.attacker.example/watch?v=abc",
      ),
    ).toBeNull();
  });
});

describe(`${guessCategoryFromName.name}`, () => {
  test("finds the category from typical product names", () => {
    expect(guessCategoryFromName("Crispy Chili Burger")).toBe("burger");
    expect(guessCategoryFromName("Döner (Sylter Fladenbrot)")).toBe("doener");
    expect(guessCategoryFromName("Dürüm Kebap")).toBe("doener");
    expect(guessCategoryFromName("Pizza Margherita")).toBe("pizza");
    expect(guessCategoryFromName("Pastrami Sandwich")).toBe("sandwich");
    expect(guessCategoryFromName("Hot Wings")).toBe("chicken");
  });

  test("counts a chicken burger as a burger", () => {
    expect(guessCategoryFromName("Chicken Burger")).toBe("burger");
  });

  test("returns null when no keyword matches", () => {
    expect(guessCategoryFromName("BETR Mac")).toBeNull();
    expect(guessCategoryFromName("")).toBeNull();
  });
});

describe(`${isRatingInRange.name}`, () => {
  test("rejects an empty rating so the form can stay blank", () => {
    expect(isRatingInRange(null)).toBe(false);
  });

  test("accepts the 0–10 endpoints and a value in between", () => {
    expect(isRatingInRange(ratingLowest)).toBe(true);
    expect(isRatingInRange(7.4)).toBe(true);
    expect(isRatingInRange(ratingHighest)).toBe(true);
  });

  test("rejects values outside the scale", () => {
    expect(isRatingInRange(-0.1)).toBe(false);
    expect(isRatingInRange(10.1)).toBe(false);
    expect(isRatingInRange(Number.NaN)).toBe(false);
  });
});
