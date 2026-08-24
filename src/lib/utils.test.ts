import { describe, expect, test } from "bun:test";
import {
  cn,
  createRandomNumberBetween,
  isKeyOfObj,
  isServer,
  objectEntries,
  pickRandomFromArray,
  pickRandomValueFromObject,
  takeUniqueOrThrow,
} from "./utils";

describe(`${cn.name}`, () => {
  test("merges tailwind classes and keeps the last conflicting utility", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  test("ignores falsy class values", () => {
    expect(cn("text-red-500", undefined, null)).toBe("text-red-500");
  });
});

describe(`${isServer.name}`, () => {
  test("is true in the bun test runtime", () => {
    expect(isServer()).toBe(true);
  });
});

describe(`${objectEntries.name}`, () => {
  test("returns the same pairs as Object.entries", () => {
    expect(objectEntries({ a: 1, b: "two" })).toEqual([
      ["a", 1],
      ["b", "two"],
    ]);
  });
});

describe(`${isKeyOfObj.name}`, () => {
  test("returns true when the key exists", () => {
    expect(isKeyOfObj({ name: "Ada" }, "name")).toBe(true);
  });

  test("throws when the key is missing", () => {
    expect(() => isKeyOfObj({ name: "Ada" }, "age")).toThrow(
      "Key age not found in object",
    );
  });
});

describe(`${pickRandomFromArray.name}`, () => {
  test("returns the first item when Math.random is 0", () => {
    const original = Math.random;
    Math.random = () => 0;
    try {
      expect(pickRandomFromArray(["a", "b", "c"])).toBe("a");
    } finally {
      Math.random = original;
    }
  });

  test("throws when the array is empty", () => {
    expect(() => pickRandomFromArray([])).toThrow("No random element found");
  });
});

describe(`${pickRandomValueFromObject.name}`, () => {
  test("returns the only value of a single-key object", () => {
    expect(pickRandomValueFromObject({ only: 42 })).toBe(42);
  });
});

describe(`${createRandomNumberBetween.name}`, () => {
  test("returns min when Math.random is 0", () => {
    const original = Math.random;
    Math.random = () => 0;
    try {
      expect(createRandomNumberBetween({ min: 2, max: 10 })).toBe(2);
    } finally {
      Math.random = original;
    }
  });

  test("rounds to one decimal place when requested", () => {
    const original = Math.random;
    Math.random = () => 0.5;
    try {
      expect(
        createRandomNumberBetween({ min: 0, max: 1, decimalPlaces: 1 }),
      ).toBe(0.5);
    } finally {
      Math.random = original;
    }
  });
});

describe(`${takeUniqueOrThrow.name}`, () => {
  test("returns the only value", () => {
    expect(takeUniqueOrThrow(["solo"], "many", "none")).toBe("solo");
  });

  test("throws when there are no values", () => {
    expect(() => takeUniqueOrThrow([], "many", "none")).toThrow("none");
  });

  test("throws when there is more than one value", () => {
    expect(() => takeUniqueOrThrow(["a", "b"], "many", "none")).toThrow("many");
  });
});
