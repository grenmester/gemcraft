import { test, expect } from '@playwright/test';

test.describe('Inventory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15000 });
    // Clear localStorage and sessionStorage to ensure fresh state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.waitForSelector('h1', { timeout: 15000 });
  });

  test('can navigate to inventory from menu', async ({ page }) => {
    // Click Inventory button
    await page.getByRole('button', { name: 'Inventory' }).click();
    
    // Should see inventory header
    await expect(page.locator('h2:has-text("INVENTORY")')).toBeVisible();
  });

  test('inventory shows three tabs: Gems, Minerals, Equipment', async ({ page }) => {
    await page.getByRole('button', { name: 'Inventory' }).click();
    
    // Check all tabs are visible
    await expect(page.getByRole('button', { name: 'Gems', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Minerals', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Equipment', exact: true })).toBeVisible();
  });

  test('Gems tab is selected by default', async ({ page }) => {
    await page.getByRole('button', { name: 'Inventory' }).click();
    
    const gemsBtn = page.getByRole('button', { name: 'Gems', exact: true });
    await expect(gemsBtn).toHaveClass(/bg-yellow-400/);
  });

  test('can switch between tabs', async ({ page }) => {
    await page.getByRole('button', { name: 'Inventory' }).click();
    
    // Click Minerals tab
    await page.getByRole('button', { name: 'Minerals', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Minerals', exact: true })).toHaveClass(/bg-yellow-400/);
    
    // Click Equipment tab
    await page.getByRole('button', { name: 'Equipment', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Equipment', exact: true })).toHaveClass(/bg-yellow-400/);
  });

  test('empty state messages shown when no items', async ({ page }) => {
    await page.getByRole('button', { name: 'Inventory' }).click();
    
    // Gems tab empty state
    await expect(page.getByText('No gems collected yet')).toBeVisible();
    
    // Minerals tab empty state
    await page.getByRole('button', { name: 'Minerals', exact: true }).click();
    await expect(page.getByText('No minerals in inventory')).toBeVisible();
  });

  test('back button returns to menu', async ({ page }) => {
    await page.getByRole('button', { name: 'Inventory' }).click();
    await expect(page.locator('h2:has-text("INVENTORY")')).toBeVisible();
    
    // Click back button
    await page.locator('button:has-text("Back")').click();
    
    // Should be back at menu - use exact match to avoid header
    await expect(page.getByRole('heading', { name: 'Gemstone', exact: true })).toBeVisible();
    await expect(page.locator('text=Build your gem empire')).toBeVisible();
  });

  test('has sort dropdown and filter input', async ({ page }) => {
    await page.getByRole('button', { name: 'Inventory' }).click();
    
    // Sort dropdown
    await expect(page.locator('select')).toBeVisible();
    
    // Filter input
    await expect(page.getByPlaceholder('Filter...')).toBeVisible();
  });

  test('can type in filter input', async ({ page }) => {
    await page.getByRole('button', { name: 'Inventory' }).click();
    
    const filterInput = page.getByPlaceholder('Filter...');
    await filterInput.fill('quartz');
    
    await expect(filterInput).toHaveValue('quartz');
  });

  test('equipment tab shows unlock levels', async ({ page }) => {
    await page.getByRole('button', { name: 'Inventory' }).click();
    await page.getByRole('button', { name: 'Equipment', exact: true }).click();
    
    // Should show equipment items with level indicators
    await expect(page.getByText(/Level \d+/).first()).toBeVisible();
  });

  test('inventory accessible after fresh start (no cached state)', async ({ page }) => {
    // Clear any persisted state
    await page.evaluate(() => {
      localStorage.removeItem('gemstone_game_save');
    });
    
    // Reload page
    await page.reload();
    await page.waitForSelector('h1', { timeout: 15000 });
    
    // Navigate to inventory
    await page.getByRole('button', { name: 'Inventory' }).click();
    
    // Should load without errors
    await expect(page.locator('h2:has-text("INVENTORY")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Gems', exact: true })).toBeVisible();
  });
});

test.describe('Inventory - Data Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15000 });
    // Clear localStorage and sessionStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.waitForSelector('h1', { timeout: 15000 });
  });

  test('inventory state persists across page reload', async ({ page }) => {
    // Navigate to inventory and verify it's empty
    await page.getByRole('button', { name: 'Inventory' }).click();
    await expect(page.getByText('No gems collected yet')).toBeVisible();
    
    // Reload page (staying in inventory)
    await page.reload();
    await page.waitForSelector('h2:has-text("INVENTORY")', { timeout: 15000 });
    
    // Should still be in inventory and empty
    await expect(page.locator('h2:has-text("INVENTORY")')).toBeVisible();
    await expect(page.getByText('No gems collected yet')).toBeVisible();
  });
});
