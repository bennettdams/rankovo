import { describe, expect, test } from "bun:test";
import { prepareFormState } from "./form-utils";

describe(`${prepareFormState.name}`, () => {
  test("transforms form fields according to the config", () => {
    const formData = new FormData();
    formData.set("name", "Cheeseburger");
    formData.append("tags", "burger");
    formData.append("tags", "smash");
    formData.set("rating", "8.5");
    formData.set("reviewedAt", "2021-11-25");

    expect(
      prepareFormState(
        {
          name: "string",
          tags: "stringArray",
          rating: "number",
          reviewedAt: "date",
        },
        formData,
      ),
    ).toEqual({
      name: "Cheeseburger",
      tags: ["burger", "smash"],
      rating: 8.5,
      reviewedAt: new Date("2021-11-25"),
    });
  });

  test("turns empty and missing numeric fields into null", () => {
    const formData = new FormData();
    formData.set("rating", "");

    expect(
      prepareFormState({ rating: "number", missing: "number" }, formData),
    ).toEqual({
      rating: null,
      missing: null,
    });
  });

  test("turns an empty string field into null", () => {
    const formData = new FormData();
    formData.set("note", "");

    expect(prepareFormState({ note: "string" }, formData)).toEqual({
      note: null,
    });
  });
});
