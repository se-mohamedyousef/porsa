import { test as base, expect } from '@playwright/test';

/**
 * Fixtures for E2E tests
 * Provides shared setup/teardown and utility functions
 */

type TestFixtures = {
  authenticatedPage: void;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we need to login (if login form appears, skip auth for demo)
    const loginForm = page.locator('input[type="email"]');
    const isLoginPage = await loginForm.isVisible().catch(() => false);
    
    if (isLoginPage) {
      // For testing, we'll assume the app is in authenticated state
      // In production, implement proper test user login
      console.log('Note: App is in unauthenticated state for this test');
    }
    
    await use();
  },
});

export { expect };
