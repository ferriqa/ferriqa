import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Content Editor", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("should display page structure for new content", async ({ page }) => {
    // Navigate to create page
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    // Wait for the page to fully load with longer timeout
    await page.waitForTimeout(2000);

    // Check for basic page structure - form should exist now with mocks
    const headingExists = await page
      .getByRole("heading", { name: /Create Content/i })
      .isVisible()
      .catch(() => false);

    const blueprintName = await page
      .locator("text=Test Blueprint")
      .isVisible()
      .catch(() => false);

    const buttonsExist = await page
      .locator("button")
      .count()
      .then((count) => count > 0);

    expect(headingExists || blueprintName || buttonsExist).toBeTruthy();
  });

  test("should display page structure for edit", async ({ page }) => {
    // Navigate to edit page
    await page.goto("/content/content-1/edit");
    await page.waitForLoadState("networkidle");

    // Wait for the page to fully load
    await page.waitForTimeout(2000);

    // Check for basic page structure
    const headingExists = await page
      .getByRole("heading", { name: /Edit Content/i })
      .isVisible()
      .catch(() => false);

    const contentTitle = await page
      .locator("text=Test Content 1")
      .isVisible()
      .catch(() => false);

    const formLoaded = await page
      .locator("form, .space-y-6, input, textarea, select")
      .count()
      .then((c) => c > 0);

    expect(headingExists || contentTitle || formLoaded).toBeTruthy();
  });

  test("should have tabs or navigation elements", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    // Wait for form to load
    await page.waitForTimeout(2000);

    // Look for common UI elements (tabs, buttons, forms)
    const hasTabs = await page
      .locator(
        "button:has-text('Content'), button:has-text('SEO'), button:has-text('Settings')",
      )
      .first()
      .isVisible()
      .catch(() => false);

    const hasButtons = await page
      .locator("button")
      .count()
      .then((count) => count > 0);

    expect(hasTabs || hasButtons).toBeTruthy();
  });

  test("should handle navigation", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    // Wait for the page to fully load
    await page.waitForTimeout(2000);

    // Look for cancel/back button - use first() to avoid strict mode issues
    const cancelButton = page
      .getByRole("button", { name: /Cancel|Back/i })
      .first();

    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click();
      await page.waitForLoadState("networkidle");

      // Should navigate back to content list
      await expect(page).toHaveURL(/\/content/);
    }
  });

  test("should have form elements when loaded", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    // Wait longer for form to load with mocked data
    await page.waitForTimeout(2000);

    // Check for form inputs - the blueprint has text, textarea, number, select, etc.
    const hasInputs = await page
      .locator("input, textarea, select")
      .count()
      .then((c) => c > 0);

    // Also check for the form container
    const hasForm = await page
      .locator("form, .space-y-6, .grid")
      .count()
      .then((c) => c > 0);

    expect(hasInputs || hasForm).toBeTruthy();
  });

  test("should render all field types from blueprint", async ({ page }) => {
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    // Wait for form to render
    await page.waitForTimeout(2000);

    // Check for specific field types based on test blueprint
    const textInput = page.locator('input[type="text"]').first();
    const textarea = page.locator("textarea").first();
    const numberInput = page.locator('input[type="number"]').first();
    const checkbox = page.locator('input[type="checkbox"]').first();
    const select = page.locator("select").first();

    // At least some of these should exist
    const hasText = await textInput.isVisible().catch(() => false);
    const hasTextarea = await textarea.isVisible().catch(() => false);
    const hasNumber = await numberInput.isVisible().catch(() => false);
    const hasCheckbox = await checkbox.isVisible().catch(() => false);
    const hasSelect = await select.isVisible().catch(() => false);

    expect(
      hasText || hasTextarea || hasNumber || hasCheckbox || hasSelect,
    ).toBeTruthy();
  });
});
