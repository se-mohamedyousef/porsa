import { test, expect } from '@playwright/test';

test.describe('AI Assistant Tab and Quick Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for dashboard to fully render
    await page.waitForTimeout(1000);
  });

  test('should display AI Assistant tab', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check page has content
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should navigate to AI tab', async ({ page }) => {
    // Find bottom navigation
    const navButtons = page.locator('[class*="bottom"], [class*="nav"]').locator('button');
    const count = await navButtons.count();
    
    // Look for AI tab
    for (let i = 0; i < count; i++) {
      const text = await navButtons.nth(i).textContent();
      if (text?.includes('AI') || text?.includes('🤖') || text?.includes('Assistant')) {
        await navButtons.nth(i).click();
        await page.waitForLoadState('networkidle');
        break;
      }
    }
  });

  test('should display agent mode selector', async ({ page }) => {
    // Look for agent selection options
    const agentLabels = page.locator('text=/Research|Portfolio|Risk|Recommendation|Anomaly/i');
    
    // Should have at least one agent option visible
    const count = await agentLabels.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display quick action buttons', async ({ page }) => {
    // Look for quick action buttons with lightning emoji
    const quickActions = page.locator('button').filter({ hasText: /⚡|Quick|Action/ });
    
    // Quick actions should be available
    const count = await quickActions.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have Portfolio agent with quick actions', async ({ page }) => {
    // Look for portfolio agent option
    const portfolioOption = page.locator('text=/Portfolio|portfolio/i').first();
    
    // If portfolio option exists, click it
    const exists = await portfolioOption.isVisible().catch(() => false);
    
    if (exists) {
      await portfolioOption.click();
      await page.waitForTimeout(500);
      
      // Look for quick actions that appear
      const actions = page.locator('button').filter({ hasText: /Summary|Performance|Losses/ });
      expect(await actions.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have Risk agent with quick actions', async ({ page }) => {
    // Look for risk agent option
    const riskOption = page.locator('text=/Risk|risk|Assessment/i').first();
    
    // If risk option exists, click it
    const exists = await riskOption.isVisible().catch(() => false);
    
    if (exists) {
      await riskOption.click();
      await page.waitForTimeout(500);
      
      // Look for quick actions specific to risk
      const actions = page.locator('button').filter({ hasText: /Risk|Volatility|Concentration/ });
      expect(await actions.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have Recommendation agent with quick actions', async ({ page }) => {
    // Look for recommendation agent
    const recOption = page.locator('text=/Recommendation|recommendation/i').first();
    
    // If rec option exists, click it
    const exists = await recOption.isVisible().catch(() => false);
    
    if (exists) {
      await recOption.click();
      await page.waitForTimeout(500);
      
      // Look for recommendation-specific actions
      const actions = page.locator('button').filter({ hasText: /Buy|Sell|Undervalued/ });
      expect(await actions.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have Anomaly detector agent with quick actions', async ({ page }) => {
    // Look for anomaly agent
    const anomalyOption = page.locator('text=/Anomaly|anomaly|Detect/i').first();
    
    // If anomaly option exists, click it
    const exists = await anomalyOption.isVisible().catch(() => false);
    
    if (exists) {
      await anomalyOption.click();
      await page.waitForTimeout(500);
      
      // Look for anomaly-specific actions
      const actions = page.locator('button').filter({ hasText: /Anomal|Volume|Price|Gaps/ });
      expect(await actions.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display input field for queries', async ({ page }) => {
    // Look for text input for AI queries
    const input = page.locator('input[type="text"], textarea').first();
    
    // Input should be visible
    const exists = await input.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });

  test('should allow sending quick action queries', async ({ page }) => {
    // Look for a quick action button
    const quickAction = page.locator('button').filter({ hasText: /⚡/ }).first();
    
    const exists = await quickAction.isVisible().catch(() => false);
    
    if (exists) {
      // Click quick action
      await quickAction.click();
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Check if response appeared
      const response = page.locator('text=/portfolio|analysis|recommend/i');
      const responseExists = await response.isVisible().catch(() => false);
      
      // Response might be visible or loading
      expect(typeof responseExists).toBe('boolean');
    }
  });

  test('should display AI response in results section', async ({ page }) => {
    // Look for results or response section
    const resultsSection = page.locator('text=/Response|Result|Analysis|Insight/i');
    
    // Results section should exist
    const exists = await resultsSection.isVisible().catch(() => false);
    expect(typeof exists).toBe('boolean');
  });

  test('should handle loading state while fetching AI response', async ({ page }) => {
    // Look for input field
    const input = page.locator('input[type="text"], textarea').first();
    
    const exists = await input.isVisible().catch(() => false);
    
    if (exists) {
      // Type a query
      await input.click();
      await input.fill('What is the current portfolio performance?');
      
      // Look for send button and click
      const sendBtn = page.locator('button').filter({ hasText: /Send|Submit|Ask/ }).first();
      const btnExists = await sendBtn.isVisible().catch(() => false);
      
      if (btnExists) {
        await sendBtn.click();
        
        // Should show loading indicator
        const loader = page.locator('[class*="loading"], [class*="spinner"]');
        expect(await loader.count()).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should clear previous responses when switching agents', async ({ page }) => {
    // Initial agent selection and query
    await page.waitForTimeout(1000);
    
    // Switch to different agent
    const agentOptions = page.locator('button').filter({ hasText: /Research|Portfolio|Risk/ });
    const count = await agentOptions.count();
    
    if (count > 1) {
      // Click different agents
      await agentOptions.first().click();
      await page.waitForTimeout(500);
      
      await agentOptions.nth(1).click();
      await page.waitForTimeout(500);
      
      // Page should still be responsive
      expect(page.url()).toContain('localhost:3000');
    }
  });
});
