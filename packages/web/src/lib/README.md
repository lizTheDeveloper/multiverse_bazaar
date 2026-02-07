# Library Utilities

Core utility functions and API client.

## Files

| File | Purpose |
|------|---------|
| `api.ts` | API client with fetch wrapper |
| `utils.ts` | General utility functions |

## API Client (api.ts)

Configured fetch wrapper for API calls:

```typescript
import { auth, projects, ideas, users, search, collaborators } from '@/lib/api';

// Auth
await auth.login(email);
await auth.logout();

// Projects
const projects = await projects.list({ status: 'launched' });
const project = await projects.get(id);
await projects.create({ title, description });
await projects.update(id, { title });
await projects.delete(id);
await projects.upvote(id);
await projects.removeUpvote(id);

// Ideas
const ideas = await ideas.list();
await ideas.expressInterest(id, { message: 'Interested!' });
await ideas.graduate(id, projectData);

// Users
const user = await users.get(id);
await users.update({ name, bio });

// Search
const results = await search.search({ q: 'query' });

// Collaborators
await collaborators.invite(projectId, { email, role });
await collaborators.remove(projectId, collaboratorId);
```

## Error Handling

API throws `ApiError` for non-2xx responses:

```typescript
class ApiError extends Error {
  status: number;
  statusText: string;
  data?: {
    message?: string;
    code?: string;
    validationErrors?: Array<{ field: string; message: string }>;
  };
}
```

Usage:
```typescript
try {
  await projects.create(data);
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      // Redirect to login
    }
    showToast(error.data?.message || 'Error');
  }
}
```

## File Uploads

```typescript
// Upload project image
const { url } = await projects.uploadImage(file);

// Upload avatar
const { url } = await users.uploadAvatar(file);
```

## Authentication

Token stored in localStorage:
- Set on login: `localStorage.setItem('auth_token', token)`
- Removed on logout: `localStorage.removeItem('auth_token')`
- Auto-attached to requests via `Authorization: Bearer` header
