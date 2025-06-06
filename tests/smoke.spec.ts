import { test, expect } from '@playwright/test';

test('page loads without console errors', async ({ page }) => {
  // Create a promise that will reject if console.error is called
  const errorPromise = new Promise<void>((resolve, reject) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        reject(new Error(`Console error: ${msg.text()}`));
      }
    });
    
    // Resolve after page load if no errors
    page.on('load', () => {
      setTimeout(resolve, 1000); // Wait a bit after load to catch any async errors
    });
  });

  // Navigate to the page
  await page.goto('http://localhost:4173');
  
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Wait for the error promise to either resolve or reject
  await errorPromise;
  
  // If we get here, no console errors were detected
  expect(true).toBeTruthy();
});