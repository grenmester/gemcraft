import { test, expect } from '@playwright/test';

test.describe('Debug Process Navigation', () => {
  test('debug Process button click', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForSelector('text=Gemstone', { timeout: 15000 });
    
    // Take screenshot before click
    await page.screenshot({ path: 'debug-before-click.png' });
    
    // Get all buttons
    const buttons = await page.getByRole('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    // Check for Process button
    const processButton = page.getByRole('button', { name: 'Process' });
    const processButtonExists = await processButton.count();
    console.log(`Process button exists: ${processButtonExists}`);
    
    if (processButtonExists > 0) {
      // Try to click it
      await processButton.click();
      console.log('Clicked Process button');
      
      // Wait a moment
      await page.waitForTimeout(1000);
      
      // Take screenshot after click
      await page.screenshot({ path: 'debug-after-click.png' });
      
      // Check what's visible now
      const visibleText = await page.locator('body').textContent();
      console.log(`Visible text includes 'Process': ${visibleText.includes('Process')}`);
    }
  });
});
