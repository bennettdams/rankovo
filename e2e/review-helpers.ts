import { randomUUID } from "node:crypto";
import { expect, type Locator, type TestInfo } from "@playwright/test";

export function uniqueName(prefix: string, testInfo: TestInfo): string {
  return `${prefix} ${Date.now()}-${testInfo.parallelIndex}-${randomUUID()}`;
}

export async function setRating(
  slider: Locator,
  tenths: number,
): Promise<void> {
  if (!Number.isInteger(tenths) || tenths < 0 || tenths > 100) {
    throw new RangeError("Rating must be an integer from 0 to 100 tenths");
  }

  await slider.focus();
  await slider.press("Home");

  for (let index = 0; index < tenths; index += 1) {
    await slider.press("ArrowRight");
  }

  await expect(slider).toHaveAttribute("aria-valuenow", String(tenths / 10));
}
