import { test, expect } from '@playwright/test';

test.describe('Process Phase - Active Processing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15000 });
    // Clear localStorage to ensure fresh state
    await page.evaluate(() => localStorage.removeItem('gemstone_game_save'));
    await page.reload();
    await page.waitForSelector('h1', { timeout: 15000 });
    
    // Navigate to Process
    await page.getByRole('button', { name: 'Process', exact: true }).click();
    await expect(page.locator('h2:has-text("Process")')).toBeVisible();
  });

  test('displays process screen with tabs', async ({ page }) => {
    await expect(page.locator('h2:has-text("Process")')).toBeVisible();
    // Use exact match for tab buttons
    await expect(page.getByRole('button', { name: 'Active', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Idle Queue', exact: true })).toBeVisible();
  });

  test('active tab is default and highlighted', async ({ page }) => {
    const activeBtn = page.getByRole('button', { name: 'Active', exact: true });
    await expect(activeBtn).toHaveClass(/bg-amber-500/);
  });

  test('shows empty state when no items available', async ({ page }) => {
    await expect(page.locator('text=No items available to process')).toBeVisible();
    await expect(page.locator('text=Visit Discover to find some gems')).toBeVisible();
  });

  test('shows item selection UI with title', async ({ page }) => {
    await expect(page.locator('text=Select Item to Process')).toBeVisible();
  });

  test('can switch to idle queue tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Idle Queue', exact: true }).click();
    // Should see the idle queue content
    await expect(page.locator('text=Idle Queue')).toBeVisible();
  });

  test('back button returns to menu', async ({ page }) => {
    // Look for the back button with "Menu" text
    const backBtn = page.getByRole('button', { name: /Menu/ });
    await expect(backBtn).toBeVisible();
    
    await backBtn.first().click();
    
    // Should be back at main menu
    await expect(page.locator('h1:has-text("Gemstone")').nth(1)).toBeVisible();
  });
});

test.describe('Process Phase - UI Component Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.evaluate(() => localStorage.removeItem('gemstone_game_save'));
    await page.reload();
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.getByRole('button', { name: 'Process', exact: true }).click();
  });

  test('shows active processing header', async ({ page }) => {
    await expect(page.locator('h2:has-text("Process")')).toBeVisible();
    await expect(page.locator('text=Select Item to Process')).toBeVisible();
  });

  test('idle queue tab shows queue content', async ({ page }) => {
    await page.getByRole('button', { name: 'Idle Queue', exact: true }).click();
    // Should show some content related to the queue
    await expect(page.locator('text=Idle Queue')).toBeVisible();
  });

  test('equipment tab shows process equipment', async ({ page }) => {
    await page.getByRole('button', { name: 'Equipment', exact: true }).click();
    await expect(page.locator('text=Process Equipment')).toBeVisible();
    await expect(page.locator('text=Currently Equipped')).toBeVisible();
  });

  test('equipment tab has process type tabs', async ({ page }) => {
    await page.getByRole('button', { name: 'Equipment', exact: true }).click();
    // Should see the three process type buttons
    await expect(page.getByRole('button', { name: /Cleaning/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cutting/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Faceting/ })).toBeVisible();
  });

  test('equipment shows upgrade options', async ({ page }) => {
    await page.getByRole('button', { name: 'Equipment', exact: true }).click();
    // Should show Basic Tumbler as the first option for cleaning
    await expect(page.locator('text=Basic Tumbler')).toBeVisible();
  });
});
