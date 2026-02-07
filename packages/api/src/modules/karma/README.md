# Karma Module

User reputation scoring system.

## Overview

Karma is a read-only score calculated from user activity:
- Upvotes received on projects
- Upvotes received on ideas
- Collaboration contributions

## Calculation

```typescript
karma = (projectUpvotes * 2) + (ideaUpvotes * 1) + (collaborations * 1)
```

Weights may be adjusted. Calculated by background job, not real-time.

## No Direct Endpoints

Karma is accessed via user profile:
```json
// GET /users/:id
{
  "id": "...",
  "karma": 42,
  ...
}
```

## Files

| File | Purpose |
|------|---------|
| `service.ts` | Karma calculation logic |
| `repository.ts` | Queries for karma factors |
| `types.ts` | Karma-related interfaces |

## Triggers

Karma recalculation triggered by:
- Upvote created/deleted
- Scheduled daily job

## Background Job

`recalculate-karma.ts` job:
- Runs daily
- Recalculates karma for all active users
- Updates `User.karma` field

## Related Modules

- `upvotes` - Triggers recalculation
- `users` - Stores karma value
- `jobs` - Schedules recalculation
