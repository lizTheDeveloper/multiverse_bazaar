# Projects Module

CRUD operations for collaborative projects with upvoting and team management.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /projects | No | List projects with filters |
| GET | /projects/:id | No | Get project details |
| POST | /projects | Yes | Create project (becomes creator) |
| PATCH | /projects/:id | Yes | Update project (creator only) |
| DELETE | /projects/:id | Yes | Delete project (creator only) |

## Query Parameters (List)

| Param | Type | Description |
|-------|------|-------------|
| `status` | BUILDING\|LAUNCHED | Filter by status |
| `featured` | boolean | Featured projects only |
| `limit` | number | Page size (default 20, max 100) |
| `cursor` | string | Pagination cursor |

## Project Model

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  url?: string;          // Live project URL
  repoUrl?: string;      // Repository URL
  imageUrl?: string;     // Cover image
  status: 'BUILDING' | 'LAUNCHED';
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectDetailed extends Project {
  collaborators: Collaborator[];
  upvoteCount: number;
  hasUpvoted: boolean;   // Current user's upvote status
}
```

## Files

| File | Purpose |
|------|---------|
| `routes.ts` | HTTP endpoints |
| `service.ts` | Business logic with authorization checks |
| `repository.ts` | Prisma queries with collaborator joins |
| `types.ts` | Project interfaces |
| `schemas.ts` | Create/update validation schemas |

## Authorization

- **Create**: Any authenticated user
- **Read**: Public (no auth required)
- **Update/Delete**: Creator only (checked via `isUserCreator`)

## Response Enrichment

List and detail responses include:
- `upvoteCount`: Total upvotes
- `hasUpvoted`: Whether current user upvoted (if authenticated)
- `collaborators`: Team members with roles (detail only)

## Related Modules

- `collaborators` - Team member management
- `upvotes` - Voting functionality
- `ideas` - Ideas can graduate to projects
