## ADDED Requirements

### Requirement: Tab Navigation
App uses bottom tab navigation.

#### Scenario: Tab bar
- **WHEN** the app is open
- **THEN** bottom tabs are visible: Projects, Ideas, [+], Notifications, Profile

#### Scenario: Tab icons
- **WHEN** viewing tab bar
- **THEN** each tab has an icon and label
- **THEN** active tab is highlighted

### Requirement: Stack Navigation
Each tab has a navigation stack.

#### Scenario: Detail navigation
- **WHEN** a user taps a project card in Projects tab
- **THEN** project detail pushes onto the stack
- **THEN** back button returns to list

#### Scenario: Stack preservation
- **WHEN** a user switches tabs and returns
- **THEN** previous tab's stack state is preserved

### Requirement: Create Button
Central button for creating content.

#### Scenario: Create options
- **WHEN** a user taps the [+] tab/button
- **THEN** options appear: New Project, New Idea

#### Scenario: Unauthenticated create
- **WHEN** a guest taps create
- **THEN** login prompt appears

### Requirement: Deep Linking
App supports deep links.

#### Scenario: Project deep link
- **WHEN** a user opens a link like `bazaar://projects/123`
- **THEN** app opens to that project's detail screen

#### Scenario: Notification deep link
- **WHEN** a user taps a push notification
- **THEN** app navigates to relevant content

### Requirement: Header Navigation
Screens have appropriate headers.

#### Scenario: Back button
- **WHEN** on a detail screen
- **THEN** header shows back arrow to return

#### Scenario: Action buttons
- **WHEN** on screens with actions (edit, share)
- **THEN** header shows appropriate buttons

### Requirement: Gestures
App supports native gestures.

#### Scenario: Swipe back
- **WHEN** a user swipes from left edge
- **THEN** they navigate back (iOS behavior)

#### Scenario: Pull to refresh
- **WHEN** a user pulls down on a list
- **THEN** content refreshes
