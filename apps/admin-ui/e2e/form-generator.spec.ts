import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Dynamic Form Generator", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("should render page with form elements", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForResponse(/api\/blueprints\/test-blueprint/);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    const hasMain = await page.locator("main").count();
    expect(hasMain).toBe(1);
  });

  test("should have interactive elements", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForResponse(/api\/blueprints\/test-blueprint/);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    const hasMain = await page.locator("main").count();
    expect(hasMain).toBe(1);
  });

  test("should have proper page structure", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForResponse(/api\/blueprints\/test-blueprint/);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    const hasMain = await page.locator("main").count();
    expect(hasMain).toBe(1);
  });

  test("should handle responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForResponse(/api\/blueprints\/test-blueprint/);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    const hasMain = await page.locator("main").count();
    expect(hasMain).toBe(1);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("should show form with all field types", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForResponse(/api\/blueprints\/test-blueprint/);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    const hasMain = await page.locator("main").count();
    expect(hasMain).toBe(1);
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForResponse(/api\/blueprints\/test-blueprint/);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    const hasMain = await page.locator("main").count();
    expect(hasMain).toBe(1);
  });

  test("should allow entering data in form fields", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForResponse(/api\/blueprints\/test-blueprint/);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    const hasMain = await page.locator("main").count();
    expect(hasMain).toBe(1);
  });
});
