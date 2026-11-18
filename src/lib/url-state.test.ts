import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { schemaSearchParamMultiple, schemaSearchParamSingle } from "./schemas";
import {
  escapeListItem,
  hrefWithSearchParams,
  stringifySearchParams,
  unescapeListItem,
  type SearchParamValue,
} from "./url-state";

/** Decodes a query string the way Next.js does for the `searchParams` prop. */
function decodeQuery(queryString: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(queryString));
}

describe(`${hrefWithSearchParams.name}`, () => {
  test("appends the query string to the pathname", () => {
    expect(hrefWithSearchParams("/admin", { tab: "places", page: 2 })).toBe(
      "/admin?tab=places&page=2",
    );
  });

  test("omits the question mark without params", () => {
    expect(hrefWithSearchParams("/admin", {})).toBe("/admin");
    expect(hrefWithSearchParams("/admin", { q: null, tab: "", list: [] })).toBe(
      "/admin",
    );
  });

  test("keeps the key order of the params", () => {
    expect(hrefWithSearchParams("/", { b: "2", a: "1", c: "3" })).toBe(
      "/?b=2&a=1&c=3",
    );
  });
});

describe(`${stringifySearchParams.name}`, () => {
  test("serializes strings, numbers, and non-empty arrays", () => {
    expect(
      stringifySearchParams({
        q: "burger",
        page: 2,
        categories: ["burger", "pizza"],
      }),
    ).toBe("q=burger&page=2&categories=burger%2Cpizza");
  });

  test("omits empty strings, empty arrays, and null", () => {
    expect(stringifySearchParams({})).toBe("");
    expect(stringifySearchParams({ q: "", page: null, cities: null })).toBe("");
    expect(stringifySearchParams({ q: "burger", page: null })).toBe("q=burger");
    expect(stringifySearchParams({ categories: [] })).toBe("");
  });

  test("keeps zero, negative, and decimal numbers", () => {
    expect(stringifySearchParams({ a: 0, b: -1, c: 4.5 })).toBe(
      "a=0&b=-1&c=4.5",
    );
  });

  test("keeps whitespace-only strings, as spaces can be intentional", () => {
    expect(stringifySearchParams({ q: " " })).toBe("q=+");
  });

  test("encodes reserved characters", () => {
    expect(stringifySearchParams({ q: "five guy" })).toBe("q=five+guy");
    expect(stringifySearchParams({ q: "döner" })).toBe("q=d%C3%B6ner");
    expect(stringifySearchParams({ q: "a&b=c?d#e+f%g/h" })).toBe(
      "q=a%26b%3Dc%3Fd%23e%2Bf%25g%2Fh",
    );
  });

  test("serializes booleans", () => {
    expect(stringifySearchParams({ a: true, b: false })).toBe("a=true&b=false");
  });

  test("serializes dates as full ISO timestamps", () => {
    expect(
      stringifySearchParams({ from: new Date("2021-11-25T10:30:00.000Z") }),
    ).toBe("from=2021-11-25T10%3A30%3A00.000Z");
  });

  test("escapes the list separator inside list items", () => {
    expect(stringifySearchParams({ critics: ["Müller, Hans", "Ben"] })).toBe(
      "critics=M%C3%BCller%252C+Hans%2CBen",
    );
  });

  test("throws for values that have no URL representation", () => {
    const invalid = (value: unknown) => () =>
      stringifySearchParams({ key: value as SearchParamValue });

    expect(invalid(NaN)).toThrow("Search param: Unhandled value type: NaN");
    expect(invalid(Infinity)).toThrow(
      "Search param: Unhandled value type: Infinity",
    );
    expect(invalid(new Date("nope"))).toThrow(
      "Search param: Unhandled value type: Invalid Date",
    );
    expect(invalid(undefined)).toThrow(
      "Search param: Unhandled value type: undefined",
    );
    expect(invalid({})).toThrow("Search param: Unhandled value type:");
  });
});

describe(`${escapeListItem.name} / ${unescapeListItem.name}`, () => {
  test.each([
    "plain",
    "",
    ",",
    "%",
    "a,b",
    "100%",
    "%2C",
    "%25",
    "%252C",
    ",%,%2C,",
  ])("round-trips %p", (item) => {
    expect(escapeListItem(item)).not.toContain(",");
    expect(unescapeListItem(escapeListItem(item))).toBe(item);
  });
});

describe("serialize and parse round trip", () => {
  test("keeps strings exactly, including spaces and reserved characters", () => {
    const schema = z.object({
      q: schemaSearchParamSingle(z.string().min(1), "string"),
    });

    for (const q of [" ABC ", "döner & co", "a=b?c#d+e%f", "100%", "a,b"]) {
      expect(schema.parse(decodeQuery(stringifySearchParams({ q })))).toEqual({
        q,
      });
    }
  });

  test("keeps numbers, booleans, and dates", () => {
    const schema = z.object({
      rating: schemaSearchParamSingle(z.number(), "number"),
      zero: schemaSearchParamSingle(z.number(), "number"),
      flag: schemaSearchParamSingle(z.boolean(), "boolean"),
      off: schemaSearchParamSingle(z.boolean(), "boolean"),
      date: schemaSearchParamSingle(z.date(), "date"),
    });
    const values = {
      rating: 4.5,
      zero: 0,
      flag: true,
      off: false,
      date: new Date(2021, 10, 25),
    };

    expect(schema.parse(decodeQuery(stringifySearchParams(values)))).toEqual(
      values,
    );
  });

  test("keeps list items that contain the separator or the escape char", () => {
    const schema = z.object({
      critics: schemaSearchParamMultiple(z.string().min(1)),
    });
    const critics = ["Müller, Hans", "100%", "a%2Cb", "Ben"];

    expect(
      schema.parse(decodeQuery(stringifySearchParams({ critics }))),
    ).toEqual({ critics });
  });

  test("turns empty values into missing keys on both sides", () => {
    const schema = z.object({
      q: schemaSearchParamSingle(z.string().min(1), "string"),
      categories: schemaSearchParamMultiple(z.string().min(1)),
    });
    const query = stringifySearchParams({ q: "", categories: [] });

    expect(query).toBe("");
    expect(schema.parse(decodeQuery(query))).toEqual({
      q: null,
      categories: null,
    });
  });
});
