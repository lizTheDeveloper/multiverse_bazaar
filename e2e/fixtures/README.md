# E2E Test Fixtures

Reusable test utilities for Playwright tests.

## Files

| File | Purpose |
|------|---------|
| `auth.fixture.ts` | Authentication helpers |
| `api.fixture.ts` | API mocking and helpers |

## Auth Fixture (auth.fixture.ts)

### authenticateUser(page)

Logs in a test user by setting auth token in localStorage:

```typescript
import { authenticateUser } from './fixtures/auth.fixture';

test('authenticated action', async ({ page }) => {
  await page.goto('/');
  await authenticateUser(page);
  await page.reload();  // Apply auth state

  // Now authenticated
  await page.goto('/projects/new');
});
```

### clearAuth(page)

Removes auth state:

```typescript
import { clearAuth } from './fixtures/auth.fixture';

test('logout', async ({ page }) => {
  await authenticateUser(page);
  await clearAuth(page);
  await page.reload();

  // Now logged out
});
```

## API Fixture (api.fixture.ts)

Helpers for API interactions in tests.

## Usage Pattern

```typescript
test.describe('Protected Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await authenticateUser(page);
    await page.reload();
  });

  test('can access feature', async ({ page }) => {
    // Tests run as authenticated user
  });
});
```

## Notes

- `authenticateUser` creates a unique test user per call
- Auth state persists in localStorage
- Call `page.reload()` after auth changes to apply them
- Tests clean up automatically between runs
