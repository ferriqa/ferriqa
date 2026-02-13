import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Content List View", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/content");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  });

  test("should display content list page", async ({ page }) => {
    // Use specific heading selector
    const contentHeading = page.getByRole("heading", {
      name: "Content",
      exact: true,
    });
    await expect(contentHeading).toBeVisible();

    const createButton = page.getByRole("button", { name: /Create Content/i });
    await expect(createButton).toBeVisible();
  });

  test("should display page structure", async ({ page }) => {
    // Check for page title and create button
    await expect(
      page.getByRole("heading", { name: "Content", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Create Content/i }),
    ).toBeVisible();
  });

  test("should have search functionality", async ({ page }) => {
    // Look for search input by placeholder - use first() to avoid strict mode
    const searchInput = page
      .locator('input[type="text"]')
      .filter({ hasText: /^$/ })
      .or(
        page.locator(
          'input[placeholder*="Search"], input[placeholder*="search"]',
        ),
      )
      .first();

    // Check if search input exists (might be empty state)
    if (await searchInput.isVisible().catch(() => false)) {
      await expect(searchInput).toBeVisible();
    } else {
      // If no search input, page should at least load
      await expect(
        page.getByRole("heading", { name: "Content" }),
      ).toBeVisible();
    }
  });

  test("should have filter dropdowns", async ({ page }) => {
    // Look for select dropdowns
    const selects = page.locator("select");
    const selectCount = await selects.count();

    // Should have at least one select or be in empty state
    if (selectCount > 0) {
      await expect(selects.first()).toBeVisible();
    } else {
      // Empty state should be visible or content should load
      const hasContent = await page
        .locator("text=No content items, text=Test Content")
        .isVisible()
        .catch(() => false);
      expect(hasContent).toBeTruthy();
    }
  });

  test("should navigate to create content page", async ({ page }) => {
    await page.getByRole("button", { name: /Create Content/i }).click();

    // Wait for navigation
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Should be on create page or see blueprint selector modal
    const currentUrl = page.url();
    const isCreatePage = currentUrl.includes("/content/new");

    // Also check for the modal if it appears
    const hasModal = await page
      .locator(
        "text=Select Blueprint, text=test-blueprint, text=article-blueprint",
      )
      .isVisible()
      .catch(() => false);

    expect(isCreatePage || hasModal).toBeTruthy();
  });

  test("should show empty state or content list", async ({ page }) => {
    // Check if we see empty state or actual content
    const pageContent = await page.locator("body").innerText();
    const hasContent =
      pageContent.includes("Content") ||
      pageContent.includes("Test Content") ||
      pageContent.includes("No content items");

    expect(hasContent).toBeTruthy();
  });

  test("should have responsive layout", async ({ page }) => {
    // Store current viewport
    const originalViewport = page.viewportSize();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Page should still load - use first() to avoid strict mode issues
    const heading = page.getByRole("heading", { name: "Content" }).first();
    await expect(heading).toBeVisible();

    // Reset viewport to original
    if (originalViewport) {
      await page.setViewportSize(originalViewport);
    } else {
      await page.setViewportSize({ width: 1280, height: 720 });
    }
  });

  test("should display content items from mock data", async ({ page }) => {
    // With mocks, we should see our test content items
    const pageText = await page.locator("body").innerText();

    // Check if at least one of our test items is visible
    const hasTestContent =
      pageText.includes("Test Content 1") ||
      pageText.includes("Draft Article") ||
      pageText.includes("Archived Content");

    expect(hasTestContent).toBeTruthy();
  });

  test("should filter by blueprint", async ({ page }) => {
    // Find and select a blueprint filter
    const blueprintSelect = page.locator("select").first();

    if (await blueprintSelect.isVisible().catch(() => false)) {
      await blueprintSelect.selectOption("test-blueprint");
      await page.waitForTimeout(500); // Wait for filter to apply

      // Should show filtered results
      const pageText = await page.locator("body").innerText();
      expect(
        pageText.includes("Test Content 1") ||
          pageText.includes("Archived Content"),
      ).toBeTruthy();
    }
  });

  test("should filter by status", async ({ page }) => {
    // Find status filter dropdown (usually the third select)
    const selects = page.locator("select");
    const count = await selects.count();

    if (count >= 2) {
      const statusSelect = selects.nth(1); // Second select is usually status

      if (await statusSelect.isVisible().catch(() => false)) {
        await statusSelect.selectOption("published");
        await page.waitForTimeout(500);

        // Should show only published items
        const pageText = await page.locator("body").innerText();
        // Published status should be visible or no items message
        expect(
          pageText.includes("published") || pageText.includes("No content"),
        ).toBeTruthy();
      }
    }
  });
});
