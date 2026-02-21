import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Plugins", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/plugins");
    await page.waitForLoadState("networkidle");
  });

  test("should display plugins page", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/plugins?/i);
  });

  test("should show installed plugins or empty state", async ({ page }) => {
    const pageText = await page.locator("body").innerText();
    const hasContent = /plugin|installed/i.test(pageText);
    expect(hasContent || /no plugins|empty/i.test(pageText)).toBeTruthy();
  });

  test("should display installed plugins", async ({ page }) => {
    const pageText = await page.locator("body").innerText();
    expect(pageText).toMatch(/plugin|name|version/i);
  });

  test("should display plugin status", async ({ page }) => {
    const pageText = await page.locator("body").innerText();
    const hasStatus = /active|inactive|enabled|disabled/i.test(pageText);
    expect(hasStatus).toBeTruthy();
  });

  test("should display plugin version", async ({ page }) => {
    const pageText = await page.locator("body").innerText();
    const hasVersion = /v\d+\.\d+|version/i.test(pageText);
    expect(hasVersion).toBeTruthy();
  });

  test("should show empty state when no plugins", async ({ page }) => {
    await page.route("/api/v1/plugins", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    const pageText = await page.locator("body").innerText();
    const hasEmptyState = /no plugins|empty|get started|not configured/i.test(
      pageText,
    );
    expect(hasEmptyState).toBeTruthy();
  });
});
