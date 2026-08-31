import { describe, expect, test } from "bun:test";
import { isForeignKeyViolation } from "./postgres-errors";

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
