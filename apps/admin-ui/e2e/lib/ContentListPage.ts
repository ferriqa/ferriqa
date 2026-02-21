import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Content List Page Object Model
 */
export class ContentListPage extends BasePage {
  // Locators - getter olarak tanımlıyoruz
  get heading(): Locator {
    return this.page.locator("h1");
  }

  get createButton(): Locator {
    return this.page.getByRole("button", { name: /Create Content/i });
  }

  get searchInput(): Locator {
    return this.page.locator('input[type="text"]').first();
  }

  get blueprintFilter(): Locator {
    return this.page.locator("select").nth(0);
  }

  get statusFilter(): Locator {
    return this.page.locator("select").nth(1);
  }

  get table(): Locator {
    return this.page.locator("table, [role='list']");
  }

  get contentItems(): Locator {
    return this.page.locator("[class*='content-item'], tr, [role='listitem']");
  }

  get modal(): Locator {
    return this.page.locator("[role='dialog']");
  }

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to content list page
   */
  async goto(): Promise<void> {
    await super.goto("/content");
    await this.waitForLoad();
  }

  /**
   * Search for content
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
    await this.wait(500);
  }

  /**
   * Filter by blueprint
   */
  async filterByBlueprint(blueprintId: string): Promise<void> {
    if (await this.isVisible(this.blueprintFilter)) {
      await this.blueprintFilter.selectOption(blueprintId);
      await this.wait(500);
    }
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: string): Promise<void> {
    if (await this.isVisible(this.statusFilter)) {
      await this.statusFilter.selectOption(status);
      await this.wait(500);
    }
  }

  /**
   * Click create content button
   */
  async clickCreate(): Promise<void> {
    await this.createButton.click();
  }

  /**
   * Click on content item to edit
   */
  async clickEdit(contentName: string): Promise<void> {
    const contentItem = this.page.locator(`text=${contentName}`).first();
    if (await this.isVisible(contentItem)) {
      await contentItem.click();
    }
  }

  /**
   * Check if blueprint selection modal is visible
   */
  async isBlueprintModalVisible(): Promise<boolean> {
    return await this.isVisible(this.modal);
  }

  /**
   * Select blueprint from modal
   */
  async selectBlueprint(blueprintName: string): Promise<void> {
    if (await this.isBlueprintModalVisible()) {
      const blueprintOption = this.page
        .locator(`text=${blueprintName}`)
        .first();
      await blueprintOption.click();
    }
  }

  /**
   * Get content count
   */
  async getContentCount(): Promise<number> {
    return await this.contentItems.count();
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    const bodyText = await this.getBodyText();
    return /no content|empty|get started/i.test(bodyText);
  }

  /**
   * Delete content by name
   */
  async deleteContent(contentName: string): Promise<boolean> {
    // Find delete button for content
    const deleteButton = this.page
      .locator(`text=${contentName}`)
      .locator("..")
      .locator("button[aria-label*='Delete'], button:has-text('Delete')")
      .first();

    if (await this.safeClick(deleteButton)) {
      // Confirm deletion
      await this.wait(500);
      const confirmButton = this.page
        .locator("button:has-text('Delete')")
        .last();
      await this.safeClick(confirmButton);
      await this.wait(1000);
      return true;
    }
    return false;
  }

  /**
   * Export content list
   */
  async export(): Promise<boolean> {
    const exportButton = this.page
      .locator("button:has-text('Export'), [aria-label='Export']")
      .first();
    return await this.safeClick(exportButton);
  }

  /**
   * Sort by column
   */
  async sortBy(columnName: string): Promise<void> {
    const columnHeader = this.page.locator(`text=${columnName}`).first();
    if (await this.isVisible(columnHeader)) {
      await columnHeader.click();
      await this.wait(500);
    }
  }

  /**
   * Navigate to next page
   */
  async nextPage(): Promise<boolean> {
    const nextButton = this.page
      .locator("[aria-label='Next page'], button:has-text('Next')")
      .first();
    if (await this.isVisible(nextButton)) {
      await nextButton.click();
      await this.wait(500);
      return true;
    }
    return false;
  }
}
