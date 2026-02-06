## Why

Multiverse students and alumni are building amazing projects—products, open-source tools, research, experiments—but there's no central place to celebrate and discover this work. We need a "Product Hunt for Multiverse" that showcases what the community is creating, enables collaboration on ideas, and builds reputation through community recognition.

This backend provides the API, database, and authentication foundation that powers both the web and mobile clients.

## What Changes

This is a greenfield project. We're building:
- PostgreSQL database schema for users, projects, ideas, collaborations, and karma
- RESTful API (or tRPC) for all operations
- Authentication layer that integrates with existing Multiverse students table
- Support for external collaborators via invite system
- Karma/reputation calculation system
- Push notification infrastructure

## Capabilities

### New Capabilities
- `user-auth`: Authentication using existing Multiverse students table, plus invite-based external collaborators
- `user-profiles`: User profiles with bio, avatar, karma score, and project history
- `projects`: Project gallery with CRUD, collaborator management, and featuring
- `ideas-board`: Ideas for recruiting collaborators, with interest expression and graduation to projects
- `upvotes`: Upvoting system for projects with karma attribution
- `collaborators`: Team management with roles (creator/contributor/advisor) and external invites
- `karma-system`: Reputation calculation based on upvotes received and collaboration activity
- `search`: Full-text search across projects and ideas
- `notifications`: Push notification events for upvotes and collaboration invites
- `security`: Authentication hardening, rate limiting, input validation, security headers, audit logging
- `privacy`: GDPR compliance including data export, account deletion, consent management, data retention
- `architecture`: Vertical slice modules, dependency injection, Result types, repository pattern, comprehensive testing

### Modified Capabilities
<!-- None - greenfield project -->

## Impact

- **Database**: New PostgreSQL schema with ~12 tables (including audit, consent, invitations)
- **API**: New Node.js/TypeScript API server
- **External Systems**: Integration with existing Multiverse students table
- **Infrastructure**: Will need push notification service (FCM/APNs) for mobile
- **Storage**: Local file storage initially, Google Cloud Buckets later for images
- **Security**: Rate limiting, JWT with refresh tokens, httpOnly cookies, audit logging
- **Privacy**: GDPR-compliant data handling, consent records, retention policies, export/deletion endpoints
- **Architecture**: Vertical slice modules, DI container, repository pattern, Result types for error handling, >80% test coverage
