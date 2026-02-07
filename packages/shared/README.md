# Shared Package

Shared TypeScript types and utilities used across API and frontend.

## Installation

Consumed as workspace dependency:
```json
{
  "dependencies": {
    "@multiverse-bazaar/shared": "*"
  }
}
```

## Exports

```typescript
import {
  // Result type for error handling
  Result,
  Ok,
  Err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  map,
  mapErr,
  andThen,

  // Error classes
  BaseError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  InternalError,
  isBaseError,
  toBaseError,
} from '@multiverse-bazaar/shared';
```

## Result Type

Functional error handling without throwing:

```typescript
// Creating results
const success = Ok({ id: '123', name: 'Test' });
const failure = Err(new NotFoundError('User'));

// Checking results
if (isOk(result)) {
  console.log(result.value);
} else {
  console.log(result.error.message);
}

// Unwrapping
const value = unwrap(result);        // Throws if Err
const valueOrDefault = unwrapOr(result, defaultValue);

// Chaining
const mapped = map(result, (v) => v.name);
const chained = andThen(result, (v) => anotherOperation(v));
```

## Error Classes

All extend `BaseError` with `code`, `statusCode`, and optional `details`:

| Error | Code | Status | Usage |
|-------|------|--------|-------|
| `NotFoundError` | NOT_FOUND | 404 | Resource doesn't exist |
| `ValidationError` | VALIDATION_ERROR | 400 | Invalid input |
| `UnauthorizedError` | UNAUTHORIZED | 401 | Auth required |
| `ForbiddenError` | FORBIDDEN | 403 | No permission |
| `ConflictError` | CONFLICT | 409 | Duplicate/conflict |
| `RateLimitError` | RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| `InternalError` | INTERNAL_ERROR | 500 | Server error |

## Usage in API

```typescript
async function getUser(id: string): Promise<Result<User, BaseError>> {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    return Err(new NotFoundError('User'));
  }
  return Ok(user);
}
```

## Files

| File | Contents |
|------|----------|
| `src/index.ts` | Re-exports all types |
| `src/types/result.ts` | Result type and utilities |
| `src/types/errors.ts` | Error class hierarchy |
