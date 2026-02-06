## ADDED Requirements

### Requirement: Multiverse Student Authentication
Users with accounts in the existing Multiverse students table can authenticate using their email.

#### Scenario: Successful login
- **WHEN** a user provides an email that exists in the students table
- **THEN** they receive a session token and are authenticated

#### Scenario: Unknown email
- **WHEN** a user provides an email not in the students table and not an invited external collaborator
- **THEN** authentication fails with "Account not found"

### Requirement: External Collaborator Invite
Authenticated users can invite external collaborators who don't have Multiverse accounts.

#### Scenario: Inviting an external collaborator
- **WHEN** an authenticated user invites an external email to collaborate on a project
- **THEN** a user record is created with `is_external=true` and `invited_by_id` set to the inviter
- **THEN** the external user can authenticate with that email

#### Scenario: External collaborator access
- **WHEN** an external collaborator authenticates
- **THEN** they have full platform access (can post projects, upvote, etc.)

### Requirement: Public Access
Unauthenticated users can browse public content.

#### Scenario: Browsing without login
- **WHEN** an unauthenticated user accesses the project gallery or ideas board
- **THEN** they can view all public projects and ideas
- **THEN** they cannot upvote, post, or express interest

### Requirement: Session Management
Sessions are managed via JWT tokens.

#### Scenario: Token expiration
- **WHEN** a session token expires
- **THEN** API requests return 401 Unauthorized
- **THEN** the client must re-authenticate

#### Scenario: Logout
- **WHEN** a user logs out
- **THEN** their session token is invalidated
