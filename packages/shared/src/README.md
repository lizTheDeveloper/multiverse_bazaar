# Shared Source

TypeScript source files for shared utilities.

## Structure

```
src/
├── index.ts         # Re-exports from types/
└── types/
    ├── index.ts     # Aggregates type exports
    ├── result.ts    # Result<T,E> monad
    └── errors.ts    # BaseError hierarchy
```

## Result Type (result.ts)

Rust-inspired Result type for error handling:

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Functions:
- `Ok(value)` - Create success result
- `Err(error)` - Create error result
- `isOk(result)` - Type guard for success
- `isErr(result)` - Type guard for error
- `unwrap(result)` - Get value or throw
- `unwrapOr(result, default)` - Get value or default
- `map(result, fn)` - Transform success value
- `mapErr(result, fn)` - Transform error
- `andThen(result, fn)` - Chain operations
- `orElse(result, fn)` - Handle error with fallback

## Error Classes (errors.ts)

Abstract `BaseError` with concrete implementations:

```typescript
abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly details?: ErrorDetails;
  toJSON(): object;
}
```

Implementations:
- `NotFoundError(resource)` - 404
- `ValidationError(message, fieldErrors?)` - 400
- `UnauthorizedError(message?)` - 401
- `ForbiddenError(message?)` - 403
- `ConflictError(message)` - 409
- `RateLimitError(message?, retryAfter?)` - 429
- `InternalError(message?)` - 500

Helpers:
- `isBaseError(error)` - Type guard
- `toBaseError(error)` - Convert any error
