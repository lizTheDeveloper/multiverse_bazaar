## ADDED Requirements

### Requirement: Collaborator Data Model
Collaborators link users to projects with specific roles.

#### Scenario: Collaborator fields
- **WHEN** a collaborator record exists
- **THEN** it contains: id, user_id, project_id, role, created_at

#### Scenario: Collaborator roles
- **WHEN** a collaborator has a role
- **THEN** it is one of: "creator", "contributor", "advisor"
- **THEN** each project has exactly one "creator"

### Requirement: Creator Assignment
Project creators are automatically assigned on project creation.

#### Scenario: Creator on new project
- **WHEN** a user creates a project
- **THEN** they are automatically added as a collaborator with role "creator"

#### Scenario: Creator uniqueness
- **WHEN** a project exists
- **THEN** exactly one collaborator has role "creator"
- **THEN** creator role cannot be changed or reassigned

### Requirement: Inviting Collaborators
Creators can invite collaborators to their projects.

#### Scenario: Inviting existing user
- **WHEN** a creator invites an existing user (by email) to a project
- **THEN** a collaborator record is created with the specified role
- **THEN** a notification is sent to the invited user

#### Scenario: Inviting external user
- **WHEN** a creator invites an email not in the system
- **THEN** a new external user is created (is_external=true, invited_by_id=creator)
- **THEN** the external user is added as collaborator
- **THEN** the external user can now authenticate

#### Scenario: Duplicate invite
- **WHEN** a creator invites someone already on the project
- **THEN** the operation fails with "User already a collaborator"

### Requirement: Removing Collaborators
Creators can remove collaborators from their projects.

#### Scenario: Removing a collaborator
- **WHEN** a creator removes a collaborator (non-creator)
- **THEN** the collaborator record is deleted

#### Scenario: Removing creator
- **WHEN** anyone tries to remove the creator
- **THEN** the operation fails with "Cannot remove project creator"

### Requirement: Leaving Projects
Collaborators can leave projects they're on.

#### Scenario: Leaving a project
- **WHEN** a contributor or advisor leaves a project
- **THEN** their collaborator record is deleted

#### Scenario: Creator leaving
- **WHEN** the creator tries to leave
- **THEN** the operation fails with "Creator cannot leave project; delete the project instead"

### Requirement: Listing Collaborators
Projects display their collaborators.

#### Scenario: Viewing project collaborators
- **WHEN** a project is viewed
- **THEN** all collaborators are listed with their roles and profile info
- **THEN** collaborators are ordered: creator first, then by created_at
