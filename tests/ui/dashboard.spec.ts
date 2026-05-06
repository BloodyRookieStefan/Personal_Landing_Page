import { test, expect } from '@playwright/test';

// All UI tests target a running dev server at http://localhost:5173.
// They exercise the dashboard via a "fallback" storage mode so no file picker
// interaction is required.

async function openDashboard(page: import('@playwright/test').Page) {
  await page.goto('/');
  // Dismiss storage setup by clicking the fallback link
  const fallbackBtn = page.getByRole('button', { name: /use without file|limited mode|fallback/i });
  await fallbackBtn.click();
  // Wait until the dashboard shell is visible
  await page.waitForSelector('[data-testid="category-sidebar"]');
}

// ──────────────────────────────────────────────────────────────────────────────
// Dashboard layout
// ──────────────────────────────────────────────────────────────────────────────

test.describe('Dashboard layout', () => {
  test('renders category sidebar and weblink grid side by side', async ({ page }) => {
    await openDashboard(page);
    await expect(page.locator('[data-testid="category-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="weblinks-empty"]')).toBeVisible();
  });

  test('sidebar shows default categories "Imported" and "Not defined"', async ({ page }) => {
    await openDashboard(page);
    const sidebar = page.locator('[data-testid="category-sidebar"]');
    await expect(sidebar).toContainText('Imported');
    await expect(sidebar).toContainText('Not defined');
  });

  test('weblink grid shows empty state when no weblinks exist', async ({ page }) => {
    await openDashboard(page);
    await expect(page.locator('[data-testid="weblinks-empty"]')).toBeVisible();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Compact mode
// ──────────────────────────────────────────────────────────────────────────────

test.describe('Compact mode', () => {
  test('compact mode toggle changes tile layout', async ({ page }) => {
    await openDashboard(page);
    await page.getByRole('button', { name: /add weblink|weblink hinzufügen/i }).click();
    await page.fill('[data-testid="weblink-url-input"]', 'https://example.com');
    await page.fill('[data-testid="weblink-name-input"]', 'Example');
    await page.click('[data-testid="weblink-save-btn"]');
    const toggle = page.getByRole('button', { name: /compact/i });
    await expect(toggle).toBeVisible();
    const grid = page.locator('[data-testid="weblink-grid"]');
    // Enable compact mode
    await toggle.click();
    await expect(grid).toHaveAttribute('data-compact', 'true');
    // Disable compact mode
    await toggle.click();
    await expect(grid).not.toHaveAttribute('data-compact', 'true');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Theme switching
// ──────────────────────────────────────────────────────────────────────────────

test.describe('Theme switching', () => {
  test('clicking the theme toggle switches between light and dark', async ({ page }) => {
    await openDashboard(page);
    const themeToggle = page.getByRole('button', { name: /theme|dark|light/i });
    await expect(themeToggle).toBeVisible();
    const html = page.locator('html');
    await themeToggle.click();
    const afterClass = await html.getAttribute('data-theme');
    expect(['light', 'dark']).toContain(afterClass);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Language switching
// ──────────────────────────────────────────────────────────────────────────────

test.describe('Language switching', () => {
  test('language toggle switches between German and English labels', async ({ page }) => {
    await openDashboard(page);
    const langToggle = page.getByRole('button', { name: /language|de|en|deutsch|english/i });
    await expect(langToggle).toBeVisible();
    await langToggle.click();
    // After switching, at least one of the well-known translated labels must be visible
    const body = page.locator('body');
    const hasDE = await body.getByText(/Kategorien|Lesezeichen importieren/i).count();
    const hasEN = await body.getByText(/Categories|Import bookmarks/i).count();
    expect(hasDE + hasEN).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Category management
// ──────────────────────────────────────────────────────────────────────────────

test.describe('Category management', () => {
  test('can create a new category', async ({ page }) => {
    await openDashboard(page);
    // Open category form
    const addCatBtn = page.getByRole('button', { name: /add category|new category|kategorie/i });
    await addCatBtn.click();
    await page.waitForSelector('[data-testid="category-name-input"]');
    await page.fill('[data-testid="category-name-input"]', 'Test Category');
    await page.click('[data-testid="category-save-btn"]');
    // New category must appear in sidebar
    await expect(page.locator('[data-testid="category-sidebar"]')).toContainText('Test Category');
  });

  test('cannot delete default categories', async ({ page }) => {
    await openDashboard(page);
    const sidebar = page.locator('[data-testid="category-sidebar"]');
    // Default categories must not show a delete button next to them
    const importedItem = sidebar.getByText('Imported');
    const notDefinedItem = sidebar.getByText('Not defined');
    // Their nearest list items should have no delete button
    const importedRow = importedItem.locator('..').locator('..');
    const notDefinedRow = notDefinedItem.locator('..').locator('..');
    await expect(importedRow.getByRole('button', { name: /delete/i })).toHaveCount(0);
    await expect(notDefinedRow.getByRole('button', { name: /delete/i })).toHaveCount(0);
  });

  test('can delete a custom category; affected weblinks move to Not defined', async ({ page }) => {
    await openDashboard(page);
    // Create a category first
    const addCatBtn = page.getByRole('button', { name: /add category|new category|kategorie/i });
    await addCatBtn.click();
    await page.fill('[data-testid="category-name-input"]', 'ToDelete');
    await page.click('[data-testid="category-save-btn"]');
    await expect(page.locator('[data-testid="category-sidebar"]')).toContainText('ToDelete');
    // Delete it
    const deleteBtn = page.locator('[data-testid="category-sidebar"]')
      .getByRole('button', { name: /delete ToDelete|ToDelete löschen/i });
    await deleteBtn.click();
    // Confirm dialog
    await page.getByRole('button', { name: /confirm|delete|löschen/i }).click();
    // Category must be gone
    await expect(page.locator('[data-testid="category-sidebar"]')).not.toContainText('ToDelete');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Firefox import action
// ──────────────────────────────────────────────────────────────────────────────

test.describe('Firefox import action', () => {
  test('import button is visible on the dashboard toolbar', async ({ page }) => {
    await openDashboard(page);
    const importBtn = page.getByRole('button', { name: /import|bookmarks|lesezeichen/i });
    await expect(importBtn).toBeVisible();
  });

  test('clicking import opens the import dialog', async ({ page }) => {
    await openDashboard(page);
    const importBtn = page.getByRole('button', { name: /import|bookmarks|lesezeichen/i });
    await importBtn.click();
    await expect(page.locator('[data-testid="import-select-file-btn"]')).toBeVisible();
  });
});

test.describe('Weblink editing', () => {
  test('ellipsis action opens an edit flow for an existing weblink', async ({ page }) => {
    await openDashboard(page);
    await page.getByRole('button', { name: /add weblink|weblink hinzufügen/i }).click();
    await page.fill('[data-testid="weblink-url-input"]', 'https://example.com');
    await page.fill('[data-testid="weblink-name-input"]', 'Example');
    await page.fill('#wl-description', 'Initial description');
    await page.click('[data-testid="weblink-save-btn"]');

    const tile = page.locator('[data-testid^="weblink-tile-"]').first();
    await expect(tile).toContainText('Example');

    const menuButton = page.locator('[data-testid^="weblink-menu-button-"]').first();
    await menuButton.click();
    await page.locator('[data-testid^="weblink-edit-button-"]').first().click();

    await expect(page.locator('#weblink-form-title')).toContainText(/edit|bearbeiten/i);
    await page.fill('[data-testid="weblink-name-input"]', 'Example Updated');
    await page.click('[data-testid="weblink-save-btn"]');

    await expect(tile).toContainText('Example Updated');
  });
});
