import { describe, expect, test } from "bun:test";
import { z } from "zod";
import {
  schemaNonEmptyString,
  schemaSearchParamMultiple,
  schemaSearchParamSingle,
} from "./schemas";

describe("schemaNonEmptyString", () => {
  test("trims and rejects blank strings", () => {
    expect(schemaNonEmptyString.parse("  hello  ")).toBe("hello");
    expect(schemaNonEmptyString.safeParse("   ").success).toBe(false);
  });
});

describe(`${schemaSearchParamSingle.name}`, () => {
  test("keeps a string value, including surrounding spaces", () => {
    const schema = schemaSearchParamSingle(z.string().min(1), "string");

    expect(schema.parse(" ABC ")).toBe(" ABC ");
    expect(schema.parse(undefined)).toBeNull();
  });

  test("parses numbers, booleans, and dates", () => {
    expect(schemaSearchParamSingle(z.number(), "number").parse("12.5")).toBe(
      12.5,
    );
    expect(schemaSearchParamSingle(z.boolean(), "boolean").parse("true")).toBe(
      true,
    );
    expect(schemaSearchParamSingle(z.boolean(), "boolean").parse("false")).toBe(
      false,
    );
    expect(
      schemaSearchParamSingle(z.date(), "date").parse("2021-11-25"),
    ).toEqual(new Date("2021-11-25"));
  });

  test("treats a non-true/false boolean token as null", () => {
    expect(
      schemaSearchParamSingle(z.boolean(), "boolean").parse("yes"),
    ).toBeNull();
  });
});

describe(`${schemaSearchParamMultiple.name}`, () => {
  test("splits a comma-separated list and treats a missing param as null", () => {
    const schema = schemaSearchParamMultiple(z.string().min(1));

    expect(schema.parse("burger,pizza")).toEqual(["burger", "pizza"]);
    expect(schema.parse(undefined)).toBeNull();
  });
});
