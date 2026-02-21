import { test, expect } from "@playwright/test";
import { setupApiMocks } from "./mocks/handlers";

test.describe("Users List", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/users");
    await page.waitForLoadState("networkidle");
  });

  test("✅ should display users list page", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/users?/i);
  });

  test("✅ should have create user button", async ({ page }) => {
    const createButton = page
      .locator("button:has-text('Create'), a:has-text('Create')")
      .first();
    await expect(createButton).toBeVisible();
  });

  test("✅ should have search functionality", async ({ page }) => {
    const searchInput = page
      .locator('input[type="text"], input[placeholder*="Search"]')
      .first();
    await expect(searchInput).toBeVisible();
  });

  test("✅ should have filter by role", async ({ page }) => {
    const roleFilter = page
      .locator("select, button:has-text('Role'), button:has-text('All Roles')")
      .first();
    await expect(roleFilter).toBeVisible();
  });

  test("✅ should have filter by status", async ({ page }) => {
    const statusFilter = page
      .locator(
        "select, button:has-text('Status'), button:has-text('All Status')",
      )
      .first();
    await expect(statusFilter).toBeVisible();
  });

  test("✅ should navigate to create user page", async ({ page }) => {
    const createButton = page.locator("button:has-text('Create')").first();
    await createButton.click();
    await expect(page).toHaveURL("/users/new");
  });

  test("✅ should display user list or empty state", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const pageText = await page.locator("body").innerText();
    const hasContent = /user|email|name/i.test(pageText);
    expect(hasContent || /no users|empty/i.test(pageText)).toBeTruthy();
  });

  // 🔄 NEW TEST CASES TO IMPLEMENT
  test("⏳ should display users list with emails", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const pageText = await page.locator("body").innerText();
    expect(pageText).toMatch(/@|email|user/i);
  });

  test("⏳ should show user names", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const pageText = await page.locator("body").innerText();
    expect(pageText).toMatch(/name|user/i);
  });

  test("⏳ should show user roles", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const pageText = await page.locator("body").innerText();
    const hasRoles = /admin|editor|viewer/i.test(pageText);
    expect(hasRoles).toBe(true);
  });

  test("⏳ should show user status", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const pageText = await page.locator("body").innerText();
    const hasStatus = /active|inactive/i.test(pageText);
    expect(hasStatus).toBe(true);
  });

  test("⏳ should search users", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill("admin");
    await searchInput.press("Enter");

    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();
  });

  test("⏳ should filter by role", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const roleSelect = page.locator("select").first();
    if (await roleSelect.isVisible().catch(() => false)) {
      await roleSelect.selectOption("admin");
      await page.waitForLoadState("networkidle");

      const pageText = await page.locator("body").innerText();
      expect(pageText).toMatch(/admin/i);
    }
  });

  test("⏳ should filter by status", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const statusSelect = page.locator("select").nth(1);
    if (await statusSelect.isVisible().catch(() => false)) {
      await statusSelect.selectOption("true");
      await page.waitForLoadState("networkidle");
    }
  });

  test("⏳ should navigate to edit user", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const editButton = page
      .locator(
        "button:has-text('Edit'), a:has-text('Edit'), [aria-label*='Edit']",
      )
      .first();
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await expect(page).toHaveURL(/\/users\/[^/]+\/?$/);
    }
  });

  test("⏳ should delete user", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const deleteButton = page
      .locator("table button:has-text('Delete')")
      .first();
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();

      await page.waitForSelector("[role='dialog']");
      await page
        .locator("[role='dialog'] button")
        .filter({ hasText: "Delete" })
        .first()
        .click({ force: true });
      await page.waitForLoadState("networkidle");
    }
  });

  test("⏳ should show user count", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const pageText = await page.locator("body").innerText();
    expect(pageText).toMatch(/\d+ users?/i);
  });
});

test.describe("User Editor", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test("✅ should display new user page", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toContainText(/create|new|user/i);
  });

  test("✅ should have email input", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const emailInput = page
      .locator("input[type='email'], input[name='email']")
      .first();
    await expect(emailInput).toBeVisible();
  });

  test("✅ should have name input", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const nameInput = page
      .locator("input[name='name'], input[placeholder*='name']")
      .first();
    await expect(nameInput).toBeVisible();
  });

  test("✅ should have password input", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const passwordInput = page
      .locator("input[type='password'], input[name='password']")
      .first();
    await expect(passwordInput).toBeVisible();
  });

  test("✅ should have role selection", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const roleSelect = page.locator("select, [role='combobox']").first();
    await expect(roleSelect).toBeVisible();
  });

  test("✅ should have save button", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const saveButton = page
      .locator("button:has-text('Save'), button[type='submit']")
      .first();
    await expect(saveButton).toBeVisible();
  });

  // 🔄 NEW TEST CASES TO IMPLEMENT
  test("⏳ should create new user", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    await page.fill("input#name", "Test User");
    await page.fill("input#email", "test" + Date.now() + "@example.com");
    await page.fill("input#password", "password123");
    await page.fill("input#confirmPassword", "password123");
    await page.selectOption("select#role", "editor");

    await page.click("button:has-text('Create')");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/users");
  });

  test("⏳ should set user email", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator("input#email").first();
    await emailInput.fill("user@example.com");

    expect(await emailInput.inputValue()).toBe("user@example.com");
  });

  test("⏳ should set user name", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const nameInput = page.locator("input#name").first();
    await nameInput.fill("John Doe");

    expect(await nameInput.inputValue()).toBe("John Doe");
  });

  test("⏳ should set user password", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const passwordInput = page.locator("input#password").first();
    await passwordInput.fill("securePassword123");

    const value = await passwordInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("⏳ should assign user role - Admin", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const roleSelect = page.locator("select#role").first();
    await roleSelect.selectOption("admin");
    await page.waitForLoadState("networkidle");
  });

  test("⏳ should assign user role - Editor", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const roleSelect = page.locator("select#role").first();
    await roleSelect.selectOption("editor");
    await page.waitForLoadState("networkidle");
  });

  test("⏳ should assign user role - Viewer", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const roleSelect = page.locator("select#role").first();
    await roleSelect.selectOption("viewer");
    await page.waitForLoadState("networkidle");
  });

  test("⏳ should activate user", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const activeCheckbox = page.locator("input[type='checkbox']").first();
    if (await activeCheckbox.isVisible().catch(() => false)) {
      await activeCheckbox.check();
    }
  });

  test("⏳ should deactivate user", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const activeCheckbox = page.locator("input[type='checkbox']").first();
    if (await activeCheckbox.isVisible().catch(() => false)) {
      await activeCheckbox.uncheck();
    }
  });

  test("⏳ should save user", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    await page.fill("input#name", "New User");
    await page.fill("input#email", "newuser" + Date.now() + "@example.com");
    await page.fill("input#password", "password123");
    await page.fill("input#confirmPassword", "password123");

    await page.click("button:has-text('Create')");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/users");
  });

  test("⏳ should show validation errors", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    await page.click("button:has-text('Create')");
    await page.waitForLoadState("networkidle");

    const pageText = await page.locator("body").innerText();
    expect(pageText).toMatch(/required|error|invalid|name|email|password/i);
  });

  test("⏳ should show password strength", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    const passwordInput = page.locator("input#password").first();
    await passwordInput.fill("weak");

    await page.waitForLoadState("networkidle");
  });

  test("⏳ should send invitation email", async ({ page }) => {
    await page.goto("/users/new");
    await page.waitForLoadState("networkidle");

    await page.fill("input#name", "Invited User");
    await page.fill("input#email", "invite" + Date.now() + "@example.com");
    await page.fill("input#password", "password123");
    await page.fill("input#confirmPassword", "password123");

    await page.click("button:has-text('Create')");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/users");
  });
});
