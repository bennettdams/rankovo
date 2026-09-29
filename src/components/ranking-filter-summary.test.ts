import { describe, expect, test } from "bun:test";
import {
  getRankingFilterChips,
  getRankingFilterSummaryHeader,
} from "./ranking-filter-summary.client";

describe(`${getRankingFilterSummaryHeader.name}`, () => {
  test("describes the default ranking scope", () => {
    expect(
      getRankingFilterSummaryHeader({
        categories: null,
        cities: null,
        critics: null,
        "rating-min": null,
        "rating-max": null,
        "reviews-min": null,
        q: null,
      }),
    ).toBe("Alle Produkte · Alle Städte");
  });

  test("uses the search query and selected cities", () => {
    expect(
      getRankingFilterSummaryHeader({
        categories: null,
        cities: ["Hamburg", "Berlin"],
        critics: null,
        "rating-min": null,
        "rating-max": null,
        "reviews-min": null,
        q: "Cheeseburger",
      }),
    ).toBe("Cheeseburger · Hamburg, Berlin");
  });

  test("uses selected categories when there is no search query", () => {
    expect(
      getRankingFilterSummaryHeader({
        categories: ["burger", "chicken"],
        cities: ["Hamburg"],
        critics: null,
        "rating-min": null,
        "rating-max": null,
        "reviews-min": null,
        q: null,
      }),
    ).toBe("Burger & Hähnchen · Hamburg");
  });

  test("formats three selected categories as a natural list", () => {
    expect(
      getRankingFilterSummaryHeader({
        categories: ["chicken", "pizza", "sandwich"],
        cities: null,
        critics: null,
        "rating-min": null,
        "rating-max": null,
        "reviews-min": null,
        q: null,
      }),
    ).toBe("Hähnchen, Pizza & Sandwich · Alle Städte");
  });
});

describe(`${getRankingFilterChips.name}`, () => {
  test("returns removable labels for active filters", () => {
    expect(
      getRankingFilterChips({
        categories: ["burger", "pizza"],
        cities: ["Hamburg"],
        critics: ["Holle21614"],
        "rating-min": 7,
        "rating-max": 10,
        "reviews-min": 5,
        q: "Cheeseburger",
      }),
    ).toEqual([
      { key: "q", label: "Cheeseburger" },
      { key: "categories", label: "Burger, Pizza" },
      { key: "cities", label: "Hamburg" },
      { key: "critics", label: "Holle21614" },
      { key: "rating-min", label: "Bewertung 7–10" },
      { key: "reviews-min", label: "mind. 5 Bewertungen" },
    ]);
  });
});
