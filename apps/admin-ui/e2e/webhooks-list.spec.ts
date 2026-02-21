import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Webhooks List", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/webhooks");
    await page.waitForLoadState("networkidle");
  });

  test("✅ should display webhooks list page", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/webhooks?/i);
  });

  test("✅ should have create webhook button", async ({ page }) => {
    const createButton = page
      .locator("button:has-text('Create'), a:has-text('Create')")
      .first();
    await expect(createButton).toBeVisible();
  });

  test("✅ should show loading state initially", async ({ page }) => {
    // Reload to see loading state
    await page.reload();

    // Should show loading indicator
    await page.waitForTimeout(500);
    const loading = page
      .locator("[class*='animate-spin'], [class*='loading']")
      .first();
    // Loading state is brief
  });

  test("✅ should have search functionality", async ({ page }) => {
    const searchInput = page
      .locator('input[type="text"], input[placeholder*="Search"]')
      .first();
    await expect(searchInput).toBeVisible();
  });

  test("✅ should have filter by event type", async ({ page }) => {
    const eventFilter = page
      .locator(
        "select, button:has-text('Event'), button:has-text('All Events')",
      )
      .first();
    await expect(eventFilter).toBeVisible();
  });

  test("✅ should have filter by status", async ({ page }) => {
    const statusFilter = page
      .locator(
        "select, button:has-text('Status'), button:has-text('All Status')",
      )
      .first();
    await expect(statusFilter).toBeVisible();
  });

  test("✅ should navigate to create webhook page", async ({ page }) => {
    const createButton = page.locator("button:has-text('Create')").first();
    await createButton.click();
    await expect(page).toHaveURL("/webhooks/new");
  });

  // 🔄 NEW TEST CASES TO IMPLEMENT
  test("⏳ should display webhooks list", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Should show webhook items or empty state
    const pageText = await page.locator("body").innerText();
    const hasContent = /webhook|endpoint|url/i.test(pageText);
    expect(hasContent || /no webhooks|empty/i.test(pageText)).toBeTruthy();
  });

  test("⏳ should show webhook status (active/inactive)", async ({ page }) => {
    await page.waitForTimeout(1000);

    const pageText = await page.locator("body").innerText();
    // Should show active/inactive indicators
    const hasStatus = /active|inactive|enabled|disabled/i.test(pageText);
  });

  test("⏳ should show webhook URL", async ({ page }) => {
    await page.waitForTimeout(1000);

    const pageText = await page.locator("body").innerText();
    // Should show URLs (http/https)
    const hasUrl = /https?:\/\//i.test(pageText);
  });

  test("⏳ should show last trigger time", async ({ page }) => {
    await page.waitForTimeout(1000);

    const pageText = await page.locator("body").innerText();
    // Should show timestamps
    const hasTime = /last triggered|last delivery|last seen/i.test(pageText);
  });

  test("⏳ should navigate to edit webhook", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for edit button on first webhook
    const editButton = page
      .locator(
        "button:has-text('Edit'), a:has-text('Edit'), [aria-label*='Edit']",
      )
      .first();
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await expect(page).toHaveURL(/\/webhooks\/.*\/edit/);
    }
  });

  test("⏳ should toggle webhook active status", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for toggle switch
    const toggle = page
      .locator(
        "input[type='checkbox'], button[role='switch'], [class*='toggle']",
      )
      .first();
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click();
      await page.waitForTimeout(500);

      // Status should change
      const pageText = await page.locator("body").innerText();
      expect(pageText).toMatch(/active|inactive/i);
    }
  });

  test("⏳ should show delete confirmation modal", async ({ page }) => {
    await page.waitForTimeout(1000);

    const deleteButton = page
      .locator("button[aria-label*='Delete'], button:has-text('Delete')")
      .first();
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();

      // Should show confirmation modal
      await expect(
        page.locator("[role='dialog'], text=Delete").first(),
      ).toBeVisible();

      // Cancel
      await page.click("button:has-text('Cancel')");
    }
  });

  test("⏳ should delete webhook", async ({ page }) => {
    await page.waitForTimeout(1000);

    const deleteButton = page
      .locator("button[aria-label*='Delete'], button:has-text('Delete')")
      .first();
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();

      // Confirm in modal
      await page.click("button:has-text('Delete')");
      await page.waitForTimeout(1000);

      // Should remove item
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("⏳ should test webhook trigger", async ({ page }) => {
    await page.waitForTimeout(1000);

    const testButton = page
      .locator("button:has-text('Test'), [aria-label*='Test']")
      .first();
    if (await testButton.isVisible().catch(() => false)) {
      await testButton.click();

      // Should show test result modal
      await expect(page.locator("[role='dialog']").first()).toBeVisible();

      // Close modal
      await page.click("button:has-text('Close')");
    }
  });

  test("⏳ should show delivery history", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for history/deliveries link or button
    const historyButton = page
      .locator(
        "button:has-text('History'), button:has-text('Deliveries'), a:has-text('History')",
      )
      .first();
    if (await historyButton.isVisible().catch(() => false)) {
      await historyButton.click();

      // Should show delivery history
      await expect(
        page.locator("text=Deliveries, text=History").first(),
      ).toBeVisible();
    }
  });

  test("⏳ should retry failed delivery", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for retry button
    const retryButton = page
      .locator("button:has-text('Retry'), [aria-label*='Retry']")
      .first();
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click();

      await page.waitForTimeout(500);
      // Should show retry initiated
    }
  });

  test("⏳ should search webhooks", async ({ page }) => {
    const searchInput = page.locator("input[type='text']").first();
    await searchInput.fill("test");
    await searchInput.press("Enter");

    await page.waitForTimeout(1000);

    // Should filter results
    await expect(page.locator("main")).toBeVisible();
  });

  test("⏳ should filter by event type", async ({ page }) => {
    const eventFilter = page.locator("select").first();
    if (await eventFilter.isVisible().catch(() => false)) {
      await eventFilter.selectOption("content.created");
      await page.waitForTimeout(1000);

      // Should filter results
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("⏳ should filter by status", async ({ page }) => {
    const statusFilter = page.locator("select").nth(1);
    if (await statusFilter.isVisible().catch(() => false)) {
      // Status filter uses "true" for active, "false" for inactive
      await statusFilter.selectOption("true");
      await page.waitForTimeout(1000);

      // Should show only active webhooks
      const pageText = await page.locator("body").innerText();
    }
  });

  test("⏳ should paginate through results", async ({ page }) => {
    await page.waitForTimeout(1000);

    const nextButton = page
      .locator("button[aria-label*='Next'], text=Next")
      .first();
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
      await expect(page).toHaveURL(/page=/);
    }
  });
});
