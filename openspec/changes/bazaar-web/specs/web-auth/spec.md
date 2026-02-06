## ADDED Requirements

### Requirement: Login Flow
Users can log in with their Multiverse email.

#### Scenario: Login page
- **WHEN** an unauthenticated user visits a protected route
- **THEN** they are redirected to the login page
- **THEN** login page shows email input and submit button

#### Scenario: Successful login
- **WHEN** a user enters a valid Multiverse email and submits
- **THEN** they receive a JWT token stored in localStorage/secure storage
- **THEN** they are redirected to their original destination or home

#### Scenario: Failed login
- **WHEN** a user enters an unknown email
- **THEN** an error message is displayed: "Account not found"

### Requirement: Logout
Users can log out.

#### Scenario: Logout action
- **WHEN** an authenticated user clicks logout
- **THEN** their token is cleared
- **THEN** they are redirected to the home page

### Requirement: Protected Routes
Some routes require authentication.

#### Scenario: Protected route access
- **WHEN** an unauthenticated user tries to access: post project, post idea, upvote, profile edit
- **THEN** they are redirected to login

#### Scenario: Public routes
- **WHEN** any user accesses: project gallery, project detail, ideas board, idea detail, user profiles
- **THEN** the content is displayed without login

### Requirement: Auth State
Auth state persists across page refreshes.

#### Scenario: Token persistence
- **WHEN** a logged-in user refreshes the page
- **THEN** they remain logged in (token read from storage)

#### Scenario: Token expiration
- **WHEN** an API call returns 401
- **THEN** the user is logged out and redirected to login
