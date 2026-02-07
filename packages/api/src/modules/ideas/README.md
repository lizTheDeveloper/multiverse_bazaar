# Ideas Module

Idea board for pre-project concepts with interest expression and graduation to projects.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /ideas | No | List ideas with filters |
| GET | /ideas/:id | No | Get idea details |
| POST | /ideas | Yes | Create idea |
| PATCH | /ideas/:id | Yes | Update idea (creator only) |
| DELETE | /ideas/:id | Yes | Delete idea (creator only) |
| GET | /ideas/:id/interest | Yes | List interested users |
| POST | /ideas/:id/interest | Yes | Express interest in idea |
| DELETE | /ideas/:id/interest | Yes | Remove interest |
| POST | /ideas/:id/graduate | Yes | Convert idea to project |

## Idea Model

```typescript
interface Idea {
  id: string;
  title: string;
  description: string;
  lookingFor: string;        // What help is needed
  creatorId: string;
  status: 'OPEN' | 'CLOSED' | 'GRADUATED';
  graduatedToProjectId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Status Lifecycle

1. **OPEN** - Accepting interest from collaborators
2. **CLOSED** - No longer accepting interest
3. **GRADUATED** - Converted to a full project

## Interest System

Users can express interest in ideas:
```typescript
interface IdeaInterest {
  id: string;
  userId: string;
  ideaId: string;
  message?: string;  // Optional message to creator
  createdAt: Date;
}
```

## Graduation

Convert idea to project:
```json
// POST /ideas/:id/graduate
{
  "title": "Project Title",
  "description": "Full description",
  "url": "https://...",
  "repoUrl": "https://github.com/..."
}
```

- Sets idea status to GRADUATED
- Creates new project
- Links idea to project via `graduatedToProjectId`
- Creator becomes project creator

## Files

| File | Purpose |
|------|---------|
| `routes.ts` | HTTP endpoints |
| `service.ts` | Business logic, graduation flow |
| `repository.ts` | Prisma queries with interest joins |
| `types.ts` | Idea, IdeaInterest interfaces |
| `schemas.ts` | Create/update/graduate validation |
