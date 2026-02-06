## ADDED Requirements

### Requirement: Collaborators Display
Projects show their collaborators.

#### Scenario: Collaborators on project card
- **WHEN** viewing a project card
- **THEN** collaborator avatars are shown (max 3-4, +N more)

#### Scenario: Collaborators on project detail
- **WHEN** viewing project detail
- **THEN** full collaborator list is shown with: avatar, name, role badge
- **THEN** clicking a collaborator goes to their profile

### Requirement: Invite Collaborators
Creators can invite collaborators.

#### Scenario: Invite button
- **WHEN** a creator views their project
- **THEN** they see an "Invite Collaborator" button

#### Scenario: Invite form
- **WHEN** a creator clicks Invite
- **THEN** a modal/form appears with: email input, role selector (contributor/advisor)

#### Scenario: Inviting existing user
- **WHEN** a creator invites an email that exists in the system
- **THEN** that user is added as collaborator
- **THEN** success message shown

#### Scenario: Inviting external user
- **WHEN** a creator invites an email not in the system
- **THEN** an external collaborator account is created
- **THEN** they are added to the project
- **THEN** message indicates external user was created

#### Scenario: Duplicate invite
- **WHEN** a creator invites someone already on the project
- **THEN** error message: "Already a collaborator"

### Requirement: Remove Collaborators
Creators can remove collaborators.

#### Scenario: Remove button
- **WHEN** a creator views their project's collaborator list
- **THEN** each non-creator collaborator has a remove button

#### Scenario: Remove confirmation
- **WHEN** a creator clicks remove
- **THEN** a confirmation appears
- **THEN** on confirm, collaborator is removed

### Requirement: Leave Project
Collaborators can leave projects.

#### Scenario: Leave button
- **WHEN** a non-creator collaborator views a project they're on
- **THEN** they see a "Leave Project" button

#### Scenario: Leave confirmation
- **WHEN** a collaborator clicks Leave
- **THEN** a confirmation appears
- **THEN** on confirm, they are removed from the project

#### Scenario: Creator cannot leave
- **WHEN** a creator views their project
- **THEN** no Leave button is shown (they must delete the project)
