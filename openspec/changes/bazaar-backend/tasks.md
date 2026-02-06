## 1. Project Setup

- [ ] 1.1 Initialize `packages/api/` with TypeScript, tsconfig (strict mode)
- [ ] 1.2 Initialize `packages/shared/` for shared types and utilities
- [ ] 1.3 Set up monorepo workspace (npm/pnpm workspaces)
- [ ] 1.4 Add ESLint and Prettier configuration (shared across packages)
- [ ] 1.5 Set up Vitest for testing (with coverage reporting)
- [ ] 1.6 Configure CI pipeline (type check, lint, test, coverage gate >80%)

## 2. Architectural Foundations

- [ ] 2.1 Create Result<T, E> type in packages/shared with ok/error helpers
- [ ] 2.2 Create base error types (NotFoundError, ValidationError, AuthError, etc.)
- [ ] 2.3 Create typed Config module with Zod validation for env vars
- [ ] 2.4 Set up structured JSON logger with request ID support
- [ ] 2.5 Create DI container type and factory function
- [ ] 2.6 Set up Hono app with middleware composition pattern
- [ ] 2.7 Create base repository interface pattern in shared/
- [ ] 2.8 Add consistent API response envelope types ({ data } / { error })
- [ ] 2.9 Write architecture tests (module boundaries, no circular deps)
- [ ] 2.10 Create first vertical slice module scaffold (empty projects/ module)

## 3. Database Schema

- [ ] 3.1 Configure Prisma with PostgreSQL connection
- [ ] 3.2 Create Prisma schema with core models (users, projects, collaborators)
- [ ] 3.3 Add remaining models (ideas, idea_interests, upvotes, notifications, push_tokens)
- [ ] 3.4 Add security/privacy models (pending_invitations, consent_records, data_requests, audit_logs, refresh_tokens)
- [ ] 3.5 Add PostgreSQL enums for status fields and roles
- [ ] 3.6 Set up full-text search indexes on projects and ideas
- [ ] 3.7 Add privacy fields to users (deleted_at, deletion_requested_at, anonymized_at, privacy_settings)
- [ ] 3.8 Create initial migration
- [ ] 3.9 Add seed script with sample data for development
- [ ] 3.10 Write migration reversibility tests

## 4. Authentication Module (Hardened)

- [ ] 4.1 Create auth/ module with vertical slice structure
- [ ] 4.2 Define IAuthRepository interface and Prisma implementation
- [ ] 4.3 Create AuthService with Result return types
- [ ] 4.4 Create auth middleware for JWT access token validation
- [ ] 4.5 Implement short-lived access tokens (15 min) + refresh tokens (7 days)
- [ ] 4.6 Implement POST /auth/login with rate limiting (5 per email per 15 min)
- [ ] 4.7 Implement POST /auth/refresh for token renewal
- [ ] 4.8 Implement POST /auth/logout with token revocation
- [ ] 4.9 Set up httpOnly cookie handling for refresh tokens (web)
- [ ] 4.10 Prevent email enumeration (identical responses for known/unknown)
- [ ] 4.11 Create user record on first login (sync from students table)
- [ ] 4.12 Add optional auth middleware for public endpoints
- [ ] 4.13 Record consent on account creation
- [ ] 4.14 Write unit tests for AuthService (>90% coverage)
- [ ] 4.15 Write integration tests for auth flow

## 5. Users Module

- [ ] 5.1 Create users/ module with vertical slice structure
- [ ] 5.2 Define IUserRepository interface and Prisma implementation
- [ ] 5.3 Create UserService with Result return types
- [ ] 5.4 Implement GET /users/me (current user profile)
- [ ] 5.5 Implement PATCH /users/me (update profile) with input sanitization
- [ ] 5.6 Implement GET /users/:id (public profile with projects)
- [ ] 5.7 Implement GET /me/privacy-settings
- [ ] 5.8 Implement PATCH /me/privacy-settings
- [ ] 5.9 Write unit tests for UserService (>90% coverage)

## 6. Projects Module (First Full Vertical Slice)

- [ ] 6.1 Create projects/ module with vertical slice structure
- [ ] 6.2 Define IProjectRepository interface and Prisma implementation
- [ ] 6.3 Create ProjectService with Result return types
- [ ] 6.4 Create Zod validation schemas for project inputs
- [ ] 6.5 Implement GET /projects (list with pagination, filtering)
- [ ] 6.6 Implement POST /projects (create with auto creator collaborator)
- [ ] 6.7 Implement GET /projects/:id (detail with collaborators, upvote count)
- [ ] 6.8 Implement PATCH /projects/:id (update, creator only)
- [ ] 6.9 Implement DELETE /projects/:id (delete, creator only)
- [ ] 6.10 Write unit tests for ProjectService (>90% coverage)
- [ ] 6.11 Write integration tests for projects endpoints
- [ ] 6.12 Verify module isolation (no imports from other feature modules)

## 7. Collaborators Module (with Consent Flow)

- [ ] 7.1 Create collaborators/ module with vertical slice structure
- [ ] 7.2 Define ICollaboratorRepository and IInvitationRepository interfaces
- [ ] 7.3 Create CollaboratorService with Result return types
- [ ] 7.4 Implement POST /projects/:id/collaborators (create pending_invitation, NOT user)
- [ ] 7.5 Send invitation email with unique accept token
- [ ] 7.6 Implement GET /invitations/:token (view invitation details)
- [ ] 7.7 Implement POST /invitations/:token/accept (create user with consent)
- [ ] 7.8 Implement POST /invitations/:token/decline
- [ ] 7.9 Implement DELETE /projects/:id/collaborators/:userId (remove)
- [ ] 7.10 Add role validation (one creator per project)
- [ ] 7.11 Rate limit invitation creation
- [ ] 7.12 Write unit tests for CollaboratorService (>90% coverage)

## 8. Upvotes Module

- [ ] 8.1 Create upvotes/ module with vertical slice structure
- [ ] 8.2 Define IUpvoteRepository interface
- [ ] 8.3 Create UpvoteService with Result return types
- [ ] 8.4 Implement POST /projects/:id/upvote
- [ ] 8.5 Implement DELETE /projects/:id/upvote
- [ ] 8.6 Add upvote status to project responses (has_upvoted for auth'd users)
- [ ] 8.7 Trigger karma recalculation on upvote changes
- [ ] 8.8 Write unit tests for UpvoteService

## 9. Ideas Module

- [ ] 9.1 Create ideas/ module with vertical slice structure
- [ ] 9.2 Define IIdeaRepository interface and Prisma implementation
- [ ] 9.3 Create IdeaService with Result return types
- [ ] 9.4 Implement GET /ideas (list with pagination, filtering)
- [ ] 9.5 Implement POST /ideas (create)
- [ ] 9.6 Implement GET /ideas/:id (detail with interested users for creator)
- [ ] 9.7 Implement PATCH /ideas/:id (update, creator only)
- [ ] 9.8 Implement DELETE /ideas/:id (delete, creator only)
- [ ] 9.9 Implement POST /ideas/:id/interest (express interest)
- [ ] 9.10 Implement POST /ideas/:id/graduate (create project from idea)
- [ ] 9.11 Write unit tests for IdeaService (>90% coverage)

## 10. Karma Module

- [ ] 10.1 Create karma/ module with vertical slice structure
- [ ] 10.2 Create pure karma calculation function (easily testable)
- [ ] 10.3 Create KarmaService with Result return types
- [ ] 10.4 Implement karma recalculation triggers (upvote, collaborator changes)
- [ ] 10.5 Add karma to user profile responses
- [ ] 10.6 Write comprehensive unit tests for karma calculation
- [ ] 10.7 Consider database trigger vs application-level (prefer application for testability)

## 11. Search Module

- [ ] 11.1 Create search/ module with vertical slice structure
- [ ] 11.2 Set up PostgreSQL full-text search configuration
- [ ] 11.3 Create SearchService with Result return types
- [ ] 11.4 Implement GET /search with type filtering
- [ ] 11.5 Add relevance ranking with ts_rank
- [ ] 11.6 Support pagination in search results
- [ ] 11.7 Write unit tests for SearchService

## 12. Notifications Module

- [ ] 12.1 Create notifications/ module with vertical slice structure
- [ ] 12.2 Define INotificationRepository interface
- [ ] 12.3 Create NotificationService with Result return types
- [ ] 12.4 Implement notification triggers (upvote, invite, interest)
- [ ] 12.5 Implement GET /notifications (list user's notifications)
- [ ] 12.6 Implement PATCH /notifications/:id/read
- [ ] 12.7 Set up Firebase Admin SDK for push delivery
- [ ] 12.8 Implement POST /notifications/push-token (register device)
- [ ] 12.9 Send push notifications on notification creation
- [ ] 12.10 Write unit tests for NotificationService

## 13. File Uploads Module (Secure)

- [ ] 13.1 Create uploads/ module with vertical slice structure
- [ ] 13.2 Define IStorageService interface (abstraction for local/cloud)
- [ ] 13.3 Implement LocalStorageAdapter
- [ ] 13.4 Create UploadService with Result return types
- [ ] 13.5 Implement POST /uploads/image endpoint with rate limiting
- [ ] 13.6 Add file size validation (max 5MB, reject before full read)
- [ ] 13.7 Add MIME type validation via magic bytes (not just extension)
- [ ] 13.8 Strip EXIF metadata from images (GPS, camera info, etc.)
- [ ] 13.9 Generate UUID filenames (no user-provided names)
- [ ] 13.10 Store files outside web root
- [ ] 13.11 Serve uploaded files via dedicated secure endpoint
- [ ] 13.12 Write unit tests for UploadService

## 14. Security Infrastructure

- [ ] 14.1 Create centralized authorize() function for permission checks
- [ ] 14.2 Set up rate limiting middleware (Redis or in-memory)
- [ ] 14.3 Configure rate limit tiers per endpoint type
- [ ] 14.4 Add security headers middleware (X-Content-Type-Options, X-Frame-Options, etc.)
- [ ] 14.5 Configure CORS with specific allowed origins (no wildcards)
- [ ] 14.6 Create input validation middleware using Zod schemas
- [ ] 14.7 Add HTML sanitization for user-generated content (DOMPurify or similar)
- [ ] 14.8 Create shared validation schemas in packages/shared
- [ ] 14.9 Write unit tests for authorize() function

## 15. Audit Logging Module

- [ ] 15.1 Create audit/ module with vertical slice structure
- [ ] 15.2 Create AuditService with typed event recording
- [ ] 15.3 Log authentication events (login success/failure)
- [ ] 15.4 Log authorization failures
- [ ] 15.5 Log data modification events (delete project, delete idea)
- [ ] 15.6 Log external user creation events
- [ ] 15.7 Log sensitive data access (exports, deletion requests)
- [ ] 15.8 Set up log retention (1 year identified, 3 years anonymized)
- [ ] 15.9 Write unit tests for AuditService

## 16. GDPR / Privacy Module

- [ ] 16.1 Create privacy/ module with vertical slice structure
- [ ] 16.2 Create PrivacyService with Result return types
- [ ] 16.3 Implement GET /me/data-export (compile all user data)
- [ ] 16.4 Create data export format (JSON with metadata)
- [ ] 16.5 Implement DELETE /me (account deletion request)
- [ ] 16.6 Build deletion options UI support (anonymize vs full delete)
- [ ] 16.7 Implement 30-day deletion grace period
- [ ] 16.8 Create anonymization function (replace PII with "[Deleted User]")
- [ ] 16.9 Create full deletion function (cascade delete all user data)
- [ ] 16.10 Log all data requests in data_requests table
- [ ] 16.11 Create consent recording service
- [ ] 16.12 Implement GET /privacy-policy endpoint
- [ ] 16.13 Write unit tests for PrivacyService (>90% coverage)

## 17. Data Retention Jobs

- [ ] 17.1 Create jobs/ module for scheduled tasks
- [ ] 17.2 Create scheduled job runner (node-cron or similar)
- [ ] 17.3 Implement pending_invitations cleanup (30 days)
- [ ] 17.4 Implement inactive push_tokens cleanup (90 days)
- [ ] 17.5 Implement audit_logs anonymization (1 year)
- [ ] 17.6 Implement audit_logs deletion (3 years)
- [ ] 17.7 Implement orphaned file cleanup (30 days)
- [ ] 17.8 Implement soft-deleted user finalization (30 days)
- [ ] 17.9 Write unit tests for each retention job

## 18. Final Integration & Documentation

- [ ] 18.1 Verify all modules follow vertical slice pattern
- [ ] 18.2 Run full test suite, ensure >80% overall coverage
- [ ] 18.3 Verify no circular dependencies between modules
- [ ] 18.4 Generate OpenAPI spec from routes
- [ ] 18.5 Create ADRs for key architectural decisions
- [ ] 18.6 Document security decisions and threat model
- [ ] 18.7 Set up npm audit in CI pipeline
- [ ] 18.8 Performance test critical paths (search, list endpoints)
- [ ] 18.9 Load test rate limiting configuration
