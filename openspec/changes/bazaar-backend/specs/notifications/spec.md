## ADDED Requirements

### Requirement: Notification Events
Certain events trigger push notifications.

#### Scenario: Upvote notification
- **WHEN** a project receives an upvote
- **THEN** all collaborators with push enabled receive a notification
- **THEN** notification contains: upvoter name, project title

#### Scenario: Collaboration invite notification
- **WHEN** a user is invited to collaborate on a project
- **THEN** the invited user receives a notification
- **THEN** notification contains: inviter name, project title, role offered

#### Scenario: Interest expression notification
- **WHEN** a user expresses interest in an idea
- **THEN** the idea creator receives a notification
- **THEN** notification contains: interested user name, idea title

### Requirement: Notification Data Model
Notifications are stored for history and delivery.

#### Scenario: Notification fields
- **WHEN** a notification is created
- **THEN** it contains: id, user_id (recipient), type, title, body, data (JSON), read, created_at

#### Scenario: Notification types
- **WHEN** a notification has a type
- **THEN** it is one of: "upvote", "collaboration_invite", "idea_interest"

### Requirement: Push Delivery
Notifications are delivered via push services.

#### Scenario: Push token registration
- **WHEN** a user registers a push token (from mobile app)
- **THEN** the token is stored associated with their user_id
- **THEN** multiple tokens per user are supported (multiple devices)

#### Scenario: Push delivery
- **WHEN** a notification event occurs
- **THEN** the notification is stored in database
- **THEN** push is sent via FCM (Firebase Cloud Messaging) to all registered tokens

#### Scenario: Push failure
- **WHEN** push delivery fails (invalid token)
- **THEN** the invalid token is removed from storage
- **THEN** the notification remains in database for in-app viewing

### Requirement: Notification Preferences (Future)
Users may control notification preferences.

#### Scenario: Preferences consideration
- **WHEN** notification system is designed
- **THEN** schema supports per-user, per-type preferences
- **THEN** initial implementation sends all notification types

### Requirement: In-App Notifications
Notifications are viewable in-app.

#### Scenario: Listing notifications
- **WHEN** an authenticated user requests their notifications
- **THEN** notifications are returned paginated, newest first
- **THEN** unread count is included

#### Scenario: Marking as read
- **WHEN** a user marks a notification as read
- **THEN** the read flag is set to true
- **THEN** unread count decreases
