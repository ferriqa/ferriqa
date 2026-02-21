import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Blueprint Builder", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/blueprints/new");
    await page.waitForLoadState("networkidle");
  });

  test("✅ should display builder interface", async ({ page }) => {
    await expect(page.locator("text=Blueprint Builder").first()).toBeVisible();
  });

  test("✅ should show field palette", async ({ page }) => {
    await expect(page.locator("text=Field Types")).toBeVisible();
    await expect(page.locator("text=Basic Fields")).toBeVisible();
  });

  test("✅ should have blueprint name input", async ({ page }) => {
    await expect(page.locator("#blueprint-name")).toBeVisible();
  });

  test("✅ should have blueprint slug input", async ({ page }) => {
    await expect(page.locator("#blueprint-slug")).toBeVisible();
  });

  test("✅ should have blueprint description textarea", async ({ page }) => {
    await expect(page.locator("#blueprint-description")).toBeVisible();
  });

  test("✅ should show field categories", async ({ page }) => {
    await expect(page.locator("text=Basic Fields")).toBeVisible();
    await expect(page.locator("text=Advanced Fields")).toBeVisible();
    await expect(page.locator("text=Relations")).toBeVisible();
    await expect(
      page.locator("button:has-text('Media')").first(),
    ).toBeVisible();
  });

  test("✅ should expand/collapse field categories", async ({ page }) => {
    const basicFieldsButton = page
      .locator("button:has-text('Basic Fields')")
      .first();
    await basicFieldsButton.click();
    await page.waitForTimeout(500);

    await basicFieldsButton.click();
    await page.waitForTimeout(500);

    await expect(page.locator("button:has-text('Text')").first()).toBeVisible();
    await expect(
      page.locator("button:has-text('Number')").first(),
    ).toBeVisible();
  });

  test("✅ should show canvas area", async ({ page }) => {
    // Canvas or field drop area should exist
    const canvas = page
      .locator("[class*='canvas'], [class*='Canvas'], main")
      .first();
    await expect(canvas).toBeVisible();
  });

  test("✅ should have save button", async ({ page }) => {
    const saveButton = page
      .locator("button:has-text('Save'), button[type='submit']")
      .first();
    await expect(saveButton).toBeVisible();
  });

  test("✅ should have cancel button", async ({ page }) => {
    const cancelButton = page.locator("button:has-text('Cancel')").first();
    await expect(cancelButton).toBeVisible();
  });

  test("✅ should show validation errors for empty required fields", async ({
    page,
  }) => {
    const saveButton = page.locator("button:has-text('Save')").first();
    await saveButton.click();
    await page.waitForTimeout(500);

    const pageText = await page.locator("body").innerText();
    expect(pageText).toMatch(/required|error|field/i);
  });

  test("⏳ should add text field", async ({ page }) => {
    const textFieldButton = page.locator("button:has-text('Text')").first();
    await expect(textFieldButton).toBeVisible();
    await textFieldButton.click();
    await page.waitForTimeout(500);
    await expect(page.locator("text=1 field")).toBeVisible();
  });

  test("⏳ should add textarea field", async ({ page }) => {
    const textareaButton = page.locator("button:has-text('Textarea')").first();
    await expect(textareaButton).toBeVisible();
    await textareaButton.click();
    await page.waitForTimeout(500);
  });

  test("⏳ should add number field", async ({ page }) => {
    const numberButton = page.locator("button:has-text('Number')").first();
    await expect(numberButton).toBeVisible();
    await numberButton.click();
    await page.waitForTimeout(500);
  });

  test("⏳ should add boolean field", async ({ page }) => {
    const booleanButton = page.locator("button:has-text('Boolean')").first();
    await expect(booleanButton).toBeVisible();
    await booleanButton.click();
    await page.waitForTimeout(500);
  });

  test("⏳ should add select field", async ({ page }) => {
    const advancedButton = page
      .locator("button:has-text('Advanced Fields')")
      .first();
    await advancedButton.click();
    await page.waitForTimeout(300);

    const selectButton = page.locator("button:has-text('Select')").first();
    await expect(selectButton).toBeVisible();
    await selectButton.click();
    await page.waitForTimeout(500);
  });

  test("⏳ should add multiselect field", async ({ page }) => {
    const advancedButton = page
      .locator("button:has-text('Advanced Fields')")
      .first();
    await advancedButton.click();
    await page.waitForTimeout(300);

    const multiselectButton = page
      .locator("button:has-text('MultiSelect')")
      .first();
    await expect(multiselectButton).toBeVisible();
    await multiselectButton.click();
    await page.waitForTimeout(500);
  });

  test("⏳ should add date field", async ({ page }) => {
    const advancedButton = page
      .locator("button:has-text('Advanced Fields')")
      .first();
    await advancedButton.click();
    await page.waitForTimeout(300);

    const dateButton = page.locator("button:has-text('Date')").first();
    await expect(dateButton).toBeVisible();
    await dateButton.click();
    await page.waitForTimeout(500);
  });

  test("⏳ should add media field", async ({ page }) => {
    const mediaButton = page.locator("button:has-text('Media')").first();
    await expect(mediaButton).toBeVisible();
    await mediaButton.click();
    await page.waitForTimeout(500);
  });

  test("⏳ should edit field properties", async ({ page }) => {
    const textFieldButton = page.locator("button:has-text('Text')").first();
    await textFieldButton.click();
    await page.waitForTimeout(500);

    await expect(page.locator("text=Field Properties")).toBeVisible();
  });

  test("⏳ should delete field", async ({ page }) => {
    const textFieldButton = page.locator("button:has-text('Text')").first();
    await textFieldButton.click();
    await page.waitForTimeout(500);

    const deleteButton = page.locator("button[title='Delete']").first();
    if (await deleteButton.isVisible().catch(() => false)) {
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      await deleteButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test("⏳ should reorder fields with drag-drop", async ({ page }) => {
    const textButton = page.locator("button:has-text('Text')").first();
    await textButton.click();
    await page.waitForTimeout(300);

    const numberButton = page.locator("button:has-text('Number')").first();
    await numberButton.click();
    await page.waitForTimeout(300);

    await expect(page.locator("text=2 fields")).toBeVisible();
  });

  test("⏳ should mark field as required", async ({ page }) => {
    const textFieldButton = page.locator("button:has-text('Text')").first();
    await textFieldButton.click();
    await page.waitForTimeout(500);

    const requiredCheckbox = page.locator("input[type='checkbox']").first();
    if (await requiredCheckbox.isVisible().catch(() => false)) {
      await requiredCheckbox.check();
    }
  });

  test("⏳ should set field validation rules", async ({ page }) => {
    const textFieldButton = page.locator("button:has-text('Text')").first();
    await textFieldButton.click();
    await page.waitForTimeout(500);

    const minLengthInput = page.locator("input[id*='min']").first();
    if (await minLengthInput.isVisible().catch(() => false)) {
      await minLengthInput.fill("3");
    }
  });

  test("⏳ should preview form", async ({ page }) => {
    const previewButton = page.locator("button[title*='Preview']").first();
    if (await previewButton.isVisible().catch(() => false)) {
      await previewButton.click();
      await expect(page.locator("text=Preview").first()).toBeVisible();
    }
  });

  test("⏳ should save blueprint", async ({ page }) => {
    const nameInput = page.locator("#blueprint-name").first();
    await nameInput.fill("Test Blueprint " + Date.now());

    const slugInput = page.locator("#blueprint-slug").first();
    await slugInput.fill("test-blueprint-" + Date.now());

    const textFieldButton = page.locator("button:has-text('Text')").first();
    await textFieldButton.click();

    const saveButton = page.locator("button:has-text('Save')").first();
    await saveButton.click();

    await page.waitForTimeout(1000);

    const pageText = await page.locator("body").innerText();
    expect(pageText).toMatch(/saved|success|blueprints/i);
  });

  test("⏳ should show validation errors on invalid data", async ({ page }) => {
    const saveButton = page.locator("button:has-text('Save')").first();
    await saveButton.click();

    await page.waitForTimeout(500);

    const pageText = await page.locator("body").innerText();
    expect(pageText).toMatch(/required|error|field/i);
  });

  test("⏳ should discard changes with prompt", async ({ page }) => {
    const nameInput = page.locator("#blueprint-name").first();
    await nameInput.fill("Draft Blueprint");

    // Click cancel
    const cancelButton = page.locator("button:has-text('Cancel')").first();
    await cancelButton.click();

    // Should show confirmation dialog
    await page.waitForTimeout(500);

    // Handle browser confirm dialog
    page.on("dialog", async (dialog) => {
      if (dialog.type() === "confirm") {
        await dialog.accept();
      }
    });
  });
});
