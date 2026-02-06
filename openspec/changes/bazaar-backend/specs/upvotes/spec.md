## ADDED Requirements

### Requirement: Upvote Data Model
Upvotes are user endorsements of projects.

#### Scenario: Upvote fields
- **WHEN** an upvote exists
- **THEN** it contains: id, user_id, project_id, created_at

#### Scenario: Unique constraint
- **WHEN** an upvote is created
- **THEN** the (user_id, project_id) combination must be unique

### Requirement: Upvoting Projects
Authenticated users can upvote projects.

#### Scenario: Upvoting a project
- **WHEN** an authenticated user upvotes a project they haven't upvoted
- **THEN** an upvote record is created
- **THEN** the project's upvote count increases by 1
- **THEN** karma is attributed to project collaborators (via karma-system)

#### Scenario: Duplicate upvote
- **WHEN** a user tries to upvote a project they already upvoted
- **THEN** the operation fails with "Already upvoted"

#### Scenario: Self-upvote
- **WHEN** a user tries to upvote their own project (where they are a collaborator)
- **THEN** the upvote is allowed (users can endorse their own work)

### Requirement: Removing Upvotes
Users can remove their upvotes.

#### Scenario: Removing an upvote
- **WHEN** a user removes their upvote from a project
- **THEN** the upvote record is deleted
- **THEN** the project's upvote count decreases by 1
- **THEN** karma is adjusted accordingly

### Requirement: Upvote Counts
Projects display their upvote counts.

#### Scenario: Project upvote count
- **WHEN** a project is viewed
- **THEN** the total number of upvotes is included
- **THEN** if authenticated, whether the current user has upvoted is included

### Requirement: No Downvotes
The system only supports upvotes, not downvotes.

#### Scenario: Downvote attempt
- **WHEN** any attempt to downvote is made
- **THEN** no such endpoint or functionality exists
- **THEN** the minimum vote on a project is 0
