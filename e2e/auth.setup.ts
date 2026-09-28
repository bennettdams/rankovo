import { mkdir } from "node:fs/promises";
import { expect, test as setup } from "@playwright/test";

// Logs in through the dev-login page and saves the authenticated browser state
// so the Chromium tests run as a signed-in user.
setup("authenticate as the development user", async ({ page }) => {
  await page.goto("/dev/login");
  await page
    .getByRole("button", { name: "Sign in as rankovo-dev-user" })
    .click();
  await expect(page).toHaveURL("/");
  await mkdir("e2e/.storage", { recursive: true });
  await page.context().storageState({ path: "e2e/.storage/auth-user.json" });
});
