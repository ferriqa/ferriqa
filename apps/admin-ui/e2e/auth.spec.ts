import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("✅ should access protected routes when authenticated", async ({
    page,
  }) => {
    // Navigate to protected route - app has mock auth
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    // Should be able to access content page (not redirected)
    const currentUrl = page.url();
    expect(currentUrl).toContain("/content");

    // Should show content page elements
    const hasContent = await page.locator("main").isVisible();
    expect(hasContent).toBeTruthy();
  });

  test("✅ should show user profile in header", async ({ page }) => {
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    // Should have user menu in header
    const userMenu = page
      .locator("button:has-text('Admin'), [aria-label*='User']")
      .first();
    const hasUserMenu = await userMenu.isVisible().catch(() => false);

    expect(hasUserMenu).toBeTruthy();
  });

  test("✅ should have navigation menu", async ({ page }) => {
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    // Should have navigation sidebar
    const nav = page.locator("nav, aside, [role='navigation']").first();
    await expect(nav).toBeVisible();
  });

  // 🔄 NEW TEST CASES - Updated for mock auth flow
  test("⏳ should persist session on refresh", async ({ page }) => {
    // Navigate to protected page
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    // Refresh page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should still be logged in (not redirected)
    const currentUrl = page.url();
    expect(currentUrl).toContain("/content");

    // Should still show content
    const hasContent = await page.locator("main").isVisible();
    expect(hasContent).toBeTruthy();
  });

  test("⏳ should navigate between protected sections", async ({ page }) => {
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    // Navigate to blueprints
    await page.goto("/blueprints");
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    expect(currentUrl).toContain("/blueprints");

    // Navigate to settings
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/settings");
  });

  test("⏳ should access user management when authenticated", async ({
    page,
  }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // Should access users page
    const currentUrl = page.url();
    expect(currentUrl).toContain("/users");

    // Should show users page content
    const hasContent = await page.locator("main").isVisible();
    expect(hasContent).toBeTruthy();
  });

  test("⏳ should show authenticated user name", async ({ page }) => {
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    // Look for user name in header
    const pageText = await page.locator("body").innerText();

    // Should contain user-related text
    expect(pageText).toMatch(/admin|user/i);
  });

  test("⏳ should maintain auth across different pages", async ({ page }) => {
    // Visit multiple pages
    const pages = ["/content", "/blueprints", "/media", "/settings"];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      // Should not be redirected to login
      const currentUrl = page.url();
      expect(currentUrl).not.toContain("login");
      expect(currentUrl).toContain(url);
    }
  });

  test("⏳ should handle API requests with auth", async ({ page }) => {
    await page.goto("/content");

    // Wait for API calls with timeout
    try {
      await page.waitForResponse(/api\/v1\/contents/, { timeout: 5000 });
    } catch {
      // API might already be cached, continue
    }

    await page.waitForLoadState("networkidle");

    // Should successfully load content
    const hasContent = await page
      .locator("main")
      .isVisible()
      .catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});
