## ADDED Requirements

### Requirement: Search Interface
Users can search across projects and ideas.

#### Scenario: Search bar
- **WHEN** a user is on any page
- **THEN** a search bar is visible in the header/navigation

#### Scenario: Search submission
- **WHEN** a user enters a query and submits
- **THEN** they are taken to a search results page

### Requirement: Search Results
Search results display matching projects and ideas.

#### Scenario: Results display
- **WHEN** search returns results
- **THEN** results are shown in a list with type indicator (project/idea)
- **THEN** matching text is highlighted

#### Scenario: Empty results
- **WHEN** no results match the query
- **THEN** a friendly "No results found" message is shown
- **THEN** suggestions to broaden search or browse categories

### Requirement: Search Filtering
Users can filter search results.

#### Scenario: Type filter
- **WHEN** on search results
- **THEN** user can filter by: All, Projects only, Ideas only

#### Scenario: Status filter
- **WHEN** filtering search results
- **THEN** user can filter projects by status
- **THEN** user can filter ideas by status

### Requirement: Search Pagination
Search results are paginated.

#### Scenario: Many results
- **WHEN** search returns many results
- **THEN** results are paginated
- **THEN** total result count is shown

### Requirement: URL State
Search state is reflected in URL.

#### Scenario: Shareable search
- **WHEN** a search is performed with filters
- **THEN** the URL reflects query and filters
- **THEN** sharing the URL reproduces the same search
