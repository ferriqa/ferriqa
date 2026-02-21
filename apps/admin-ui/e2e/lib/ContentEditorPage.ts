import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Content Editor Page Object Model
 */
export class ContentEditorPage extends BasePage {
  // Form field locators
  get titleInput(): Locator {
    return this.page
      .locator("input[name='title'], input[placeholder*='title']")
      .first();
  }

  get descriptionInput(): Locator {
    return this.page
      .locator(
        "textarea[name='description'], textarea[placeholder*='description']",
      )
      .first();
  }

  get saveButton(): Locator {
    return this.page
      .locator("button:has-text('Save'), button:has-text('Create Content')")
      .first();
  }

  get saveDraftButton(): Locator {
    return this.page.locator("button:has-text('Save Draft')").first();
  }

  get publishButton(): Locator {
    return this.page
      .locator("button:has-text('Publish'), button:has-text('Unpublish')")
      .first();
  }

  get cancelButton(): Locator {
    return this.page.locator("button:has-text('Cancel')").first();
  }

  get form(): Locator {
    return this.page.locator(".bg-white.dark\\:bg-gray-800.border").first();
  }

  get errorMessages(): Locator {
    return this.page.locator(
      ".text-red-500, .text-red-600, .text-red-700, [class*='error']",
    );
  }

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to create new content page
   */
  async gotoNew(blueprintId: string): Promise<void> {
    await super.goto(`/content/new?blueprint=${blueprintId}`);
    await this.waitForLoad();
    await this.waitForFormReady();
    await this.wait(1000);
  }

  /**
   * Navigate to edit content page
   */
  async gotoEdit(contentId: string): Promise<void> {
    await super.goto(`/content/${contentId}/edit`);
    await this.waitForLoad();
    await this.waitForFormReady();
    await this.wait(1000);
  }

  /**
   * Wait for form elements to be ready
   */
  async waitForFormReady(): Promise<void> {
    await this.page
      .waitForSelector("input[name='title'], input[name='slug']", {
        timeout: 10000,
      })
      .catch(() => {});
  }

  /**
   * Fill text field
   */
  async fillTextField(fieldName: string, value: string): Promise<boolean> {
    const field = this.page.locator(`input[name='${fieldName}']`).first();
    return await this.safeFill(field, value);
  }

  /**
   * Fill textarea field
   */
  async fillTextareaField(fieldName: string, value: string): Promise<boolean> {
    const field = this.page.locator(`textarea[name='${fieldName}']`).first();
    return await this.safeFill(field, value);
  }

  /**
   * Fill number field
   */
  async fillNumberField(fieldName: string, value: number): Promise<boolean> {
    const field = this.page
      .locator(`input[type='number'][name='${fieldName}']`)
      .first();
    if (await this.isVisible(field)) {
      await field.fill(value.toString());
      return true;
    }
    return false;
  }

  /**
   * Check/uncheck checkbox
   */
  async toggleCheckbox(fieldName: string, checked: boolean): Promise<boolean> {
    const checkbox = this.page
      .locator(`input[type='checkbox'][name='${fieldName}']`)
      .first();
    if (await this.isVisible(checkbox)) {
      if (checked) {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
      return true;
    }
    return false;
  }

  /**
   * Select from dropdown
   */
  async selectOption(fieldName: string, option: string): Promise<boolean> {
    const select = this.page.locator(`select[name='${fieldName}']`).first();
    if (await this.isVisible(select)) {
      await select.selectOption(option);
      return true;
    }
    return false;
  }

  /**
   * Fill date field
   */
  async fillDateField(fieldName: string, date: string): Promise<boolean> {
    const dateInput = this.page
      .locator(`input[type='date'][name='${fieldName}']`)
      .first();
    return await this.safeFill(dateInput, date);
  }

  /**
   * Click save button
   */
  async clickSave(): Promise<void> {
    await this.saveButton.click();
    await this.wait(1000);
  }

  /**
   * Click save draft button
   */
  async clickSaveDraft(): Promise<boolean> {
    if (await this.isVisible(this.saveDraftButton)) {
      await this.saveDraftButton.click();
      await this.wait(1000);
      return true;
    }
    return false;
  }

  /**
   * Click publish button
   */
  async clickPublish(): Promise<boolean> {
    if (await this.isVisible(this.publishButton)) {
      await this.publishButton.click();
      await this.wait(1000);
      return true;
    }
    return false;
  }

  /**
   * Click cancel button
   */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Check if there are validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    const errorCount = await this.errorMessages.count();
    if (errorCount > 0) return true;

    const bodyText = await this.getBodyText();
    return /required|error|invalid/i.test(bodyText);
  }

  /**
   * Check if save was successful
   */
  async isSaveSuccessful(): Promise<boolean> {
    const bodyText = await this.getBodyText();
    return /saved|success|created/i.test(bodyText);
  }

  /**
   * Get all form fields
   */
  async getFormFields(): Promise<Locator[]> {
    return await this.page.locator("input, textarea, select").all();
  }

  /**
   * Fill form with data
   */
  async fillForm(
    data: Record<string, string | number | boolean>,
  ): Promise<void> {
    for (const [fieldName, value] of Object.entries(data)) {
      if (typeof value === "boolean") {
        await this.toggleCheckbox(fieldName, value);
      } else if (typeof value === "number") {
        await this.fillNumberField(fieldName, value);
      } else {
        await this.fillTextField(fieldName, value);
      }
    }
  }
}
