import { describe, expect, test } from "bun:test";
import { and, type SQL } from "drizzle-orm";
import { CasingCache } from "drizzle-orm/casing";
import {
  conditionsSearchProducts,
  conditionsSearchReviewProducts,
  ilikeContains,
} from "./search-conditions";

function sqlToQuery(fragment: SQL) {
  return fragment.toQuery({
    casing: new CasingCache(),
    escapeName: (name) => `"${name}"`,
    escapeParam: (num) => `$${num + 1}`,
    escapeString: (str) => `'${str.replaceAll("'", "''")}'`,
  });
}

function paramsOf(conditions: (SQL | undefined)[] | undefined) {
  if (!conditions) return [];
  const combined = and(...conditions);
  if (!combined) return [];
  return sqlToQuery(combined).params;
}

describe(`${ilikeContains.name}`, () => {
  test("wraps the value in wildcards for a contains search", () => {
    expect(ilikeContains("döner")).toBe("%döner%");
  });

  test("escapes %, _, and backslash so they are literal characters", () => {
    expect(ilikeContains("100%")).toBe("%100\\%%");
    expect(ilikeContains("A_B")).toBe("%A\\_B%");
    expect(ilikeContains("a\\b")).toBe("%a\\\\b%");
  });
});

describe(`${conditionsSearchProducts.name}`, () => {
  test("returns undefined when there are no searchable terms", () => {
    expect(conditionsSearchProducts("")).toBeUndefined();
    expect(conditionsSearchProducts("   ")).toBeUndefined();
    expect(conditionsSearchProducts("in")).toBeUndefined();
  });

  test("drops the conjunction 'in' and ANDs the remaining terms", () => {
    const params = paramsOf(conditionsSearchProducts("Burger in Berlin"));

    expect(params).toContain("%burger%");
    expect(params).toContain("%berlin%");
    expect(params).not.toContain("%in%");
  });
});

describe(`${conditionsSearchReviewProducts.name}`, () => {
  test("ANDs place name with product search so other restaurants are excluded", () => {
    const conditions = conditionsSearchReviewProducts("cheesebur", "five guy");

    expect(conditions).toBeDefined();
    const params = paramsOf(conditions);

    expect(params).toContain("%cheesebur%");
    expect(params).toContain("%five guy%");
  });

  test("filters by restaurant name when product name is omitted", () => {
    const params = paramsOf(conditionsSearchReviewProducts(null, "five guy"));

    expect(params).toEqual(["%five guy%"]);
  });

  test("ignores a place name shorter than the search minimum", () => {
    const params = paramsOf(conditionsSearchReviewProducts("cheesebur", "fg"));

    expect(params).toContain("%cheesebur%");
    expect(params).not.toContain("%fg%");
  });

  test("returns undefined when neither filter is usable", () => {
    expect(conditionsSearchReviewProducts(null, null)).toBeUndefined();
    expect(conditionsSearchReviewProducts(null, "ab")).toBeUndefined();
    expect(conditionsSearchReviewProducts("", null)).toBeUndefined();
  });
});
