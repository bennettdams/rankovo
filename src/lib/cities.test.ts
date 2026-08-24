import { describe, expect, test } from "bun:test";
import { formatCitiesFull, formatCitiesLabel, pickCityForMap } from "./cities";

describe(`${formatCitiesLabel.name}`, () => {
  test("returns null when there are no cities", () => {
    expect(formatCitiesLabel([])).toBeNull();
  });

  test("joins one or two cities and summarizes more", () => {
    expect(formatCitiesLabel(["Hamburg"])).toBe("Hamburg");
    expect(formatCitiesLabel(["Hamburg", "Berlin"])).toBe("Hamburg, Berlin");
    expect(formatCitiesLabel(["Hamburg", "Berlin", "München"])).toBe(
      "3 Städte",
    );
  });
});

describe(`${formatCitiesFull.name}`, () => {
  test("returns null when there are no cities", () => {
    expect(formatCitiesFull([])).toBeNull();
  });

  test("always lists every city", () => {
    expect(formatCitiesFull(["Hamburg", "Berlin", "München"])).toBe(
      "Hamburg, Berlin, München",
    );
  });
});

describe(`${pickCityForMap.name}`, () => {
  test("returns null when there are no cities", () => {
    expect(pickCityForMap([])).toBeNull();
  });

  test("picks the first city in the canonical cities list", () => {
    expect(pickCityForMap(["Hannover", "Berlin"])).toBe("Berlin");
  });
});
