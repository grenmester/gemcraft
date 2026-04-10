import { test, expect } from '@playwright/test';

test.describe('Craft Phase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.evaluate(() => localStorage.removeItem('gemstone_game_save'));
    await page.reload();
    await page.waitForSelector('h1', { timeout: 15000 });
  });

  test('craft button visible in menu', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Craft', exact: true })).toBeVisible();
  });

  test('can navigate to craft screen', async ({ page }) => {
    await page.getByRole('button', { name: 'Craft', exact: true }).click();
    await expect(page.locator('h2:has-text("Craft")')).toBeVisible();
  });

  test('craft shows jewelry type tabs', async ({ page }) => {
    await page.getByRole('button', { name: 'Craft', exact: true }).click();
    
    // Check for jewelry type tabs
    await expect(page.locator('button:has-text("ring")')).toBeVisible();
    await expect(page.locator('button:has-text("pendant")')).toBeVisible();
    await expect(page.locator('button:has-text("earrings")')).toBeVisible();
    await expect(page.locator('button:has-text("bracelet")')).toBeVisible();
    await expect(page.locator('button:has-text("necklace")')).toBeVisible();
    await expect(page.locator('button:has-text("crown")')).toBeVisible();
  });

  test('craft shows recipes for ring type', async ({ page }) => {
    await page.getByRole('button', { name: 'Craft', exact: true }).click();
    
    // Ring tab should be active by default, show recipes
    await expect(page.locator('text=Simple Copper Ring')).toBeVisible();
  });

  test('craft shows XP display', async ({ page }) => {
    await page.getByRole('button', { name: 'Craft', exact: true }).click();
    
    await expect(page.locator('text=XP:')).toBeVisible();
    await expect(page.locator('text=XP: 0')).toBeVisible();
  });

  test('back button returns to menu', async ({ page }) => {
    await page.getByRole('button', { name: 'Craft', exact: true }).click();
    await expect(page.locator('h2:has-text("Craft")')).toBeVisible();
    
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('can select a recipe and see details', async ({ page }) => {
    await page.getByRole('button', { name: 'Craft', exact: true }).click();
    
    // Click on Simple Copper Ring recipe
    await page.getByRole('button', { name: 'Simple Copper Ring' }).click();
    
    // Should show recipe details
    await expect(page.locator('text=Back to recipes')).toBeVisible();
    await expect(page.locator('text=Gems Required')).toBeVisible();
    await expect(page.locator('text=Metal Required')).toBeVisible();
    await expect(page.locator('text=Setting')).toBeVisible();
    await expect(page.locator('text=Estimated Value')).toBeVisible();
  });

  test('locked recipes show XP requirement', async ({ page }) => {
    await page.getByRole('button', { name: 'Craft', exact: true }).click();
    
    // Navigate to earrings (requires 500 XP)
    await page.getByRole('button', { name: 'earrings' }).click();
    
    // Gold Ruby Earrings should show "Need 500 XP"
    await expect(page.locator('text=Need 500 XP')).toBeVisible();
  });

  test('can navigate between jewelry type tabs', async ({ page }) => {
    await page.getByRole('button', { name: 'Craft', exact: true }).click();
    
    // Click pendant tab
    await page.getByRole('button', { name: 'pendant' }).click();
    await expect(page.locator('text=Silver Amethyst Pendant')).toBeVisible();
    
    // Click ring tab back
    await page.getByRole('button', { name: 'ring' }).click();
    await expect(page.locator('text=Simple Copper Ring')).toBeVisible();
  });
});