import { describe, expect, test } from "bun:test";
import { stringifySearchParams } from "./url-state";

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

  test("omits empty strings and null", () => {
    expect(stringifySearchParams({})).toBe("");
    expect(stringifySearchParams({ q: "", page: null, cities: null })).toBe("");
    expect(stringifySearchParams({ q: "burger", page: null })).toBe("q=burger");
  });

  test("keeps zero and encodes reserved characters", () => {
    expect(stringifySearchParams({ page: 0, q: "five guy" })).toBe(
      "page=0&q=five+guy",
    );
    expect(stringifySearchParams({ q: "döner" })).toBe("q=d%C3%B6ner");
  });

  test("throws for an unhandled value type", () => {
    expect(() => stringifySearchParams({ ok: true })).toThrow(
      "Search param: Unhandled value type: true",
    );
    expect(() => stringifySearchParams({ extra: undefined })).toThrow(
      "Search param: Unhandled value type: undefined",
    );
    expect(() => stringifySearchParams({ categories: [] })).toThrow(
      "Search param: Unhandled value type:",
    );
  });
});
