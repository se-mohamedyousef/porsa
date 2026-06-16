# E2E Test Quick Start Guide

## Installation Complete ✅

Playwright E2E testing suite has been installed and configured for Porsa.

## Quick Commands

### 1. Run All Tests
```bash
npm run test:e2e
```
Runs all 104 tests across Chrome, Firefox, WebKit, and mobile browsers.

### 2. Interactive Testing (Recommended)
```bash
npm run test:e2e:ui
```
Opens UI mode where you can:
- See all tests with pass/fail status
- Run individual tests
- Watch tests execute
- Debug failures in real-time

### 3. Debug Specific Test
```bash
npm run test:e2e:debug
```
Step through tests line-by-line with Playwright Inspector.

### 4. Run with Visible Browser
```bash
npm run test:e2e:headed
```
See browser windows while tests run.

### 5. View Test Report
```bash
npm run test:e2e:report
```
Opens HTML report with:
- Test summary and statistics
- Screenshots of failures
- Video recordings on failure
- Trace viewer for debugging

## Test Files Created

| File | Tests | Purpose |
|------|-------|---------|
| home-tab.spec.ts | 9 | Market status badge, portfolio, header |
| alerts.spec.ts | 10 | Alert system, trigger detection |
| ai-assistant.spec.ts | 12 | AI agents, quick actions, responses |
| recommendations.spec.ts | 13 | Stock cards, recommendations, caching |
| portfolio.spec.ts | 15 | Portfolio management, stock operations |
| performance.spec.ts | 14 | Batch ops, caching, load times |
| error-handling.spec.ts | 15 | Error scenarios, edge cases |
| responsive.spec.ts | 16 | Mobile/tablet/desktop, accessibility |
| **TOTAL** | **104** | **Comprehensive feature coverage** |

## What's Being Tested

### ✅ Core Features
- Portfolio management (add, remove, update stocks)
- Market recommendations with stock cards
- Alert system with real-time trigger detection
- AI Assistant with 5 agent modes
- Quick action shortcuts (⚡ buttons)
- Market status badge (Open/Closed)
- Price refresh with batch API

### ✅ Performance
- Page load time <5s
- Portfolio refresh <10s
- Batch price fetching
- Recommendation caching (KV store)
- Memoization effectiveness
- No excessive API calls

### ✅ Responsiveness
- Mobile (375x667)
- Tablet (768x1024)
- Desktop (1280x720)
- Landscape orientation
- No horizontal scroll
- Touch-friendly buttons (44px+)
- Dark/Light mode support

### ✅ Error Handling
- Failed API calls with retry
- Timeout graceful degradation
- Network disconnection recovery
- Invalid input validation
- XSS prevention
- Empty state displays

## Running Tests in CI/CD

Add to your GitHub Actions workflow:

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Understanding Test Output

### Success Output
```
✓ home-tab.spec.ts (9 tests)
✓ alerts.spec.ts (10 tests)
✓ ai-assistant.spec.ts (12 tests)
...
104 passed in 2m 30s
```

### Failure Output
```
✗ home-tab.spec.ts > should display market status badge
  AssertionError: expected element to be visible
  
  test-results/home-tab-should-display-market-status-badge/
  ├── screenshot.png
  ├── video.webm
  └── trace.zip
```

## Debugging Tips

### 1. Visual Debugging
```bash
npm run test:e2e:headed
```
Watch browser while tests run.

### 2. Step-by-Step Debug
```bash
npm run test:e2e:debug
```
Use Playwright Inspector to step through code.

### 3. Check Artifacts
- Screenshots: `test-results/**/screenshot.png`
- Videos: `test-results/**/video.webm`
- Traces: `test-results/**/trace.zip`

### 4. View Report
```bash
npm run test:e2e:report
```

## Common Issues

### "Port 3000 already in use"
```bash
# Kill existing process
lsof -ti :3000 | xargs kill -9

# Or use different port
PORT=3001 npm run test:e2e
```

### "Tests timeout"
- Check dev server is running: `npm run dev`
- Increase timeout: Edit `playwright.config.ts`
- Check for missing elements: Use `isVisible()` with `.catch()`

### "Tests flaky"
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Use safer selectors: `page.locator('text=Label')` instead of CSS
- Avoid hardcoded delays

## Next Steps

1. **Run tests locally**: `npm run test:e2e:ui`
2. **Fix any failures**: Check `test-results/` for artifacts
3. **Integrate CI/CD**: Add to GitHub Actions
4. **Monitor performance**: Track load times in reports
5. **Expand coverage**: Add tests for new features

## Documentation

Full documentation available in: `E2E_TESTING.md`

For more Playwright info: https://playwright.dev/

---

**Status**: ✅ E2E testing suite ready to use
**Coverage**: 104 comprehensive tests
**Browsers**: Chrome, Firefox, Safari, Mobile
**Next**: Run `npm run test:e2e:ui` to start testing!
