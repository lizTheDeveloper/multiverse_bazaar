# Mobile Package

Expo React Native mobile app for iOS and Android.

## Quick Commands

```bash
npm run start         # Start Expo dev server
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web           # Run in browser
npm run test          # Run Jest tests
npm run test:watch    # Watch mode tests
npm run typecheck     # TypeScript check

# Build commands (requires EAS)
npm run build:dev           # Development builds
npm run build:dev:ios       # iOS development build
npm run build:dev:android   # Android development build
npm run build:preview       # Preview builds
npm run build:production    # Production builds
npm run submit:ios          # Submit to App Store
npm run submit:android      # Submit to Play Store
```

## Tech Stack

- **Expo SDK 54** with React Native 0.81
- **React Navigation** for navigation
- **React Query** for server state
- **Expo SecureStore** for auth tokens
- **Expo Notifications** for push notifications

## Architecture

```
src/
├── screens/         # Screen components by feature
├── components/      # Reusable components
├── navigation/      # Navigation stacks and tabs
├── hooks/           # Custom React hooks
├── lib/             # Utilities, API client, storage
└── theme/           # Colors, typography, spacing
```

## Navigation Structure

```
RootNavigator
├── AuthStack (unauthenticated)
│   └── LoginScreen
└── MainTabs (authenticated or guest)
    ├── ProjectsStack
    │   ├── ProjectsScreen
    │   ├── ProjectDetailScreen
    │   └── ProjectFormScreen
    ├── IdeasStack
    │   ├── IdeasScreen
    │   ├── IdeaDetailScreen
    │   └── IdeaFormScreen
    ├── NotificationsStack
    │   └── NotificationsScreen
    └── ProfileStack
        ├── ProfileScreen
        └── ProfileEditScreen
```

## Authentication

- Password login and magic link support
- Guest mode for browsing without account
- Tokens stored in `expo-secure-store`
- Auto-refresh on expiry

## Push Notifications

- Expo notifications service
- Token registration on login
- Background notification handling

## Environment

Uses Expo constants for configuration. Set via app.json extras or EAS secrets.
