import { describe, expect, test } from "bun:test";
import { prepareFiltersForUpdate } from "./url-state.client";

const filters = {
  q: "burger" as string | null,
  city: "Hamburg" as string | null,
  categories: ["burger"] as string[] | null,
  page: 1 as number | null,
};

describe(`${prepareFiltersForUpdate.name}`, () => {
  test("returns false when nothing changed", () => {
    expect(prepareFiltersForUpdate({ q: "burger" }, filters)).toBe(false);
    expect(prepareFiltersForUpdate({ page: 1 }, filters)).toBe(false);
    expect(
      prepareFiltersForUpdate({ categories: filters.categories }, filters),
    ).toBe(false);
    expect(prepareFiltersForUpdate({}, filters)).toBe(false);
  });

  test("merges a changed filter into the existing set", () => {
    expect(prepareFiltersForUpdate({ q: "pizza" }, filters)).toEqual({
      ...filters,
      q: "pizza",
    });
    expect(prepareFiltersForUpdate({ q: null }, filters)).toEqual({
      ...filters,
      q: null,
    });
    expect(
      prepareFiltersForUpdate({ city: "Berlin", page: 2 }, filters),
    ).toEqual({
      ...filters,
      city: "Berlin",
      page: 2,
    });
  });

  test("treats a new array as a change even with the same contents", () => {
    expect(
      prepareFiltersForUpdate({ categories: ["burger"] }, filters),
    ).toEqual({
      ...filters,
      categories: ["burger"],
    });
  });

  test("throws when the partial uses a key that does not exist yet", () => {
    expect(() =>
      prepareFiltersForUpdate(
        { missing: "x" } as Partial<typeof filters>,
        filters,
      ),
    ).toThrow("Key missing not found in object");
  });
});
