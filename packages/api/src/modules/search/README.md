# Search Module

The Search module provides full-text search capabilities for the Multiverse Bazaar API using PostgreSQL's native full-text search features.

## Overview

This module enables users to search across projects and ideas using natural language queries with relevance ranking. It uses PostgreSQL's `to_tsvector`, `plainto_tsquery`, and `ts_rank` functions for efficient full-text search.

## Features

- **Full-text search** across projects and ideas
- **Relevance scoring** using PostgreSQL's `ts_rank`
- **Flexible filtering** by type, status, and featured status
- **Pagination** support with configurable page size
- **Personalized results** with upvote/interest status when authenticated
- **SQL injection protection** through query sanitization
- **Multi-field search** - searches title, description, and other relevant fields

## API Endpoints

### GET /search

Search across projects and ideas.

**Query Parameters:**

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `q` | string | Yes | Search query (1-200 chars) | - |
| `type` | enum | No | `'projects'`, `'ideas'`, or `'all'` | `'all'` |
| `status` | string | No | Filter by ProjectStatus or IdeaStatus | - |
| `featured` | boolean | No | Filter by featured status (projects only) | - |
| `page` | number | No | Page number (positive integer) | `1` |
| `limit` | number | No | Items per page (1-100) | `20` |

**Response:**

```json
{
  "results": [
    {
      "type": "project",
      "id": "uuid",
      "title": "Project Title",
      "description": "Project description...",
      "score": 0.607927,
      "url": "https://example.com",
      "repoUrl": "https://github.com/user/repo",
      "imageUrl": "https://example.com/image.png",
      "status": "BUILDING",
      "isFeatured": false,
      "upvoteCount": 42,
      "hasUpvoted": true,
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-01-20T14:25:00Z"
    },
    {
      "type": "idea",
      "id": "uuid",
      "title": "Idea Title",
      "description": "Idea description...",
      "lookingFor": "Co-founder with backend experience",
      "score": 0.456789,
      "status": "OPEN",
      "creatorId": "uuid",
      "creatorName": "John Doe",
      "interestCount": 5,
      "hasInterest": false,
      "createdAt": "2026-01-18T09:15:00Z",
      "updatedAt": "2026-01-19T11:40:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "query": "machine learning"
}
```

**Example Requests:**

```bash
# Search all content
GET /search?q=machine+learning

# Search only projects
GET /search?q=AI&type=projects

# Search featured projects
GET /search?q=web3&type=projects&featured=true

# Search projects with specific status
GET /search?q=startup&type=projects&status=LAUNCHED

# Search ideas with pagination
GET /search?q=mobile+app&type=ideas&page=2&limit=10
```

## Architecture

### Files

- **types.ts** - Type definitions for search queries and results
- **schemas.ts** - Zod validation schemas
- **repository.ts** - Database access layer with PostgreSQL full-text search
- **service.ts** - Business logic and query routing
- **routes.ts** - HTTP endpoints
- **index.ts** - Public API exports

### Search Flow

1. **Request** → Routes validate query parameters using Zod
2. **Validation** → Service validates status filters and sanitizes input
3. **Routing** → Service routes to appropriate repository method based on type
4. **Query** → Repository executes PostgreSQL full-text search
5. **Enrichment** → Add upvote/interest status if user is authenticated
6. **Response** → Return paginated results with relevance scores

## PostgreSQL Full-Text Search

### How It Works

The search uses PostgreSQL's built-in full-text search features:

```sql
SELECT
  id, title, description,
  ts_rank(
    to_tsvector('english', title || ' ' || description),
    plainto_tsquery('english', $1)
  ) as score
FROM "Project"
WHERE to_tsvector('english', title || ' ' || description)
  @@ plainto_tsquery('english', $1)
ORDER BY score DESC
LIMIT $2 OFFSET $3;
```

**Key Functions:**

- `to_tsvector('english', text)` - Converts text to a searchable vector
- `plainto_tsquery('english', query)` - Converts plain text query to tsquery
- `@@` operator - Matches tsvector against tsquery
- `ts_rank()` - Calculates relevance score

### Search Fields

**Projects:**
- `title` - Project title
- `description` - Project description

**Ideas:**
- `title` - Idea title
- `description` - Idea description
- `lookingFor` - What the creator is looking for

### Performance Considerations

For production use with large datasets, consider adding GIN indexes:

```sql
-- Add indexes for better performance
CREATE INDEX idx_project_search
  ON "Project"
  USING gin(to_tsvector('english', title || ' ' || description));

CREATE INDEX idx_idea_search
  ON "Idea"
  USING gin(to_tsvector('english', title || ' ' || description || ' ' || "lookingFor"));
```

## Security

### SQL Injection Prevention

The repository sanitizes all search queries to prevent SQL injection:

```typescript
private sanitizeQuery(query: string): string {
  // Remove special PostgreSQL characters that could break tsquery
  return query.replace(/[^\w\s-]/g, ' ').trim();
}
```

This removes any potentially dangerous characters while preserving the search intent.

### Empty Query Handling

Empty or invalid queries return an empty result set rather than an error:

```typescript
if (!query || query.trim().length === 0) {
  return Ok({ results: [], total: 0 });
}
```

## Error Handling

All methods return `Result<T, E>` types for consistent error handling:

```typescript
// Success
Result<SearchResponse, BaseError>

// Error types
- ValidationError (400) - Invalid query parameters
- InternalError (500) - Database or unexpected errors
```

## Type Safety

The module uses TypeScript for full type safety:

```typescript
// Discriminated union for search results
type SearchResult = ProjectSearchResult | IdeaSearchResult;

// Type guard example
if (result.type === 'project') {
  // TypeScript knows this is ProjectSearchResult
  console.log(result.url, result.repoUrl);
}
```

## Integration Example

```typescript
import { PrismaClient } from '@prisma/client';
import {
  SearchRepository,
  SearchService,
  createSearchRoutes
} from './modules/search';
import { Logger } from './infra/logger';
import { AuthService } from './modules/auth';

// Setup
const db = new PrismaClient();
const logger = getLogger();
const searchRepository = new SearchRepository(db);
const searchService = new SearchService(searchRepository, logger);

// Create routes
const searchRoutes = createSearchRoutes(searchService, authService);

// Mount routes
app.route('/api/v1/search', searchRoutes);
```

## Future Enhancements

Potential improvements for future versions:

1. **Highlight snippets** - Return highlighted search term matches
2. **Advanced operators** - Support for AND, OR, NOT operators
3. **Faceted search** - Aggregate results by status, date range, etc.
4. **Search suggestions** - Autocomplete and "did you mean" features
5. **Search analytics** - Track popular searches and zero-result queries
6. **Multi-language support** - Support for non-English content
7. **Fuzzy matching** - Tolerance for typos and spelling mistakes
8. **Boosting** - Weight certain fields or attributes higher in ranking
9. **Search filters** - Additional filters like date range, creator, etc.
10. **Search history** - Track user's recent searches

## Testing

Example test cases:

```typescript
describe('SearchService', () => {
  it('should return empty results for empty query', async () => {
    const result = await searchService.search({ q: '' });
    expect(result.ok).toBe(true);
    expect(result.value.results).toEqual([]);
  });

  it('should search projects only when type is projects', async () => {
    const result = await searchService.search({
      q: 'test',
      type: 'projects'
    });
    expect(result.ok).toBe(true);
    expect(result.value.results.every(r => r.type === 'project')).toBe(true);
  });

  it('should validate status filter against search type', async () => {
    const result = await searchService.search({
      q: 'test',
      type: 'projects',
      status: 'INVALID_STATUS'
    });
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });
});
```

## Dependencies

- `@prisma/client` - Database access
- `zod` - Schema validation
- `hono` - HTTP routing
- `@multiverse-bazaar/shared` - Shared types and utilities
