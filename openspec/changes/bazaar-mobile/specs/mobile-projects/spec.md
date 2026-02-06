## ADDED Requirements

### Requirement: Project Gallery
Users can browse projects.

#### Scenario: Gallery tab
- **WHEN** a user opens the Projects tab
- **THEN** they see a scrollable list of project cards
- **THEN** each card shows: image, title, description preview, upvote count

#### Scenario: Pull to refresh
- **WHEN** a user pulls down on the list
- **THEN** the project list refreshes

#### Scenario: Infinite scroll
- **WHEN** a user scrolls to the bottom
- **THEN** more projects are loaded automatically

### Requirement: Project Detail
Users can view project details.

#### Scenario: Project detail screen
- **WHEN** a user taps a project card
- **THEN** they see full details: title, description, links, image, collaborators

#### Scenario: External links
- **WHEN** a user taps a project URL or repo link
- **THEN** it opens in the in-app browser or external browser

### Requirement: Project Creation
Authenticated users can create projects.

#### Scenario: New project button
- **WHEN** an authenticated user is on the projects tab
- **THEN** a floating action button (FAB) or header button allows new project

#### Scenario: Project form
- **WHEN** creating a project
- **THEN** form includes: title, description, url, repo_url, image (camera/gallery), status

#### Scenario: Camera capture
- **WHEN** adding an image
- **THEN** user can choose from camera or photo gallery
- **THEN** image is uploaded after form submission

### Requirement: Project Editing
Creators can edit their projects.

#### Scenario: Edit access
- **WHEN** a creator views their project detail
- **THEN** an edit button is available in header/menu

#### Scenario: Edit form
- **WHEN** a creator edits their project
- **THEN** form is pre-filled with current values

### Requirement: Project Deletion
Creators can delete their projects.

#### Scenario: Delete action
- **WHEN** a creator chooses delete from options
- **THEN** a confirmation alert appears
- **THEN** on confirm, project is deleted and user returns to gallery
