import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForSelector('h1:has-text("Gemstone")', { timeout: 15000 });
  });

  test('should load the main menu', async ({ page }) => {
    // Verify main menu is displayed
    await expect(page.locator('h1:has-text("Gemstone")').first()).toBeVisible();
    await expect(page.locator('text=Build your gem empire')).toBeVisible();
    // Verify menu buttons are visible
    await expect(page.locator('button:has-text("Discover")')).toBeVisible();
    await expect(page.locator('button:has-text("Process")')).toBeVisible();
    await expect(page.locator('button:has-text("Craft")')).toBeVisible();
    await expect(page.locator('button:has-text("Sell")')).toBeVisible();
  });

  test('should navigate to Discover page', async ({ page }) => {
    // Click Discover button
    await page.locator('button:has-text("Discover")').click();
    
    // Verify we're on Discover page - should see Discover tabs (Idle/Panning)
    await expect(page.locator('button:has-text("Idle")').first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to Process page', async ({ page }) => {
    // Click Process button from menu
    await page.getByRole('button', { name: 'Process' }).click();
    
    // Verify we're on Process page - look for Process heading
    await expect(page.locator('h2:has-text("Process")')).toBeVisible({ timeout: 15000 });
    
    // Verify Active tab is selected by default
    await expect(page.getByRole('button', { name: /^Active/i })).toHaveClass(/bg-amber-500/, { timeout: 5000 });
  });

  test('should navigate to Craft page', async ({ page }) => {
    // Click Craft button
    await page.locator('button:has-text("Craft")').click();
    
    // Verify we're on Craft page
    await expect(page.getByRole('heading', { name: /craft/i })).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to Sell page', async ({ page }) => {
    // Click Sell button
    await page.locator('button:has-text("Sell")').click();
    
    // Verify we're on Sell page
    await expect(page.getByRole('heading', { name: /sell/i })).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to Gemdex page', async ({ page }) => {
    // Click Gemdex button
    await page.locator('button:has-text("Gemdex")').click();
    
    // Verify we're on Gemdex page - heading shows 📖 Gemdex
    await expect(page.locator('h2:has-text("Gemdex")')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to Inventory page', async ({ page }) => {
    // Click Inventory button
    await page.locator('button:has-text("Inventory")').click();
    
    // Verify we're on Inventory page - should see tabs
    await expect(page.locator('button:has-text("Gems")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Minerals")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Equipment")').first()).toBeVisible();
  });

  test('should navigate back to menu from Process', async ({ page }) => {
    // Go to Process
    await page.getByRole('button', { name: 'Process', exact: false }).click();
    
    // Wait for Process page to load
    await expect(page.locator('h2:has-text("Process")')).toBeVisible({ timeout: 15000 });
    
    // Click back button (Menu button)
    await page.getByRole('button', { name: 'Menu', exact: false }).click();
    
    // Verify we're back on main menu
    await expect(page.locator('text=Build your gem empire')).toBeVisible();
  });

  test('should navigate back to menu from Discover', async ({ page }) => {
    // Go to Discover
    await page.locator('button:has-text("Discover")').click();
    await expect(page.locator('button:has-text("Idle")').first()).toBeVisible();
    
    // Click back to menu - the header shows "Gemstone Collector"
    await expect(page.locator('h1:has-text("Gemstone Collector")')).toBeVisible();
  });
});

test.describe('Process Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1:has-text("Gemstone")', { timeout: 15000 });
  });

  test('should show Active and Idle tabs on Process page', async ({ page }) => {
    await page.getByRole('button', { name: 'Process' }).click();
    
    // Process page should be visible with tabs
    await expect(page.locator('h2:has-text("Process")')).toBeVisible({ timeout: 15000 });
    
    // Both tabs should be visible
    await expect(page.getByRole('button', { name: /^Active/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Idle Queue/i })).toBeVisible();
  });

  test('should switch between Active and Idle tabs', async ({ page }) => {
    await page.getByRole('button', { name: 'Process' }).click();
    await expect(page.locator('h2:has-text("Process")')).toBeVisible({ timeout: 15000 });
    
    // Active tab by default should show "Select Item to Process"
    await expect(page.getByText('Select Item to Process')).toBeVisible({ timeout: 15000 });
    
    // Click Idle tab
    await page.getByRole('button', { name: /Idle Queue/i }).click();
    
    // Should show queue interface
    await expect(page.getByText('Process Queue')).toBeVisible({ timeout: 15000 });
    // Empty state shows when no items in inventory or queue depending on state
    await expect(
      page.getByText('Add to Queue').or(page.getByText('No items in inventory'))
    ).toBeVisible({ timeout: 15000 });
    
    // Click Active tab
    await page.getByRole('button', { name: /^Active/i }).click();
    
    // Should show active processing interface (item selector)
    await expect(page.getByText('Select Item to Process')).toBeVisible({ timeout: 15000 });
  });
});
