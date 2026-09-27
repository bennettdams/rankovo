import { describe, expect, test } from "bun:test";
import { sliderThumbLabels } from "./slider";

describe(sliderThumbLabels.name, () => {
  test("uses distinct labels for a dual slider", () => {
    expect(
      sliderThumbLabels("Bewertungsbereich", [
        "Mindestbewertung",
        "Höchstbewertung",
      ]),
    ).toEqual(["Mindestbewertung", "Höchstbewertung"]);
  });

  test("falls back to the shared label for a single slider", () => {
    expect(sliderThumbLabels("Bewertung", undefined)).toEqual([
      "Bewertung",
      "Bewertung",
    ]);
  });
});
