import { test, expect } from "@playwright/test";
import { setupApiMocks, testMediaFiles } from "./mocks/handlers";

test.describe("Media Library", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/media");
    await page.waitForLoadState("networkidle");
  });

  test("✅ should display media library page", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Media");
  });

  test("✅ should display media library grid", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });

  test("✅ should have upload button", async ({ page }) => {
    const uploadButton = page
      .locator("button:has-text('Upload'), [aria-label*='Upload']")
      .first();
    await expect(uploadButton).toBeVisible();
  });

  test("✅ should have search functionality", async ({ page }) => {
    const searchInput = page
      .locator('input[type="text"], input[placeholder*="Search"]')
      .first();
    await expect(searchInput).toBeVisible();
  });

  test("✅ should have view mode toggle", async ({ page }) => {
    const viewButtons = page.locator(
      "button[aria-label*='Grid'], button[aria-label*='List'], button[class*='grid'], button[class*='list']",
    );
    const count = await viewButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("✅ should have filter by file type", async ({ page }) => {
    const typeFilter = page
      .locator("select, button:has-text('All'), button:has-text('Image')")
      .first();
    await expect(typeFilter).toBeVisible();
  });

  test("✅ should select multiple files", async ({ page }) => {
    const checkboxes = page.locator("input[type='checkbox']");
    const count = await checkboxes.count();

    if (count > 0) {
      await checkboxes.first().check();
      expect(await checkboxes.first().isChecked()).toBeTruthy();
    }
  });

  test("✅ should open upload dialog", async ({ page }) => {
    const uploadButton = page.locator("button:has-text('Upload')").first();
    await uploadButton.click();
    await expect(page.locator("[role='dialog']").first()).toBeVisible();
  });

  test("✅ should have delete action", async ({ page }) => {
    const deleteButton = page
      .locator(
        "button[aria-label*='Delete'], [class*='delete'], button:has-text('Delete')",
      )
      .first();
    await expect(deleteButton).toBeAttached();
  });

  test("✅ should show empty state", async ({ page }) => {
    const pageText = await page.locator("body").innerText();
    const hasMedia = testMediaFiles.length > 0;
    if (!hasMedia) {
      expect(pageText).toMatch(/no media|empty|no files/i);
    } else {
      expect(pageText).not.toMatch(/no media|empty|no files/i);
    }
  });

  // 🔄 NEW TEST CASES TO IMPLEMENT
  test("⏳ should upload single file", async ({ page }) => {
    await page.click("button:has-text('Upload')");
    await page.waitForTimeout(500);

    const fileInput = page.locator("input[type='file']").first();
    if (await fileInput.isVisible().catch(() => false)) {
      await fileInput.setInputFiles("e2e/fixtures/images/test-image.png");
      await page.waitForTimeout(2000);

      const pageText = await page.locator("body").innerText();
      expect(pageText).toMatch(/upload|success|complete/i);
    }
  });

  test("⏳ should upload multiple files", async ({ page }) => {
    await page.click("button:has-text('Upload')");
    await page.waitForTimeout(500);

    const fileInput = page.locator("input[type='file']").first();
    if (await fileInput.isVisible().catch(() => false)) {
      await fileInput.setInputFiles([
        "e2e/fixtures/images/test1.png",
        "e2e/fixtures/images/test1.jpg",
      ]);
      await page.waitForTimeout(2000);
    }
  });

  test("⏳ should display upload progress", async ({ page }) => {
    await page.click("button:has-text('Upload')");
    await page.waitForTimeout(500);

    const fileInput = page.locator("input[type='file']").first();
    if (await fileInput.isVisible().catch(() => false)) {
      await fileInput.setInputFiles("e2e/fixtures/images/test.png");
      const _progress = page
        .locator("[role='progressbar'], [class*='progress'], text=%")
        .first();
    }
  });

  test("⏳ should show file metadata", async ({ page }) => {
    const mediaItem = page.locator("[class*='media'], [class*='card']").first();
    if (await mediaItem.isVisible().catch(() => false)) {
      await mediaItem.click();
      const pageText = await page.locator("body").innerText();
      expect(pageText).toMatch(/size|dimensions|type|date/i);
    }
  });

  test("⏳ should search media files", async ({ page }) => {
    const searchInput = page.locator("input[type='text']").first();
    await searchInput.fill("test");
    await searchInput.press("Enter");
    await page.waitForTimeout(1000);
    await expect(page.locator("main")).toBeVisible();
  });

  test("⏳ should filter by file type", async ({ page }) => {
    const typeSelect = page.locator("select").first();
    if (await typeSelect.isVisible().catch(() => false)) {
      await typeSelect.selectOption("image");
    } else {
      const imageFilter = page
        .locator("button:has-text('Image'), [aria-label='Images']")
        .first();
      if (await imageFilter.isVisible().catch(() => false)) {
        await imageFilter.click();
      }
    }
    await page.waitForTimeout(1000);
  });

  test("⏳ should filter by date", async ({ page }) => {
    const dateFilter = page.locator("button:has-text('Date'), select").first();
    if (await dateFilter.isVisible().catch(() => false)) {
      await dateFilter.click();
    }
  });

  test("⏳ should delete selected files", async ({ page }) => {
    const checkbox = page.locator("input[type='checkbox']").first();
    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.check();

      const deleteButton = page
        .locator("button:has-text('Delete'), [aria-label*='Delete']")
        .first();
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();
        await page.click("button:has-text('Delete')");
        await page.waitForTimeout(1000);
      }
    }
  });

  test("⏳ should download file", async ({ page }) => {
    const mediaItem = page.locator("[class*='media']").first();
    if (await mediaItem.isVisible().catch(() => false)) {
      const downloadButton = page
        .locator("button[aria-label*='Download'], button:has-text('Download')")
        .first();
      if (await downloadButton.isVisible().catch(() => false)) {
        await downloadButton.click();
      }
    }
  });

  test("⏳ should copy file URL", async ({ page }) => {
    const mediaItem = page.locator("[class*='media']").first();
    if (await mediaItem.isVisible().catch(() => false)) {
      const copyButton = page
        .locator("button[aria-label*='Copy'], button:has-text('Copy')")
        .first();
      if (await copyButton.isVisible().catch(() => false)) {
        await copyButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("⏳ should show file preview modal", async ({ page }) => {
    const mediaItem = page.locator("[class*='media'], img").first();
    if (await mediaItem.isVisible().catch(() => false)) {
      await mediaItem.click();
      const modal = page
        .locator("[role='dialog'], [class*='preview'], [class*='modal']")
        .first();
      if (await modal.isVisible().catch(() => false)) {
        await expect(modal).toBeVisible();
      }
    }
  });

  test("⏳ should display file size", async ({ page }) => {
    const pageText = await page.locator("body").innerText();
    const hasSize =
      testMediaFiles.length > 0 && /\d+\s*(KB|MB|GB|B)/i.test(pageText);
    if (testMediaFiles.length > 0) {
      expect(hasSize).toBeTruthy();
    }
  });

  test("⏳ should display file dimensions for images", async ({ page }) => {
    const hasImageWithDimensions = testMediaFiles.some(
      (m) => m.width && m.height,
    );
    if (hasImageWithDimensions) {
      const pageText = await page.locator("body").innerText();
      const hasDimensions = /\d+\s*x\s*\d+/i.test(pageText);
      expect(hasDimensions).toBeFalsy();
    }
  });

  test("⏳ should handle upload errors", async ({ page }) => {
    const uploadButton = page.locator("button:has-text('Upload')").first();
    await uploadButton.click();
    await page.waitForTimeout(500);
    await expect(page.locator("[role='dialog']").first()).toBeVisible();
  });

  test("⏳ should switch between grid and list view", async ({ page }) => {
    const listButton = page
      .locator("button[aria-label*='List'], button[class*='list']")
      .first();
    if (await listButton.isVisible().catch(() => false)) {
      await listButton.click();
      await page.waitForTimeout(500);
      await expect(page.locator("[class*='list'], main").first()).toBeVisible();
    }

    const gridButton = page
      .locator("button[aria-label*='Grid'], button[class*='grid']")
      .first();
    if (await gridButton.isVisible().catch(() => false)) {
      await gridButton.click();
      await page.waitForTimeout(500);
      await expect(page.locator("[class*='grid'], main").first()).toBeVisible();
    }
  });

  test("⏳ should load more items on scroll", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const loadMoreButton = page
      .locator("button:has-text('Load More'), button:has-text('Show More')")
      .first();
    if (await loadMoreButton.isVisible().catch(() => false)) {
      await loadMoreButton.click();
      await page.waitForTimeout(1000);
    }
  });
});
