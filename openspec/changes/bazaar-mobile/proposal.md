## Why

Many Multiverse community members want to browse and interact with the Bazaar on their phones. A native mobile app provides push notifications for upvotes and collaboration invites, camera access for project images, and a native mobile experience.

## What Changes

Building a React Native mobile application with:
- Cross-platform support (iOS and Android) via Expo
- Push notifications for upvotes and collaboration invites
- Camera integration for project image capture
- Native navigation and gestures
- Offline-friendly browsing where possible
- Feature parity with web for core functionality

## Capabilities

### New Capabilities
- `mobile-auth`: Login flow with secure token storage
- `mobile-projects`: Project gallery, detail view, submission with camera
- `mobile-ideas`: Ideas board browsing and interest expression
- `mobile-profiles`: User profile viewing
- `mobile-notifications`: Push notification handling (FCM/APNs via Expo)
- `mobile-upvotes`: Upvote interactions
- `mobile-navigation`: Tab and stack navigation patterns

### Modified Capabilities
<!-- None - greenfield project -->

## Impact

- **Codebase**: New React Native app in `packages/mobile/`
- **Dependencies**: React Native, Expo, React Navigation, Expo Camera, Expo Notifications
- **Shared Code**: Uses types and API client from `packages/shared/`
- **App Stores**: Will need Apple Developer and Google Play accounts for distribution
- **Push Infrastructure**: Requires FCM (Firebase Cloud Messaging) setup
