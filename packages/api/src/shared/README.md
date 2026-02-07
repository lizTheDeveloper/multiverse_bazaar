# Shared Utilities

Cross-cutting utilities used across API modules.

## Files

| File | Purpose |
|------|---------|
| `pagination.ts` | Cursor-based pagination helpers |
| `prisma-errors.ts` | Prisma error handling and translation |

## Pagination

Cursor-based pagination for list endpoints:

```typescript
import { createPaginatedResponse } from '../shared/pagination.js';

// In service layer
const paginatedResponse = createPaginatedResponse(
  items,           // Array of items (fetched limit + 1)
  limit,           // Requested limit
  (item) => ({     // Cursor extractor
    id: item.id,
    createdAt: item.createdAt,
  })
);

// Returns:
// {
//   data: Item[],       // Trimmed to limit
//   nextCursor: string, // Base64 encoded cursor or null
//   hasMore: boolean    // True if more items exist
// }
```

## Prisma Error Handling

Translates Prisma errors to domain errors:

```typescript
import { handlePrismaError } from '../shared/prisma-errors.js';

try {
  await prisma.user.create({ ... });
} catch (error) {
  return Err(handlePrismaError(error));
  // Returns NotFoundError, ConflictError, ValidationError, etc.
}
```

Common error mappings:
- `P2002` (unique violation) → ConflictError
- `P2025` (not found) → NotFoundError
- `P2003` (foreign key) → ValidationError
