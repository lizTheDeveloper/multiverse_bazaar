## ADDED Requirements

### Requirement: Push Notification Setup
App registers for push notifications.

#### Scenario: Permission request
- **WHEN** a user logs in
- **THEN** they are prompted for push notification permission
- **THEN** if granted, FCM token is sent to backend

#### Scenario: Permission denied
- **WHEN** a user denies push permissions
- **THEN** app works normally, just without push notifications
- **THEN** user can enable later in settings

### Requirement: Receiving Push Notifications
Users receive notifications for relevant events.

#### Scenario: Upvote notification
- **WHEN** someone upvotes a user's project
- **THEN** they receive a push: "[Name] upvoted your project [Title]"

#### Scenario: Collaboration invite notification
- **WHEN** someone invites a user to collaborate
- **THEN** they receive a push: "[Name] invited you to [Project]"

#### Scenario: Notification tap
- **WHEN** a user taps a notification
- **THEN** app opens to relevant screen (project detail, etc.)

### Requirement: Foreground Notifications
Notifications are handled when app is open.

#### Scenario: Foreground alert
- **WHEN** a notification arrives while app is in foreground
- **THEN** an in-app toast/banner is shown
- **THEN** tapping navigates to relevant content

### Requirement: Notification Center
Users can view notification history.

#### Scenario: Notifications screen
- **WHEN** a user opens notifications (bell icon or screen)
- **THEN** they see a list of all notifications, newest first

#### Scenario: Unread badge
- **WHEN** there are unread notifications
- **THEN** a badge shows on the notifications icon

#### Scenario: Mark as read
- **WHEN** a user views a notification
- **THEN** it is marked as read
- **THEN** badge count updates

### Requirement: Token Refresh
Push tokens are refreshed when needed.

#### Scenario: Token refresh
- **WHEN** FCM refreshes the device token
- **THEN** new token is sent to backend
- **THEN** old token is invalidated
