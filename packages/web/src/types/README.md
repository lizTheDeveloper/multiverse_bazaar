# Types

TypeScript type definitions for the web application.

## Files

| File | Contents |
|------|----------|
| `index.ts` | All type definitions |

## Core Types

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  karma: number;
  is_external: boolean;
  created_at: string;
  updated_at: string;
}
```

### Project
```typescript
type ProjectStatus = 'building' | 'launched';

interface Project {
  id: string;
  title: string;
  description: string;
  url?: string;
  repo_url?: string;
  image_url?: string;
  status: ProjectStatus;
  is_featured: boolean;
  upvote_count: number;
  has_upvoted?: boolean;
  creator_id: string;
  creator: User;
  collaborators: Collaborator[];
  created_at: string;
  updated_at: string;
}
```

### Idea
```typescript
type IdeaStatus = 'open' | 'closed' | 'graduated';

interface Idea {
  id: string;
  title: string;
  description: string;
  looking_for: string;
  status: IdeaStatus;
  interest_count: number;
  has_expressed_interest?: boolean;
  creator_id: string;
  creator: User;
  created_at: string;
  updated_at: string;
}
```

### Collaborator
```typescript
type CollaboratorRole = 'creator' | 'contributor' | 'advisor';

interface Collaborator {
  id: string;
  user_id: string;
  project_id: string;
  role: CollaboratorRole;
  user: User;
  created_at: string;
}
```

## Input Types

Used for create/update forms:
- `CreateProjectInput`, `UpdateProjectInput`
- `CreateIdeaInput`, `UpdateIdeaInput`
- `InviteCollaboratorInput`
- `ExpressInterestInput`

## Filter Types

Used for list queries:
- `ProjectFilters` - status, is_featured, creator_id, sort
- `IdeaFilters` - status, creator_id, sort
- `SearchParams` - q, type, page, per_page

## Naming Convention

- API uses snake_case (e.g., `created_at`)
- Types match API response shape
- Input types for request bodies
