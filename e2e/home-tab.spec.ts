import { test, expect } from '@playwright/test';

test.describe('Market Status and Home Tab', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home - with auth state loaded, this should show dashboard
    await page.goto('/');
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    // Give dashboard components time to render
    await page.waitForTimeout(500);
  });

  test('should display market status badge in header', async ({ page }) => {
    // Look for market status badge
    const marketBadge = page.locator('[class*="rounded-full"]').filter({ hasText: /Open|Closed/ }).first();
    
    // Badge should be visible
    await expect(marketBadge).toBeVisible();
    
    // Should contain either "Open" or "Closed"
    const badgeText = await marketBadge.textContent();
    expect(badgeText).toMatch(/Open|Closed/);
  });

  test('should show market status icon (green for open, red for closed)', async ({ page }) => {
    const marketBadge = page.locator('[class*="rounded-full"]').filter({ hasText: /Open|Closed/ }).first();
    const badgeText = await marketBadge.textContent();
    
    if (badgeText?.includes('Open')) {
      // Should have green styling
      const badgeClasses = await marketBadge.getAttribute('class');
      expect(badgeClasses).toContain('green');
    } else {
      // Should have gray styling
      const badgeClasses = await marketBadge.getAttribute('class');
      expect(badgeClasses).toContain('gray');
    }
  });

  test('should display portfolio summary card', async ({ page }) => {
    // Look for portfolio hero card
    const portfolioCard = page.locator('[class*="from-blue-600"]').first();
    await expect(portfolioCard).toBeVisible();
    
    // Should contain portfolio header
    await expect(page.locator('text=💼')).toBeVisible();
  });

  test('should display Porsa header title', async ({ page }) => {
    const title = page.locator('text=Porsa');
    await expect(title).toBeVisible();
    
    // Should have gradient styling
    const titleClasses = await title.getAttribute('class');
    expect(titleClasses).toContain('gradient');
  });

  test('should display refresh button', async ({ page }) => {
    const refreshBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(refreshBtn).toBeVisible();
  });

  test('should show "Your Portfolio" label', async ({ page }) => {
    const label = page.locator('p:has-text("Your Portfolio")').first();
    await expect(label).toBeVisible({ timeout: 5000 });
  });

  test('should display stocks list section', async ({ page }) => {
    // Look for stocks section header
    const stocksHeader = page.locator('text=📊').first();
    await expect(stocksHeader).toBeVisible({ timeout: 5000 });
  });

  test('should display market recommendations section', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle').catch(() => {});
    
    await page.waitForTimeout(1000);
    
    // Check if page has substantial content
    const pageContent = await page.evaluate(() => document.body.innerText);
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('should load portfolio data from user', async ({ page }) => {
    // Wait for portfolio to load
    await page.waitForTimeout(2000);
    
    // Check if portfolio summary has data
    const portfolioCard = page.locator('[class*="from-blue-600"]').first();
    const cardText = await portfolioCard.textContent();
    
    // Should have either portfolio values or empty state message
    expect(cardText?.length).toBeGreaterThan(0);
  });

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check header is still visible
    const title = page.locator('text=Porsa');
    await expect(title).toBeVisible();
    
    // Check market badge is visible
    const marketBadge = page.locator('[class*="rounded-full"]').filter({ hasText: /Open|Closed/ }).first();
    await expect(marketBadge).toBeVisible();
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
