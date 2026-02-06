## ADDED Requirements

### Requirement: Profile Data
Each user has a profile with display information and computed stats.

#### Scenario: Profile fields
- **WHEN** a user profile is created or viewed
- **THEN** it contains: id, email, name, avatar_url, bio, is_external, invited_by_id, karma, created_at

#### Scenario: Default profile
- **WHEN** a new user authenticates for the first time
- **THEN** a profile is created with name defaulting to email prefix, null avatar/bio, karma=0

### Requirement: Profile Updates
Users can update their own profile information.

#### Scenario: Updating profile
- **WHEN** an authenticated user updates their profile
- **THEN** they can change: name, avatar_url, bio
- **THEN** they cannot change: email, is_external, invited_by_id, karma

### Requirement: Profile Public View
Profiles are publicly viewable.

#### Scenario: Viewing any profile
- **WHEN** any user (authenticated or not) requests a profile by ID
- **THEN** they see: name, avatar_url, bio, karma, projects created, projects contributed to

#### Scenario: Profile project list
- **WHEN** viewing a profile
- **THEN** it shows all projects where the user is a collaborator (any role)
- **THEN** projects are ordered by created_at descending

### Requirement: Karma Display
Karma is a computed value based on reputation.

#### Scenario: Karma on profile
- **WHEN** a profile is viewed
- **THEN** karma reflects the user's accumulated reputation score
- **THEN** karma is read-only (computed by karma-system)
