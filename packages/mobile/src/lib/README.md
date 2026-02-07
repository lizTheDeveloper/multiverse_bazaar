# Library Utilities

Core utilities for the mobile app.

## Files

| File | Purpose |
|------|---------|
| `api.ts` | API client with auth token handling |
| `storage.ts` | SecureStore wrapper for tokens |
| `pushNotifications.ts` | Expo push notification setup |

## API Client (api.ts)

Fetch wrapper with automatic auth:

```typescript
import { api } from './lib/api';

// GET request
const projects = await api.get<Project[]>('/projects');

// POST request
const project = await api.post<Project>('/projects', {
  title: 'New Project',
  description: 'Description',
});

// PUT/PATCH/DELETE
await api.put<Project>(`/projects/${id}`, data);
await api.patch<Project>(`/projects/${id}`, data);
await api.delete(`/projects/${id}`);
```

Features:
- Auto-attaches auth token from storage
- Handles token refresh on 401
- Throws errors for non-2xx responses

## Storage (storage.ts)

SecureStore wrapper for sensitive data:

```typescript
import { storage } from './lib/storage';

// Token management
await storage.setToken(accessToken);
await storage.getToken();
await storage.setRefreshToken(refreshToken);
await storage.getRefreshToken();

// User data
await storage.setUser(user);
const user = await storage.getUser<User>();

// Generic storage
await storage.set('key', 'value');
const value = await storage.get('key');
await storage.remove('key');

// Clear all
await storage.clear();
```

## Push Notifications (pushNotifications.ts)

Expo notifications setup:

```typescript
import {
  registerForPushNotificationsAsync,
  setupNotificationHandlers,
} from './lib/pushNotifications';

// Get push token
const token = await registerForPushNotificationsAsync();

// Setup handlers in App.tsx
useEffect(() => {
  setupNotificationHandlers({
    onNotificationReceived: (notification) => { ... },
    onNotificationResponse: (response) => { ... },
  });
}, []);
```
