import { describe, expect, test } from "bun:test";
import { and, type SQL } from "drizzle-orm";
import { CasingCache } from "drizzle-orm/casing";
import { shouldRunSearch } from "./static";
import { conditionsSearchProducts, ilikeContains } from "./search-conditions";

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

describe(`${shouldRunSearch.name}`, () => {
  test("stays quiet until the query has enough characters", () => {
    expect(shouldRunSearch(null)).toBe(false);
    expect(shouldRunSearch("")).toBe(false);
    expect(shouldRunSearch("  ")).toBe(false);
    expect(shouldRunSearch("Do")).toBe(false);
    expect(shouldRunSearch("  Do")).toBe(false);
  });

  test("runs once the trimmed query meets the search minimum", () => {
    expect(shouldRunSearch("Don")).toBe(true);
    expect(shouldRunSearch("  Don")).toBe(true);
    expect(shouldRunSearch("Five Guys")).toBe(true);
  });
});
