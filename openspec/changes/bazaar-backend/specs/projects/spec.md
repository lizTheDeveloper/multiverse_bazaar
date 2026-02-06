## ADDED Requirements

### Requirement: Project Data Model
Projects are the primary content type for showcasing shipped work.

#### Scenario: Project fields
- **WHEN** a project is created or viewed
- **THEN** it contains: id, title, description, url (optional), repo_url (optional), image_url (optional), status, is_featured, created_at, updated_at

#### Scenario: Project statuses
- **WHEN** a project has a status
- **THEN** it is one of: "building", "launched"
- **THEN** default status is "launched"

### Requirement: Project Creation
Authenticated users can create projects.

#### Scenario: Creating a project
- **WHEN** an authenticated user creates a project with title and description
- **THEN** a project is created with the user as creator (via collaborators)
- **THEN** the project appears in the gallery

#### Scenario: Required fields
- **WHEN** creating a project without title or description
- **THEN** creation fails with validation error

### Requirement: Project Updates
Project creators can update their projects.

#### Scenario: Updating a project
- **WHEN** a collaborator with "creator" role updates a project
- **THEN** they can change: title, description, url, repo_url, image_url, status

#### Scenario: Non-creator update attempt
- **WHEN** a non-creator tries to update a project
- **THEN** the update is rejected with 403 Forbidden

### Requirement: Project Deletion
Project creators can delete their projects.

#### Scenario: Deleting a project
- **WHEN** a collaborator with "creator" role deletes a project
- **THEN** the project and all associated data (collaborators, upvotes) are removed

### Requirement: Project Featuring
Projects can be featured by administrators (manual DB flag).

#### Scenario: Featured projects
- **WHEN** a project has is_featured=true
- **THEN** it appears in featured sections/filters
- **THEN** only database administrators can set this flag (no API endpoint)

### Requirement: Project Gallery
Projects are listable with filtering and pagination.

#### Scenario: Listing projects
- **WHEN** requesting the project gallery
- **THEN** projects are returned paginated (default 20 per page)
- **THEN** ordered by created_at descending by default

#### Scenario: Filtering projects
- **WHEN** filtering projects
- **THEN** can filter by: status, is_featured, creator_id
- **THEN** can search by title/description text

### Requirement: Image Upload
Projects can have images uploaded.

#### Scenario: Uploading project image
- **WHEN** a creator uploads an image for a project
- **THEN** the image is stored locally (initially) or in Google Cloud Buckets (later)
- **THEN** image_url is updated to point to the stored image
