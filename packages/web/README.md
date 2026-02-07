# Web Package

React + Vite web application with Tailwind CSS.

## Quick Commands

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint check
```

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build and dev server
- **Tailwind CSS 4** for styling
- **React Router 7** for routing
- **React Query** for server state
- **react-hook-form + Zod** for forms

## Architecture

```
src/
├── main.tsx           # Entry point
├── App.tsx            # Root component with providers
├── router.tsx         # Route definitions
├── components/        # Reusable components by feature
├── pages/             # Route page components
├── hooks/             # Custom React hooks
├── lib/               # Utilities (API client, helpers)
└── types/             # TypeScript interfaces
```

## Key Patterns

**Provider Stack** (App.tsx):
```
ErrorBoundary → QueryClientProvider → ToastProvider → AuthProvider → Router
```

**API Calls**: Use hooks from `hooks/` which wrap React Query:
```typescript
const { data: projects, isLoading } = useProjects();
const { mutate: createProject } = useCreateProject();
```

**Protected Routes**: Wrap with `<ProtectedRoute>`:
```tsx
<ProtectedRoute>
  <ProjectEditPage />
</ProtectedRoute>
```

**Forms**: Use react-hook-form with Zod validation:
```typescript
const form = useForm<ProjectInput>({
  resolver: zodResolver(projectSchema),
});
```

## Environment Variables

```
VITE_API_URL=http://localhost:3000/api/v1
```

## Routes

| Path | Page | Auth |
|------|------|------|
| `/` | Home | No |
| `/projects` | Project list | No |
| `/projects/new` | Create project | Yes |
| `/projects/:id` | Project detail | No |
| `/projects/:id/edit` | Edit project | Yes |
| `/ideas` | Idea board | No |
| `/ideas/new` | Create idea | Yes |
| `/ideas/:id` | Idea detail | No |
| `/users/:id` | User profile | No |
| `/profile/edit` | Edit profile | Yes |
| `/search` | Search | No |
| `/login` | Login | No |
