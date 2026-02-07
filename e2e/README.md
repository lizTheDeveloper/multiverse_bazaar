# End-to-End Tests

Playwright tests for the web application.

## Commands

```bash
npm run test:e2e          # Run all e2e tests
npm run test:e2e:ui       # Run with Playwright UI
npm run test:e2e:headed   # Run with visible browser
```

## Configuration

Tests configured in `playwright.config.ts`:
- Runs against `http://localhost:5173` (web) and `http://localhost:3000` (API)
- Auto-starts both servers before tests
- Uses Chromium by default

## Test Files

| File | Coverage |
|------|----------|
| `app.spec.ts` | Basic app loading |
| `navigation.spec.ts` | Page navigation |
| `auth-flows.spec.ts` | Login, logout, protected routes |
| `projects.spec.ts` | Project CRUD flows |
| `ideas.spec.ts` | Idea creation and interest |
| `search.spec.ts` | Search functionality |
| `user-profile.spec.ts` | Profile viewing/editing |
| `user-journeys.spec.ts` | Complete user flows |
| `api-integration.spec.ts` | API response handling |

## Fixtures (fixtures/)

Test helpers:
- `auth.fixture.ts` - `authenticateUser()`, `clearAuth()`
- `api.fixture.ts` - API mocking helpers

## Writing Tests

```typescript
import { test, expect } from '@playwright/test';
import { authenticateUser } from './fixtures/auth.fixture';

test.describe('Feature', () => {
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/projects');

    // Interact
    await page.getByRole('button', { name: /create/i }).click();

    // Assert
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('requires auth', async ({ page }) => {
    await page.goto('/');
    await authenticateUser(page);

    await page.goto('/projects/new');
    await expect(page.getByLabel(/title/i)).toBeVisible();
  });
});
```

## Selectors

Prefer accessible selectors:
- `page.getByRole('button', { name: /submit/i })`
- `page.getByLabel(/email/i)`
- `page.getByPlaceholder(/search/i)`
- `page.getByText(/welcome/i)`

Fallback to test IDs:
- `page.locator('[data-testid="project-card"]')`

## CI Integration

Tests run in CI with:
- Headless Chromium
- 2 retries on failure
- HTML report generation
