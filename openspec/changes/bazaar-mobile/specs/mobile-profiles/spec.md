## ADDED Requirements

### Requirement: Profile Screen
Users can view profiles.

#### Scenario: Profile view
- **WHEN** a user taps on someone's avatar or name
- **THEN** they see the profile screen: name, avatar, bio, karma, projects

#### Scenario: Projects list
- **WHEN** viewing a profile
- **THEN** projects are listed with role badges
- **THEN** tapping a project goes to project detail

### Requirement: My Profile Tab
Authenticated users have a profile tab.

#### Scenario: Profile tab
- **WHEN** an authenticated user opens Profile tab
- **THEN** they see their own profile with edit option

#### Scenario: Guest profile tab
- **WHEN** a guest opens Profile tab
- **THEN** they see a prompt to log in

### Requirement: Profile Editing
Users can edit their profile.

#### Scenario: Edit profile
- **WHEN** a user taps Edit on their profile
- **THEN** they can change: name, bio, avatar

#### Scenario: Avatar update
- **WHEN** changing avatar
- **THEN** user can take photo or choose from gallery

### Requirement: Karma Display
Karma is displayed on profiles.

#### Scenario: Karma visibility
- **WHEN** viewing any profile
- **THEN** karma is prominently displayed with context
