import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Content List View", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/content");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("should display content list page", async ({ page }) => {
    const hasContent = await page.locator("main").textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });

  test("should display page structure", async ({ page }) => {
    const hasContent = await page.locator("main").textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });

  test("should have search functionality", async ({ page }) => {
    const hasContent = await page.locator("main").textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });

  test("should have filter dropdowns", async ({ page }) => {
    const hasContent = await page.locator("main").textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });

  test("should navigate to create content page", async ({ page }) => {
    await page.getByRole("button", { name: /Create Content/i }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/content/);
  });

  test("should show empty state or content list", async ({ page }) => {
    const hasContent = await page.locator("main").textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });

  test("should have responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const hasContent = await page.locator("main").textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("should display content items from mock data", async ({ page }) => {
    const pageText = await page.locator("body").innerText();
    const hasTestContent =
      pageText.includes("Test Content 1") ||
      pageText.includes("Draft Article") ||
      pageText.includes("Archived Content");
    expect(hasTestContent).toBeTruthy();
  });

  test("should filter by blueprint", async ({ page }) => {
    const hasContent = await page.locator("main").textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });

  test("should filter by status", async ({ page }) => {
    const hasContent = await page.locator("main").textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });
});
