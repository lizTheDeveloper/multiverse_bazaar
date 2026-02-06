## ADDED Requirements

### Requirement: Ideas Board
Users can browse ideas.

#### Scenario: Ideas tab
- **WHEN** a user opens the Ideas tab
- **THEN** they see a list of open ideas
- **THEN** each idea shows: title, looking_for, creator name

#### Scenario: Pull to refresh
- **WHEN** a user pulls down
- **THEN** the ideas list refreshes

### Requirement: Idea Detail
Users can view idea details.

#### Scenario: Idea detail screen
- **WHEN** a user taps an idea
- **THEN** they see: title, full description, looking_for, creator info, status

### Requirement: Express Interest
Users can express interest in ideas.

#### Scenario: Interest button
- **WHEN** an authenticated user (not creator) views an idea
- **THEN** an "I'm Interested" button is visible

#### Scenario: Interest submission
- **WHEN** a user taps "I'm Interested"
- **THEN** a modal allows adding an optional message
- **THEN** on submit, interest is recorded

#### Scenario: Already interested
- **WHEN** a user has already expressed interest
- **THEN** button shows "Interest Sent" (disabled)

### Requirement: Idea Creation
Authenticated users can post ideas.

#### Scenario: New idea
- **WHEN** an authenticated user wants to post an idea
- **THEN** they can access a form from the Ideas tab

#### Scenario: Idea form
- **WHEN** creating an idea
- **THEN** form includes: title, description, looking_for

### Requirement: View Interested Users
Idea creators can see who is interested.

#### Scenario: Interest list
- **WHEN** an idea creator views their idea
- **THEN** they see a list of interested users with their messages
