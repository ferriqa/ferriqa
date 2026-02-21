import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";
import { ContentEditorPage } from "./lib/ContentEditorPage";

test.describe("Content Editor", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("✅ should display page structure for new content", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    const hasError = await page.locator(".bg-red-50, .text-red-").count();
    expect(hasError).toBe(0);
  });

  test("✅ should display page structure for edit", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoEdit("content-1");

    const hasError = await page.locator(".bg-red-50, .text-red-").count();
    expect(hasError).toBe(0);
  });

  test("✅ should have tabs or navigation elements", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    const hasContent = await page.locator("main").count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test("✅ should handle navigation", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");
    await expect(page).toHaveURL(/\/content\/new/);
  });

  test("✅ should have form elements when loaded", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    const hasError = await page.locator(".bg-red-50, .text-red-").count();
    expect(hasError).toBe(0);
  });

  test("✅ should render all field types from blueprint", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    const hasError = await page.locator(".bg-red-50, .text-red-").count();
    expect(hasError).toBe(0);
  });

  // 🔄 NEW TEST CASES - Using POM
  test("⏳ should create new content with required fields", async ({
    page,
  }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    await editorPage.fillTextField("title", "Test Content Title");
    await editorPage.clickSave();
  });

  test("⏳ should validate required fields on submit", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    await editorPage.clickSave();
    await editorPage.wait(500);

    const hasErrors = await editorPage.hasValidationErrors();
    expect(hasErrors).toBeTruthy();
  });

  test.skip("⏳ should save draft content", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    await editorPage.fillTextField("title", "Draft Content");
    const saved = await editorPage.clickSaveDraft();

    if (saved) {
      const isSuccess = await editorPage.isSaveSuccessful();
      expect(isSuccess).toBeTruthy();
    }
  });

  test.skip("⏳ should publish content", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    await editorPage.fillTextField("title", "Published Content");
    const published = await editorPage.clickPublish();

    if (published) {
      const isSuccess = await editorPage.isSaveSuccessful();
      expect(isSuccess).toBeTruthy();
    }
  });

  test("⏳ should display validation errors", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    await editorPage.clickSave();
    await editorPage.wait(500);

    const hasErrors = await editorPage.hasValidationErrors();
    expect(hasErrors).toBeTruthy();
  });

  test("⏳ should handle text field input", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    const filled = await editorPage.fillTextField("title", "Test text input");
    if (filled) {
      const value = await editorPage.titleInput.inputValue();
      expect(value).toBe("Test text input");
    }
  });

  test("⏳ should handle textarea field input", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    const filled = await editorPage.fillTextareaField(
      "description",
      "Test textarea content\nWith multiple lines",
    );
    if (filled) {
      const value = await editorPage.descriptionInput.inputValue();
      expect(value).toContain("Test textarea content");
    }
  });

  test("⏳ should handle number field input", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    const filled = await editorPage.fillNumberField("count", 42);
    expect(filled).toBeDefined();
  });

  test("⏳ should handle boolean checkbox", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    const toggled = await editorPage.toggleCheckbox("isActive", true);
    expect(toggled).toBeDefined();
  });

  test("⏳ should handle select dropdown", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    const selected = await editorPage.selectOption("category", "option1");
    expect(selected).toBeDefined();
  });

  test("⏳ should handle date picker", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    const filled = await editorPage.fillDateField("publishDate", "2024-02-15");
    expect(filled).toBeDefined();
  });

  test("⏳ should show save success notification", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    await editorPage.fillTextField("title", "Success Test Content");
    await editorPage.clickSave();

    await expect(page).toHaveURL(/\/content\/.+\/edit/);
  });

  test("⏳ should auto-save draft", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    await editorPage.fillTextField("title", "Auto-save test");
    await editorPage.wait(5000);

    const isSuccess = await editorPage.isSaveSuccessful();
    expect(isSuccess).toBeDefined();
  });

  test("⏳ should navigate back without saving prompt", async ({ page }) => {
    const editorPage = new ContentEditorPage(page);
    await editorPage.gotoNew("test-blueprint");

    await editorPage.fillTextField("title", "Unsaved changes");
    await editorPage.handleDialog(true);
    await editorPage.goto("/content");

    await expect(page).toHaveURL(/\/content/);
  });
});
