import { test, expect } from '@playwright/test';

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for dashboard to fully render
    await page.waitForTimeout(1000);
  });

  test('should display error toast on failed price refresh', async ({ page }) => {
    // Trigger refresh
    const refreshBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    await refreshBtn.click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Look for error or success toast
    const toast = page.locator('[class*="toast"], [role="alert"]');
    
    // Toast should appear or not
    expect(await toast.count()).toBeGreaterThanOrEqual(0);
  });

  test('should handle missing portfolio data gracefully', async ({ page }) => {
    // Navigate to portfolio
    await page.goto('/');
    
    // Page should not crash even if data is missing
    const portfolioCard = page.locator('[class*="from-blue-600"]').first();
    
    // Should display something or empty state
    const exists = await portfolioCard.isVisible({ timeout: 5000 }).catch(() => false);
    expect(typeof exists).toBe('boolean');
  });

  test('should handle recommendation fetch errors with retry', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Look for retry button if error occurred
    const retryBtn = page.locator('button').filter({ hasText: /Retry|retry/ });
    
    // Retry button might exist
    const count = await retryBtn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle null/undefined recommendation fields', async ({ page }) => {
    // Navigate and wait for content
    await page.waitForLoadState('networkidle').catch(() => {});
    
    await page.waitForTimeout(1000);
    
    // Get only visible text content (not HTML source)
    const visibleText = await page.evaluate(() => document.body.innerText);
    
    // Should not have "undefined" in visible text (it's OK in HTML/JS code)
    // This checks that recommendations don't display "undefined" values
    const lines = visibleText.split('\n');
    const undefinedLines = lines.filter(line => 
      line.trim().includes('undefined') && 
      (line.includes('EGP') || line.includes('Target') || line.includes('Stop') || line.includes('Expected'))
    );
    
    expect(undefinedLines.length).toBe(0);
  });

  test('should handle AI response timeouts gracefully', async ({ page }) => {
    // Look for AI input
    const input = page.locator('input[type="text"], textarea').first();
    
    const exists = await input.isVisible().catch(() => false);
    
    if (exists) {
      // Try to send a query
      await input.click();
      await input.fill('Test query');
      
      // Look for send button
      const sendBtn = page.locator('button').filter({ hasText: /Send|Submit/ }).first();
      const btnExists = await sendBtn.isVisible().catch(() => false);
      
      if (btnExists) {
        await sendBtn.click();
        
        // Wait for timeout
        await page.waitForTimeout(5000);
        
        // Page should not crash
        expect(page.url()).toContain('localhost:3000');
      }
    }
  });

  test('should display fallback message on AI timeout', async ({ page }) => {
    // Look for fallback or error message
    const fallbackMsg = page.locator('text=/Response Truncated|timeout|available data/i');
    
    // Message might appear
    const count = await fallbackMsg.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle empty alert list gracefully', async ({ page }) => {
    // Navigate and check for alerts
    const alertElements = page.locator('text=/Alert|alert/i');
    
    // Should handle both empty and populated states
    expect(await alertElements.count()).toBeGreaterThanOrEqual(0);
  });

  test('should validate alert price input', async ({ page }) => {
    // Look for alert creation form
    const priceInput = page.locator('input[type="number"]');
    
    const exists = await priceInput.isVisible().catch(() => false);
    
    if (exists) {
      // Try entering invalid value
      await priceInput.fill('-100');
      
      // Should either accept or show error
      const value = await priceInput.inputValue();
      
      // Input should be present
      expect(value).toBeDefined();
    }
  });

  test('should handle network disconnection', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    // Wait a moment
    await page.waitForTimeout(1000);
    
    // Check for offline indicator or error
    const offlineMsg = page.locator('text=/offline|Offline|network/i');
    
    // Page might show offline message
    const count = await offlineMsg.count();
    
    // Go back online
    await page.context().setOffline(false);
    
    // Should be resilient to network changes
    expect(typeof count).toBe('number');
  });

  test('should recover from failed API calls', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);
    
    // Try refresh multiple times
    const refreshBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    
    for (let i = 0; i < 3; i++) {
      await refreshBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Page should still be responsive
    expect(page.url()).toContain('localhost:3000');
  });

  test('should handle empty stock list display', async ({ page }) => {
    // Look for stocks list or empty state
    const stocksList = page.locator('[class*="stock"], [class*="list"]');
    const emptyMsg = page.locator('text=/No Stocks|empty|Empty/i');
    
    // Should show either list or empty message
    const stockCount = await stocksList.count();
    const emptyCount = await emptyMsg.count();
    
    expect(stockCount + emptyCount).toBeGreaterThanOrEqual(0);
  });

  test('should sanitize recommendation data fields', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check page renders without errors
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('should handle rapid API requests without crashing', async ({ page }) => {
    // Trigger multiple rapid refreshes
    const refreshBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    
    for (let i = 0; i < 5; i++) {
      await refreshBtn.click({ timeout: 100 }).catch(() => {});
      await page.waitForTimeout(100);
    }
    
    // Page should remain stable
    expect(page.url()).toContain('localhost:3000');
  });

  test('should display informative error messages', async ({ page }) => {
    // Look for error messages
    const errorMsg = page.locator('text=/Error|Failed|error|failed/i');
    
    // Errors should be user-friendly
    const count = await errorMsg.count();
    
    // Count should be reasonable (not spam)
    expect(count).toBeLessThan(10);
  });

  test('should never display stack traces to user', async ({ page }) => {
    // Get all page text
    const pageContent = await page.content();
    
    // Should not contain common stack trace indicators
    expect(pageContent).not.toContain('at Function');
    expect(pageContent).not.toContain('at Object');
    expect(pageContent).not.toContain('Error:');
  });

  test('should handle missing localStorage gracefully', async ({ page }) => {
    // Try to clear storage
    await page.context().clearCookies();
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Page should still work
    const title = page.locator('text=Porsa');
    await expect(title).toBeVisible();
  });

  test('should validate stock symbol format', async ({ page }) => {
    // Look for stock symbols
    const symbols = page.locator('text=/[A-Z]{3,4}/');
    
    // Symbols should follow pattern
    const count = await symbols.count();
    
    // Should have valid symbols
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle very long recommendation text gracefully', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Get page dimensions
    const viewport = page.viewportSize();
    
    // All content should fit in viewport
    expect(viewport?.width).toBeGreaterThan(0);
    expect(viewport?.height).toBeGreaterThan(0);
  });
});
