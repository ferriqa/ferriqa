import { test, expect } from "@playwright/test";

test.describe("Simple Test", () => {
  test("should work", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("h1")).toContainText(/settings/i);
  });
});
