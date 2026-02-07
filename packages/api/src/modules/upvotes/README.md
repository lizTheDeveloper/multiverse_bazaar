# Upvotes Module

Voting system for projects and ideas.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /projects/:id/upvote | Yes | Upvote project |
| DELETE | /projects/:id/upvote | Yes | Remove upvote |
| POST | /ideas/:id/upvote | Yes | Upvote idea |
| DELETE | /ideas/:id/upvote | Yes | Remove upvote |

## Behavior

- One upvote per user per resource
- Toggle behavior: POST adds, DELETE removes
- Cannot upvote own projects/ideas
- Triggers karma recalculation for creator
- Sends notification to resource creator

## Models

```typescript
interface Upvote {
  id: string;
  userId: string;
  projectId: string;
  createdAt: Date;
}

interface IdeaUpvote {
  id: string;
  userId: string;
  ideaId: string;
  createdAt: Date;
}
```

## Response

Returns updated resource with upvote info:
```json
{
  "id": "...",
  "upvoteCount": 42,
  "hasUpvoted": true
}
```

## Side Effects

On upvote:
1. Creates Upvote/IdeaUpvote record
2. Notifies resource creator
3. Triggers karma recalculation

On remove:
1. Deletes upvote record
2. Triggers karma recalculation

## Related Modules

- `projects` - Upvotable resource
- `ideas` - Upvotable resource
- `karma` - Recalculates on vote changes
- `notifications` - Notifies creator
