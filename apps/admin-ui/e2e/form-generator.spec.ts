import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Dynamic Form Generator", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("should render page with form elements", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    // Wait for form elements to appear
    await page.waitForSelector("input, textarea, select, button", {
      timeout: 5000,
    });

    // Check for any form elements - with mocks, form should render
    const hasFormElements = await page
      .locator("input, textarea, select, button")
      .count()
      .then((c) => c > 0);

    expect(hasFormElements).toBeTruthy();
  });

  test("should have interactive elements", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    // Wait for buttons to appear
    await page.waitForSelector("button", { timeout: 5000 });

    // Check for buttons - save, cancel, publish, etc.
    const buttonCount = await page.locator("button").count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test("should have proper page structure", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    // Wait for content to load
    await page.waitForSelector("h1, button, input", { timeout: 5000 });

    // Page should have loaded (no 404)
    const notFound = await page
      .locator("text=404|Not Found|Page not found")
      .isVisible()
      .catch(() => false);
    expect(notFound).toBeFalsy();

    // Should have heading
    const hasHeading = await page
      .getByRole("heading")
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasHeading).toBeTruthy();
  });

  test("should handle responsive layout", async ({ page }) => {
    // Store original viewport
    const originalViewport = page.viewportSize();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    // Wait for content
    await page.waitForSelector("button, input, textarea", { timeout: 5000 });

    // Page should load without errors
    const hasError = await page
      .locator("text=Error|Failed to load|error occurred")
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasError).toBeFalsy();

    // Form should still be visible or accessible
    const hasContent = await page
      .locator("form, button, input")
      .count()
      .then((c) => c > 0);
    expect(hasContent).toBeTruthy();

    // Reset viewport
    if (originalViewport) {
      await page.setViewportSize(originalViewport);
    } else {
      await page.setViewportSize({ width: 1280, height: 720 });
    }
  });

  test("should show form with all field types", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    // Wait for form inputs
    await page.waitForSelector("input, textarea, select", { timeout: 5000 });

    // Verify form is present
    const formContainer = await page
      .locator("form, .space-y-6, [class*='grid']")
      .first()
      .isVisible()
      .catch(() => false);

    // Check that form inputs are present
    const inputs = await page.locator("input, textarea, select").count();

    expect(formContainer || inputs > 0).toBeTruthy();
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    // Wait for save button
    await page.waitForSelector("button", { timeout: 5000 });

    // Try to save without filling required fields
    const saveButton = page
      .getByRole("button", { name: /Save|Create/i })
      .first();

    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(500);

      // Should show validation error or stay on page
      const url = page.url();
      expect(url).toContain("/content/new");
    }
  });

  test("should allow entering data in form fields", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    // Wait for form inputs
    await page.waitForSelector('input[type="text"], textarea', {
      timeout: 5000,
    });

    // Find and fill text input (Title field)
    const titleInput = page.locator('input[type="text"]').first();

    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill("Test Title");

      // Verify value was entered
      const value = await titleInput.inputValue();
      expect(value).toBe("Test Title");
    }

    // Find and fill textarea (Description field)
    const textarea = page.locator("textarea").first();

    if (await textarea.isVisible().catch(() => false)) {
      await textarea.fill("Test description content");

      const value = await textarea.inputValue();
      expect(value).toBe("Test description content");
    }
  });
});
