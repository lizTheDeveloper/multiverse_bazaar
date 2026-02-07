# Hooks

Custom React hooks for data fetching and state management.

## Available Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useAuth` | Auth context access | `{ user, isAuthenticated, login, logout }` |
| `useUser` | User profile data | Query result for user |
| `useProjects` | Project list | Query with filters |
| `useIdeas` | Idea list | Query with filters |
| `useCollaborators` | Project collaborators | Query + mutations |
| `useUpvotes` | Upvote mutations | `{ upvote, removeUpvote }` |
| `useSearch` | Search results | Query with params |
| `useToast` | Toast notifications | `{ showToast }` |

## Usage Patterns

**Data Fetching**:
```typescript
function ProjectList() {
  const { data: projects, isLoading, error } = useProjects({
    status: 'launched',
    limit: 20,
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  return <ProjectGrid projects={projects} />;
}
```

**Mutations**:
```typescript
function UpvoteButton({ projectId }) {
  const { upvote, isLoading } = useUpvotes();

  return (
    <Button
      onClick={() => upvote(projectId)}
      loading={isLoading}
    >
      Upvote
    </Button>
  );
}
```

**Auth**:
```typescript
function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <LoginButton />;
  return (
    <Dropdown>
      <Avatar user={user} />
      <Button onClick={logout}>Logout</Button>
    </Dropdown>
  );
}
```

## React Query Integration

Hooks wrap React Query's `useQuery` and `useMutation`:
- Automatic caching and refetching
- Loading and error states
- Optimistic updates for mutations
- Query invalidation on success

## Files

| File | Hook(s) |
|------|---------|
| `useAuth.ts` | useAuth (context hook) |
| `useUser.ts` | useUser, useUpdateUser |
| `useProjects.ts` | useProjects, useProject, useCreateProject, useUpdateProject |
| `useIdeas.ts` | useIdeas, useIdea, useCreateIdea, useExpressInterest |
| `useCollaborators.ts` | useCollaborators, useInvite, useRemove |
| `useUpvotes.ts` | useUpvotes |
| `useSearch.ts` | useSearch |
| `useToast.ts` | useToast |
