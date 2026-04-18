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
    
    // Check for jewelry type tabs - use exact matching
    await expect(page.getByRole('button', { name: 'ring', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'pendant', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'earrings', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'bracelet', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'necklace', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'crown', exact: true })).toBeVisible();
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
    // Main menu heading
    await expect(page.getByRole('heading', { name: 'Gemstone Collector' })).toBeVisible();
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
    await page.getByRole('button', { name: 'pendant', exact: true }).click();
    await expect(page.locator('text=Silver Amethyst Pendant')).toBeVisible();
    
    // Click ring tab back
    await page.getByRole('button', { name: 'ring', exact: true }).click();
    await expect(page.locator('text=Simple Copper Ring')).toBeVisible();
  });

  test('no console errors when viewing craft screen', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.getByRole('button', { name: 'Craft', exact: true }).click();
    await page.waitForTimeout(500);

    const criticalErrors = errors.filter(e => !e.includes('Warning'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('no console errors when selecting recipe', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.getByRole('button', { name: 'Craft', exact: true }).click();
    await page.getByRole('button', { name: 'Simple Copper Ring' }).click();
    await page.waitForTimeout(500);

    const criticalErrors = errors.filter(e => !e.includes('Warning'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('no console errors when viewing recipe with no materials', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.getByRole('button', { name: 'Craft', exact: true }).click();
    await page.getByRole('button', { name: 'Simple Copper Ring' }).click();
    await page.waitForTimeout(500);

    // Recipe detail should show without crashing
    await expect(page.locator('text=Gems Required')).toBeVisible();
    await expect(page.locator('text=Metal Required')).toBeVisible();

    const criticalErrors = errors.filter(e => !e.includes('Warning'));
    expect(criticalErrors).toHaveLength(0);
  });
});