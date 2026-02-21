import type { Page, Locator } from "@playwright/test";

/**
 * Base Page Object Model class
 * Provides common functionality for all page objects
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a URL
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  /**
   * Wait for page to fully load
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for a specific timeout
   */
  async wait(timeout: number): Promise<void> {
    await this.page.waitForTimeout(timeout);
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get page URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Safe click - checks visibility first
   */
  async safeClick(locator: Locator): Promise<boolean> {
    if (await this.isVisible(locator)) {
      await locator.click();
      return true;
    }
    return false;
  }

  /**
   * Safe fill - checks visibility first
   */
  async safeFill(locator: Locator, value: string): Promise<boolean> {
    if (await this.isVisible(locator)) {
      await locator.fill(value);
      return true;
    }
    return false;
  }

  /**
   * Get text content of page body
   */
  async getBodyText(): Promise<string> {
    return await this.page.locator("body").innerText();
  }

  /**
   * Check if text exists in page
   */
  async hasText(text: string | RegExp): Promise<boolean> {
    const bodyText = await this.getBodyText();
    if (typeof text === "string") {
      return bodyText.includes(text);
    }
    return text.test(bodyText);
  }

  /**
   * Wait for API response
   */
  async waitForResponse(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForResponse(urlPattern);
  }

  /**
   * Handle dialog (alert, confirm, prompt)
   */
  async handleDialog(
    accept: boolean = true,
    promptText?: string,
  ): Promise<void> {
    this.page.on("dialog", async (dialog) => {
      if (dialog.type() === "prompt" && promptText) {
        await dialog.accept(promptText);
      } else if (accept) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
  }

  /**
   * Set viewport size
   */
  async setViewport(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }

  /**
   * Reload page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForLoad();
  }
}
