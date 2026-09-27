import { describe, expect, test } from "bun:test";
import { routes } from "./navigation";

describe("review create routes", () => {
  test("opens a product review within its restaurant route", () => {
    expect(routes.reviewCreateProduct({ placeId: 7, productId: 12 })).toBe(
      "/review/create/7?product-id=12",
    );
  });

  test("opens a known restaurant by id", () => {
    expect(routes.reviewCreateAtPlace(7)).toBe("/review/create/7");
  });

  test("opens the new restaurant draft route", () => {
    expect(routes.reviewCreateNewPlace("Burger Lab & Co")).toBe(
      "/review/create/new?place-name=Burger+Lab+%26+Co",
    );
  });

  test("drops the query param for an empty search", () => {
    expect(routes.reviewCreateSearch("")).toBe("/review/create");
    expect(routes.reviewCreateSearch("Döner")).toBe(
      "/review/create?q=D%C3%B6ner",
    );
  });
});
