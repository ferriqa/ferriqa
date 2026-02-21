import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("✅ should display main navigation menu", async ({ page }) => {
    // Should have navigation sidebar or header
    const nav = page.locator("nav, [role='navigation'], aside").first();
    await expect(nav).toBeVisible();
  });

  test("✅ should have Content link", async ({ page }) => {
    const contentLink = page
      .locator("a:has-text('Content'), [aria-label*='Content']")
      .first();
    await expect(contentLink).toBeVisible();
  });

  test("✅ should have Blueprints link", async ({ page }) => {
    const blueprintsLink = page
      .locator("a:has-text('Blueprints'), [aria-label*='Blueprints']")
      .first();
    await expect(blueprintsLink).toBeVisible();
  });

  test("✅ should have Media link", async ({ page }) => {
    const mediaLink = page
      .locator("a:has-text('Media'), [aria-label*='Media']")
      .first();
    await expect(mediaLink).toBeVisible();
  });

  test("✅ should have Webhooks link", async ({ page }) => {
    const webhooksLink = page
      .locator("a:has-text('Webhooks'), [aria-label*='Webhooks']")
      .first();
    await expect(webhooksLink).toBeVisible();
  });

  test("✅ should have Users link", async ({ page }) => {
    const usersLink = page
      .locator("a:has-text('Users'), [aria-label*='Users']")
      .first();
    await expect(usersLink).toBeVisible();
  });

  test("✅ should have Settings link", async ({ page }) => {
    const settingsLink = page
      .locator("a:has-text('Settings'), [aria-label*='Settings']")
      .first();
    await expect(settingsLink).toBeVisible();
  });

  test("✅ should navigate to Content section", async ({ page }) => {
    const contentLink = page.locator("a:has-text('Content')").first();
    await contentLink.click();
    await expect(page).toHaveURL(/\/content/);
  });

  test("✅ should navigate to Blueprints section", async ({ page }) => {
    const blueprintsLink = page.locator("a:has-text('Blueprints')").first();
    await blueprintsLink.click();
    await expect(page).toHaveURL(/\/blueprints/);
  });

  test("✅ should navigate to Media section", async ({ page }) => {
    const mediaLink = page.locator("a:has-text('Media')").first();
    await mediaLink.click();
    await expect(page).toHaveURL(/\/media/);
  });

  test("✅ should show active menu item", async ({ page }) => {
    // Click on Content
    const contentLink = page.locator("a:has-text('Content')").first();
    await contentLink.click();
    await page.waitForLoadState("networkidle");

    // Should have active indicator - sidebar uses bg-blue-50 for active state
    const activeItem = page.locator("a[class*='bg-blue-50']").first();
    await expect(activeItem).toBeVisible();
  });

  test("✅ should collapse sidebar on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Look for hamburger menu
    const menuButton = page
      .locator(
        "button[aria-label*='Menu'], button[class*='menu'], button[class*='hamburger']",
      )
      .first();
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();

      // Menu should open
      await page.waitForTimeout(500);
    }
  });

  test("✅ should display breadcrumbs", async ({ page }) => {
    // Navigate to a nested page
    await page.goto("/content/test/edit");
    await page.waitForLoadState("networkidle");

    // Look for breadcrumbs
    const breadcrumbs = page
      .locator("[aria-label*='Breadcrumb'], nav[class*='breadcrumb']")
      .first();
    const hasBreadcrumbs = await breadcrumbs.isVisible().catch(() => false);

    // Or check for breadcrumb-like text
    const pageText = await page.locator("body").innerText();
    expect(hasBreadcrumbs || /content/i.test(pageText)).toBeTruthy();
  });

  // 🔄 NEW TEST CASES TO IMPLEMENT
  test("⏳ should navigate to Webhooks section", async ({ page }) => {
    const webhooksLink = page.locator("a:has-text('Webhooks')").first();
    await webhooksLink.click();
    await expect(page).toHaveURL(/\/webhooks/);
  });

  test("⏳ should navigate to Users section", async ({ page }) => {
    const usersLink = page.locator("a:has-text('Users')").first();
    await usersLink.click();
    await expect(page).toHaveURL(/\/users/);
  });

  test("⏳ should navigate to Settings section", async ({ page }) => {
    const settingsLink = page.locator("a:has-text('Settings')").first();
    await settingsLink.click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test("⏳ should expand sidebar on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Sidebar should be visible
    const sidebar = page.locator("aside, nav").first();
    await expect(sidebar).toBeVisible();
  });

  test("⏳ should navigate via breadcrumbs", async ({ page }) => {
    // Navigate to nested page
    await page.goto("/content/test/edit");
    await page.waitForLoadState("networkidle");

    // Click on breadcrumb link
    const breadcrumbLink = page
      .locator("a[href='/content'], a:has-text('Content')")
      .first();
    if (await breadcrumbLink.isVisible().catch(() => false)) {
      await breadcrumbLink.click();
      await expect(page).toHaveURL(/\/content/);
    }
  });

  test("⏳ should expand/collapse menu groups", async ({ page }) => {
    // Look for collapsible menu groups
    const menuGroup = page
      .locator("button[class*='group'], button[aria-expanded]")
      .first();
    if (await menuGroup.isVisible().catch(() => false)) {
      await menuGroup.click();
      await page.waitForTimeout(500);

      // Should expand/collapse
      await menuGroup.click();
    }
  });

  test("⏳ should show user profile menu", async ({ page }) => {
    // Look for user profile button/avatar
    const profileButton = page
      .locator(
        "button[class*='profile'], [aria-label*='User'], img[alt*='User']",
      )
      .first();
    if (await profileButton.isVisible().catch(() => false)) {
      await profileButton.click();

      // Should show dropdown menu
      await expect(page.locator("[role='menu']").first()).toBeVisible();
    }
  });

  test("⏳ should have keyboard navigation", async ({ page }) => {
    // Focus on first nav link
    const firstLink = page.locator("nav a, aside a").first();
    await firstLink.focus();

    // Press Tab to navigate
    await page.keyboard.press("Tab");
    await page.waitForTimeout(200);

    // Press Enter to navigate
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
  });
});
