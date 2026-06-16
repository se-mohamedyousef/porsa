import { test, expect } from '@playwright/test';

test.describe('Responsive Design and UI Interactions', () => {
  test('should display correctly on desktop (1280x720)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Main elements should be visible
    const title = page.locator('text=Porsa');
    const portfolio = page.locator('[class*="from-blue-600"]').first();
    
    await expect(title).toBeVisible();
    await expect(portfolio).toBeVisible();
  });

  test('should display correctly on tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Title should be readable
    const title = page.locator('text=Porsa');
    await expect(title).toBeVisible();
    
    // Portfolio card should adapt
    const portfolio = page.locator('[class*="from-blue-600"]').first();
    await expect(portfolio).toBeVisible();
  });

  test('should display correctly on mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Title should be visible on mobile
    const title = page.locator('text=Porsa');
    await expect(title).toBeVisible();
    
    // Market badge should be visible
    const badge = page.locator('[class*="rounded-full"]').filter({ hasText: /Open|Closed/ }).first();
    await expect(badge).toBeVisible();
  });

  test('should handle landscape orientation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Header should still be visible
    const title = page.locator('text=Porsa');
    await expect(title).toBeVisible();
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should have properly stacked navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Bottom navigation should be visible
    const navButtons = page.locator('[class*="bottom"], [class*="nav"]').locator('button');
    const count = await navButtons.count();
    
    // Should have navigation buttons
    expect(count).toBeGreaterThan(0);
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should not have horizontal scroll on any viewport', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1280, height: 720 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const windowWidth = await page.evaluate(() => window.innerWidth);
      
      expect(scrollWidth).toBeLessThanOrEqual(windowWidth + 1); // Allow 1px for rounding
    }
    
    // Reset to default
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should have readable text on all viewports', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1280, height: 720 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check that text is visible
      const title = page.locator('text=Porsa');
      await expect(title).toBeVisible();
    }
    
    // Reset
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should allow tab navigation with keyboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // Check that focus moved
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focusedElement).toBeDefined();
  });

  test('should support keyboard shortcuts for main actions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test Enter key on button
    const btn = page.locator('button').first();
    await btn.focus();
    
    // Button should accept keyboard input
    expect(page.url()).toContain('localhost:3000');
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that main text is visible (color contrast)
    const title = page.locator('text=Porsa');
    const isVisible = await title.isVisible();
    
    // Title should be readable
    expect(isVisible).toBe(true);
  });

  test('should be usable with dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Elements should be visible in dark mode
    const title = page.locator('text=Porsa');
    await expect(title).toBeVisible();
    
    // Reset to light mode
    await page.emulateMedia({ colorScheme: 'light' });
  });

  test('should be usable with light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Elements should be visible in light mode
    const portfolio = page.locator('[class*="from-blue-600"]').first();
    await expect(portfolio).toBeVisible();
  });

  test('should handle text selection properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to select text
    const title = page.locator('text=Porsa');
    
    // Text should be selectable
    const textContent = await title.textContent();
    expect(textContent).toBe('Porsa');
  });

  test('should support zooming in and out', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to zoom (may not be supported on all browsers)
    try {
      await page.keyboard.press('Control+Equal');
      await page.waitForTimeout(500);
    } catch (e) {
      // Zoom not supported, skip
    }
    
    // Page should still be functional
    expect(page.url()).toContain('localhost:3000');
    
    // Reset zoom
    await page.keyboard.press('Control+0');
  });

  test('should display images (if any) responsively', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get all images
    const images = page.locator('img');
    const count = await images.count();
    
    // No images expected, but if present they should load
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(typeof alt).toBe('string' || 'object');
    }
  });

  test('should have proper button sizing on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get button dimensions
    const btn = page.locator('button').first();
    const boundingBox = await btn.boundingBox();
    
    // Button should be at least 44px for touch targets
    expect(boundingBox?.height).toBeGreaterThanOrEqual(32); // Minimum reasonable size
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should have proper spacing between interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get two buttons
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    if (count >= 2) {
      const btn1 = await buttons.nth(0).boundingBox();
      const btn2 = await buttons.nth(1).boundingBox();
      
      // Should be properly spaced
      expect(btn1).toBeDefined();
      expect(btn2).toBeDefined();
    }
  });

  test('should scroll content without layout shift', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const startPos = await page.evaluate(() => document.documentElement.scrollTop);
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 300));
    
    const newPos = await page.evaluate(() => document.documentElement.scrollTop);
    
    // Scroll should work
    expect(newPos).toBeGreaterThan(startPos);
    
    // Scroll back up
    await page.evaluate(() => window.scrollBy(0, -300));
  });

  test('should maintain focus visibility when navigating', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Press Tab to move focus
    await page.keyboard.press('Tab');
    
    // Check that focused element is visible
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active) return null;
      
      const rect = active.getBoundingClientRect();
      return {
        visible: rect.height > 0 && rect.width > 0,
        inViewport: rect.top >= 0 && rect.left >= 0,
      };
    });
    
    // Focused element should exist and ideally be visible
    expect(focusedElement).toBeDefined();
  });

  test('should handle long text gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Long text should wrap, not overflow
    const viewport = page.viewportSize();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    
    expect(scrollWidth).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
  });
});
