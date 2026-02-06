## ADDED Requirements

### Requirement: Karma Calculation
Karma is a reputation score calculated from user contributions.

#### Scenario: Karma sources
- **WHEN** a user's karma is calculated
- **THEN** it includes points from:
  - Upvotes received on projects where user is a collaborator
  - Bonus for being a creator vs contributor vs advisor
  - Featured project bonus

#### Scenario: Karma formula
- **WHEN** calculating karma
- **THEN** the formula is:
  - Base: 1 point per upvote received on any project you're on
  - Role multiplier: creator gets 1.0x, contributor gets 0.5x, advisor gets 0.25x
  - Featured bonus: +10 points if any project you created is featured
  - Example: Project with 100 upvotes → creator gets 100, contributor gets 50, advisor gets 25

#### Scenario: Karma is cumulative
- **WHEN** karma is displayed
- **THEN** it's the sum across ALL projects the user has contributed to
- **THEN** karma never goes below 0

### Requirement: Karma Updates
Karma is recalculated when relevant events occur.

#### Scenario: Upvote adds karma
- **WHEN** a project receives an upvote
- **THEN** all collaborators' karma is recalculated
- **THEN** updates are reflected on their profiles

#### Scenario: Upvote removal reduces karma
- **WHEN** an upvote is removed from a project
- **THEN** all collaborators' karma is recalculated

#### Scenario: Collaborator changes
- **WHEN** a collaborator is added or removed from a project
- **THEN** affected users' karma is recalculated

### Requirement: Karma is Read-Only
Users cannot directly modify karma.

#### Scenario: No karma manipulation
- **WHEN** any API request attempts to set karma directly
- **THEN** the request is rejected
- **THEN** karma is only modified through the calculation system

### Requirement: Time Decay (Future)
Karma may incorporate time decay in the future.

#### Scenario: Time decay consideration
- **WHEN** karma system is designed
- **THEN** the schema supports adding time-weighted calculations later
- **THEN** initial implementation uses simple sum without decay
