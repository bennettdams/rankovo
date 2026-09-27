import { describe, expect, test } from "bun:test";
import { ratingAfterPointerDown } from "./rating-input.client";

describe(ratingAfterPointerDown.name, () => {
  test("commits zero when the blank slider is first pressed", () => {
    expect(ratingAfterPointerDown(null)).toBe(0);
  });

  test("keeps an existing rating unchanged", () => {
    expect(ratingAfterPointerDown(7.4)).toBe(7.4);
  });
});
