## ADDED Requirements

### Requirement: Idea Data Model
Ideas are proposals for projects seeking collaborators.

#### Scenario: Idea fields
- **WHEN** an idea is created or viewed
- **THEN** it contains: id, title, description, looking_for (what kind of help needed), creator_id, status, created_at, updated_at

#### Scenario: Idea statuses
- **WHEN** an idea has a status
- **THEN** it is one of: "open" (seeking collaborators), "closed" (no longer recruiting), "graduated" (became a project)
- **THEN** default status is "open"

### Requirement: Idea Creation
Authenticated users can post ideas.

#### Scenario: Creating an idea
- **WHEN** an authenticated user creates an idea with title, description, and looking_for
- **THEN** an idea is created with status "open"
- **THEN** the idea appears on the ideas board

#### Scenario: Required fields
- **WHEN** creating an idea without title or description
- **THEN** creation fails with validation error

### Requirement: Idea Updates
Idea creators can update their ideas.

#### Scenario: Updating an idea
- **WHEN** the idea creator updates their idea
- **THEN** they can change: title, description, looking_for, status

#### Scenario: Non-creator update attempt
- **WHEN** a non-creator tries to update an idea
- **THEN** the update is rejected with 403 Forbidden

### Requirement: Expressing Interest
Users can express interest in collaborating on an idea.

#### Scenario: Expressing interest
- **WHEN** an authenticated user expresses interest in an idea
- **THEN** an idea_interest record is created with optional message
- **THEN** the idea creator can see who is interested

#### Scenario: Viewing interested users
- **WHEN** the idea creator views their idea
- **THEN** they see a list of users who expressed interest with their messages

#### Scenario: Duplicate interest
- **WHEN** a user tries to express interest twice on the same idea
- **THEN** the operation fails or updates the existing interest message

### Requirement: Idea Graduation
Ideas can graduate to become projects.

#### Scenario: Graduating an idea
- **WHEN** an idea creator graduates their idea to a project
- **THEN** a new project is created with the idea's title and description
- **THEN** the idea status changes to "graduated"
- **THEN** the idea links to the new project (graduated_to_project_id)
- **THEN** interested users can optionally be added as collaborators

### Requirement: Ideas Board Listing
Ideas are listable with filtering and pagination.

#### Scenario: Listing ideas
- **WHEN** requesting the ideas board
- **THEN** ideas are returned paginated (default 20 per page)
- **THEN** ordered by created_at descending by default
- **THEN** only "open" ideas shown by default (can filter to see others)

#### Scenario: Filtering ideas
- **WHEN** filtering ideas
- **THEN** can filter by: status, creator_id
- **THEN** can search by title/description/looking_for text
