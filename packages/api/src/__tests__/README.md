# Integration Tests

This directory contains integration tests for the Multiverse Bazaar API.

## Overview

The integration tests verify that the API works correctly end-to-end, including:

- Authentication flows (login, logout, token refresh)
- Project CRUD operations
- Upvoting functionality
- Idea management and interest tracking
- Collaborator invitations and management
- Search functionality
- Notifications and push tokens

## Test Files

- `setup.ts` - Test environment setup, database utilities, and helper functions
- `auth.test.ts` - Authentication endpoint tests
- `projects.test.ts` - Project CRUD and permissions tests
- `upvotes.test.ts` - Project upvoting tests
- `ideas.test.ts` - Idea creation, interest, and graduation tests
- `collaborators.test.ts` - Collaborator invitation and management tests
- `search.test.ts` - Search functionality tests
- `notifications.test.ts` - Notification listing and push token tests

## Running Tests

### Prerequisites

1. Ensure you have a test database configured in your `.env` file:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/multiverse_bazaar_test"
   ```

2. Run database migrations:
   ```bash
   npm run db:migrate
   ```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Specific Test File

```bash
npm test -- auth.test.ts
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests Matching a Pattern

```bash
npm test -- -t "should login successfully"
```

## Test Structure

Each test file follows this pattern:

1. **Setup** - Uses `beforeEach` to clean the database and ensure a fresh state
2. **Test Cases** - Uses `describe` blocks to group related tests
3. **Assertions** - Uses `expect` to verify expected behavior

## Helper Functions

The `setup.ts` file provides several helper functions:

- `getTestApp()` - Returns the configured Hono app instance
- `getTestDb()` - Returns the Prisma database client
- `getTestToken(email?)` - Creates a user and returns an auth token
- `createTestUser(email?, name?)` - Creates a test user in the database
- `createTestProject(userId, data?)` - Creates a test project
- `createTestIdea(userId, data?)` - Creates a test idea
- `cleanDatabase()` - Truncates all tables (runs before each test)

## Writing New Tests

When adding new tests:

1. Import necessary utilities from `setup.ts`
2. Use `describe` blocks to group related tests
3. Use `it` blocks for individual test cases
4. Clean up any created resources (handled automatically by `beforeEach`)
5. Test both success and error cases
6. Verify response status codes and body structure

Example:

```typescript
import { describe, it, expect } from 'vitest';
import { getTestApp, getTestToken } from './setup.js';

describe('My Feature API', () => {
  describe('POST /api/v1/my-feature', () => {
    it('should create feature successfully', async () => {
      const app = getTestApp();
      const { token } = await getTestToken();

      const response = await app.request('/api/v1/my-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: 'Test Feature' }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('Test Feature');
    });

    it('should reject without authentication', async () => {
      const app = getTestApp();

      const response = await app.request('/api/v1/my-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Feature' }),
      });

      expect(response.status).toBe(401);
    });
  });
});
```

## Best Practices

1. **Isolation** - Each test should be independent and not rely on other tests
2. **Clean State** - Database is cleaned before each test via `beforeEach`
3. **Descriptive Names** - Test names should clearly describe what they verify
4. **Both Paths** - Test both success and error cases
5. **Real Data** - Use realistic test data that matches production patterns
6. **Async/Await** - Always use async/await for asynchronous operations
7. **Type Safety** - Leverage TypeScript for type checking in tests

## Troubleshooting

### Tests Fail Due to Database Connection

- Ensure your test database is running
- Verify `DATABASE_URL` in `.env` is correct
- Run `npm run db:migrate` to apply migrations

### Tests Timeout

- Increase timeout in `vitest.config.ts` if needed
- Check for async operations without `await`
- Ensure test database is performant

### Random Test Failures

- Check for race conditions in concurrent operations
- Verify database cleanup is working correctly
- Look for tests that depend on execution order

### Cannot Find Module Errors

- Ensure all imports use `.js` extension for ESM compatibility
- Run `npm install` to install dependencies
- Check TypeScript compilation with `npm run type-check`

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run integration tests
  run: |
    npm install
    npm run db:migrate
    npm test
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## Coverage Goals

While we don't aim for 100% coverage, integration tests should cover:

- All critical user flows
- Permission/authorization checks
- Input validation
- Error handling
- Edge cases for business logic

Current test coverage can be viewed by running:

```bash
npm run test:coverage
```
