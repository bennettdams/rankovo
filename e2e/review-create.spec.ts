import { expect, test, type Page } from "@playwright/test";
import { setRating, uniqueName } from "./review-helpers";

const seededPlaceName = "Lister Döner";
const seededProductName = "Döner Hähnchen";

function placeSearchResults(page: Page) {
  return page.getByRole("region", { name: "Suchergebnisse" });
}

async function openPlaceFromReviewSearch(page: Page, query: string) {
  await page.getByLabel("Restaurant oder Gericht").fill(query);

  const results = placeSearchResults(page);
  await expect(results).toHaveAttribute("aria-busy", "false");

  const placeLinks = results
    .locator('a[href^="/review/create/"]:not([href^="/review/create/new"])')
    .filter({ hasText: query });
  await expect(placeLinks).toHaveCount(1);
  const placeHref = await placeLinks.getAttribute("href");
  expect(placeHref).toMatch(/\/review\/create\/\d+$/);
  await page.goto(placeHref!);
}

async function openSeededPlace(page: Page) {
  await page.goto("/review/create");
  await openPlaceFromReviewSearch(page, seededPlaceName);
}

async function submitSingleReview(
  page: Page,
  productName: string,
  ratingTenths: number,
) {
  const slider = page.getByRole("slider", {
    name: `Bewertung für ${productName} von 0 bis 10`,
  });
  await expect(slider).toBeVisible();
  await setRating(slider, ratingTenths);
  await page.getByRole("button", { name: "1 Bewertung speichern" }).click();
}

test.describe("anonymous review access", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // Verifies anonymous visitors can select a product but cannot save a review.
  // It opens a seeded place and checks the sign-in notice and disabled save button.
  test("requires sign-in before saving a review", async ({ page }) => {
    await openSeededPlace(page);

    await page.getByRole("button", { name: /Döner Hähnchen/ }).click();
    await expect(
      page.getByText("Melde dich an, um Bewertungen zu speichern."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "1 Bewertung speichern" }),
    ).toBeDisabled();
  });
});

// Verifies short and unknown review searches show the right guidance and route.
// It checks the short-query hint, then opens the new-place form from no results.
test("handles short and unknown review searches", async ({ page }) => {
  const unknownPlaceName = "E2E Place Does Not Exist";

  await page.goto("/review/create");
  const search = page.getByLabel("Restaurant oder Gericht");
  await search.fill("xy");
  await expect(
    page.getByText("Ab 3 Zeichen suchen wir nach Restaurants und Gerichten."),
  ).toBeVisible();

  await search.fill(unknownPlaceName);
  const results = page.getByRole("region", { name: "Suchergebnisse" });
  await expect(results).toHaveAttribute("aria-busy", "false");
  await expect(results.getByText("Kein Restaurant gefunden.")).toBeVisible();

  await results
    .getByRole("link", {
      name: `"${unknownPlaceName}" als neues Restaurant anlegen`,
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/review/create/new" &&
      url.searchParams.get("place-name") === unknownPlaceName,
  );
  await expect(
    page.getByRole("heading", { name: unknownPlaceName }),
  ).toBeVisible();
});

// Verifies a signed-in user can rate an existing seeded product and see the saved result.
// It opens the seeded place, selects the product, sets the slider, and checks the confirmation.
test("creates a review for an existing seeded product", async ({ page }) => {
  await openSeededPlace(page);

  await page.getByRole("button", { name: /Döner Hähnchen/ }).click();
  await submitSingleReview(page, seededProductName, 75);

  await expect(page.getByText("1 Bewertung gespeichert")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: seededPlaceName }),
  ).toBeVisible();
  await expect(
    page.getByText(seededProductName, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("7.5", { exact: true })).toBeVisible();
});

// Verifies a signed-in user can add a product at an existing place and find it later.
// It submits the review, returns to search, and checks the product's persisted ranking.
test("creates and persists a new product at an existing seeded place", async ({
  page,
}, testInfo) => {
  const productName = uniqueName("E2E Burger", testInfo);

  await openSeededPlace(page);
  await page
    .getByRole("button", { name: "Etwas anderes gegessen?", exact: true })
    .click();
  await page.getByLabel("Was hattest du?").fill(productName);
  await page.getByRole("button", { name: "Burger", exact: true }).click();
  await submitSingleReview(page, productName, 80);

  await expect(page.getByText("1 Bewertung gespeichert")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: seededPlaceName }),
  ).toBeVisible();
  await expect(page.getByText(productName, { exact: true })).toBeVisible();
  await expect(page.getByText("8.0", { exact: true })).toBeVisible();

  await page.goto("/review/create");
  await expect(page).toHaveURL(/\/review\/create$/);
  await openPlaceFromReviewSearch(page, productName);

  await expect(
    page.getByRole("heading", { name: seededPlaceName }),
  ).toBeVisible();
  const persistedProduct = page.getByRole("button", {
    name: new RegExp(productName),
  });
  await expect(persistedProduct).toHaveCount(1);
  await expect(persistedProduct).toContainText("Ø 8.0");
  await expect(persistedProduct).toContainText("1 Bewertung");
});

// Verifies a signed-in user can create a restaurant and its first product in one review.
// It submits both through the form, then reopens the place to verify persistence.
test("creates and persists a new place with its first product", async ({
  page,
}, testInfo) => {
  const placeName = uniqueName("E2E Restaurant", testInfo);
  const productName = uniqueName("E2E Burger", testInfo);

  await page.goto("/review/create");
  await page.getByLabel("Restaurant oder Gericht").fill(placeName);

  await page
    .getByRole("link", {
      name: `"${placeName}" als neues Restaurant anlegen`,
      exact: true,
    })
    .click();

  await expect(page.getByRole("heading", { name: placeName })).toBeVisible();
  await expect(page.getByText("Neu", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Hamburg", exact: true }).click();

  await page.getByLabel("Was hattest du?").fill(productName);
  await page.getByRole("button", { name: "Burger", exact: true }).click();
  await submitSingleReview(page, productName, 85);

  await expect(page.getByText("1 Bewertung gespeichert")).toBeVisible();
  await expect(page.getByRole("heading", { name: placeName })).toBeVisible();
  await expect(page.getByText(productName, { exact: true })).toBeVisible();
  await expect(
    page
      .locator("ul")
      .filter({ hasText: productName })
      .getByText("8.5", { exact: true }),
  ).toContainText("8.5");

  await page.goto("/review/create");
  await expect(page).toHaveURL(/\/review\/create$/);
  await openPlaceFromReviewSearch(page, placeName);

  await expect(page.getByRole("heading", { name: placeName })).toBeVisible();
  await expect(
    page.getByText("Hamburg · Was hattest du?", { exact: true }),
  ).toBeVisible();
  const persistedProduct = page.getByRole("button", {
    name: new RegExp(productName),
  });
  await expect(persistedProduct).toHaveCount(1);
  await expect(persistedProduct).toContainText("Ø 8.5");
  await expect(persistedProduct).toContainText("1 Bewertung");
});
