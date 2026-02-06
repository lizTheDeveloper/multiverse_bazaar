## ADDED Requirements

### Requirement: Ideas Board
Users can browse ideas seeking collaborators.

#### Scenario: Ideas list view
- **WHEN** a user visits the ideas board
- **THEN** they see a list of ideas
- **THEN** each idea shows: title, description preview, looking_for, creator, interest count

#### Scenario: Default filter
- **WHEN** viewing the ideas board
- **THEN** only "open" ideas are shown by default
- **THEN** user can toggle to see closed/graduated ideas

#### Scenario: Pagination
- **WHEN** there are more than 20 ideas
- **THEN** pagination controls are shown

### Requirement: Idea Detail
Users can view full idea details.

#### Scenario: Detail page
- **WHEN** a user clicks an idea
- **THEN** they see: title, description, looking_for, creator profile link, status

#### Scenario: Interest list (creator only)
- **WHEN** the idea creator views their idea
- **THEN** they see a list of users who expressed interest with their messages

### Requirement: Idea Creation
Authenticated users can post ideas.

#### Scenario: Create form
- **WHEN** an authenticated user clicks "Post Idea"
- **THEN** they see a form with: title, description, looking_for

#### Scenario: Successful creation
- **WHEN** a user submits a valid idea
- **THEN** they are redirected to the new idea's detail page

### Requirement: Expressing Interest
Users can express interest in ideas.

#### Scenario: Interest button
- **WHEN** an authenticated user (not the creator) views an idea
- **THEN** they see an "I'm Interested" button

#### Scenario: Interest form
- **WHEN** a user clicks "I'm Interested"
- **THEN** they can optionally add a message
- **THEN** on submit, their interest is recorded

#### Scenario: Already interested
- **WHEN** a user has already expressed interest
- **THEN** the button shows "Interest Sent" (disabled)

### Requirement: Idea Graduation
Creators can graduate ideas to projects.

#### Scenario: Graduate button
- **WHEN** an idea creator views their open idea
- **THEN** they see a "Graduate to Project" button

#### Scenario: Graduation flow
- **WHEN** a creator clicks Graduate
- **THEN** a form appears pre-filled with idea title/description
- **THEN** on submit, a project is created and idea marked as graduated
- **THEN** user is redirected to the new project

### Requirement: Idea Management
Creators can edit and close their ideas.

#### Scenario: Edit idea
- **WHEN** an idea creator edits their idea
- **THEN** they can update title, description, looking_for, status

#### Scenario: Close idea
- **WHEN** a creator no longer needs collaborators
- **THEN** they can change status to "closed"
