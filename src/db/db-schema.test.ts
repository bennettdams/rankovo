import { describe, expect, test } from "bun:test";
import { z } from "zod";
import {
  schemaCreatePlace,
  schemaCreateProduct,
  schemaCreateReview,
  schemaUpdateProduct,
  schemaUpdateReview,
  schemaUpdateUsername,
} from "./db-schema";

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(z.prettifyError(result.error));
  }
  return result.data;
}

function fieldErrors<T>(
  schema: z.ZodType<T>,
  input: unknown,
): { [K in keyof T]?: string[] } {
  const result = schema.safeParse(input);
  expect(result.success).toBe(false);
  if (result.success) throw new Error("expected parse to fail");
  return z.flattenError(result.error).fieldErrors;
}

describe("schemaCreateProduct", () => {
  const fromForm = {
    name: "Bacon Cheeseburger",
    note: null,
    category: "burger" as const,
    placeId: 85,
  };

  test("accepts the payload CreateProductForm sends after a restaurant is picked", () => {
    expect(parse(schemaCreateProduct, fromForm)).toEqual(fromForm);
  });

  test("asks for a restaurant when selectedPlace is still null", () => {
    expect(
      fieldErrors(schemaCreateProduct, { ...fromForm, placeId: null }).placeId,
    ).toBeDefined();
  });

  test("trims the name and stores an empty note as null", () => {
    expect(
      parse(schemaCreateProduct, {
        ...fromForm,
        name: "  Bacon Cheeseburger  ",
        note: "",
      }),
    ).toEqual(fromForm);
  });

  test("rejects a one-letter name and a category that is not in the list", () => {
    expect(
      fieldErrors(schemaCreateProduct, { ...fromForm, name: "A" }).name,
    ).toBeDefined();
    expect(
      fieldErrors(schemaCreateProduct, {
        ...fromForm,
        category: "not-a-category",
      }).category,
    ).toBeDefined();
  });
});

describe("schemaUpdateProduct", () => {
  const fromAdmin = {
    name: "Bacon Cheeseburger",
    note: "with jalapenos",
    category: "burger" as const,
    placeId: 85,
  };

  test("accepts the full admin form, including the selected restaurant", () => {
    expect(parse(schemaUpdateProduct, fromAdmin)).toEqual(fromAdmin);
  });

  test("rejects an update that omits the restaurant", () => {
    const withoutPlace = Object.fromEntries(
      Object.entries(fromAdmin).filter(([key]) => key !== "placeId"),
    );
    expect(
      fieldErrors(schemaUpdateProduct, withoutPlace).placeId,
    ).toBeDefined();
  });
});

describe("schemaCreateReview", () => {
  const fromForm = {
    productId: 21,
    rating: 8.5,
    note: "Crispy bread",
    urlSource: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    reviewedAt: new Date("2026-09-01T00:00:00.000Z"),
    overwriteAuthorId: null,
  };

  test("accepts a typical review submit", () => {
    expect(parse(schemaCreateReview, fromForm)).toEqual(fromForm);
  });

  test("rejects a missing rating and a rating outside 0 to 10", () => {
    expect(
      fieldErrors(schemaCreateReview, { ...fromForm, rating: null }).rating,
    ).toBeDefined();
    expect(
      fieldErrors(schemaCreateReview, { ...fromForm, rating: 10.1 }).rating,
    ).toBeDefined();
    expect(
      fieldErrors(schemaCreateReview, { ...fromForm, rating: -0.1 }).rating,
    ).toBeDefined();
  });

  test("requires https for the source URL and allows leaving it empty", () => {
    expect(
      fieldErrors(schemaCreateReview, {
        ...fromForm,
        urlSource: "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
      }).urlSource,
    ).toBeDefined();
    expect(
      parse(schemaCreateReview, { ...fromForm, urlSource: null }).urlSource,
    ).toBeNull();
  });

  test("strips authorId and isCurrent so the client cannot set them", () => {
    const parsed = parse(schemaCreateReview, {
      ...fromForm,
      authorId: "someone-else",
      isCurrent: false,
    });

    expect(parsed).not.toHaveProperty("authorId");
    expect(parsed).not.toHaveProperty("isCurrent");
  });
});

describe("schemaUpdateReview", () => {
  test("keeps rating and note, but drops reviewedAt", () => {
    expect(
      parse(schemaUpdateReview, {
        rating: 7,
        note: "Even crispier",
        reviewedAt: new Date("2020-01-01T00:00:00.000Z"),
      }),
    ).toEqual({ rating: 7, note: "Even crispier" });
  });
});

describe("schemaCreatePlace", () => {
  test("accepts a restaurant with no cities", () => {
    expect(parse(schemaCreatePlace, { name: "goldies", cities: [] })).toEqual({
      name: "goldies",
      cities: [],
    });
  });

  test("trims the name and rejects a city that is not in the list", () => {
    expect(
      parse(schemaCreatePlace, {
        name: "  Five Guys  ",
        cities: ["Hamburg"],
      }),
    ).toEqual({ name: "Five Guys", cities: ["Hamburg"] });
    expect(
      fieldErrors(schemaCreatePlace, {
        name: "Five Guys",
        cities: ["Narnia"],
      }).cities,
    ).toBeDefined();
  });

  test("rejects a blank name", () => {
    expect(
      fieldErrors(schemaCreatePlace, { name: "   ", cities: [] }).name,
    ).toBeDefined();
  });
});

describe("schemaUpdateUsername", () => {
  test("trims and keeps names between 2 and 30 characters", () => {
    expect(parse(schemaUpdateUsername, { name: "  Ada  " })).toEqual({
      name: "Ada",
    });
    expect(fieldErrors(schemaUpdateUsername, { name: "A" }).name).toBeDefined();
    expect(
      fieldErrors(schemaUpdateUsername, { name: "x".repeat(31) }).name,
    ).toBeDefined();
  });
});
