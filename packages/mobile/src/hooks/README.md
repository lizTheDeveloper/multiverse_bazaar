# Hooks

Custom React hooks for the mobile app.

## Available Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication context and actions |
| `useProjects` | Project list and CRUD |
| `useIdeas` | Ideas list and CRUD |
| `useNotifications` | Notification list and actions |
| `useProfile` | User profile data |
| `usePushNotifications` | Push token registration |

## useAuth

Provides authentication state and actions:

```typescript
const {
  user,              // Current user or null
  isAuthenticated,   // Boolean
  isGuest,           // Guest mode active
  isLoading,         // Initial load
  login,             // (email, password) => Promise
  requestMagicLink,  // (email) => Promise
  verifyMagicLink,   // (token) => Promise
  logout,            // () => Promise
  continueAsGuest,   // () => Promise
  refreshSession,    // () => Promise<boolean>
  requireAuth,       // () => boolean
} = useAuth();
```

## useProjects / useIdeas

Data fetching with React Query:

```typescript
const { data, isLoading, error, refetch } = useProjects();
const { data, isLoading } = useIdeas({ status: 'open' });
```

## usePushNotifications

Handles push notification setup:

```typescript
const { expoPushToken, notification } = usePushNotifications();

// Token is automatically registered with API on login
```

## Pattern

Hooks wrap React Query and provide:
- Loading states
- Error handling
- Automatic refetching
- Optimistic updates for mutations
