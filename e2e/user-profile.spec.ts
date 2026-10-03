import { expect, test } from "@playwright/test";

const profilePath = "/user/rankovo-dev-user";

test.describe("user profile", () => {
  test("shows the profile summary and complete review history", async ({
    page,
  }) => {
    await page.goto(profilePath);

    await expect(page).toHaveTitle("Rankovo | Profil");

    const profilePanel = page.getByTestId("user-profile-panel");
    await expect(profilePanel).toBeVisible();
    await expect(profilePanel.locator("h1")).not.toHaveText("");
    for (const label of [
      "Bewertungen",
      "Durchschnitt",
      "Bewertungsbereich",
      "Kategorien",
      "Orte",
    ]) {
      await expect(profilePanel.getByText(label, { exact: true })).toBeVisible();
    }

    await expect(
      page.getByRole("heading", { name: "Alle Bewertungen" }),
    ).toBeVisible();
    const totalReviewsText = await page
      .getByText(/\d+ Bewertungen insgesamt/)
      .textContent();
    const totalReviews = Number(totalReviewsText?.match(/\d+/)?.[0]);
    expect(totalReviews).toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: "Bearbeiten" })).toHaveCount(
      totalReviews,
    );
  });

  test("allows the owner to open the profile and review editors", async ({
    page,
  }) => {
    await page.goto(profilePath);

    await page.getByRole("button", { name: "Namen ändern" }).click();
    await expect(
      page.getByRole("heading", { name: "Nutzernamen ändern" }),
    ).toBeVisible();
    await expect(page.locator('input[name="name"]')).not.toHaveValue("");

    await page.getByRole("button", { name: "Namen ändern" }).click();
    await expect(
      page.getByRole("heading", { name: "Nutzernamen ändern" }),
    ).not.toBeVisible();

    await page.getByRole("button", { name: "Bearbeiten" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Bewertung bearbeiten" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Schließen" }).click();
    await expect(
      page.getByRole("heading", { name: "Bewertung bearbeiten" }),
    ).not.toBeVisible();
  });

  test("keeps the profile usable on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(profilePath);

    await expect(
      page.getByRole("heading", { name: "Alle Bewertungen" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const sections = [
            document.querySelector('[data-testid="user-profile-panel"]'),
            document.querySelector('[data-testid="user-reviews-section"]'),
          ];
          const sectionsFit = sections.every((section) => {
            if (!section) return false;
            const rect = section.getBoundingClientRect();
            return rect.left > 0 && rect.right < window.innerWidth;
          });
          return (
            sectionsFit &&
            document.documentElement.scrollWidth <= window.innerWidth
          );
        }),
      )
      .toBe(true);
  });

  test("shows the new username on the profile after saving", async ({
    page,
  }, testInfo) => {
    await page.goto(profilePath);

    const newUsername = `rankovo-e2e-${testInfo.workerIndex}-${Date.now()
      .toString()
      .slice(-8)}`;
    await page.getByRole("button", { name: "Namen ändern" }).click();
    await page.locator('input[name="name"]').fill(newUsername);
    await page.getByRole("button", { name: "Speichern" }).click();

    await expect(
      page.getByRole("heading", { name: newUsername, exact: true }),
    ).toBeVisible();
  });
});
