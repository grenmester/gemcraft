import { test, expect } from '@playwright/test';

test.describe('Discover Phase Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15000 });
    // Clear localStorage to ensure fresh state
    await page.evaluate(() => localStorage.removeItem('gemstone_game_save'));
    await page.reload();
    await page.waitForSelector('h1', { timeout: 15000 });
    // Navigate to Discover
    await page.click('button:has-text("Discover")');
    await expect(page.locator('h2:has-text("Discover")')).toBeVisible();
  });

  test('displays discover screen with tabs', async ({ page }) => {
    await expect(page.locator('h2:has-text("Discover")')).toBeVisible();
    await expect(page.locator('button:has-text("Panning")')).toBeVisible();
    await expect(page.locator('button:has-text("Idle")')).toBeVisible();
  });

  test('panning tab is default and highlighted', async ({ page }) => {
    const panningBtn = page.locator('button:has-text("Panning")');
    await expect(panningBtn).toHaveClass(/bg-yellow-500/);
  });

  test('shows mine selection on panning tab', async ({ page }) => {
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    // Should see some mine cards
    await expect(page.locator('text=Beginner').first()).toBeVisible();
  });

  test('can click on mine to see details', async ({ page }) => {
    // Click on the first available mine (River Panning is unlocked)
    await page.click('button:has-text("River Panning")');
    // Should see mine details with subareas
    await expect(page.locator('text=Subareas')).toBeVisible();
    await expect(page.locator('text=River Bend')).toBeVisible();
    await expect(page.locator('text=Back to Mines')).toBeVisible();
  });

  test('can click on subarea to see loot table', async ({ page }) => {
    await page.click('button:has-text("River Panning")');
    await page.click('button:has-text("View Details")');
    await expect(page.locator('text=Loot Table')).toBeVisible();
    await expect(page.locator('text=Back to Mine')).toBeVisible();
  });

  test('back button from subarea returns to mine details', async ({ page }) => {
    await page.click('button:has-text("River Panning")');
    await page.click('button:has-text("View Details")');
    await expect(page.locator('text=Back to Mine')).toBeVisible();
    
    await page.click('text=Back to Mine');
    
    // Should be back at mine details showing subareas
    await expect(page.locator('text=Subareas')).toBeVisible();
    await expect(page.locator('text=River Bend')).toBeVisible();
  });

  test('back button from mine details returns to mine selection', async ({ page }) => {
    await page.click('button:has-text("River Panning")');
    await expect(page.locator('text=Back to Mines')).toBeVisible();
    
    await page.click('text=Back to Mines');
    
    // Should be back at mine selection
    await expect(page.locator('text=Mine Selection')).toBeVisible();
  });

  test('back button from mine selection returns to menu', async ({ page }) => {
    // Look for the back button with "Menu" text
    const backBtn = page.locator('button:has-text("Menu")');
    await expect(backBtn).toBeVisible();
    
    await backBtn.click();
    
    // Should be back at main menu
    await expect(page.locator('h1:has-text("Gemstone")')).toBeVisible();
    await expect(page.locator('text=Build your gem empire')).toBeVisible();
  });

  test('can mine and collect materials', async ({ page }) => {
    await page.click('button:has-text("River Panning")');
    await page.click('button:has-text("View Details")');
    
    await page.click('button:has-text("Small Reward")');
    
    await expect(page.locator('text=Mined')).toBeVisible();
    
    const collectBtn = page.locator('button:has-text("Collect Materials")');
    await expect(collectBtn).toBeEnabled();
  });

  test('mining cooldown works', async ({ page }) => {
    await page.click('button:has-text("River Panning")');
    await page.click('button:has-text("View Details")');
    
    await page.click('button:has-text("Small Reward")');
    
    // Try to mine again immediately
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

  test('idle tab shows workers stats when workers exist', async ({ page }) => {
    await page.click('button:has-text("Idle")');
    await expect(page.locator('text=Total')).toBeVisible();
    await expect(page.locator('text=Next Generation')).toBeVisible();
  });

  test('complete navigation flow: menu -> mine selection -> mine details -> subarea -> back to menu', async ({ page }) => {
    // Start at menu
    await expect(page.locator('h1:has-text("Gemstone")')).toBeVisible();
    
    // Go to Discover
    await page.click('button:has-text("Discover")');
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    
    // Click mine
    await page.click('button:has-text("River Panning")');
    await expect(page.locator('text=Subareas')).toBeVisible();
    
    // Click subarea
    await page.click('button:has-text("View Details")');
    await expect(page.locator('text=Loot Table')).toBeVisible();
    
    // Back to mine details
    await page.click('text=Back to Mine');
    await expect(page.locator('text=Subareas')).toBeVisible();
    
    // Back to mine selection
    await page.click('text=Back to Mines');
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    
    // Back to menu
    await page.click('button:has-text("Menu")');
    await expect(page.locator('h1:has-text("Gemstone")')).toBeVisible();
  });
});
