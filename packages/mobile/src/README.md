# Mobile Source Directory

## Structure

```
src/
├── screens/         # Screen components organized by feature
├── components/      # Reusable UI components
├── navigation/      # React Navigation configuration
├── hooks/           # Custom React hooks
├── lib/             # Utilities, API, storage
├── theme/           # Design system tokens
└── __tests__/       # Jest tests
```

## Directories

### screens/
Screen components grouped by feature:
- `auth/` - LoginScreen
- `projects/` - ProjectsScreen, ProjectDetailScreen, ProjectFormScreen
- `ideas/` - IdeasScreen, IdeaDetailScreen, IdeaFormScreen
- `notifications/` - NotificationsScreen
- `profile/` - ProfileScreen, ProfileEditScreen

### components/
- `ui/` - Base components (Button, Card, Input, Avatar)
- Feature components (ProjectCard, IdeaCard, UpvoteButton, etc.)

### navigation/
- `RootNavigator.tsx` - Auth/Main switch based on auth state
- `AuthStack.tsx` - Unauthenticated flow
- `MainTabs.tsx` - Bottom tab navigator
- `*Stack.tsx` - Feature stack navigators
- `types.ts` - Navigation type definitions

### hooks/
- `useAuth.tsx` - Auth context and provider
- `useProjects.ts` - Project data hooks
- `useIdeas.ts` - Ideas data hooks
- `useNotifications.ts` - Notification hooks
- `useProfile.ts` - Profile hooks
- `usePushNotifications.ts` - Push registration

### lib/
- `api.ts` - API client with auth token handling
- `storage.ts` - SecureStore wrapper for tokens
- `pushNotifications.ts` - Expo push notification setup

### theme/
Design tokens:
- `colors.ts` - Color palette
- `typography.ts` - Font sizes, weights
- `spacing.ts` - Spacing scale
