# Prisma Database

PostgreSQL database schema and migrations using Prisma ORM.

## Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and run migrations
npm run db:migrate

# Deploy migrations in production
npm run db:migrate:deploy

# Open Prisma Studio GUI
npm run db:studio

# Push schema directly (dev only, no migration)
npm run db:push

# Reset database (drops all data!)
npm run db:reset

# Seed database with test data
npm run db:seed
```

## Files

| File | Purpose |
|------|---------|
| `schema.prisma` | Database schema definition |
| `seed.ts` | Database seeding script |
| `migrations/` | Migration history |

## Schema Overview

### Core Models

| Model | Purpose |
|-------|---------|
| `User` | User accounts with karma, privacy settings |
| `Project` | Collaborative projects |
| `Idea` | Pre-project concepts |
| `Collaborator` | User-project relationships |

### Interaction Models

| Model | Purpose |
|-------|---------|
| `Upvote` | Project upvotes |
| `IdeaUpvote` | Idea upvotes |
| `IdeaInterest` | Interest in ideas |

### Support Models

| Model | Purpose |
|-------|---------|
| `Notification` | In-app notifications |
| `PushToken` | Mobile push tokens |
| `PendingInvitation` | Collaboration invites |

### Privacy & Audit

| Model | Purpose |
|-------|---------|
| `ConsentRecord` | GDPR consent tracking |
| `DataRequest` | Export/deletion requests |
| `AuditLog` | Action audit trail |

### Auth

| Model | Purpose |
|-------|---------|
| `RefreshToken` | JWT refresh tokens |
| `LoginAttempt` | Login tracking for rate limiting |
| `Upload` | File upload records |

## Enums

```prisma
enum ProjectStatus { BUILDING, LAUNCHED }
enum CollaboratorRole { CREATOR, CONTRIBUTOR, ADVISOR }
enum IdeaStatus { OPEN, CLOSED, GRADUATED }
enum NotificationType { UPVOTE, COLLABORATION_INVITE, IDEA_INTEREST }
enum Platform { IOS, ANDROID }
enum DataRequestType { EXPORT, DELETION }
enum DataRequestStatus { PENDING, PROCESSING, COMPLETED }
```

## Relationships

```
User ──┬── Project (via Collaborator)
       ├── Idea (creator)
       ├── Upvote
       ├── Notification
       ├── RefreshToken
       └── Upload

Project ──┬── Collaborator
          ├── Upvote
          └── Idea (graduated from)

Idea ──┬── IdeaInterest
       └── IdeaUpvote
```

## Migration Workflow

1. Modify `schema.prisma`
2. Run `npm run db:migrate` with descriptive name
3. Review generated SQL in `migrations/`
4. Commit migration files with code changes
