## ADDED Requirements

### Requirement: Profile Page
Users have public profile pages.

#### Scenario: Profile view
- **WHEN** a user visits /users/:id
- **THEN** they see: name, avatar, bio, karma score, join date

#### Scenario: Project list on profile
- **WHEN** viewing a profile
- **THEN** all projects where user is a collaborator are shown
- **THEN** each project shows the user's role (creator/contributor/advisor)

#### Scenario: External collaborator badge
- **WHEN** viewing an external collaborator's profile
- **THEN** a badge indicates they are an external collaborator

### Requirement: Profile Editing
Users can edit their own profile.

#### Scenario: Edit own profile
- **WHEN** an authenticated user visits their own profile
- **THEN** they see an "Edit Profile" button

#### Scenario: Edit form
- **WHEN** a user edits their profile
- **THEN** they can change: name, bio, avatar (upload)

### Requirement: Karma Display
Karma is prominently displayed.

#### Scenario: Karma on profile
- **WHEN** viewing any profile
- **THEN** karma is shown with a visual indicator (number, possibly with icon)

#### Scenario: Karma tooltip
- **WHEN** hovering over karma
- **THEN** a tooltip explains what karma represents

### Requirement: Current User Menu
Logged-in users have quick access to their profile.

#### Scenario: User menu
- **WHEN** a user is logged in
- **THEN** their avatar/name appears in the header
- **THEN** clicking shows dropdown: My Profile, My Projects, Settings, Logout
