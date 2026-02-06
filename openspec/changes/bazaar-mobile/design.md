## Context

Building the React Native mobile application for Multiverse Bazaar. This provides native iOS and Android apps with push notifications, camera access, and native UX patterns.

The mobile app shares business logic and types with the web app via a shared package, and consumes the same backend API.

## Goals / Non-Goals

**Goals:**
- Cross-platform iOS and Android app via React Native + Expo
- Native navigation patterns (tabs, stacks, gestures)
- Push notifications for upvotes and collaboration invites
- Camera integration for project images
- Secure token storage
- Offline-tolerant browsing (graceful degradation)
- Feature parity with web for core features

**Non-Goals:**
- Pixel-perfect match with web design (native patterns take priority)
- Full offline mode with sync (just graceful degradation)
- Complex animations (keep it simple and performant)
- Tablet-optimized layouts (phone-first)
- Search from mobile v1 (can add later; users can search on web)

## Decisions

### Framework: React Native with Expo
- Expo provides managed workflow, easier builds, OTA updates
- Expo modules for camera, notifications, secure storage
- Can eject to bare workflow if needed later
- React Navigation for routing

### Navigation: React Navigation
- Bottom tabs for main sections
- Stack navigators within each tab
- Native gestures and transitions
- Deep linking support

### State Management: TanStack Query
- Same as web, via shared package wrapper
- Consistent caching and refetching behavior
- Optimistic updates for upvotes

### Secure Storage: Expo SecureStore
- JWT stored securely (Keychain on iOS, Keystore on Android)
- Not accessible to other apps

### Push Notifications: Expo Notifications + FCM
- Expo handles FCM/APNs abstraction
- Token management simplified
- Notification handlers for foreground and background

### Project Structure

```
packages/mobile/
├── App.tsx                      # Entry point with providers
├── app.json                     # Expo configuration
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx    # Main tab + auth flow
│   │   ├── ProjectsStack.tsx    # Projects tab stack
│   │   ├── IdeasStack.tsx       # Ideas tab stack
│   │   └── ProfileStack.tsx     # Profile tab stack
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── projects/
│   │   │   ├── ProjectsScreen.tsx
│   │   │   ├── ProjectDetailScreen.tsx
│   │   │   └── ProjectFormScreen.tsx
│   │   ├── ideas/
│   │   │   ├── IdeasScreen.tsx
│   │   │   ├── IdeaDetailScreen.tsx
│   │   │   └── IdeaFormScreen.tsx
│   │   ├── profile/
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── ProfileEditScreen.tsx
│   │   └── notifications/
│   │       └── NotificationsScreen.tsx
│   ├── components/
│   │   ├── ui/                  # Button, Card, Input, etc.
│   │   ├── ProjectCard.tsx
│   │   ├── IdeaCard.tsx
│   │   ├── UpvoteButton.tsx
│   │   └── CollaboratorAvatars.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   ├── useIdeas.ts
│   │   ├── useNotifications.ts
│   │   └── usePushToken.ts
│   ├── lib/
│   │   ├── api.ts               # API client (uses shared)
│   │   ├── storage.ts           # SecureStore wrapper
│   │   └── notifications.ts     # Push notification setup
│   └── theme/
│       ├── colors.ts
│       ├── typography.ts
│       └── spacing.ts
├── assets/
│   ├── icon.png
│   └── splash.png
├── eas.json                     # EAS Build configuration
└── tsconfig.json
```

### Navigation Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ROOT NAVIGATOR                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
       ┌──────────┐          ┌──────────┐          ┌──────────┐
       │  AUTH    │          │   MAIN   │          │  MODAL   │
       │  STACK   │          │   TABS   │          │  STACK   │
       │          │          │          │          │          │
       │ • Login  │          │ Projects │          │ • Create │
       │          │          │ Ideas    │          │ • Invite │
       │          │          │ Notifs   │          │          │
       │          │          │ Profile  │          │          │
       └──────────┘          └──────────┘          └──────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              TAB BAR                                        │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│    Projects     │      Ideas      │  Notifications  │       Profile         │
│       📦        │       💡         │       🔔        │         👤           │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

### Screen Layouts

**Project Card (List Item)**
```
┌─────────────────────────────────────────────────────┐
│ ┌─────────┐                                         │
│ │  IMAGE  │  Project Title                          │
│ │         │  Short description text that may        │
│ │         │  wrap to multiple lines...              │
│ └─────────┘                                         │
│             👤 👤 👤 +2        ▲ 42                  │
└─────────────────────────────────────────────────────┘
```

**Bottom Tab Bar**
```
┌────────────┬────────────┬────────────┬────────────┐
│  Projects  │   Ideas    │   Notifs   │  Profile   │
│     📦      │     💡     │    🔔 3    │     👤     │
└────────────┴────────────┴────────────┴────────────┘
```

### Push Notification Flow

1. User logs in
2. App requests notification permissions
3. If granted, Expo gets FCM token
4. Token sent to backend via `POST /notifications/push-token`
5. On notification events, backend sends via FCM
6. Expo Notifications handles display and tap actions
7. On token refresh, new token sent to backend

### Image Capture Flow

1. User taps "Add Image" in project form
2. Action sheet: "Take Photo" | "Choose from Library"
3. If camera: request permission, open camera, capture
4. If library: request permission, open picker
5. Image displayed as preview in form
6. On form submit, image uploaded to API

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Expo limitations | Can eject to bare workflow if needed; Expo SDK covers our needs |
| Push notification complexity | Expo simplifies FCM/APNs; still need to handle edge cases |
| Performance with many items | Virtualized lists (FlatList); pagination; lazy loading |
| Different platform behaviors | Test on both iOS and Android; use Platform-specific code when needed |
| App store approval | Follow guidelines; no web views for core content |
| Large app size | Tree shaking; lazy loading; monitor bundle |
