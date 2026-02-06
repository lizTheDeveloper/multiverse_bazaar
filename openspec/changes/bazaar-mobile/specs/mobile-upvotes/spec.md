## ADDED Requirements

### Requirement: Upvote Button
Projects display upvote button.

#### Scenario: Upvote on card
- **WHEN** viewing project cards in list
- **THEN** upvote count is visible
- **THEN** authenticated users can tap to upvote

#### Scenario: Upvote on detail
- **WHEN** viewing project detail
- **THEN** larger upvote button with count is visible

### Requirement: Upvote Interaction
Users can toggle upvotes.

#### Scenario: Adding upvote
- **WHEN** an authenticated user taps upvote
- **THEN** count increments immediately (optimistic)
- **THEN** button shows filled/active state
- **THEN** haptic feedback is triggered

#### Scenario: Removing upvote
- **WHEN** a user taps upvote on already-upvoted project
- **THEN** count decrements immediately
- **THEN** button shows unfilled/inactive state

#### Scenario: Guest upvote attempt
- **WHEN** a guest taps upvote
- **THEN** login prompt appears

### Requirement: Upvote Feedback
Upvoting provides tactile feedback.

#### Scenario: Haptic feedback
- **WHEN** an upvote is toggled
- **THEN** light haptic feedback is triggered

#### Scenario: Visual feedback
- **WHEN** upvote state changes
- **THEN** subtle animation plays (scale, color transition)

### Requirement: Optimistic Updates
Upvotes update immediately.

#### Scenario: Network delay
- **WHEN** an upvote is tapped
- **THEN** UI updates before API response
- **THEN** on failure, UI reverts with error toast
