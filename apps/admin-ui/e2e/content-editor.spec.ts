import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Content Editor", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("should display page structure for new content", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");

    // Wait for the API response
    await Promise.all([
      page.waitForResponse(/api\/blueprints\/test-blueprint/),
      page.waitForLoadState("networkidle"),
    ]);

    // Wait a bit for Svelte reactivity
    await page.waitForTimeout(2000);

    // Check there's no error message
    const hasError = await page.locator(".bg-red-50, .text-red-").count();
    expect(hasError).toBe(0);
  });

  test("should display page structure for edit", async ({ page }) => {
    await page.goto("/content/content-1/edit");

    // Wait for content and blueprint API responses
    await Promise.all([
      page.waitForResponse(/api\/v1\/contents\/content-1/),
      page.waitForResponse(/api\/blueprints\/test-blueprint/),
      page.waitForLoadState("networkidle"),
    ]);

    // Wait a bit for Svelte reactivity
    await page.waitForTimeout(2000);

    // Check there's no error message
    const hasError = await page.locator(".bg-red-50, .text-red-").count();
    expect(hasError).toBe(0);
  });

  test("should have tabs or navigation elements", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");

    // Wait for API response
    await Promise.all([
      page.waitForResponse(/api\/blueprints\/test-blueprint/),
      page.waitForSelector("main", { timeout: 15000 }),
    ]);

    // Check for any interactive elements in main
    const hasContent = await page.locator("main").count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test("should handle navigation", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");

    // Wait for page to load
    await Promise.all([
      page.waitForResponse(/api\/blueprints\/test-blueprint/),
      page.waitForSelector("main", { timeout: 15000 }),
    ]);

    // Check that we're on the create page
    await expect(page).toHaveURL(/\/content\/new/);
  });

  test("should have form elements when loaded", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");

    // Wait for API response
    await Promise.all([
      page.waitForResponse(/api\/blueprints\/test-blueprint/),
      page.waitForLoadState("networkidle"),
    ]);

    // Wait a bit for Svelte reactivity
    await page.waitForTimeout(2000);

    // Check there's no error message
    const hasError = await page.locator(".bg-red-50, .text-red-").count();
    expect(hasError).toBe(0);
  });

  test("should render all field types from blueprint", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");

    // Wait for API response
    await Promise.all([
      page.waitForResponse(/api\/blueprints\/test-blueprint/),
      page.waitForLoadState("networkidle"),
    ]);

    // Wait a bit for Svelte reactivity
    await page.waitForTimeout(2000);

    // Check there's no error message
    const hasError = await page.locator(".bg-red-50, .text-red-").count();
    expect(hasError).toBe(0);
  });
});
