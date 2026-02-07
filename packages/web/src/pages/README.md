# Pages

Top-level route page components.

## Available Pages

| File | Route | Description |
|------|-------|-------------|
| `Home.tsx` | `/` | Landing page |
| `Projects.tsx` | `/projects` | Project listing |
| `ProjectDetail.tsx` | `/projects/:id` | Single project view |
| `ProjectNew.tsx` | `/projects/new` | Create project form |
| `ProjectEdit.tsx` | `/projects/:id/edit` | Edit project form |
| `Ideas.tsx` | `/ideas` | Idea board listing |
| `IdeaDetail.tsx` | `/ideas/:id` | Single idea view |
| `IdeaNew.tsx` | `/ideas/new` | Create idea form |
| `IdeaEdit.tsx` | `/ideas/:id/edit` | Edit idea form |
| `Profile.tsx` | `/users/:id` | User profile view |
| `ProfileEdit.tsx` | `/profile/edit` | Edit own profile |
| `Search.tsx` | `/search` | Search results |
| `Login.tsx` | `/login` | Login page |

## Page Pattern

Pages follow a consistent structure:
```tsx
export function ProjectDetail() {
  const { id } = useParams();
  const { data: project, isLoading, error } = useProject(id);

  if (isLoading) return <LoadingPage />;
  if (error) return <ErrorState error={error} />;

  return (
    <Layout>
      <Page title={project.title}>
        <ProjectContent project={project} />
      </Page>
    </Layout>
  );
}
```

## Protected vs Public

Protected pages (require auth):
- `ProjectNew`, `ProjectEdit`
- `IdeaNew`, `IdeaEdit`
- `ProfileEdit`

Public pages (no auth):
- `Home`, `Projects`, `ProjectDetail`
- `Ideas`, `IdeaDetail`
- `Profile`, `Search`, `Login`

Protection handled in `router.tsx` with `<ProtectedRoute>`.

## Layout Usage

Pages use `<Layout>` for consistent header/footer:
```tsx
<Layout>
  <Page title="Projects">
    {/* content */}
  </Page>
</Layout>
```

## URL Parameters

```typescript
// /projects/:id
const { id } = useParams<{ id: string }>();

// /search?q=query&type=project
const [searchParams] = useSearchParams();
const query = searchParams.get('q');
```
