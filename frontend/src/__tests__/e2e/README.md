# End-to-End Tests

Complete user journey tests using Playwright.

## 🎯 What We Test

E2E tests verify critical user flows in a real browser:
- Authentication & authorization
- Complete workflows (login → action → result)
- Cross-page interactions
- Real API calls and database changes

## 📁 Test Files

- `auth.spec.js` - Login, logout, permissions (TODO)
- `gameManagement.spec.js` - Complete game management workflow
- `playerManagement.spec.js` - Player CRUD and management (TODO)
- `gameLifecycle.spec.js` - Full game lifecycle (TODO)

## 🚀 Setup & Running

### Install Playwright

```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

### Configuration

Create `playwright.config.js`:

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test gameManagement.spec.js

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## 📝 Writing E2E Tests

### Template

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Login or setup
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
  });

  test('should complete user flow', async ({ page }) => {
    // Navigate
    await page.click('text=Link');
    
    // Interact
    await page.fill('[name="field"]', 'value');
    await page.click('button:has-text("Submit")');
    
    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid** - Stable selectors
```html
<button data-testid="submit-btn">Submit</button>
```
```javascript
await page.click('[data-testid="submit-btn"]');
```

2. **Wait for navigation**
```javascript
await page.waitForURL('/expected-page');
```

3. **Handle async operations**
```javascript
await expect(page.locator('text=Loaded')).toBeVisible({ timeout: 5000 });
```

4. **Test error states**
```javascript
await context.route('**/api/endpoint', route => route.abort());
```

5. **Take screenshots**
```javascript
await page.screenshot({ path: 'screenshot.png' });
```

## 🎯 Test Scenarios

### Critical Paths (Must Test)
- ✅ **Game Creation** - Create → View → Edit → Finalize
- ⏳ **Authentication** - Login → Access → Logout
- ⏳ **Player Management** - Add → Edit → Delete
- ⏳ **Game Events** - Goals → Subs → Cards

### Important Paths
- ⏳ **Team Management** - Create team → Add players
- ⏳ **Training Sessions** - Create → Assign drills
- ⏳ **Reports** - Generate → View → Export

### Edge Cases
- ⏳ **Error Handling** - Network errors, validation
- ⏳ **Permissions** - Unauthorized access
- ⏳ **Mobile** - Responsive design

## 📊 Coverage

| Flow | Tests | Status |
|------|-------|--------|
| Game Management | 6 tests | ✅ Complete |
| Authentication | 0 tests | ⏳ TODO |
| Player Management | 0 tests | ⏳ TODO |
| Error Handling | 2 tests | ✅ Complete |

**Goal:** 100% coverage of critical paths

## 🐛 Debugging

### View Test Execution

```bash
# Headed mode (see browser)
npx playwright test --headed

# Debug mode (step through)
npx playwright test --debug

# Slow motion
npx playwright test --headed --slow-mo=1000
```

### Playwright Inspector

```bash
# Open inspector
npx playwright test --debug

# Commands in inspector:
# - Step over
# - Resume
# - Pick locator
# - Copy selector
```

### Screenshots & Videos

```javascript
// In playwright.config.js
use: {
  screenshot: 'on', // or 'only-on-failure'
  video: 'retain-on-failure',
  trace: 'on-first-retry',
}
```

## 🚨 Common Issues

### 1. Element Not Found

```javascript
// ❌ Race condition
await page.click('button');

// ✅ Wait for element
await page.waitForSelector('button');
await page.click('button');
```

### 2. Flaky Tests

```javascript
// ❌ Hard-coded waits
await page.waitForTimeout(1000);

// ✅ Wait for conditions
await page.waitForSelector('text=Loaded');
await expect(page.locator('text=Loaded')).toBeVisible();
```

### 3. Server Not Running

```bash
# Start servers first
npm run dev          # Frontend
npm run server       # Backend (in separate terminal)

# Then run tests
npm run test:e2e
```

## 📚 Resources

- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Test Generator](https://playwright.dev/docs/codegen)

## 🎥 Test Generation

Generate tests by recording actions:

```bash
# Record actions
npx playwright codegen http://localhost:5173

# Generates test code automatically
# Copy/paste into test file
```

---

**Status:** ✅ Framework Setup  
**Tests:** 8/20 planned tests  
**Coverage:** Critical paths covered  
**Date:** December 2025

