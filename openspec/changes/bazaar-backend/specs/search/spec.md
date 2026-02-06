## ADDED Requirements

### Requirement: Full-Text Search
Users can search across projects and ideas.

#### Scenario: Search endpoint
- **WHEN** a user submits a search query
- **THEN** results include matching projects and ideas
- **THEN** results are ranked by relevance

#### Scenario: Searchable fields - Projects
- **WHEN** searching projects
- **THEN** search matches against: title, description

#### Scenario: Searchable fields - Ideas
- **WHEN** searching ideas
- **THEN** search matches against: title, description, looking_for

### Requirement: Search Filtering
Search results can be filtered.

#### Scenario: Filter by type
- **WHEN** a search includes type filter
- **THEN** results can be limited to: "projects", "ideas", or "all" (default)

#### Scenario: Filter by status
- **WHEN** a search includes status filter
- **THEN** projects can be filtered by: building, launched
- **THEN** ideas can be filtered by: open, closed, graduated

#### Scenario: Filter by featured
- **WHEN** a search includes featured filter
- **THEN** only featured projects are returned (ideas cannot be featured)

### Requirement: Search Pagination
Search results are paginated.

#### Scenario: Paginated results
- **WHEN** search returns many results
- **THEN** results are paginated (default 20 per page)
- **THEN** total count is included in response

### Requirement: Search Implementation
Search uses database full-text capabilities.

#### Scenario: PostgreSQL full-text
- **WHEN** search is implemented
- **THEN** use PostgreSQL full-text search (ts_vector, ts_query)
- **THEN** create appropriate indexes for performance

#### Scenario: Search ranking
- **WHEN** results are ranked
- **THEN** use ts_rank for relevance scoring
- **THEN** optionally boost by upvote count or recency
