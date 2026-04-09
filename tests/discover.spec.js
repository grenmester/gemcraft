import { test, expect } from '@playwright/test';

test.describe('Discover Phase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.click('button:has-text("Discover")');
  });

  test('displays discover screen with tabs', async ({ page }) => {
    await expect(page.locator('h2:has-text("Discover")')).toBeVisible();
    await expect(page.locator('button:has-text("Panning")')).toBeVisible();
    await expect(page.locator('button:has-text("Idle")')).toBeVisible();
  });

  test('panning tab is default', async ({ page }) => {
    const panningBtn = page.locator('button:has-text("Panning")');
    await expect(panningBtn).toHaveClass(/bg-yellow-500/);
  });

  test('shows mine selection on panning tab', async ({ page }) => {
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    await expect(page.locator('text=River Panning')).toBeVisible();
  });

  test('shows all mine tiers', async ({ page }) => {
    await expect(page.locator('text=Beginner')).toBeVisible();
  });

  test('can click on mine to see details', async ({ page }) => {
    await page.click('button:has-text("River Panning")');
    await expect(page.locator('text=Subareas')).toBeVisible();
    await expect(page.locator('text=River Bend')).toBeVisible();
  });

  test('can click on subarea to see loot table', async ({ page }) => {
    await page.click('button:has-text("River Panning")');
    await page.click('button:has-text("View Details")');
    await expect(page.locator('text=Loot Table')).toBeVisible();
    await expect(page.locator('text=Clear Quartz')).toBeVisible();
  });

  test('can mine and collect materials', async ({ page }) => {
    await page.click('button:has-text("River Panning")');
    await page.click('button:has-text("View Details")');
    
    await page.click('button:has-text("Small Reward")');
    
    await expect(page.locator('text=Mined small reward')).toBeVisible();
    
    const collectBtn = page.locator('button:has-text("Collect Materials")');
    await expect(collectBtn).toBeEnabled();
  });

  test('mining cooldown works', async ({ page }) => {
    await page.click('button:has-text("River Panning")');
    await page.click('button:has-text("View Details")');
    
    await page.click('button:has-text("Small Reward")');
    
    await page.click('button:has-text("Small Reward")');
    
    await expect(page.locator('text=Cooldown')).toBeVisible();
  });

  test('can switch to idle tab', async ({ page }) => {
    await page.click('button:has-text("Idle")');
    await expect(page.locator('text=Workers Overview')).toBeVisible();
  });

  test('idle tab shows empty state when no workers', async ({ page }) => {
    await page.click('button:has-text("Idle")');
    await expect(page.locator('text=No workers hired yet')).toBeVisible();
    await expect(page.locator('button:has-text("Hire Workers")')).toBeVisible();
  });

  test('idle tab shows workers stats', async ({ page }) => {
    await page.click('button:has-text("Idle")');
    await expect(page.locator('text=Total Workers')).toBeVisible();
    await expect(page.locator('text=Next Generation')).toBeVisible();
  });

  test('can navigate back through screens', async ({ page }) => {
    await page.click('button:has-text("River Panning")');
    await expect(page.locator('text=Back to Mines')).toBeVisible();
    
    await page.click('button:has-text("View Details")');
    await expect(page.locator('text=Back to Mine')).toBeVisible();
    
    await page.click('text=Back to Mine');
    await expect(page.locator('text=Subareas')).toBeVisible();
    
    await page.click('text=Back to Mines');
    await expect(page.locator('text=Mine Selection')).toBeVisible();
  });

  test('can navigate back to menu from mine selection', async ({ page }) => {
    await page.click('text=Menu');
    await expect(page.locator('h1:has-text("Gemstone")')).toBeVisible();
  });
});
