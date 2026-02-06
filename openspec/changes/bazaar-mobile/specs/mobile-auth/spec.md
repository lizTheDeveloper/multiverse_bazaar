## ADDED Requirements

### Requirement: Login Screen
Users can log in with their Multiverse email.

#### Scenario: Login screen
- **WHEN** an unauthenticated user opens the app
- **THEN** they see a login screen with email input and submit button
- **THEN** they can also browse as guest (limited functionality)

#### Scenario: Successful login
- **WHEN** a user enters a valid Multiverse email
- **THEN** token is securely stored (Expo SecureStore)
- **THEN** they are taken to the home screen

#### Scenario: Failed login
- **WHEN** a user enters an unknown email
- **THEN** an error alert is shown: "Account not found"

### Requirement: Persistent Login
Auth state persists across app launches.

#### Scenario: Token persistence
- **WHEN** a logged-in user closes and reopens the app
- **THEN** they remain logged in (token retrieved from SecureStore)

#### Scenario: Token expiration
- **WHEN** an API call returns 401
- **THEN** stored token is cleared
- **THEN** user is prompted to log in again

### Requirement: Guest Mode
Users can browse without logging in.

#### Scenario: Guest browsing
- **WHEN** an unauthenticated user chooses to browse as guest
- **THEN** they can view projects, ideas, and profiles
- **THEN** they cannot upvote, post, or express interest

#### Scenario: Guest action prompt
- **WHEN** a guest tries to perform an authenticated action
- **THEN** a prompt appears to log in

### Requirement: Logout
Users can log out.

#### Scenario: Logout action
- **WHEN** a user logs out from settings
- **THEN** token is cleared from SecureStore
- **THEN** they are taken to login screen
