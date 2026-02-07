# Web Source Directory

## File Overview

| File | Purpose |
|------|---------|
| `main.tsx` | React DOM entry point |
| `App.tsx` | Root component with provider stack |
| `router.tsx` | React Router route definitions |

## Directory Structure

| Directory | Contents |
|-----------|----------|
| `components/` | Reusable UI components organized by feature |
| `pages/` | Top-level route page components |
| `hooks/` | Custom React hooks for data fetching and state |
| `lib/` | Utility functions, API client |
| `types/` | TypeScript type definitions |
| `styles/` | Global CSS styles |
| `assets/` | Static assets (images, icons) |

## Provider Stack (App.tsx)

Components are wrapped in this order:
1. `ErrorBoundary` - Catches React errors
2. `QueryClientProvider` - React Query for server state
3. `ToastProvider` - Toast notifications
4. `AuthProvider` - Authentication context
5. `Router` - React Router

## Path Aliases

Uses `@/` alias for imports:
```typescript
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
```

Configured in `vite.config.ts` and `tsconfig.json`.
