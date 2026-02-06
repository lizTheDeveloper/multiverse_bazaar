# Search Module Integration Guide

This guide shows how to integrate the Search module into the Multiverse Bazaar API.

## Step 1: Register Dependencies in Container

Add the search repository and service to your dependency injection container:

```typescript
// In src/infra/container.ts or wherever you set up your container

import { PrismaClient } from '@prisma/client';
import { SearchRepository, SearchService } from './modules/search';

export function setupContainer(): Container {
  const container = createContainer();

  // ... existing registrations (config, logger, db, etc.)

  // Register SearchRepository
  container.register<SearchRepository>(
    'searchRepository',
    (c) => {
      const db = c.resolve<PrismaClient>('db');
      return new SearchRepository(db);
    },
    'singleton'
  );

  // Register SearchService
  container.register<SearchService>(
    'searchService',
    (c) => {
      const repository = c.resolve<SearchRepository>('searchRepository');
      const logger = c.resolve<Logger>('logger');
      return new SearchService(repository, logger);
    },
    'singleton'
  );

  return container;
}
```

## Step 2: Mount Search Routes

Add the search routes to your API v1 routes:

```typescript
// In src/app.ts

import { createSearchRoutes } from './modules/search';
import { AuthService } from './modules/auth';
import { SearchService } from './modules/search';

export function configureApp(container: Container) {
  const app = new Hono<{ Variables: Variables }>();

  // ... existing middleware setup

  // API versioning
  const apiV1 = new Hono<{ Variables: Variables }>();

  // Resolve services from container
  const authService = container.resolve<AuthService>('authService');
  const searchService = container.resolve<SearchService>('searchService');

  // Mount search routes
  apiV1.route('/search', createSearchRoutes(searchService, authService));

  // ... other routes (projects, users, etc.)

  // Mount API v1 routes
  app.route('/api/v1', apiV1);

  return app;
}
```

## Step 3: Add Database Indexes (Optional but Recommended)

For better performance with large datasets, add GIN indexes to your database:

```sql
-- Create indexes for full-text search
-- Run this migration after the search module is integrated

-- Project search index
CREATE INDEX IF NOT EXISTS idx_project_search
  ON "Project"
  USING gin(to_tsvector('english', title || ' ' || description));

-- Idea search index
CREATE INDEX IF NOT EXISTS idx_idea_search
  ON "Idea"
  USING gin(to_tsvector('english', title || ' ' || description || ' ' || "lookingFor"));

-- Analyze tables to update statistics
ANALYZE "Project";
ANALYZE "Idea";
```

### Using Prisma Migrations

Create a new migration file:

```bash
npx prisma migrate dev --create-only --name add_search_indexes
```

Then edit the generated migration file in `prisma/migrations/` to add the SQL above.

## Step 4: Test the Integration

### Manual Testing

Start your server and test the search endpoint:

```bash
# Start the server
npm run dev

# Test search (in another terminal)
curl "http://localhost:3000/api/v1/search?q=machine+learning"

# Test with authentication
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/v1/search?q=AI&type=projects&featured=true"
```

### Automated Testing

Create a test file `src/modules/search/__tests__/search.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SearchRepository } from '../repository';
import { SearchService } from '../service';
import { getLogger } from '../../../infra/logger';

describe('Search Module Integration', () => {
  let db: PrismaClient;
  let repository: SearchRepository;
  let service: SearchService;

  beforeAll(async () => {
    db = new PrismaClient();
    repository = new SearchRepository(db);
    service = new SearchService(repository, getLogger());

    // Seed test data
    await db.project.create({
      data: {
        title: 'Test Project',
        description: 'A test project for search',
        status: 'BUILDING',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.project.deleteMany({ where: { title: 'Test Project' } });
    await db.$disconnect();
  });

  it('should search projects successfully', async () => {
    const result = await service.search({
      q: 'test project',
      type: 'projects',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.results.length).toBeGreaterThan(0);
      expect(result.value.results[0].type).toBe('project');
    }
  });

  it('should return empty results for non-existent query', async () => {
    const result = await service.search({
      q: 'xyznonexistentquery123',
      type: 'projects',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.results).toEqual([]);
      expect(result.value.total).toBe(0);
    }
  });
});
```

## Step 5: Monitor and Optimize

### Query Performance

Monitor slow queries in production:

```typescript
// In src/infra/database.ts or similar

db.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  const duration = after - before;

  if (duration > 1000) {
    logger.warn('Slow query detected', {
      model: params.model,
      action: params.action,
      duration,
    });
  }

  return result;
});
```

### Search Analytics

Track search queries to understand user behavior:

```typescript
// Optional: Log search queries for analytics
searchService.search(query, userId).then((result) => {
  if (result.ok) {
    logger.info('Search executed', {
      query: query.q,
      type: query.type,
      results: result.value.total,
      userId,
    });
  }
});
```

## Troubleshooting

### Common Issues

1. **"Dependency not registered" error**
   - Ensure all dependencies (db, logger, authService) are registered before searchService
   - Check that container registration order is correct

2. **No search results when data exists**
   - Verify PostgreSQL full-text search configuration
   - Check that search query is being sanitized correctly
   - Test raw SQL query directly in PostgreSQL

3. **Slow search performance**
   - Add GIN indexes (see Step 3)
   - Consider limiting the number of results fetched in `searchAll` method
   - Use EXPLAIN ANALYZE to profile queries

4. **TypeScript errors**
   - Ensure all imports use `.js` extension
   - Check that types are exported correctly from index.ts
   - Verify shared package types are available

## Next Steps

After integration:

1. Add search to your frontend application
2. Implement search analytics dashboard
3. Add search result caching (Redis)
4. Implement search suggestions/autocomplete
5. Add advanced filters and faceted search
6. Consider Elasticsearch for very large datasets

## Support

For issues or questions:
- Check the main README.md for API documentation
- Review the repository code for implementation details
- Check Prisma and PostgreSQL documentation for query optimization
