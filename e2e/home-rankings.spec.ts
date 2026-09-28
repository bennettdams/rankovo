import { expect, test, type Locator, type Page } from "@playwright/test";

const rankingProductName = "Pulled Pork";
const rankingPlaceName = "Guller BBQ";
const rankingSearchQuery = rankingProductName;

function visibleButton(page: Page, name: string): Locator {
  return page
    .getByRole("button", { name, exact: true })
    .filter({ visible: true });
}

function rankingRow(page: Page, productName: string): Locator {
  const escapedProductName = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page.getByRole("button", {
    name: new RegExp(`^Details zu ${escapedProductName} bei `),
  });
}

async function searchForRanking(page: Page) {
  const searchInput = page
    .locator('input[name="filter-search"]')
    .filter({ visible: true });
  await searchInput.fill(rankingSearchQuery);
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("q") === rankingSearchQuery,
  );

  const rankingProductRow = rankingRow(page, rankingProductName);
  await expect(rankingProductRow).toBeVisible();
  return { rankingProductRow };
}

// Verifies ranking filters update the URL and visible rows, then clear to the default list.
// It searches seeded data and clicks the visible category, city, and clear controls.
test("filters and clears seeded home rankings", async ({ page }) => {
  await page.goto("/");

  const { rankingProductRow } = await searchForRanking(page);
  const moodRow = rankingRow(page, "Mood Double");
  await expect(moodRow).toHaveCount(0);

  await visibleButton(page, "Burger").click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("q") === rankingSearchQuery &&
      url.searchParams.get("categories") === "burger",
  );

  await visibleButton(page, "Stuttgart").click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("q") === rankingSearchQuery &&
      url.searchParams.get("categories") === "burger" &&
      url.searchParams.get("cities") === "Stuttgart",
  );
  await expect(rankingProductRow).toBeVisible();

  await visibleButton(page, "Löschen").click();
  await expect(page).toHaveURL(
    (url) => url.pathname === "/" && url.search === "",
  );
  await expect(moodRow).toBeVisible();
});

// Verifies a seeded ranking opens a details drawer with its product, place, rating, and critic.
// It searches for the product, opens its row, checks the drawer, and closes it.
test("searches and inspects a seeded home ranking", async ({ page }) => {
  await page.goto("/");
  const { rankingProductRow } = await searchForRanking(page);

  await rankingProductRow.click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByText(rankingProductName, { exact: true }),
  ).toBeVisible();
  await expect(
    drawer.getByText(rankingPlaceName, { exact: true }),
  ).toBeVisible();
  await expect(drawer.getByText("9.0", { exact: true })).toBeVisible();
  await expect(drawer.getByText("1", { exact: true })).toBeVisible();
  await expect(
    drawer
      .getByRole("link", { name: "Holle21614", exact: true })
      .filter({ visible: true }),
  ).toBeVisible();

  await drawer.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(drawer).toBeHidden();
  await expect(rankingProductRow).toBeVisible();
});

// Verifies the ranking drawer links to review creation for the selected product.
// It opens a seeded row, follows the link, and checks the preselected rating slider.
test("opens a preselected review from ranking details", async ({ page }) => {
  await page.goto("/");
  const { rankingProductRow } = await searchForRanking(page);

  await rankingProductRow.click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();

  const reviewLink = drawer
    .getByRole("link", { name: "Bewertung schreiben", exact: true })
    .filter({ visible: true });
  await expect(reviewLink).toHaveCount(1);
  await reviewLink.click();

  await expect(page).toHaveURL(
    (url) =>
      /^\/review\/create\/\d+$/.test(url.pathname) &&
      url.searchParams.has("product-id"),
  );
  await expect(
    page.getByRole("heading", { name: rankingPlaceName }),
  ).toBeVisible();
  await expect(
    page.getByRole("slider", {
      name: `Bewertung für ${rankingProductName} von 0 bis 10`,
    }),
  ).toBeVisible();
});

// Verifies the minimum-review filter updates the URL and excludes a one-review result.
// It searches Pulled Pork, applies ≥2, checks the empty state, then clears all filters.
test("filters rankings by minimum review count", async ({ page }) => {
  await page.goto("/");
  await searchForRanking(page);

  await visibleButton(page, "≥ 2").click();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("reviews-min") === "2",
  );
  await expect(
    page.getByText("Keine Bewertungen für deine Filter"),
  ).toBeVisible();

  await visibleButton(page, "Löschen").click();
  await expect(page).toHaveURL(
    (url) => url.pathname === "/" && url.search === "",
  );
  await expect(rankingRow(page, "Mood Double")).toBeVisible();
});
