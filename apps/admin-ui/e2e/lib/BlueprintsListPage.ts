import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Blueprints List Page Object Model
 */
export class BlueprintsListPage extends BasePage {
  get heading(): Locator {
    return this.page.locator("h1");
  }

  get createButton(): Locator {
    return this.page
      .locator("a:has-text('Create Blueprint'), button:has-text('Create')")
      .first();
  }

  get searchInput(): Locator {
    return this.page.locator('input[type="text"]').first();
  }

  get sortSelect(): Locator {
    return this.page.locator("select").first();
  }

  get blueprintCards(): Locator {
    return this.page.locator("[class*='card'], .card");
  }

  get deleteModal(): Locator {
    return this.page.locator("[role='dialog']").filter({ hasText: /Delete/ });
  }

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await super.goto("/blueprints");
    await this.waitForLoad();
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
    await this.wait(500);
  }

  async sortBy(option: string): Promise<void> {
    if (await this.isVisible(this.sortSelect)) {
      await this.sortSelect.selectOption(option);
      await this.wait(500);
    }
  }

  async clickCreate(): Promise<void> {
    await this.createButton.click();
  }

  async clickEdit(blueprintName: string): Promise<boolean> {
    const card = this.page.locator(`text=${blueprintName}`).first();
    if (await this.isVisible(card)) {
      const editButton = card
        .locator("..")
        .locator("a:has-text('Edit'), button:has-text('Edit')")
        .first();
      return await this.safeClick(editButton);
    }
    return false;
  }

  async clickDelete(blueprintName: string): Promise<boolean> {
    const card = this.page.locator(`text=${blueprintName}`).first();
    if (await this.isVisible(card)) {
      const deleteButton = card
        .locator("..")
        .locator("button[title='Delete'], button[aria-label*='Delete']")
        .first();
      return await this.safeClick(deleteButton);
    }
    return false;
  }

  async confirmDelete(): Promise<void> {
    const confirmButton = this.deleteModal
      .locator("button:has-text('Delete')")
      .last();
    await this.safeClick(confirmButton);
    await this.wait(1000);
  }

  async getBlueprintCount(): Promise<number> {
    return await this.blueprintCards.count();
  }

  async isEmptyStateVisible(): Promise<boolean> {
    const bodyText = await this.getBodyText();
    return /no blueprints|get started/i.test(bodyText);
  }
}
