import { describe, expect, test } from "bun:test";
import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { schemaSearchParamMultiple, schemaSearchParamSingle } from "./schemas";
import { parseSearchParamsOrRedirect } from "./url-state.server";

const schema = z.object({
  q: schemaSearchParamSingle(z.string().min(1), "string"),
  page: schemaSearchParamSingle(z.number().int().positive(), "number"),
  categories: schemaSearchParamMultiple(z.enum(["burger", "pizza"])),
});

const paramsEmpty = { q: null, page: null, categories: null };

function parse(searchParams: unknown) {
  return parseSearchParamsOrRedirect({
    schema,
    searchParams,
    pathname: "/list",
  });
}

function redirectTarget(fn: () => unknown): string | null {
  try {
    fn();
  } catch (error) {
    if (isRedirectError(error)) return getURLFromRedirectError(error);
    throw error;
  }
  return null;
}

describe(`${parseSearchParamsOrRedirect.name}`, () => {
  test("returns the parsed params", () => {
    expect(
      parse({ q: "burger", page: "2", categories: "burger,pizza" }),
    ).toEqual({ q: "burger", page: 2, categories: ["burger", "pizza"] });
  });

  test("returns all keys as null without params", () => {
    expect(parse({})).toEqual(paramsEmpty);
    expect(parse(null)).toEqual(paramsEmpty);
    expect(parse(undefined)).toEqual(paramsEmpty);
    expect(parse("q=burger")).toEqual(paramsEmpty);
  });

  test("treats an empty value like a missing key", () => {
    expect(parse({ q: "", page: "", categories: "" })).toEqual(paramsEmpty);
  });

  test("ignores unknown keys", () => {
    expect(parse({ q: "burger", utm_source: "x" })).toEqual({
      ...paramsEmpty,
      q: "burger",
    });
  });

  test("uses the first value of a repeated key", () => {
    expect(parse({ q: ["burger", "pizza"] })).toEqual({
      ...paramsEmpty,
      q: "burger",
    });
    expect(parse({ q: [] })).toEqual(paramsEmpty);
  });

  test("ignores values that are not strings", () => {
    expect(parse({ q: undefined, page: 2, categories: ["burger"] })).toEqual({
      ...paramsEmpty,
      categories: ["burger"],
    });
  });
});

describe(`${parseSearchParamsOrRedirect.name} redirects`, () => {
  test("to the pathname when the only key is invalid", () => {
    expect(redirectTarget(() => parse({ page: "abc" }))).toBe("/list");
  });

  test("without the invalid key and keeps the valid and unknown ones", () => {
    expect(
      redirectTarget(() => parse({ q: "burger", page: "abc", utm: "x" })),
    ).toBe("/list?q=burger&utm=x");
  });

  test("without every invalid key at once", () => {
    expect(
      redirectTarget(() =>
        parse({ q: "burger", page: "0", categories: "sushi" }),
      ),
    ).toBe("/list?q=burger");
  });

  test("without a list when one of its items is invalid", () => {
    expect(
      redirectTarget(() => parse({ q: "x", categories: "burger,sushi" })),
    ).toBe("/list?q=x");
  });

  test("without the repeated key when its first value is invalid", () => {
    expect(redirectTarget(() => parse({ page: ["abc", "2"] }))).toBe("/list");
  });

  test("with the kept values encoded again", () => {
    expect(
      redirectTarget(() => parse({ q: "döner & co", page: "-1", x: "a b" })),
    ).toBe("/list?q=d%C3%B6ner+%26+co&x=a+b");
  });

  test("without empty values that were kept", () => {
    expect(redirectTarget(() => parse({ q: "", page: "abc" }))).toBe("/list");
  });

  test("for a refinement that names the invalid key", () => {
    const schemaRange = z
      .object({
        min: schemaSearchParamSingle(z.number(), "number"),
        max: schemaSearchParamSingle(z.number(), "number"),
      })
      .refine((p) => p.min === null || p.max === null || p.min <= p.max, {
        path: ["min"],
      });

    expect(
      redirectTarget(() =>
        parseSearchParamsOrRedirect({
          schema: schemaRange,
          searchParams: { min: "4", max: "2" },
          pathname: "/list",
        }),
      ),
    ).toBe("/list?max=2");
  });
});

describe(`${parseSearchParamsOrRedirect.name} throws instead of looping`, () => {
  test("when a required key is missing", () => {
    const schemaRequired = z.object({ q: z.string() });

    expect(() =>
      parseSearchParamsOrRedirect({
        schema: schemaRequired,
        searchParams: {},
        pathname: "/list",
      }),
    ).toThrow(z.ZodError);
  });

  test("when a refinement fails for the whole object", () => {
    const schemaRange = z
      .object({
        min: schemaSearchParamSingle(z.number(), "number"),
        max: schemaSearchParamSingle(z.number(), "number"),
      })
      .refine((p) => p.min === null || p.max === null || p.min <= p.max);

    expect(() =>
      parseSearchParamsOrRedirect({
        schema: schemaRange,
        searchParams: { min: "4", max: "2" },
        pathname: "/list",
      }),
    ).toThrow(z.ZodError);
  });
});
