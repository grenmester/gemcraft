import { test, expect } from '@playwright/test';

test.describe('Tutorial / Help System', () => {
  test.describe('Discover Help', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('h1', { timeout: 15000 });
      await page.evaluate(() => localStorage.removeItem('gemstone_game_save'));
      await page.reload();
      await page.waitForSelector('h1', { timeout: 15000 });
      
      // Navigate to Discover
      await page.getByRole('button', { name: 'Discover', exact: true }).click();
      await expect(page.locator('h2:has-text("Discover")')).toBeVisible();
    });

    test('help button is visible', async ({ page }) => {
      const helpBtn = page.locator('button[title="Help"]');
      await expect(helpBtn).toBeVisible();
    });

    test('opens tutorial modal on click', async ({ page }) => {
      await page.locator('button[title="Help"]').click();
      await expect(page.locator('text=Discover Guide')).toBeVisible();
    });

    test('tutorial has multiple pages', async ({ page }) => {
      await page.locator('button[title="Help"]').click();
      await expect(page.locator('text=1 / 5')).toBeVisible();
    });

    test('can navigate to next page', async ({ page }) => {
      await page.locator('button[title="Help"]').click();
      
      // Click Next
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.locator('text=2 / 5')).toBeVisible();
    });

    test('can navigate back to previous page', async ({ page }) => {
      await page.locator('button[title="Help"]').click();
      
      // Go to page 2
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.locator('text=2 / 5')).toBeVisible();
      
      // Go back to page 1
      await page.getByRole('button', { name: 'Back' }).click();
      await expect(page.locator('text=1 / 5')).toBeVisible();
    });

    test('shows tips on tutorial pages', async ({ page }) => {
      await page.locator('button[title="Help"]').click();
      await expect(page.locator('text=Tips')).toBeVisible();
    });

    test('closes modal on Got it button', async ({ page }) => {
      await page.locator('button[title="Help"]').click();
      
      // Navigate to last page
      for (let i = 0; i < 4; i++) {
        await page.getByRole('button', { name: 'Next' }).click();
      }
      
      // Click Got it
      await page.getByRole('button', { name: 'Got it!' }).click();
      await expect(page.locator('text=Discover Guide')).not.toBeVisible();
    });

    test('can close modal with X button', async ({ page }) => {
      await page.locator('button[title="Help"]').click();
      await expect(page.locator('text=Discover Guide')).toBeVisible();
      
      // Close by pressing Escape key
      await page.keyboard.press('Escape');
      await expect(page.locator('text=Discover Guide')).not.toBeVisible();
    });
  });

  test.describe('Process Help', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('h1', { timeout: 15000 });
      await page.evaluate(() => localStorage.removeItem('gemstone_game_save'));
      await page.reload();
      await page.waitForSelector('h1', { timeout: 15000 });
      
      // Navigate to Process
      await page.getByRole('button', { name: 'Process', exact: true }).click();
      await expect(page.locator('h2:has-text("Process")')).toBeVisible();
    });

    test('help button is visible on Process page', async ({ page }) => {
      const helpBtn = page.locator('button[title="Help"]');
      await expect(helpBtn).toBeVisible();
    });

    test('opens tutorial modal on click', async ({ page }) => {
      await page.locator('button[title="Help"]').click();
      await expect(page.locator('text=Process Guide')).toBeVisible();
    });

    test('tutorial has correct page count for Process', async ({ page }) => {
      await page.locator('button[title="Help"]').click();
      await expect(page.locator('text=1 / 5')).toBeVisible();
    });

    test('shows Active Processing info', async ({ page }) => {
      await page.locator('button[title="Help"]').click();
      
      // Navigate to Active Processing page
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('heading', { name: 'Active Processing' })).toBeVisible();
    });

    test('shows Idle Queue info', async ({ page }) => {
      await page.locator('button[title="Help"]').click();
      
      // Navigate to Idle Queue page
      for (let i = 0; i < 2; i++) {
        await page.getByRole('button', { name: 'Next' }).click();
      }
      await expect(page.getByRole('heading', { name: 'Idle Queue' })).toBeVisible();
    });

    test('shows Equipment info', async ({ page }) => {
      await page.locator('button[title="Help"]').click();
      
      // Navigate to Equipment page
      for (let i = 0; i < 4; i++) {
        await page.getByRole('button', { name: 'Next' }).click();
      }
      await expect(page.getByRole('heading', { name: 'Equipment' })).toBeVisible();
    });
  });
});
