# Components

Reusable React components organized by feature domain.

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `ui/` | Generic UI primitives (Button, Card, Input, Modal, etc.) |
| `layout/` | Page layout components (Header, Footer, Layout, Page) |
| `auth/` | Authentication (AuthProvider, ProtectedRoute, UserMenu) |
| `projects/` | Project-related (ProjectCard, ProjectForm, UpvoteButton) |
| `ideas/` | Idea-related (IdeaCard, IdeaForm, InterestButton) |
| `profiles/` | Profile components (ProfileCard, ProfileEditForm) |
| `collaborators/` | Team components (CollaboratorsList, InviteModal) |
| `search/` | Search (SearchBar, SearchFilters, SearchResultItem) |

## UI Components (ui/)

Base components used across the app:

| Component | Props | Usage |
|-----------|-------|-------|
| `Button` | variant, size, loading | Primary action trigger |
| `Card` | - | Content container |
| `Input` | label, error | Form text input |
| `Textarea` | label, error | Multi-line input |
| `Select` | options, label | Dropdown select |
| `Modal` | isOpen, onClose, title | Dialog overlay |
| `Badge` | variant | Status indicators |
| `Avatar` | src, name, size | User avatar |
| `Spinner` | size | Loading indicator |
| `Skeleton` | - | Loading placeholder |
| `Toast` | type, message | Notification toast |
| `EmptyState` | title, description | No data placeholder |
| `ErrorBoundary` | fallback | Error catch |
| `LoadingPage` | - | Full page loader |

## Auth Components (auth/)

| Component | Purpose |
|-----------|---------|
| `AuthProvider` | Context provider for auth state |
| `ProtectedRoute` | Redirects unauthenticated users |
| `UserMenu` | Dropdown with user actions |

## Feature Components

Each feature folder exports via `index.ts`:
```typescript
import { ProjectCard, ProjectForm } from '@/components/projects';
import { IdeaCard, InterestButton } from '@/components/ideas';
```

## Component Patterns

**With Loading State**:
```tsx
{isLoading ? <Skeleton /> : <ProjectCard project={data} />}
```

**With Error Boundary**:
```tsx
<ErrorBoundary fallback={<ErrorState />}>
  <ProjectList />
</ErrorBoundary>
```

**Form with react-hook-form**:
```tsx
<form onSubmit={handleSubmit(onSubmit)}>
  <Input {...register('title')} error={errors.title?.message} />
  <Button type="submit" loading={isSubmitting}>Save</Button>
</form>
```
