import { describe, expect, test } from "bun:test";
import { extractReviewSourceFromUrl } from "./business-utils";

describe(`${extractReviewSourceFromUrl.name}`, () => {
  test("recognizes YouTube and Instagram with protocol and www prefixes stripped", () => {
    expect(
      extractReviewSourceFromUrl("https://www.youtube.com/watch?v=abc"),
    ).toBe("YouTube");
    expect(extractReviewSourceFromUrl("http://youtube.com/shorts/abc")).toBe(
      "YouTube",
    );
    expect(extractReviewSourceFromUrl("https://www.instagram.com/p/abc")).toBe(
      "Instagram",
    );
  });

  test("returns null when the host is not a known review source", () => {
    expect(extractReviewSourceFromUrl("https://example.com/video")).toBeNull();
  });

  test("rejects a lookalike hostname that only prefixes a known source", () => {
    expect(
      extractReviewSourceFromUrl(
        "https://youtube.com.attacker.example/watch?v=abc",
      ),
    ).toBeNull();
  });
});
