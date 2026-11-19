import { expect, test, type Page } from "@playwright/test";

// URL state: invalid keys are removed by a redirect, valid and unknown keys survive,
// and an empty value never shows up as `key=` in the URL.

function pathWithSearch(page: Page): string {
  const url = new URL(page.url());
  return `${url.pathname}${url.search}`;
}

async function expectPathWithSearch(page: Page, expected: string) {
  await expect.poll(() => pathWithSearch(page)).toBe(expected);
}

function rankingsSearch(page: Page) {
  return page.locator('input[name="filter-search"]').filter({ visible: true });
}

function rankingsHeading(page: Page, name: string) {
  return page.getByRole("heading", { name, exact: true });
}

test.describe("home rankings", () => {
  test("removes an invalid key and keeps the valid filters", async ({
    page,
  }) => {
    await page.goto("/?rating-min=abc&categories=burger");

    await expectPathWithSearch(page, "/?categories=burger");
    await expect(rankingsHeading(page, "Burger · Alle Städte")).toBeVisible();
  });

  test("removes every invalid key and keeps unknown keys", async ({ page }) => {
    await page.goto(
      "/?categories=nope&reviews-min=0&rating-max=11&utm_source=newsletter",
    );

    await expectPathWithSearch(page, "/?utm_source=newsletter");
    await expect(
      rankingsHeading(page, "Alle Produkte · Alle Städte"),
    ).toBeVisible();
  });

  test("removes a list when one of its items is invalid", async ({ page }) => {
    await page.goto("/?categories=burger,nope&cities=Hamburg");

    await expectPathWithSearch(page, "/?cities=Hamburg");
    await expect(
      rankingsHeading(page, "Alle Produkte · Hamburg"),
    ).toBeVisible();
  });

  test("treats an empty value like a missing key", async ({ page }) => {
    await page.goto("/?q=&categories=&cities=Hamburg");

    await expect(
      rankingsHeading(page, "Alle Produkte · Hamburg"),
    ).toBeVisible();
    expect(pathWithSearch(page)).toBe("/?q=&categories=&cities=Hamburg");
  });

  test("uses the first value of a repeated key", async ({ page }) => {
    await page.goto("/?categories=pizza&categories=burger");

    await expect(rankingsHeading(page, "Pizza · Alle Städte")).toBeVisible();
  });

  test("removes the search key after deleting the query", async ({ page }) => {
    await page.goto("/?cities=Hamburg");

    await rankingsSearch(page).fill("burger");
    await expectPathWithSearch(page, "/?cities=Hamburg&q=burger");

    await rankingsSearch(page).fill("");
    await expectPathWithSearch(page, "/?cities=Hamburg");
    await expect(
      rankingsHeading(page, "Alle Produkte · Hamburg"),
    ).toBeVisible();
  });

  test("keeps reserved characters in the search across a reload", async ({
    page,
  }) => {
    const query = "Döner & Co, 100% #1 + mehr?";
    await page.goto("/");

    await rankingsSearch(page).fill(query);
    await expect(page).toHaveURL((url) => url.searchParams.get("q") === query);

    await page.reload();
    await expect(rankingsSearch(page)).toHaveValue(query);
  });

  test("removes the category key after toggling the last category off", async ({
    page,
  }) => {
    await page.goto("/");
    const burger = page
      .getByRole("button", { name: "Burger", exact: true })
      .filter({ visible: true });

    await burger.click();
    await expectPathWithSearch(page, "/?categories=burger");

    await burger.click();
    await expectPathWithSearch(page, "/");
  });
});

test.describe("review creation", () => {
  async function seededPlacePath(page: Page): Promise<string> {
    await page.goto("/review/create?q=Lister%20D%C3%B6ner");
    const href = await page
      .getByRole("region", { name: "Suchergebnisse" })
      .locator('a[href^="/review/create/"]:not([href^="/review/create/new"])')
      .filter({ hasText: "Lister Döner" })
      .getAttribute("href");
    expect(href).toMatch(/^\/review\/create\/\d+$/);
    return href!;
  }

  test("treats an empty search like no search", async ({ page }) => {
    await page.goto("/review/create?q=");

    await expect(page.getByLabel("Restaurant oder Gericht")).toHaveValue("");
    expect(pathWithSearch(page)).toBe("/review/create?q=");
  });

  test("removes the search key after deleting the query", async ({ page }) => {
    await page.goto("/review/create");
    const search = page.getByLabel("Restaurant oder Gericht");

    await search.fill("Lister");
    await expectPathWithSearch(page, "/review/create?q=Lister");

    await search.fill("xy");
    await expectPathWithSearch(page, "/review/create?q=xy");

    await search.fill("");
    await expectPathWithSearch(page, "/review/create");
  });

  test("removes an invalid preselected product and keeps other keys", async ({
    page,
  }) => {
    const placePath = await seededPlacePath(page);

    await page.goto(`${placePath}?product-id=abc&utm_source=x`);

    await expectPathWithSearch(page, `${placePath}?utm_source=x`);
    await expect(
      page.getByRole("heading", { name: "Lister Döner" }),
    ).toBeVisible();
  });

  test("shows not found for a new place without a name", async ({ page }) => {
    for (const query of ["", "?place-name=", "?place-name=%20%20"]) {
      await page.goto(`/review/create/new${query}`);
      await expect(page.getByText("Seite nicht gefunden")).toBeVisible();
    }
  });
});

test.describe("admin", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/login");
    await page
      .getByRole("button", { name: "Sign in as rankovo-dev-admin" })
      .click();
    await expect(page).toHaveURL("/");
  });

  function restaurantsTab(page: Page) {
    return page.getByRole("link", { name: "Restaurants", exact: true });
  }

  test("searches places and keeps the places tab", async ({ page }) => {
    await page.goto("/admin?tab=places&page=2");

    await page.getByLabel("Restaurantname").fill("Lister");
    await page.getByLabel("Restaurantname").press("Enter");

    await expectPathWithSearch(page, "/admin?tab=places&place-search=Lister");
    await expect(restaurantsTab(page)).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("link", { name: /Lister Döner/ }).first(),
    ).toBeVisible();
  });

  test("shows the committed search after back and forward", async ({
    page,
  }) => {
    await page.goto("/admin?tab=places");
    const search = page.getByLabel("Restaurantname");

    await search.fill("Lis");
    await expect(search).toHaveValue("Lis");
    await expect(search).toBeFocused();
    await search.press("Enter");

    await expectPathWithSearch(page, "/admin?tab=places&place-search=Lis");
    await expect(search).toHaveValue("Lis");
    await expect(search).toBeFocused();

    await search.fill("Lister");
    await search.press("Enter");
    await expectPathWithSearch(page, "/admin?tab=places&place-search=Lister");
    await expect(search).toHaveValue("Lister");

    await page.goBack();
    await expectPathWithSearch(page, "/admin?tab=places&place-search=Lis");
    await expect(search).toHaveValue("Lis");

    await page.goBack();
    await expectPathWithSearch(page, "/admin?tab=places");
    await expect(search).toHaveValue("");

    await page.goForward();
    await expectPathWithSearch(page, "/admin?tab=places&place-search=Lis");
    await expect(search).toHaveValue("Lis");
  });

  test("removes the search key after an empty search", async ({ page }) => {
    await page.goto("/admin?tab=places&place-search=Lister");

    await page.getByLabel("Restaurantname").fill("");
    await page.getByLabel("Restaurantname").press("Enter");

    await expectPathWithSearch(page, "/admin?tab=places");
    await expect(restaurantsTab(page)).toHaveAttribute("aria-current", "page");
  });

  test("searches products without adding a tab key", async ({ page }) => {
    await page.goto("/admin");

    await page.getByLabel("Produktname").fill("Döner Hähnchen");
    await page.getByLabel("Produktname").press("Enter");

    await expect(page).toHaveURL(
      (url) =>
        url.pathname === "/admin" &&
        [...url.searchParams.keys()].join() === "product-search" &&
        url.searchParams.get("product-search") === "Döner Hähnchen",
    );
  });

  test("removes invalid keys and keeps the tab", async ({ page }) => {
    await page.goto("/admin?tab=places&page=abc&productId=-1&placeId=x");

    await expectPathWithSearch(page, "/admin?tab=places");
    await expect(restaurantsTab(page)).toHaveAttribute("aria-current", "page");
  });

  test("removes an unknown tab and keeps the search", async ({ page }) => {
    await page.goto("/admin?tab=nope&product-search=Lister");

    await expectPathWithSearch(page, "/admin?product-search=Lister");
  });

  test("clamps an out-of-range page and keeps the tab", async ({ page }) => {
    await page.goto("/admin?tab=places&page=999");

    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get("tab") === "places" &&
        url.searchParams.get("page") !== "999",
    );
    await expect(restaurantsTab(page)).toHaveAttribute("aria-current", "page");
  });
});
