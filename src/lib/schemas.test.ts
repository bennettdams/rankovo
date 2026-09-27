import { describe, expect, test } from "bun:test";
import { z } from "zod";
import {
  schemaNonEmptyString,
  schemaCreateVisit,
  schemaSearchParamMultiple,
  schemaSearchParamSingle,
  type VisitCreate,
} from "./schemas";

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(z.prettifyError(result.error));
  }
  return result.data;
}

describe("schemaNonEmptyString", () => {
  test("trims and rejects blank strings", () => {
    expect(schemaNonEmptyString.parse("  hello  ")).toBe("hello");
    expect(schemaNonEmptyString.safeParse("   ").success).toBe(false);
  });
});

describe(`${schemaSearchParamSingle.name}`, () => {
  test("keeps a string value, including surrounding spaces", () => {
    const schema = schemaSearchParamSingle(z.string().min(1), "string");

    expect(schema.parse(" ABC ")).toBe(" ABC ");
    expect(schema.parse(undefined)).toBeNull();
  });

  test("parses numbers, booleans, and dates", () => {
    expect(schemaSearchParamSingle(z.number(), "number").parse("12.5")).toBe(
      12.5,
    );
    expect(schemaSearchParamSingle(z.boolean(), "boolean").parse("true")).toBe(
      true,
    );
    expect(schemaSearchParamSingle(z.boolean(), "boolean").parse("false")).toBe(
      false,
    );
    expect(
      schemaSearchParamSingle(z.date(), "date").parse("2021-11-25"),
    ).toEqual(new Date("2021-11-25"));
  });

  test("treats a non-true/false boolean token as null", () => {
    expect(
      schemaSearchParamSingle(z.boolean(), "boolean").parse("yes"),
    ).toBeNull();
  });
});

describe(`${schemaSearchParamMultiple.name}`, () => {
  test("splits a comma-separated list and treats a missing param as null", () => {
    const schema = schemaSearchParamMultiple(z.string().min(1));

    expect(schema.parse("burger,pizza")).toEqual(["burger", "pizza"]);
    expect(schema.parse(undefined)).toBeNull();
  });
});

describe("schemaCreateVisit", () => {
  const reviewKnown = {
    id: "product-21",
    product: { kind: "existing" as const, id: 21 },
    rating: 8.6,
    note: null,
  } satisfies VisitCreate["reviews"][number];
  const reviewNew = {
    id: "new-4",
    product: {
      kind: "new" as const,
      name: "Chili Fries",
      category: "burger" as const,
    },
    rating: 7,
    note: "scharf",
  } satisfies VisitCreate["reviews"][number];
  const atKnownPlace = {
    place: { kind: "existing" as const, id: 7 },
    reviews: [reviewKnown, reviewNew],
    urlSource: null,
    overwriteAuthorId: null,
  };

  function issuePaths(input: unknown): string[] {
    const result = schemaCreateVisit.safeParse(input);
    expect(result.success).toBe(false);
    if (result.success) throw new Error("expected parse to fail");
    return result.error.issues.map((issue) => issue.path.join("."));
  }

  test("accepts known and new products rated in one visit", () => {
    expect(parse(schemaCreateVisit, atKnownPlace)).toEqual(atKnownPlace);
  });

  test("accepts a new restaurant with its first new product", () => {
    const atNewPlace = {
      ...atKnownPlace,
      place: {
        kind: "new" as const,
        name: "  Burger Lab  ",
        cities: ["Leipzig"],
      },
      reviews: [reviewNew],
    };
    expect(parse(schemaCreateVisit, atNewPlace).place).toEqual({
      kind: "new",
      name: "Burger Lab",
      cities: ["Leipzig"],
    });
  });

  test("needs at least one review", () => {
    expect(issuePaths({ ...atKnownPlace, reviews: [] })).toEqual(["reviews"]);
  });

  test("requires a stable review draft id", () => {
    expect(
      issuePaths({
        ...atKnownPlace,
        reviews: [{ ...reviewKnown, id: "row-1" }],
      }),
    ).toEqual(["reviews.0.id"]);
  });

  test("points the error at the row whose rating is missing", () => {
    expect(
      issuePaths({
        ...atKnownPlace,
        reviews: [reviewKnown, { ...reviewNew, rating: null }],
      }),
    ).toEqual(["reviews.1.rating"]);
  });

  test("rejects the same product twice, also for new names in another case", () => {
    expect(
      issuePaths({
        ...atKnownPlace,
        reviews: [
          reviewKnown,
          reviewKnown,
          reviewNew,
          {
            ...reviewNew,
            product: { ...reviewNew.product, name: "chili fries" },
          },
        ],
      }),
    ).toEqual(["reviews.1.product", "reviews.3.product.name"]);
  });
});
