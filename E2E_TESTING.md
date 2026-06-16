# E2E Testing Suite for Porsa

Comprehensive end-to-end tests for the Egyptian stock market AI assistant application using Playwright.

## Overview

This test suite covers all major features including:
- ✅ Portfolio Management
- ✅ Market Recommendations & Stock Cards
- ✅ Alert System with Trigger Detection
- ✅ AI Assistant with Quick Actions
- ✅ Market Hours Awareness
- ✅ Performance & Batch Operations
- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Error Handling & Edge Cases
- ✅ UI Interactions & Accessibility

## Test Structure

```
e2e/
├── fixtures.ts                 # Shared test utilities and setup
├── home-tab.spec.ts            # Home tab UI and market status badge tests
├── alerts.spec.ts              # Alert system and trigger detection tests
├── ai-assistant.spec.ts        # AI tab, agents, and quick actions tests
├── recommendations.spec.ts     # Stock cards and recommendations tests
├── portfolio.spec.ts           # Portfolio management and stock operations tests
├── performance.spec.ts         # Performance, caching, and batch operations tests
├── error-handling.spec.ts      # Error scenarios and edge cases tests
└── responsive.spec.ts          # Responsive design and UI interactions tests
```

## Test Categories

### 1. **Home Tab Tests** (`home-tab.spec.ts`)
Tests the main portfolio view and market awareness features:
- Market status badge (Open/Closed indicator)
- Portfolio summary display
- Header and navigation
- Responsive layout on mobile/tablet/desktop
- Portfolio data loading

### 2. **Alert System Tests** (`alerts.spec.ts`)
Tests price alert functionality:
- Alert tab navigation
- Triggered alerts display
- Active alerts section
- Alert creation and deletion
- Alert persistence across sessions
- Real-time price comparison

### 3. **AI Assistant Tests** (`ai-assistant.spec.ts`)
Tests AI agent features and quick actions:
- Agent mode selection
- Quick action buttons (with ⚡ emoji)
- Agent-specific shortcuts:
  - Portfolio: Summary, Performance, Losses
  - Risk: Risk Assessment, Volatility, Concentration
  - Recommendations: Buy Signals, Sell Signals, Undervalued
  - Anomaly: Market Anomalies, Volume Spikes, Price Gaps
- Query input and submission
- Response display
- Loading states

### 4. **Recommendations Tests** (`recommendations.spec.ts`)
Tests stock cards and market recommendations:
- Market Recommendations section display
- Stock card information (symbol, name, price)
- Confidence scores and ratings
- Risk level badges (LOW/MEDIUM/HIGH)
- Entry/target prices
- 52-week high/low data
- Add to Portfolio button
- Error handling and retry
- Empty state handling
- Caching performance

### 5. **Portfolio Tests** (`portfolio.spec.ts`)
Tests portfolio management features:
- Portfolio summary card
- Total value and profit/loss calculation
- Investment type filters (All, Long-term, Short-term)
- Stock list display
- Price updates and refresh button
- Asset allocation pie chart
- Stock details view
- Responsive layout

### 6. **Performance Tests** (`performance.spec.ts`)
Tests performance and optimization features:
- Initial page load time (<5s)
- Portfolio refresh time (<10s)
- Batch price fetching
- Recommendation caching
- Memoization effectiveness
- Tab switching responsiveness
- API call efficiency
- Memory management
- No excessive refresh calls during market closed hours

### 7. **Error Handling Tests** (`error-handling.spec.ts`)
Tests error scenarios and graceful degradation:
- Failed refresh error toast
- Missing data handling
- Recommendation fetch errors with retry
- Null/undefined field handling
- AI response timeouts with fallback messages
- Empty alert lists
- Invalid input validation
- Network disconnection recovery
- XSS prevention (no script tags)
- Rapid request handling

### 8. **Responsive Design Tests** (`responsive.spec.ts`)
Tests UI across different viewports and accessibility:
- Desktop (1280x720)
- Tablet (768x1024)
- Mobile Portrait (375x667)
- Mobile Landscape (667x375)
- No horizontal scroll on any viewport
- Readable text on all sizes
- Keyboard navigation (Tab key)
- Keyboard shortcuts
- Color contrast
- Dark mode support
- Light mode support
- Button sizing (44px touch targets)
- Focus visibility
- Text selection

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm run test:e2e
```

### Run Tests in UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

Launches interactive UI where you can:
- See all tests and their status
- Run individual tests
- Debug specific tests
- View test timeline and network requests

### Run Tests in Debug Mode
```bash
npm run test:e2e:debug
```

Step through tests line-by-line with Playwright Inspector.

### Run Tests with Browser Visible
```bash
npm run test:e2e:headed
```

All browsers will run with visible windows for observation.

### View Test Report
```bash
npm run test:e2e:report
```

Opens HTML report of latest test run with:
- Test summary and pass/fail status
- Screenshots on failure
- Video recordings on failure
- Trace viewer for debugging

## Test Configuration

**Playwright Config** (`playwright.config.ts`):
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Base URL**: `http://localhost:3000`
- **Timeout**: 30s per test
- **Retries**: 0 (local), 2 (CI)
- **Workers**: Parallel (auto) or single (CI)
- **Artifacts**: Screenshots and videos on failure

## Running Specific Tests

```bash
# Run a single test file
npx playwright test e2e/home-tab.spec.ts

# Run tests matching a pattern
npx playwright test --grep "market status"

# Run tests in a specific project (browser)
npx playwright test --project=chromium

# Run with specific timeout
npx playwright test --timeout=60000
```

## Key Test Assertions

All tests verify critical behaviors:

### Functional Tests
- ✅ Elements are visible and interactive
- ✅ Navigation works between tabs
- ✅ Data loads and displays
- ✅ Actions complete successfully
- ✅ Errors are handled gracefully

### Performance Tests
- ✅ Page loads within acceptable time
- ✅ Batch operations complete quickly
- ✅ Caching reduces API calls
- ✅ No UI blocking during async operations

### Responsiveness Tests
- ✅ Layout adapts to all viewports
- ✅ Text is readable on all sizes
- ✅ Touch targets are appropriately sized
- ✅ No horizontal scroll
- ✅ Keyboard navigation works

### Accessibility Tests
- ✅ Focus is visible and navigable
- ✅ Color contrast is sufficient
- ✅ Dark/light modes are supported
- ✅ No layout shifts on interaction

## Debugging Failed Tests

### View Failure Details
```bash
npm run test:e2e:report
```

### Debug Specific Test
```bash
npx playwright test e2e/home-tab.spec.ts --debug --grep "market status"
```

### View Video of Failure
Videos are automatically saved in `test-results/` for failed tests.

### Check Screenshot
Screenshots are saved in `test-results/` showing the exact moment of failure.

### Review Trace
```bash
npx playwright show-trace test-results/.../trace.zip
```

## Continuous Integration

### GitHub Actions Setup
Add to `.github/workflows/test.yml`:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test:e2e
```

## Test Coverage

| Feature | Tests | Status |
|---------|-------|--------|
| Home Tab | 9 | ✅ |
| Alerts | 10 | ✅ |
| AI Assistant | 12 | ✅ |
| Recommendations | 13 | ✅ |
| Portfolio | 15 | ✅ |
| Performance | 14 | ✅ |
| Error Handling | 15 | ✅ |
| Responsive Design | 16 | ✅ |
| **Total** | **104** | **✅** |

## Best Practices

1. **Isolation**: Each test is independent and can run in any order
2. **Cleanup**: Tests clean up after themselves (localStorage, cookies)
3. **Waits**: Use explicit waits for elements, not hardcoded delays
4. **Selectors**: Use semantic selectors (text, role) over brittle ones (CSS classes)
5. **Assertions**: Verify visible state, not implementation details
6. **Performance**: Tests capture performance metrics for regression detection

## Extending Tests

### Add New Test
Create `e2e/feature.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    const element = page.locator('text=Something');
    await expect(element).toBeVisible();
  });
});
```

### Add Fixture
Edit `e2e/fixtures.ts` to add shared setup:

```typescript
const test = base.extend({
  myFixture: async ({}, use) => {
    // Setup
    const value = await setup();
    await use(value);
    // Cleanup
  },
});
```

## Troubleshooting

### Tests Timeout
- Increase timeout: `test.setTimeout(60000)`
- Check if element exists: `await element.isVisible().catch(() => false)`
- Add explicit waits: `await page.waitForLoadState('networkidle')`

### Element Not Found
- Use text selector: `page.locator('text=Label')`
- Use role selector: `page.locator('button[role="tab"]')`
- Check visibility: `await element.isVisible()`

### Flaky Tests
- Add explicit waits before assertions
- Use `waitFor()` with conditions
- Avoid hardcoded delays
- Check for animation completion

### Port Already in Use
```bash
# Kill existing process
lsof -ti :3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Inspector](https://playwright.dev/docs/inspector)
- [Test Generator](https://playwright.dev/docs/codegen)
- [Debugging Guide](https://playwright.dev/docs/debug)

## Contributing

When adding features to Porsa:

1. Write E2E tests for the feature
2. Run `npm run test:e2e` to verify
3. Check for performance regressions
4. Update this README if adding new test categories

## Contact

For test-related issues or improvements, please open an issue or PR with details about:
- Test name and file
- Expected behavior
- Actual behavior
- Environment (OS, browser, Node version)
