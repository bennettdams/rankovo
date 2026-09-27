import { describe, expect, test } from "bun:test";
import {
  isForeignKeyViolation,
  uniqueViolationConstraint,
} from "./postgres-errors";

describe(`${isForeignKeyViolation.name}`, () => {
  test("is true for Postgres foreign key violations", () => {
    expect(isForeignKeyViolation({ code: "23503" })).toBe(true);
  });

  test("is true when Drizzle wraps the Postgres error as cause", () => {
    expect(
      isForeignKeyViolation({
        message: "insert failed",
        cause: { code: "23503" },
      }),
    ).toBe(true);
  });

  test("is false for other errors", () => {
    expect(isForeignKeyViolation({ code: "23505" })).toBe(false);
    expect(isForeignKeyViolation(new Error("insert failed"))).toBe(false);
    expect(isForeignKeyViolation(null)).toBe(false);
    expect(isForeignKeyViolation("23503")).toBe(false);
  });
});

describe(`${uniqueViolationConstraint.name}`, () => {
  test("returns the constraint name, also when wrapped as cause", () => {
    expect(
      uniqueViolationConstraint({
        code: "23505",
        constraint_name: "products_place_name_unique_idx_custom",
      }),
    ).toBe("products_place_name_unique_idx_custom");
    expect(
      uniqueViolationConstraint({
        message: "insert failed",
        cause: { code: "23505", constraint_name: "some_idx" },
      }),
    ).toBe("some_idx");
  });

  test("returns an empty string when the driver gives no name", () => {
    expect(uniqueViolationConstraint({ code: "23505" })).toBe("");
  });

  test("returns null for other errors", () => {
    expect(uniqueViolationConstraint({ code: "23503" })).toBeNull();
    expect(uniqueViolationConstraint(new Error("insert failed"))).toBeNull();
    expect(uniqueViolationConstraint(null)).toBeNull();
  });
});
