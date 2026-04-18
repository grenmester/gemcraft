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
    await page.getByRole('button', { name: 'Discover', exact: true }).click();
    await expect(page.locator('h2:has-text("Discover")')).toBeVisible();
  });

  test('displays discover screen with tabs', async ({ page }) => {
    await expect(page.locator('h2:has-text("Discover")')).toBeVisible();
    // Use exact match for tab buttons
    await expect(page.getByRole('button', { name: 'Panning', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Idle', exact: true })).toBeVisible();
  });

  test('panning tab is default and highlighted', async ({ page }) => {
    const panningBtn = page.getByRole('button', { name: 'Panning', exact: true });
    await expect(panningBtn).toHaveClass(/bg-yellow-500/);
  });

  test('shows mine selection on panning tab', async ({ page }) => {
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    // Should see some mine cards
    await expect(page.getByRole('button', { name: 'River Panning' })).toBeVisible();
  });

  test('can click on mine to see details', async ({ page }) => {
    // Click on the first available mine (River Panning is unlocked)
    await page.getByRole('button', { name: 'River Panning' }).click();
    // Should see mine details with subareas
    await expect(page.locator('text=Subareas')).toBeVisible();
    await expect(page.locator('text=River Bend')).toBeVisible();
  });

  test('can click on subarea to see loot table', async ({ page }) => {
    await page.getByRole('button', { name: 'River Panning' }).click();
    await page.getByRole('button', { name: 'View Details' }).first().click();
    await expect(page.locator('text=Loot Table')).toBeVisible();
  });

  test('back button from subarea returns to mine details', async ({ page }) => {
    await page.getByRole('button', { name: 'River Panning' }).click();
    await page.getByRole('button', { name: 'View Details' }).first().click();
    
    // Click back to mine button
    await page.locator('button:has-text("Back to Mine")').first().click({ force: true });
    
    // Should be back at mine details showing subareas
    await expect(page.locator('text=Subareas')).toBeVisible();
    await expect(page.locator('text=River Bend')).toBeVisible();
  });

  test('back button from mine details returns to mine selection', async ({ page }) => {
    await page.getByRole('button', { name: 'River Panning' }).click();
    
    // Click back to mines button
    await page.locator('button:has-text("Back to Mines")').first().click({ force: true });
    
    // Should be back at mine selection
    await expect(page.locator('text=Mine Selection')).toBeVisible();
  });

  test('back button from mine selection returns to menu', async ({ page }) => {
    // Look for the back button with "Menu" text
    const backBtn = page.getByRole('button', { name: /Menu/ });
    await expect(backBtn).toBeVisible();
    
    await backBtn.first().click();
    
    // Should be back at main menu
    await expect(page.locator('h1:has-text("Gemstone")').nth(1)).toBeVisible();
    await expect(page.locator('text=Build your gem empire')).toBeVisible();
  });

  test('can mine and collect materials', async ({ page }) => {
    await page.getByRole('button', { name: 'River Panning' }).click();
    await page.getByRole('button', { name: 'View Details' }).first().click();
    
    // Mine using lowercase aria-label
    await page.getByRole('button', { name: 'small reward' }).click();
    
    // Check for success message
    await expect(page.locator('text=Mined small reward!')).toBeVisible();
    
    const collectBtn = page.getByRole('button', { name: 'Collect Materials' });
    await expect(collectBtn).toBeEnabled();
  });

  test('can switch to idle tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Idle', exact: true }).click();
    await expect(page.locator('text=Workers Overview')).toBeVisible();
  });

  test('idle tab shows empty state when no workers', async ({ page }) => {
    await page.getByRole('button', { name: 'Idle', exact: true }).click();
    await expect(page.locator('text=No workers hired yet')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hire Workers' })).toBeVisible();
  });

  test('idle tab shows workers stats when workers exist', async ({ page }) => {
    await page.getByRole('button', { name: 'Idle', exact: true }).click();
    await expect(page.locator('text=Total')).toBeVisible();
    await expect(page.locator('text=Next Generation')).toBeVisible();
  });

  test('complete navigation flow: menu -> mine selection -> mine details -> subarea -> back to menu', async ({ page }) => {
    // Start at Discover (after beforeEach)
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    
    // Click mine
    await page.getByRole('button', { name: 'River Panning' }).click();
    await expect(page.locator('text=Subareas')).toBeVisible();
    
    // Click subarea
    await page.getByRole('button', { name: 'View Details' }).first().click();
    await expect(page.locator('text=Loot Table')).toBeVisible();
    
    // Back to mine details
    await page.locator('button:has-text("Back to Mine")').first().click({ force: true });
    await expect(page.locator('text=Subareas')).toBeVisible();
    
    // Back to mine selection
    await page.locator('button:has-text("Back to Mines")').first().click({ force: true });
    await expect(page.locator('text=Mine Selection')).toBeVisible();
    
    // Back to menu - click Menu button in the header
    await page.locator('button:has-text("Menu")').first().click();
    
    // Verify we're back at menu
    await page.waitForSelector('h1:has-text("Gemstone")', { timeout: 5000 });
  });
});
