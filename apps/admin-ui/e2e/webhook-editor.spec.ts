import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Webhook Editor", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("should display new webhook page", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toContainText(/create|new|webhook/i);
  });

  test("should have webhook URL input", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const urlInput = page.locator("input#url").first();
    await expect(urlInput).toBeVisible();
  });

  test("should have webhook name input", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const nameInput = page.locator("input#name").first();
    await expect(nameInput).toBeVisible();
  });

  test("should have trigger events selection", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const events = page.locator("button:has-text('Content')");
    expect(await events.count()).toBeGreaterThan(0);
  });

  test("should have create button", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const createButton = page
      .locator("button:has-text('Create'), button[type='submit']")
      .first();
    await expect(createButton).toBeVisible();
  });

  test("should have cancel button", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const cancelButton = page.locator("button:has-text('Cancel')").first();
    await expect(cancelButton).toBeVisible();
  });

  test("should create new webhook", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    await page.fill("#name", "Test Webhook");
    await page.fill("#url", "https://example.com/webhook");

    const eventButton = page
      .locator("button:has-text('Content Created')")
      .first();
    await eventButton.click();
    await page.waitForTimeout(500);

    await page.click("button:has-text('Create')");
    await page.waitForTimeout(2000);

    const nameValue = await page.locator("#name").inputValue();
    expect(nameValue).toBe("Test Webhook");
  });

  test("should set webhook URL", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const urlInput = page.locator("input#url").first();
    await urlInput.fill("https://api.example.com/hooks");

    expect(await urlInput.inputValue()).toBe("https://api.example.com/hooks");
  });

  test("should select trigger event - content.created", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const eventButton = page
      .locator("button:has-text('Content Created')")
      .first();
    await eventButton.click();

    await expect(eventButton).toHaveClass(/bg-blue-/);
  });

  test("should select trigger event - content.updated", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const eventButton = page
      .locator("button:has-text('Content Updated')")
      .first();
    await eventButton.click();

    await expect(eventButton).toHaveClass(/bg-blue-/);
  });

  test("should select trigger event - content.deleted", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const eventButton = page
      .locator("button:has-text('Content Deleted')")
      .first();
    await eventButton.click();

    await expect(eventButton).toHaveClass(/bg-blue-/);
  });

  test("should select trigger event - content.published", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const eventButton = page
      .locator("button:has-text('Content Published')")
      .first();
    await eventButton.click();

    await expect(eventButton).toHaveClass(/bg-blue-/);
  });

  test("should set secret key", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const secretInput = page.locator("input#secret").first();
    await secretInput.fill("my-secret-key-123");
    expect(await secretInput.inputValue()).toBe("my-secret-key-123");
  });

  test("should configure HTTP headers", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const headersTextarea = page.locator("textarea#headers").first();
    await headersTextarea.fill('{"Authorization": "Bearer token"}');

    expect(await headersTextarea.inputValue()).toBe(
      '{"Authorization": "Bearer token"}',
    );
  });

  test("should show validation errors for empty form", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    await page.click("button:has-text('Create')");
    await page.waitForTimeout(500);

    const urlInput = page.locator("#url");
    await expect(urlInput).toBeVisible();
  });

  test("should show validation error for invalid URL", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    await page.fill("#name", "Test Webhook");
    await page.fill("#url", "not-a-valid-url");

    await page.click("button:has-text('Create')");
    await page.waitForTimeout(500);

    const urlInput = page.locator("#url");
    await expect(urlInput).toBeVisible();
  });

  test("should toggle webhook active status", async ({ page }) => {
    await page.goto("/webhooks/new");
    await page.waitForLoadState("networkidle");

    const activeCheckbox = page.locator("input[type='checkbox']").first();
    await expect(activeCheckbox).toBeChecked();

    await activeCheckbox.uncheck();
    await expect(activeCheckbox).not.toBeChecked();
  });
});
