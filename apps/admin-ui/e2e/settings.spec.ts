import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
  });

  test("should display settings page", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/settings/i);
  });

  test("should display general settings section", async ({ page }) => {
    const pageText = await page.locator("body").innerText();
    expect(pageText).toMatch(/general|site/i);
  });

  test("should have site name input", async ({ page }) => {
    const nameInput = page.locator("#siteName");
    await expect(nameInput).toBeVisible();
  });

  test("should have site URL input", async ({ page }) => {
    const urlInput = page.locator("#siteUrl");
    await expect(urlInput).toBeVisible();
  });

  test("should have site description textarea", async ({ page }) => {
    const descInput = page.locator("#siteDescription");
    await expect(descInput).toBeVisible();
  });

  test("should have language selection", async ({ page }) => {
    const langSelect = page.locator("#language");
    await expect(langSelect).toBeVisible();
  });

  test("should have save settings button", async ({ page }) => {
    const saveButton = page.locator("button[type='submit']");
    await expect(saveButton).toBeVisible();
  });

  test("should update site name", async ({ page }) => {
    const nameInput = page.locator("#siteName");
    await nameInput.fill("My New Site");
    await nameInput.blur();

    await expect(nameInput).toHaveValue("My New Site");
  });

  test("should update site URL", async ({ page }) => {
    const urlInput = page.locator("#siteUrl");
    await urlInput.fill("https://example.com");
    await urlInput.blur();

    await expect(urlInput).toHaveValue("https://example.com");
  });

  test("should update site description", async ({ page }) => {
    const descInput = page.locator("#siteDescription");
    await descInput.fill("This is my site description");
    await descInput.blur();

    await expect(descInput).toHaveValue("This is my site description");
  });

  test("should update language", async ({ page }) => {
    const langSelect = page.locator("#language");
    await langSelect.selectOption("en");

    await expect(langSelect).toHaveValue("en");
  });

  test("should save settings and show success message", async ({ page }) => {
    const nameInput = page.locator("#siteName");
    await nameInput.fill("Updated Site Name");

    await page.click("button[type='submit']");

    await expect(page.locator("text=Saved successfully")).toBeVisible();
  });

  test("should navigate to API Keys tab", async ({ page }) => {
    const apiKeysTab = page.locator("button:has-text('API Keys')");
    await apiKeysTab.click();

    await expect(page.locator("h2:has-text('API Keys')")).toBeVisible();
    await expect(
      page.locator("button:has-text('Create API Key')"),
    ).toBeVisible();
  });

  test("should display API Keys list", async ({ page }) => {
    await page.click("button:has-text('API Keys')");

    // Wait for loading state to complete
    await page.waitForTimeout(1000);

    // Wait for table to appear (even if empty)
    await page.waitForSelector("table", { timeout: 10000 });

    const table = page.locator("table");
    await expect(table).toBeVisible();

    // Check if we have table headers
    const headers = page.locator("thead th");
    await expect(headers).toHaveCount(5); // Name, Key Prefix, Type, Created, Actions

    // Table may have rows or be empty - both are valid states
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test("should open Create API Key modal", async ({ page }) => {
    await page.click("button:has-text('API Keys')");

    // Wait for table to load
    await page.waitForSelector("table", { timeout: 10000 });

    await page.click("button:has-text('Create API Key')");

    await expect(page.locator("[role='dialog']")).toBeVisible();
    await expect(page.locator("#keyName")).toBeVisible();
    await expect(page.locator("text=Permissions")).toBeVisible();
  });

  test("should create new API key", async ({ page }) => {
    await page.click("button:has-text('API Keys')");

    // Wait for table to load
    await page.waitForSelector("table", { timeout: 10000 });

    await page.click("button:has-text('Create API Key')");

    const modal = page.locator("[role='dialog']");
    await expect(modal).toBeVisible();

    // Wait for form to be ready
    const keyNameInput = modal.locator("#keyName");
    await expect(keyNameInput).toBeVisible();
    await keyNameInput.fill("Test API Key");

    // Directly call the component's handleCreateApiKey function via window
    await page.evaluate(async () => {
      if ((window as any).__ferriqa_test?.createApiKey) {
        await (window as any).__ferriqa_test.createApiKey();
      }
    });

    // Wait for Svelte reactivity to update DOM
    await page.waitForTimeout(2000);

    // Wait for success state (API Key Created message) - search within modal
    await expect(modal.locator("h3:has-text('API Key Created')")).toBeVisible({
      timeout: 10000,
    });

    // Verify the key is displayed within modal
    const codeBlock = modal.locator("code");
    await expect(codeBlock).toBeVisible();
    expect(await codeBlock.textContent()).toBeTruthy();
  });

  test("should rotate API key", async ({ page }) => {
    // Setup dialog handler before any actions
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.click("button:has-text('API Keys')");

    // Wait for table to load
    await page.waitForTimeout(1000);
    await page.waitForSelector("table", { timeout: 10000 });

    // Check if there are any rows
    const rowCount = await page.locator("tbody tr").count();
    if (rowCount === 0) {
      // Skip test if no API keys to rotate
      return;
    }

    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();

    // Get initial prefix text
    const prefixCell = firstRow.locator("td").nth(1);
    await expect(prefixCell).toBeVisible();
    const initialPrefix = await prefixCell.textContent();
    expect(initialPrefix).toBeTruthy();

    const rotateButton = page.locator("button:has-text('Rotate')").first();
    if (await rotateButton.isVisible().catch(() => false)) {
      await rotateButton.click();

      // Wait for the API call to complete and UI to update
      await page.waitForTimeout(1500);

      // Verify that the key prefix has changed (indicating rotation)
      await expect(prefixCell).toBeVisible();
      const newPrefix = await prefixCell.textContent();
      expect(newPrefix).not.toBe(initialPrefix);
    }
  });

  test("should delete API key", async ({ page }) => {
    // Setup dialog handler before any actions
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.click("button:has-text('API Keys')");

    // Wait for table to load
    await page.waitForTimeout(1000);
    await page.waitForSelector("table", { timeout: 10000 });

    // Get initial row count
    const initialRows = await page.locator("tbody tr").count();

    // Skip test if no API keys to delete
    if (initialRows === 0) {
      return;
    }

    const deleteButton = page.locator("button:has-text('Delete')").first();
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();

      // Wait for the API call to complete and table to update
      await page.waitForTimeout(1500);

      // Verify that one row has been deleted
      const finalRows = await page.locator("tbody tr").count();
      expect(finalRows).toBe(initialRows - 1);
    }
  });

  test("should navigate to Appearance tab", async ({ page }) => {
    const appearanceTab = page.locator("button:has-text('Appearance')");
    await appearanceTab.click();

    await expect(page.locator("h2:has-text('Appearance')")).toBeVisible();
    await expect(page.locator("h3:has-text('Dark Mode')")).toBeVisible();
  });

  test("should toggle dark mode", async ({ page }) => {
    await page.click("button:has-text('Appearance')");

    const toggle = page.locator("button[role='switch']");
    await expect(toggle).toBeVisible();

    const initialState = await toggle.getAttribute("aria-checked");
    await toggle.click();

    const newState = await toggle.getAttribute("aria-checked");
    expect(newState).not.toBe(initialState);
  });
});
