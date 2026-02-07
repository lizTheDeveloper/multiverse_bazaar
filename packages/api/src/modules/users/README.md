# Users Module

User profile management.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /users/:id | No | Get user profile |
| GET | /users/me | Yes | Get current user |
| PATCH | /users/me | Yes | Update current user |
| GET | /users/:id/projects | No | List user's projects |
| GET | /users/:id/ideas | No | List user's ideas |

## User Model

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  karma: number;
  showEmailOnProfile: boolean;
  includeInSearch: boolean;
  showActivityPublicly: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Profile Visibility

Privacy settings control what's visible:
- `showEmailOnProfile` - Email visible on public profile
- `includeInSearch` - User appears in search results
- `showActivityPublicly` - Activity feed visible

## Update Profile

```json
// PATCH /users/me
{
  "name": "New Name",
  "bio": "Updated bio",
  "avatarUrl": "https://..."
}
```

Avatar uploads go through `/uploads/avatar` endpoint first.

## Karma System

Read-only karma score based on:
- Upvotes received on projects/ideas
- Collaboration activity
- Recalculated by background job

## Files

| File | Purpose |
|------|---------|
| `routes.ts` | User endpoints |
| `service.ts` | Profile management |
| `repository.ts` | User queries |
| `types.ts` | User interface |
| `schemas.ts` | Update validation |

## Related Modules

- `auth` - User creation/authentication
- `privacy` - Privacy settings management
- `uploads` - Avatar uploads
- `karma` - Reputation calculation
