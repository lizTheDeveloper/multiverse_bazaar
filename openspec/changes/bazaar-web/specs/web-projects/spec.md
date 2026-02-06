## ADDED Requirements

### Requirement: Project Gallery
Users can browse all projects.

#### Scenario: Gallery view
- **WHEN** a user visits the projects page
- **THEN** they see a grid/list of project cards
- **THEN** each card shows: title, description preview, image (if any), upvote count, collaborators

#### Scenario: Pagination
- **WHEN** there are more than 20 projects
- **THEN** pagination controls are shown (infinite scroll or page numbers)

#### Scenario: Filtering
- **WHEN** a user applies filters
- **THEN** they can filter by: status (building/launched), featured only
- **THEN** filters update the URL for shareability

### Requirement: Project Detail
Users can view full project details.

#### Scenario: Detail page
- **WHEN** a user clicks a project card
- **THEN** they see the full project page with: title, description, links, image, status, collaborators list with roles, upvote count

#### Scenario: Upvote display
- **WHEN** an authenticated user views a project
- **THEN** they see whether they've already upvoted (button state)

### Requirement: Project Creation
Authenticated users can create projects.

#### Scenario: Create form
- **WHEN** an authenticated user clicks "New Project"
- **THEN** they see a form with: title, description, url (optional), repo_url (optional), image upload, status

#### Scenario: Successful creation
- **WHEN** a user submits a valid project
- **THEN** they are redirected to the new project's detail page

#### Scenario: Validation errors
- **WHEN** a user submits without required fields
- **THEN** validation errors are shown inline

### Requirement: Project Editing
Creators can edit their projects.

#### Scenario: Edit access
- **WHEN** a creator views their project
- **THEN** they see an "Edit" button

#### Scenario: Edit form
- **WHEN** a creator clicks Edit
- **THEN** they see a pre-filled form with current values
- **THEN** they can update and save

### Requirement: Project Deletion
Creators can delete their projects.

#### Scenario: Delete action
- **WHEN** a creator clicks Delete
- **THEN** a confirmation dialog appears
- **THEN** on confirm, the project is deleted and user redirected to gallery

### Requirement: Image Upload
Projects can have images.

#### Scenario: Image upload in form
- **WHEN** creating or editing a project
- **THEN** user can upload an image via file picker
- **THEN** image preview is shown before submission
