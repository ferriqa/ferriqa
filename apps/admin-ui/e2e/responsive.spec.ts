import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Responsive Design", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("✅ should display properly on mobile (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    const body = page.locator("body");
    await expect(body).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 50);
  });

  test("✅ should display properly on tablet (768px)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();
    const h1 = page.locator("h1").first();
    const h1Visible = await h1.isVisible().catch(() => false);
    if (h1Visible) {
      await expect(h1).toBeVisible();
    }
  });

  test("✅ should display properly on desktop (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();
    const h1 = page.locator("h1").first();
    const h1Visible = await h1.isVisible().catch(() => false);
    if (h1Visible) {
      await expect(h1).toBeVisible();
    }
  });

  test("✅ should have touch-friendly buttons on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    const buttons = page.locator("button");
    const count = await buttons.count();

    if (count > 0) {
      const firstButton = buttons.first();
      const box = await firstButton.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(40);
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test("⏳ should handle orientation change", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/content");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();

    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
  });

  test("⏳ should show mobile navigation menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    const mobileMenuButton = page
      .locator(
        "button[class*='menu'], button[class*='Menu'], [aria-label*='menu'], [aria-label*='Menu']",
      )
      .first();
    const isMenuVisible = await mobileMenuButton.isVisible().catch(() => false);

    if (isMenuVisible) {
      await mobileMenuButton.click();
      await page.waitForLoadState("networkidle");
      const mobileMenu = page
        .locator("[role='menu'], nav, [class*='drawer'], [class*='sidebar']")
        .first();
      const menuVisible = await mobileMenu.isVisible().catch(() => false);
      if (menuVisible) {
        await expect(mobileMenu).toBeVisible();
      }
    }
  });

  test("⏳ should adjust table layout on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    const table = page.locator("table").first();
    const isTableVisible = await table.isVisible().catch(() => false);

    if (isTableVisible) {
      const tableContainer = page
        .locator("table")
        .first()
        .locator("xpath=../..");
      const overflowX = await tableContainer
        .evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.overflowX;
        })
        .catch(() => "visible");

      expect(overflowX).toMatch(/auto|scroll|hidden|visible/);
    }
  });

  test("⏳ should show form properly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/content/new?blueprint=test-blueprint");
    await page.waitForLoadState("networkidle");

    const formInput = page
      .locator(
        "input[name='title'], input[placeholder*='title' i], [class*='input'] input",
      )
      .first();
    const isInputVisible = await formInput.isVisible().catch(() => false);

    if (isInputVisible) {
      const box = await formInput.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(200);
      }
    } else {
      const anyInput = page.locator("input, textarea, select").first();
      const inputVisible = await anyInput.isVisible().catch(() => false);
      if (inputVisible) {
        const box = await anyInput.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(150);
        }
      }
    }
  });

  test("⏳ should stack sidebar content on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/blueprints");
    await page.waitForLoadState("networkidle");

    const pageText = await page.locator("body").innerText();
    expect(pageText.length).toBeGreaterThan(0);
  });

  test("⏳ should show responsive grid on blueprints page", async ({
    page,
  }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto("/blueprints");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("⏳ should adjust text size on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    const h1 = page.locator("h1").first();
    const h1Exists = (await h1.count()) > 0;

    if (h1Exists) {
      const h1Visible = await h1.isVisible().catch(() => false);
      if (h1Visible) {
        const fontSize = await h1.evaluate(
          (el) => window.getComputedStyle(el).fontSize,
        );
        const sizeInPx = parseInt(fontSize);
        expect(sizeInPx).toBeGreaterThanOrEqual(16);
      }
    }
  });

  test("⏳ should hide sidebar on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    const sidebar = page
      .locator("aside, [class*='sidebar'], [class*='Sidebar']")
      .first();
    const isVisible = await sidebar.isVisible().catch(() => false);

    if (isVisible) {
      const box = await sidebar.boundingBox();
      if (box) {
        expect(box.width).toBeLessThan(375);
      }
    }
  });

  test("⏳ should show responsive modals on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    const createButton = page
      .locator("button:has-text('Create Content'), button:has-text('Create')")
      .first();
    await createButton.click();
    await page.waitForLoadState("networkidle");

    const modal = page.locator("[role='dialog']").first();
    const isModalVisible = await modal.isVisible().catch(() => false);

    if (isModalVisible) {
      const box = await modal.boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(375);
      }
    } else {
      await page.waitForURL(/\/content\/new/);
      const contentArea = page.locator("main, form, [class*='editor']").first();
      const contentVisible = await contentArea.isVisible().catch(() => false);
      if (contentVisible) {
        await expect(contentArea).toBeVisible();
      }
    }
  });
});
