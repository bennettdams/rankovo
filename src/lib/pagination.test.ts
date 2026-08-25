import { describe, expect, test } from "bun:test";
import {
  lastPage,
  pageFromSearchParam,
  pageOffset,
  pageSearchParam,
  schemaPageSearchParam,
  shiftPage,
  totalPages,
  type Page,
} from "./pagination";

function pageAt(raw: string): Page {
  return pageFromSearchParam(schemaPageSearchParam.parse(raw));
}

describe("schemaPageSearchParam", () => {
  test("parses a positive integer page and treats a missing param as null", () => {
    expect(Number(schemaPageSearchParam.parse("1"))).toBe(1);
    expect(Number(schemaPageSearchParam.parse("2"))).toBe(2);
    expect(schemaPageSearchParam.parse(undefined)).toBeNull();
  });

  test("rejects zero, negatives, fractions, and non-numeric values", () => {
    expect(schemaPageSearchParam.safeParse("0").success).toBe(false);
    expect(schemaPageSearchParam.safeParse("-1").success).toBe(false);
    expect(schemaPageSearchParam.safeParse("1.5").success).toBe(false);
    expect(schemaPageSearchParam.safeParse("abc").success).toBe(false);
    expect(schemaPageSearchParam.safeParse("").success).toBe(false);
  });
});

describe(`${pageFromSearchParam.name}`, () => {
  test("defaults a missing page to 1", () => {
    expect(Number(pageFromSearchParam(null))).toBe(1);
  });

  test("keeps an explicit page from the URL", () => {
    expect(Number(pageFromSearchParam(schemaPageSearchParam.parse("1")))).toBe(
      1,
    );
    expect(Number(pageFromSearchParam(schemaPageSearchParam.parse("3")))).toBe(
      3,
    );
  });
});

describe(`${pageSearchParam.name}`, () => {
  test("omits page 1 from the URL and keeps later pages", () => {
    expect(pageSearchParam(pageAt("1"))).toBeNull();
    expect(Number(pageSearchParam(pageAt("2")))).toBe(2);
    expect(Number(pageSearchParam(pageAt("3")))).toBe(3);
  });

  test("round-trips with pageFromSearchParam", () => {
    expect(pageFromSearchParam(pageSearchParam(pageAt("1")))).toEqual(
      pageAt("1"),
    );
    expect(pageFromSearchParam(pageSearchParam(pageAt("4")))).toEqual(
      pageAt("4"),
    );
  });
});

describe(`${pageOffset.name}`, () => {
  test("converts a 1-based page to a 0-based SQL offset", () => {
    expect(Number(pageOffset(pageAt("1"), 25))).toBe(0);
    expect(Number(pageOffset(pageAt("2"), 25))).toBe(25);
    expect(Number(pageOffset(pageAt("3"), 25))).toBe(50);
  });

  test("uses the page size as the stride", () => {
    expect(Number(pageOffset(pageAt("5"), 1))).toBe(4);
    expect(Number(pageOffset(pageAt("3"), 10))).toBe(20);
  });

  test("rejects a page size below 1", () => {
    expect(() => pageOffset(pageAt("1"), 0)).toThrow("Invalid pageSize: 0");
    expect(() => pageOffset(pageAt("1"), -10)).toThrow("Invalid pageSize: -10");
    expect(() => pageOffset(pageAt("1"), 0.5)).toThrow("Invalid pageSize: 0.5");
  });
});

describe(`${totalPages.name}`, () => {
  test("is at least 1 even for an empty result set", () => {
    expect(Number(totalPages(0, 25))).toBe(1);
  });

  test("rounds up by page size", () => {
    expect(Number(totalPages(24, 25))).toBe(1);
    expect(Number(totalPages(25, 25))).toBe(1);
    expect(Number(totalPages(26, 25))).toBe(2);
    expect(Number(totalPages(50, 25))).toBe(2);
    expect(Number(totalPages(51, 25))).toBe(3);
  });

  test("rejects a page size below 1", () => {
    expect(() => totalPages(10, 0)).toThrow("Invalid pageSize: 0");
    expect(() => totalPages(10, -1)).toThrow("Invalid pageSize: -1");
  });
});

describe(`${shiftPage.name}`, () => {
  test("moves forward one page at a time", () => {
    const page2 = shiftPage(pageAt("1"), 1);
    const page3 = shiftPage(page2, 1);

    expect(Number(page2)).toBe(2);
    expect(Number(page3)).toBe(3);
  });

  test("moves back one page and does not go below page 1", () => {
    expect(Number(shiftPage(pageAt("3"), -1))).toBe(2);
    expect(Number(shiftPage(pageAt("2"), -1))).toBe(1);
    expect(Number(shiftPage(pageAt("1"), -1))).toBe(1);
  });
});

describe(`${lastPage.name}`, () => {
  test("is the last 1-based page for a page count", () => {
    expect(Number(lastPage(totalPages(1, 25)))).toBe(1);
    expect(Number(lastPage(totalPages(26, 25)))).toBe(2);
    expect(Number(lastPage(totalPages(51, 25)))).toBe(3);
  });

  test("can be written back to a search param for clamping", () => {
    expect(pageSearchParam(lastPage(totalPages(0, 25)))).toBeNull();
    expect(Number(pageSearchParam(lastPage(totalPages(51, 25))))).toBe(3);
  });
});
