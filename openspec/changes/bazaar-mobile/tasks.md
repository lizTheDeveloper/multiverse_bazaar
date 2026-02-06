## 1. Project Setup

- [ ] 1.1 Initialize `packages/mobile/` with Expo (managed workflow)
- [ ] 1.2 Configure TypeScript
- [ ] 1.3 Set up React Navigation (bottom tabs + stacks)
- [ ] 1.4 Configure TanStack Query provider
- [ ] 1.5 Create API client using shared package
- [ ] 1.6 Set up theme constants (colors, typography, spacing)

## 2. Authentication

- [ ] 2.1 Create auth context with SecureStore integration
- [ ] 2.2 Build LoginScreen with email form
- [ ] 2.3 Implement token storage/retrieval via Expo SecureStore
- [ ] 2.4 Create auth flow (login required vs guest mode)
- [ ] 2.5 Handle 401 responses (logout and redirect)
- [ ] 2.6 Add logout functionality in profile/settings

## 3. Navigation Structure

- [ ] 3.1 Create RootNavigator with auth conditional
- [ ] 3.2 Set up bottom tab navigator (Projects, Ideas, Notifications, Profile)
- [ ] 3.3 Create stack navigators for each tab
- [ ] 3.4 Configure deep linking scheme
- [ ] 3.5 Add header configurations (back buttons, action buttons)

## 4. UI Components

- [ ] 4.1 Create base components: Button, Card, Input, Avatar
- [ ] 4.2 Create ProjectCard component
- [ ] 4.3 Create IdeaCard component
- [ ] 4.4 Create UpvoteButton with haptic feedback
- [ ] 4.5 Create CollaboratorAvatars component
- [ ] 4.6 Create loading indicators and skeletons

## 5. Projects Tab

- [ ] 5.1 Build ProjectsScreen with FlatList
- [ ] 5.2 Implement pull-to-refresh
- [ ] 5.3 Implement infinite scroll pagination
- [ ] 5.4 Build ProjectDetailScreen
- [ ] 5.5 Add upvote functionality on detail screen
- [ ] 5.6 Create useProjects hook

## 6. Project Creation/Editing

- [ ] 6.1 Build ProjectFormScreen (shared for create/edit)
- [ ] 6.2 Implement image picker (camera + gallery)
- [ ] 6.3 Request and handle camera/gallery permissions
- [ ] 6.4 Implement image upload on form submit
- [ ] 6.5 Add form validation
- [ ] 6.6 Build delete confirmation alert

## 7. Ideas Tab

- [ ] 7.1 Build IdeasScreen with FlatList
- [ ] 7.2 Implement pull-to-refresh and pagination
- [ ] 7.3 Build IdeaDetailScreen
- [ ] 7.4 Add "I'm Interested" button and modal
- [ ] 7.5 Show interested users for idea creators
- [ ] 7.6 Build IdeaFormScreen for creating ideas

## 8. Upvotes

- [ ] 8.1 Implement UpvoteButton with optimistic updates
- [ ] 8.2 Add haptic feedback (Expo Haptics)
- [ ] 8.3 Add visual animation on toggle
- [ ] 8.4 Handle guest upvote (prompt login)

## 9. Profile Tab

- [ ] 9.1 Build ProfileScreen (view mode)
- [ ] 9.2 Display karma prominently
- [ ] 9.3 Show user's projects with role badges
- [ ] 9.4 Build ProfileEditScreen
- [ ] 9.5 Implement avatar upload (camera/gallery)
- [ ] 9.6 Handle "my profile" vs "other user profile"

## 10. Push Notifications

- [ ] 10.1 Set up Expo Notifications
- [ ] 10.2 Request notification permissions on login
- [ ] 10.3 Get and send FCM token to backend
- [ ] 10.4 Handle token refresh
- [ ] 10.5 Configure notification handlers (foreground, background, tap)
- [ ] 10.6 Implement deep link navigation from notifications

## 11. Notifications Screen

- [ ] 11.1 Build NotificationsScreen with list
- [ ] 11.2 Display notification items with appropriate icons
- [ ] 11.3 Implement mark-as-read on view
- [ ] 11.4 Add unread badge to tab icon
- [ ] 11.5 Navigate to relevant content on tap

## 12. Polish & Testing

- [ ] 12.1 Add loading states throughout
- [ ] 12.2 Implement error handling with user-friendly messages
- [ ] 12.3 Add empty state screens
- [ ] 12.4 Test on iOS simulator
- [ ] 12.5 Test on Android emulator
- [ ] 12.6 Test push notifications on physical devices

## 13. Build & Distribution

- [ ] 13.1 Configure app.json (name, icons, splash)
- [ ] 13.2 Set up EAS Build
- [ ] 13.3 Create development builds for testing
- [ ] 13.4 Configure Firebase project for FCM
- [ ] 13.5 Prepare for TestFlight (iOS)
- [ ] 13.6 Prepare for internal testing (Android)
