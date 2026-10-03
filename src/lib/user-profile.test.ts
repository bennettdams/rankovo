import { describe, expect, test } from "bun:test";
import { getUserReviewStats } from "./user-profile";

const reviews = [
  {
    rating: 8.5,
    productCategory: "burger",
    placeName: "Burger House",
    reviewedAt: new Date("2026-10-01T12:00:00Z"),
  },
  {
    rating: 8,
    productCategory: "burger",
    placeName: "Burger House",
    reviewedAt: new Date("2026-09-30T12:00:00Z"),
  },
  {
    rating: 7.5,
    productCategory: "doener",
    placeName: "Kebab Corner",
    reviewedAt: new Date("2026-09-28T12:00:00Z"),
  },
] as const;

describe(getUserReviewStats.name, () => {
  test("summarizes all reviews with factual metrics", () => {
    expect(getUserReviewStats(reviews)).toEqual({
      count: 3,
      averageRating: 8,
      ratingLowest: 7.5,
      ratingHighest: 8.5,
      categoryCount: 2,
      placeCount: 2,
      latestReviewedAt: new Date("2026-10-01T12:00:00Z"),
    });
  });

  test("returns empty metrics when the user has no reviews", () => {
    expect(getUserReviewStats([])).toEqual({
      count: 0,
      averageRating: null,
      ratingLowest: null,
      ratingHighest: null,
      categoryCount: 0,
      placeCount: 0,
      latestReviewedAt: null,
    });
  });

  test("ignores reviews without a review date when finding the latest date", () => {
    expect(
      getUserReviewStats([
        {
          rating: 9,
          productCategory: "pizza",
          placeName: "Pizza Place",
          reviewedAt: null,
        },
      ]),
    ).toMatchObject({
      count: 1,
      latestReviewedAt: null,
    });
  });
});
