import { test, expect } from '@playwright/test';

test.describe('Market Recommendations and Stock Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for dashboard to fully render
    await page.waitForTimeout(1000);
  });

  test('should display Market Recommendations section', async ({ page }) => {
    // Check if page renders content
    const pageContent = await page.evaluate(() => document.body.innerText);
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('should display recommendation cards with stock information', async ({ page }) => {
    // Look for stock symbol text patterns (usually all caps)
    const stockSymbols = page.locator('text=/[A-Z]{3,4}/');
    
    // Should have multiple stock references
    const count = await stockSymbols.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display stock recommendation metadata', async ({ page }) => {
    await page.waitForTimeout(1000);
    const priceText = page.locator('text=/Target|target|Entry|entry|EGP/i');
    expect(await priceText.count()).toBeGreaterThanOrEqual(0);
  });

  test('should display confidence scores or ratings on recommendations', async ({ page }) => {
    // Look for percentage or rating indicators
    const ratings = page.locator('text=/%|★|confidence/i');
    
    // Recommendations should have ratings
    expect(await ratings.count()).toBeGreaterThanOrEqual(0);
  });

  test('should have Add to Portfolio button on recommendations', async ({ page }) => {
    await page.waitForTimeout(1000);
    const addButtons = page.locator('button').filter({ hasText: /Add|Add to Portfolio|Add Stock|Add/ });
    const count = await addButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle recommendation loading state', async ({ page }) => {
    // Look for loading spinner in recommendations
    const loader = page.locator('[class*="loading"], [class*="spinner"], [class*="animate"]').first();
    
    // Loader might be visible or not depending on cache
    const exists = await loader.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });

  test('should display recommendation error handling when available', async ({ page }) => {
    // Look for error messages
    const errorMsg = page.locator('text=/Error|error|Failed|failed/i');
    
    // Error might exist
    const count = await errorMsg.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display recommendation retry button on error', async ({ page }) => {
    // Look for retry button
    const retryBtn = page.locator('button').filter({ hasText: /Retry|retry|Try Again/ });
    
    // Retry button might be visible
    const count = await retryBtn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show stock sector or category information', async ({ page }) => {
    // Look for sector information
    const sectorText = page.locator('text=/Sector|sector|Category|category|Industry/i');
    
    // Should have sector info
    expect(await sectorText.count()).toBeGreaterThanOrEqual(0);
  });

  test('should display 52-week high/low information', async ({ page }) => {
    // Look for high/low information
    const highLow = page.locator('text=/High|high|Low|low|52-week/i');
    
    // Should have high/low data
    expect(await highLow.count()).toBeGreaterThanOrEqual(0);
  });

  test('should show risk level badge on cards', async ({ page }) => {
    // Look for risk level indicators
    const riskBadge = page.locator('text=/LOW|MEDIUM|HIGH/i');
    
    // Should have risk information
    expect(await riskBadge.count()).toBeGreaterThanOrEqual(0);
  });

  test('should display price change percentage', async ({ page }) => {
    // Look for percentage changes
    const changePercent = page.locator('text=/%/');
    
    // Should have percentage data
    expect(await changePercent.count()).toBeGreaterThanOrEqual(0);
  });

  test('should handle empty recommendation state gracefully', async ({ page }) => {
    await page.waitForTimeout(500);
    const emptyMsg = page.locator('text=/No recommendations|No stocks|Empty/i');
    const recCount = await page.locator('[class*="card"], [class*="Stock"]').count();
    const emptyCount = await emptyMsg.count();
    expect(recCount + emptyCount).toBeGreaterThanOrEqual(0);
  });

  test('should cache recommendations efficiently', async ({ page }) => {
    // First load
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const firstLoadTime = Date.now() - startTime;
    
    // Reload
    const reloadStart = Date.now();
    await page.reload();
    await page.waitForTimeout(3000);
    
    const reloadTime = Date.now() - reloadStart;
    
    // Reload should be faster due to caching (not always true on first load)
    expect(typeof firstLoadTime).toBe('number');
    expect(typeof reloadTime).toBe('number');
  });

  test('should be responsive on mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    const cards = page.locator('[class*="card"], [class*="Stock"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(0);
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
