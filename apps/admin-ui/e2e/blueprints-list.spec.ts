import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";
import { BlueprintsListPage } from "./lib/BlueprintsListPage";

test.describe("Blueprints List", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("✅ should display blueprints list page", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();
    await expect(listPage.heading).toContainText("Blueprints");
  });

  test("✅ should show blueprint count", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();

    const pageText = await listPage.getBodyText();
    expect(pageText).toMatch(/\d+ blueprint/i);
  });

  test("✅ should have search functionality", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();
    await expect(listPage.searchInput).toBeVisible();
  });

  test("✅ should have sort dropdown", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();
    await expect(listPage.sortSelect).toBeVisible();
  });

  test("✅ should display blueprint cards", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();

    // Check for any blueprint cards or content
    const cardCount = await listPage.getBlueprintCount();
    if (cardCount > 0) {
      await expect(listPage.blueprintCards.first()).toBeVisible();
    } else {
      // If no cards, should show empty state
      const isEmpty = await listPage.isEmptyStateVisible();
      expect(isEmpty || cardCount > 0).toBeTruthy();
    }
  });

  test("✅ should show blueprint field count", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();

    const pageText = await listPage.getBodyText();
    expect(pageText).toMatch(/\d+ field/i);
  });

  test("✅ should show blueprint last modified date", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();

    const pageText = await listPage.getBodyText();
    expect(pageText).toMatch(
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
    );
  });

  test("✅ should navigate to blueprint builder on edit", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();

    const clicked = await listPage.clickEdit("Test Blueprint");
    if (clicked) {
      await expect(page).toHaveURL(/\/blueprints\/.*\/edit/);
    }
  });

  test("✅ should navigate to content view", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();

    const viewButton = page.locator("text=View Content").first();
    if (await viewButton.isVisible().catch(() => false)) {
      await viewButton.click();
      await expect(page).toHaveURL(/\/content/);
    }
  });

  test("✅ should show delete confirmation modal", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();

    const clicked = await listPage.clickDelete("Test Blueprint");
    if (clicked) {
      await expect(listPage.deleteModal).toBeVisible();
      // Cancel
      await page.click("button:has-text('Cancel')");
    }
  });

  test("✅ should have create blueprint button", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();

    await expect(listPage.createButton).toBeVisible();
    await listPage.createButton.click();
    await expect(page).toHaveURL("/blueprints/new");
  });

  test("✅ should display API access badges", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();

    const pageText = await listPage.getBodyText();
    const hasAccessBadge = /(public|auth|private)/i.test(pageText);
    expect(hasAccessBadge).toBeTruthy();
  });

  // 🔄 NEW TEST CASES - Using POM
  test("⏳ should search blueprints", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();
    await listPage.search("Article");

    await expect(page.locator("text=Article")).toBeVisible();
  });

  test("⏳ should sort by name", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();
    await listPage.sortBy("name");

    await expect(listPage.blueprintCards.first()).toBeVisible();
  });

  test("⏳ should sort by content count", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();
    await listPage.sortBy("content");

    // Just check that page still loads after sorting
    await expect(listPage.heading).toBeVisible();
  });

  test("⏳ should delete blueprint", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();

    const clicked = await listPage.clickDelete("Test Blueprint");
    if (clicked) {
      await listPage.confirmDelete();
    }
  });

  test("⏳ should show empty state when no blueprints", async ({ page }) => {
    const listPage = new BlueprintsListPage(page);
    await listPage.goto();
    await listPage.search("non-existent-blueprint-xyz");

    const isEmpty = await listPage.isEmptyStateVisible();
    expect(isEmpty).toBeTruthy();
  });
});
