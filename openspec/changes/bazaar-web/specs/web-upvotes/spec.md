## ADDED Requirements

### Requirement: Upvote Button
Projects have an upvote button.

#### Scenario: Upvote button display
- **WHEN** viewing a project (card or detail)
- **THEN** an upvote button is visible with current count

#### Scenario: Upvote state for authenticated users
- **WHEN** an authenticated user views a project they upvoted
- **THEN** the button shows "upvoted" state (filled/highlighted)

#### Scenario: Upvote state for unauthenticated users
- **WHEN** an unauthenticated user views the upvote button
- **THEN** button appears but clicking prompts login

### Requirement: Upvote Interaction
Users can toggle their upvote.

#### Scenario: Adding upvote
- **WHEN** an authenticated user clicks upvote on a project they haven't upvoted
- **THEN** the count increments immediately (optimistic update)
- **THEN** the button shows upvoted state
- **THEN** API call is made in background

#### Scenario: Removing upvote
- **WHEN** an authenticated user clicks upvote on a project they already upvoted
- **THEN** the count decrements immediately
- **THEN** the button shows non-upvoted state

#### Scenario: Optimistic update failure
- **WHEN** an upvote API call fails
- **THEN** the UI reverts to previous state
- **THEN** an error toast is shown

### Requirement: Upvote Feedback
Upvoting provides visual feedback.

#### Scenario: Animation
- **WHEN** an upvote is toggled
- **THEN** a subtle animation plays (e.g., heart pulse, count tick)

#### Scenario: Disabled during request
- **WHEN** an upvote request is in flight
- **THEN** the button is temporarily disabled to prevent double-clicks
