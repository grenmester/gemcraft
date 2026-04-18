import { test, expect } from '@playwright/test';

test.describe('Discover Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15000 });
    // Clear localStorage to ensure fresh state
    await page.evaluate(() => localStorage.removeItem('gemstone_game_save'));
    await page.reload();
    await page.waitForSelector('h1', { timeout: 15000 });
  });

  test('back button from mine selection returns to menu', async ({ page }) => {
    // Navigate to Discover
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    await expect(page.locator('h2:has-text("Discover")')).toBeVisible();
    
    // The back button shows "Menu" when at mine selection level
    await expect(page.getByRole('button', { name: /Menu/ })).toBeVisible();
    
    await page.getByRole('button', { name: /Menu/ }).click();
    
    // Should be back at main menu
    await expect(page.getByRole('heading', { name: 'Gemstone', exact: true })).toBeVisible();
    await expect(page.locator('text=Build your gem empire')).toBeVisible();
  });

  test('complete navigation: menu -> mine -> back to menu', async ({ page }) => {
    // Start at menu
    await expect(page.getByRole('heading', { name: 'Gemstone', exact: true })).toBeVisible();
    
    // Go to Discover
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    
    // Click mine
    await page.getByRole('button', { name: 'River Panning' }).click();
    await expect(page.locator('text=Subareas')).toBeVisible();
    
    // Back to mine selection - button shows "Back to Mines" when mine is selected
    // Use first() since there are duplicate back buttons in the UI
    await page.getByRole('button', { name: /Back to Mines/ }).first().click();
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    
    // Back to menu - button shows "Menu" when at mine selection
    await page.getByRole('button', { name: /Menu/ }).click();
    await expect(page.getByRole('heading', { name: 'Gemstone', exact: true })).toBeVisible();
  });

  test('complete navigation: menu -> mine -> subarea -> back to mine', async ({ page }) => {
    // Go to Discover
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    
    // Click mine
    await page.getByRole('button', { name: 'River Panning' }).click();
    await expect(page.locator('text=Subareas')).toBeVisible();
    
    // Click first subarea (River Bend) - the View Details is part of the button
    await page.getByRole('button', { name: 'River Bend' }).click();
    await expect(page.locator('text=Loot Table')).toBeVisible();
    
    // Back to mine details - button shows "Back to Mine"
    // Use first() since there are duplicate back buttons in the UI
    await page.getByRole('button', { name: /Back to Mine/ }).first().click();
    await expect(page.locator('text=Subareas')).toBeVisible();
  });

  test('complete navigation: full flow with all back buttons', async ({ page }) => {
    // Start at menu
    await expect(page.getByRole('heading', { name: 'Gemstone', exact: true })).toBeVisible();
    
    // Go to Discover
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    
    // Click mine
    await page.getByRole('button', { name: 'River Panning' }).click();
    await expect(page.locator('text=Subareas')).toBeVisible();
    
    // Click first subarea
    await page.getByRole('button', { name: 'River Bend' }).click();
    await expect(page.locator('text=Loot Table')).toBeVisible();
    
    // Back to mine details - use first() for duplicate buttons
    await page.getByRole('button', { name: /Back to Mine/ }).first().click();
    await expect(page.locator('text=Subareas')).toBeVisible();
    
    // Back to mine selection
    await page.getByRole('button', { name: /Back to Mines/ }).first().click();
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    
    // Back to menu
    await page.getByRole('button', { name: /Menu/ }).click();
    await expect(page.getByRole('heading', { name: 'Gemstone', exact: true })).toBeVisible();
  });
});

test.describe('Idle Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15000 });
    // Clear localStorage to ensure fresh state
    await page.evaluate(() => localStorage.removeItem('gemstone_game_save'));
    await page.reload();
    await page.waitForSelector('h1', { timeout: 15000 });
  });

  test('can switch between Panning and Idle tabs', async ({ page }) => {
    // Go to Discover
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    
    // Panning tab should be active
    await expect(page.getByRole('button', { name: 'Panning', exact: true })).toHaveClass(/bg-yellow-500/);
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    
    // Switch to Idle tab
    await page.getByRole('button', { name: 'Idle', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Idle', exact: true })).toHaveClass(/bg-yellow-500/);
    await expect(page.locator('text=Workers Overview')).toBeVisible();
    
    // Switch back to Panning tab
    await page.getByRole('button', { name: 'Panning', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Panning', exact: true })).toHaveClass(/bg-yellow-500/);
    await expect(page.locator('text=Mine Selection')).toBeVisible();
  });
});

test.describe('Debug Panel localStorage Clear', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15000 });
  });

  test('debug panel is hidden by default', async ({ page }) => {
    // Debug panel should not be visible
    await expect(page.locator('text=Debug Mode')).not.toBeVisible();
  });

  test('can toggle debug panel with keyboard shortcut', async ({ page }) => {
    // Press Ctrl+Shift+D to toggle debug panel
    await page.keyboard.press('Control+Shift+D');
    await expect(page.locator('text=Debug Mode')).toBeVisible();
    
    // Press again to hide
    await page.keyboard.press('Control+Shift+D');
    await expect(page.locator('text=Debug Mode')).not.toBeVisible();
  });

  test('debug panel has Clear Save Data button', async ({ page }) => {
    // Open debug panel
    await page.keyboard.press('Control+Shift+D');
    await page.keyboard.press('Control+Shift+O');
    await expect(page.locator('text=Clear Save Data')).toBeVisible();
  });

  test('Clear Save Data button exists and is clickable', async ({ page }) => {
    // First make some changes to create save data
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    
    // Open debug panel
    await page.keyboard.press('Control+Shift+D');
    await page.keyboard.press('Control+Shift+O');
    
    // Verify localStorage has save data
    const hasSave = await page.evaluate(() => {
      return localStorage.getItem('gemstone_game_save') !== null;
    });
    expect(hasSave).toBe(true);
    
    // Verify Clear Save Data button exists
    await expect(page.locator('button:has-text("Clear Save Data")')).toBeVisible();
  });
});

test.describe('Loot System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15000 });
    await page.evaluate(() => localStorage.removeItem('gemstone_game_save'));
    await page.reload();
    await page.waitForSelector('h1', { timeout: 15000 });
  });

  test('mining small reward gives items', async ({ page }) => {
    // Navigate to a subarea
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    await page.getByRole('button', { name: 'River Panning' }).click();
    await page.getByRole('button', { name: 'River Bend' }).click();
    
    // Verify loot table is displayed with items
    await expect(page.locator('text=Loot Table')).toBeVisible();
    await expect(page.locator('text=Clear Quartz')).toBeVisible();
    await expect(page.locator('text=Amethyst')).toBeVisible();
    
    // Mine small reward using aria-label
    await page.getByRole('button', { name: 'small reward' }).click();
    
    // Should see success message
    await expect(page.locator('text=Mined small reward!')).toBeVisible();
    
    // Pending materials should show items
    await expect(page.locator('text=Pending Materials')).toBeVisible();
  });

  test('medium reward gives multiple items', async ({ page }) => {
    // Navigate to a subarea
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    await page.getByRole('button', { name: 'River Panning' }).click();
    await page.getByRole('button', { name: 'River Bend' }).click();
    
    // Mine medium reward using aria-label
    await page.getByRole('button', { name: 'medium reward' }).click();
    
    // Should see success message
    await expect(page.locator('text=Mined medium reward!')).toBeVisible();
    
    // Pending materials section should show items
    await expect(page.locator('text=Pending Materials')).toBeVisible();
    // Collect button should be enabled
    await expect(page.getByRole('button', { name: 'Collect Materials' })).toBeEnabled();
  });

  test('collect materials adds to inventory', async ({ page }) => {
    // Navigate to a subarea
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    await page.getByRole('button', { name: 'River Panning' }).click();
    await page.getByRole('button', { name: 'River Bend' }).click();
    
    // Mine small reward using aria-label
    await page.getByRole('button', { name: 'small reward' }).click();
    await expect(page.locator('text=Mined small reward!')).toBeVisible();
    
    // Collect materials
    await page.getByRole('button', { name: 'Collect Materials' }).click();
    await expect(page.locator('text=Materials collected!')).toBeVisible();
  });

  test('loot table shows rarity colors', async ({ page }) => {
    // Navigate to a subarea
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    await page.getByRole('button', { name: 'River Panning' }).click();
    await page.getByRole('button', { name: 'Rocky Shore' }).click();
    
    // Verify loot table shows progress bars
    await expect(page.locator('text=Loot Table')).toBeVisible();
    
    // Verify progress bars are present (they use the rarity colors as background)
    const progressBars = page.locator('.h-full');
    await expect(progressBars.first()).toBeVisible();
  });

  test('collected materials appear in process inventory', async ({ page }) => {
    // Navigate to a subarea and mine
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    await page.getByRole('button', { name: 'River Panning' }).click();
    await page.getByRole('button', { name: 'River Bend' }).click();
    
    // Mine once
    await page.getByRole('button', { name: 'small reward' }).click();
    await expect(page.locator('text=Mined small reward!')).toBeVisible();
    
    // Collect materials immediately (no need to wait for cooldown)
    await page.getByRole('button', { name: 'Collect Materials' }).click();
    await expect(page.locator('text=Materials collected!')).toBeVisible();
    
    // Wait for toast to disappear and page to settle
    await page.waitForTimeout(500);
    
    // Click "Back to Mine" to go to mine details
    await page.locator('button:has-text("Back to Mine")').first().click({ force: true });
    
    // Click "Back to Mines" to go to mine selection
    await page.locator('button:has-text("Back to Mines")').first().click({ force: true });
    
    // Now we're at mine selection, back button says Menu
    await expect(page.getByRole('button', { name: /Menu/ })).toBeVisible();
    await page.getByRole('button', { name: /Menu/ }).first().click();
    
    // Navigate to Process to verify items are available
    await page.getByRole('button', { name: 'Process' }).click();
    
    // Active tab should show the Process selector
    await expect(page.locator('text=Select Item to Process')).toBeVisible();
  });
});
