## Context

Building the backend API for Multiverse Bazaar, a community platform for showcasing projects and recruiting collaborators. This is a greenfield TypeScript project using Node.js and PostgreSQL.

The backend serves two clients (web and mobile) and integrates with an existing Multiverse students database for authentication.

## Goals / Non-Goals

**Goals:**
- RESTful API (or tRPC) serving both web and React Native clients
- PostgreSQL database with Prisma ORM
- JWT-based authentication checking existing students table
- Support for external collaborator invites
- Karma calculation system
- Push notification infrastructure (FCM)
- Full-text search using PostgreSQL
- Local file storage initially, Google Cloud Buckets later
- **Security-first**: Rate limiting, input validation, audit logging, secure token handling
- **Privacy by design**: GDPR compliance, consent management, data export/deletion, retention policies

**Non-Goals:**
- Docker containerization (explicitly excluded)
- Real-time WebSocket connections (not needed for v1)
- Admin UI (featuring is manual DB flag)
- Complex RBAC (simple ownership-based authorization is sufficient)

## Decisions

### API Framework: Hono
- Lightweight, fast, TypeScript-first
- Works great with Prisma
- Easy to deploy anywhere (no vendor lock-in)
- Alternative considered: Express (heavier), Fastify (similar but less TS-native)

### ORM: Prisma
- Type-safe database access
- Excellent TypeScript integration
- Built-in migrations
- Works well with PostgreSQL full-text search

### Code Architecture: Vertical Slices + Clean Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VERTICAL SLICE MODULE STRUCTURE                          │
└─────────────────────────────────────────────────────────────────────────────┘

packages/api/src/
├── modules/                    # Feature modules (vertical slices)
│   ├── projects/
│   │   ├── index.ts            # Public exports only
│   │   ├── projects.routes.ts  # Hono route handlers
│   │   ├── projects.service.ts # Business logic
│   │   ├── projects.repository.ts  # Database access
│   │   ├── projects.types.ts   # Module-specific types
│   │   ├── projects.errors.ts  # Typed error definitions
│   │   └── projects.test.ts    # Co-located tests
│   ├── ideas/
│   │   └── ...                 # Same structure
│   ├── users/
│   │   └── ...
│   ├── auth/
│   │   └── ...
│   ├── upvotes/
│   │   └── ...
│   └── notifications/
│       └── ...
├── shared/                     # Truly shared code (minimal!)
│   ├── result.ts               # Result<T,E> type
│   ├── errors.ts               # Base error types
│   ├── middleware/             # Shared middleware
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   └── validate.ts
│   └── utils/                  # Pure utility functions
├── infra/                      # Infrastructure concerns
│   ├── database.ts             # Prisma client setup
│   ├── container.ts            # Dependency injection setup
│   ├── logger.ts               # Structured logging
│   └── config.ts               # Environment config
├── app.ts                      # Hono app composition
└── main.ts                     # Entry point
```

### Result Type for Error Handling

```typescript
// shared/result.ts - No exceptions for expected errors
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Usage in service:
async function getProject(id: string): Promise<Result<Project, NotFoundError | DatabaseError>> {
  const project = await this.repo.findById(id);
  if (!project) {
    return { ok: false, error: new NotFoundError('Project', id) };
  }
  return { ok: true, value: project };
}

// Usage in route:
app.get('/projects/:id', async (c) => {
  const result = await projectService.getProject(c.req.param('id'));
  if (!result.ok) {
    return c.json({ error: result.error.toResponse() }, result.error.statusCode);
  }
  return c.json({ data: result.value });
});
```

### Repository Pattern

```typescript
// projects/projects.repository.ts
interface IProjectRepository {
  findById(id: string): Promise<Project | null>;
  findMany(filter: ProjectFilter, pagination: Pagination): Promise<Project[]>;
  create(data: CreateProjectData): Promise<Project>;
  update(id: string, data: UpdateProjectData): Promise<Project>;
  delete(id: string): Promise<void>;
}

// Implementation uses Prisma but interface is ORM-agnostic
class PrismaProjectRepository implements IProjectRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { id } });
  }
  // ...
}

// In tests, mock the interface:
const mockRepo: IProjectRepository = {
  findById: vi.fn().mockResolvedValue(testProject),
  // ...
};
```

### Dependency Injection Container

```typescript
// infra/container.ts
interface Container {
  prisma: PrismaClient;
  projectRepository: IProjectRepository;
  projectService: ProjectService;
  ideaRepository: IIdeaRepository;
  ideaService: IdeaService;
  // ...
}

function createContainer(config: Config): Container {
  const prisma = new PrismaClient();

  const projectRepository = new PrismaProjectRepository(prisma);
  const projectService = new ProjectService(projectRepository, /* other deps */);

  return { prisma, projectRepository, projectService, /* ... */ };
}

// In app.ts:
const container = createContainer(config);
app.use('*', (c, next) => {
  c.set('container', container);
  return next();
});
```

### Module Contract Example

```typescript
// projects/index.ts - ONLY export public API
export { projectRoutes } from './projects.routes';
export { ProjectService } from './projects.service';
export type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilter
} from './projects.types';

// DO NOT export:
// - Internal implementation details
// - Repository (other modules shouldn't access directly)
// - Private helper functions
```

### Authentication: Hardened JWT + existing students table
- Query existing `students` table by email for auth
- Issue short-lived access tokens (15 min) + refresh tokens (7 days)
- Access token: stored in memory (web) or SecureStore (mobile)
- Refresh token: httpOnly, secure, sameSite=strict cookie (web) or SecureStore (mobile)
- Token revocation list for logout (stored in Redis or DB)
- Rate limiting: 5 login attempts per email per 15 minutes
- No email enumeration: identical responses for known/unknown emails
- External collaborators: consent-based invitation flow (not immediate account creation)

### Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                   │
└─────────────────────────────────────────────────────────────────────────────┘

users
├── id: uuid (PK)
├── email: string (unique)
├── name: string
├── avatar_url: string?
├── bio: text?
├── is_external: boolean (default false)
├── invited_by_id: uuid? (FK → users)
├── karma: integer (default 0)
├── created_at: timestamp
└── updated_at: timestamp

projects
├── id: uuid (PK)
├── title: string
├── description: text
├── url: string?
├── repo_url: string?
├── image_url: string?
├── status: enum (building, launched)
├── is_featured: boolean (default false)
├── created_at: timestamp
└── updated_at: timestamp

collaborators
├── id: uuid (PK)
├── user_id: uuid (FK → users)
├── project_id: uuid (FK → projects)
├── role: enum (creator, contributor, advisor)
├── created_at: timestamp
└── UNIQUE(user_id, project_id)

ideas
├── id: uuid (PK)
├── title: string
├── description: text
├── looking_for: text
├── creator_id: uuid (FK → users)
├── status: enum (open, closed, graduated)
├── graduated_to_project_id: uuid? (FK → projects)
├── created_at: timestamp
└── updated_at: timestamp

idea_interests
├── id: uuid (PK)
├── user_id: uuid (FK → users)
├── idea_id: uuid (FK → ideas)
├── message: text?
├── created_at: timestamp
└── UNIQUE(user_id, idea_id)

upvotes
├── id: uuid (PK)
├── user_id: uuid (FK → users)
├── project_id: uuid (FK → projects)
├── created_at: timestamp
└── UNIQUE(user_id, project_id)

notifications
├── id: uuid (PK)
├── user_id: uuid (FK → users)
├── type: enum (upvote, collaboration_invite, idea_interest)
├── title: string
├── body: text
├── data: jsonb
├── read: boolean (default false)
└── created_at: timestamp

push_tokens
├── id: uuid (PK)
├── user_id: uuid (FK → users)
├── token: string (unique)
├── platform: enum (ios, android)
├── last_used_at: timestamp
└── created_at: timestamp

# SECURITY & PRIVACY TABLES

pending_invitations
├── id: uuid (PK)
├── email: string
├── invited_by_id: uuid (FK → users)
├── project_id: uuid (FK → projects)
├── role: enum (contributor, advisor)
├── token: string (unique)          # For accept link
├── expires_at: timestamp           # 30 days from creation
├── accepted_at: timestamp?
├── declined_at: timestamp?
└── created_at: timestamp

consent_records
├── id: uuid (PK)
├── user_id: uuid (FK → users)
├── consent_type: string            # account_creation, push_notifications, etc.
├── granted: boolean
├── granted_at: timestamp?
├── revoked_at: timestamp?
├── ip_address: inet
└── user_agent: text

data_requests
├── id: uuid (PK)
├── user_id: uuid (FK → users)
├── request_type: enum (export, deletion)
├── status: enum (pending, processing, completed)
├── options: jsonb                  # e.g., {delete_projects: true}
├── requested_at: timestamp
├── completed_at: timestamp?
└── metadata: jsonb

audit_logs
├── id: uuid (PK)
├── user_id: uuid? (nullable for failed logins)
├── action: string                  # login, login_failed, project_delete, etc.
├── resource_type: string?
├── resource_id: uuid?
├── ip_address: inet
├── user_agent: text
├── metadata: jsonb
└── created_at: timestamp

refresh_tokens
├── id: uuid (PK)
├── user_id: uuid (FK → users)
├── token_hash: string (unique)     # Hashed, not plaintext
├── expires_at: timestamp
├── revoked_at: timestamp?
└── created_at: timestamp
```

### API Structure

```
/api/v1
├── /auth
│   ├── POST /login          # email → JWT
│   └── POST /logout         # invalidate token
├── /users
│   ├── GET /me              # current user profile
│   ├── PATCH /me            # update profile
│   ├── GET /:id             # public profile
│   └── POST /invite         # invite external collaborator
├── /projects
│   ├── GET /                # list (paginated, filterable)
│   ├── POST /               # create
│   ├── GET /:id             # detail
│   ├── PATCH /:id           # update
│   ├── DELETE /:id          # delete
│   ├── POST /:id/upvote     # upvote
│   ├── DELETE /:id/upvote   # remove upvote
│   ├── POST /:id/collaborators    # invite collaborator
│   └── DELETE /:id/collaborators/:userId  # remove collaborator
├── /ideas
│   ├── GET /                # list (paginated, filterable)
│   ├── POST /               # create
│   ├── GET /:id             # detail
│   ├── PATCH /:id           # update
│   ├── DELETE /:id          # delete
│   ├── POST /:id/interest   # express interest
│   └── POST /:id/graduate   # graduate to project
├── /search
│   └── GET /                # full-text search
├── /notifications
│   ├── GET /                # list user's notifications
│   ├── PATCH /:id/read      # mark as read
│   └── POST /push-token     # register push token
├── /uploads
│   └── POST /image          # upload image (returns URL)
├── /me
│   ├── GET /data-export     # GDPR: download all personal data
│   ├── DELETE /             # GDPR: request account deletion
│   └── GET|PATCH /privacy-settings  # Privacy preferences
├── /invitations
│   ├── GET /:token          # View invitation details
│   ├── POST /:token/accept  # Accept and create account
│   └── POST /:token/decline # Decline invitation
└── /auth
    └── POST /refresh        # Refresh access token
```

### Karma Calculation
Implemented as a database trigger or application-level recalculation:
- On upvote create/delete: recalculate karma for all project collaborators
- Formula: sum of (upvotes × role_multiplier) + featured_bonus
- Role multipliers: creator=1.0, contributor=0.5, advisor=0.25
- Featured bonus: +10 per featured project created

### File Storage
- Phase 1: Local filesystem in `./uploads/`
- Phase 2: Google Cloud Storage bucket
- Abstract behind a storage service interface for easy swap

### Push Notifications
- Use Firebase Cloud Messaging (FCM) for both iOS and Android
- Store FCM tokens in `push_tokens` table
- Send via Firebase Admin SDK

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REQUEST SECURITY PIPELINE                            │
└─────────────────────────────────────────────────────────────────────────────┘

    Request
       │
       ▼
  ┌─────────────┐
  │ Rate Limit  │ ← Per-IP and per-user limits
  │ Middleware  │   Redis or in-memory store
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Security   │ ← X-Content-Type-Options, X-Frame-Options, CSP
  │  Headers    │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │    CORS     │ ← Allowlist: web domain, mobile scheme
  │             │   No wildcards
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │    Auth     │ ← JWT validation, refresh token handling
  │ Middleware  │   Optional for public routes
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │   Input     │ ← Zod schema validation
  │ Validation  │   HTML sanitization (DOMPurify)
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ Authorize   │ ← Centralized permission checks
  │             │   Resource ownership verification
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Business   │
  │   Logic     │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │   Audit     │ ← Log security-relevant events
  │   Logger    │
  └─────────────┘
```

### Rate Limiting Tiers

| Endpoint Pattern | Limit | Window | Key |
|------------------|-------|--------|-----|
| POST /auth/login | 5 | 15 min | email |
| POST /projects, /ideas | 10 | 1 hour | user_id |
| POST /*/upvote | 60 | 1 min | user_id |
| POST /uploads | 20 | 1 hour | user_id |
| GET /search | 30 | 1 min | user_id or IP |
| General | 100 | 1 min | IP |

### Privacy & Data Handling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL COLLABORATOR CONSENT FLOW                       │
└─────────────────────────────────────────────────────────────────────────────┘

    Creator invites email
           │
           ▼
    ┌─────────────────┐
    │ Create pending  │ ← NOT a user account yet
    │ invitation      │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Send invitation │ ← Email with unique accept link
    │ email           │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐     ┌─────────────────┐
    │ Invitee clicks  │────▶│ Consent screen  │
    │ link            │     │ with T&C        │
    └─────────────────┘     └────────┬────────┘
                                     │
                            ┌────────┴────────┐
                            ▼                 ▼
                     ┌──────────┐       ┌──────────┐
                     │  Accept  │       │ Decline  │
                     │          │       │          │
                     └────┬─────┘       └────┬─────┘
                          │                  │
                          ▼                  ▼
                   Create user         Mark declined
                   + consent record    Delete after 30d
```

### Data Retention Schedule

| Data Type | Retention | Action |
|-----------|-----------|--------|
| Active user data | While active | None |
| Deleted user | 30 days grace | Hard delete or anonymize |
| Pending invitations | 30 days | Auto-delete |
| Audit logs (identified) | 1 year | Anonymize |
| Audit logs (anonymized) | 3 years | Delete |
| Inactive push tokens | 90 days | Auto-delete |
| Orphaned uploads | 30 days | Auto-delete |

### Account Deletion Options

```
User requests deletion
         │
         ▼
    ┌─────────────────────────────────────┐
    │ Choose deletion behavior:           │
    │                                     │
    │ ○ Anonymize contributions (default) │
    │   - Name → "[Deleted User]"         │
    │   - Projects remain, creator anon   │
    │   - Upvotes remain, de-identified   │
    │                                     │
    │ ○ Delete everything                 │
    │   - All projects deleted            │
    │   - Collaborators lose shared work  │
    │   - All activity removed            │
    └─────────────────────────────────────┘
         │
         ▼
    30-day grace period (can cancel)
         │
         ▼
    Finalize deletion/anonymization
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Students table access | Need read-only connection string; document required permissions |
| Karma calculation performance | Start with triggers; can move to background job if slow |
| Push notification complexity | FCM handles both platforms; Expo simplifies on mobile side |
| Search performance | PostgreSQL full-text is good enough for 2500 users; can add Elasticsearch later |
| Image storage migration | Storage service abstraction makes Cloud Buckets swap easy |
| EXIF data in images | Strip all metadata on upload using sharp or similar library |
| Token theft via XSS | httpOnly cookies for refresh tokens; access tokens short-lived in memory |
| Rate limit bypass | Use Redis for distributed rate limiting; fall back to in-memory for dev |
| Deletion complexity | 30-day grace period allows recovery; anonymization preserves community data |
| GDPR compliance burden | Automated retention jobs; audit logging; documented data flows |
| External invite spam | Rate limit invitations; require existing user to invite; log all invites |
