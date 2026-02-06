# API Application Wiring Documentation

This document describes how the Multiverse Bazaar API is wired together.

## Architecture Overview

The application follows a layered architecture with dependency injection:

```
main.ts → app.ts → routes/index.ts → module routes
   ↓
container.ts (DI Container)
   ↓
repositories & services
```

## Dependency Injection Container

**File:** `src/infra/container.ts`

The container registers all dependencies in a single place:

### Core Infrastructure
- `config` - Application configuration
- `logger` - Logging instance
- `db` - Prisma database client

### Repositories (Data Layer)
- `authRepository` - Authentication data access
- `userRepository` - User data access
- `projectRepository` - Project data access
- `collaboratorRepository` - Collaborator data access
- `upvoteRepository` - Upvote data access
- `ideaRepository` - Idea data access
- `notificationRepository` - Notification data access
- `pushTokenRepository` - Push token data access
- `searchRepository` - Search data access
- `uploadRepository` - Upload data access
- `auditRepository` - Audit log data access
- `privacyRepository` - Privacy/GDPR data access
- `karmaRepository` - Karma calculation data access

### Services (Business Logic)
- `authService` - Authentication logic
- `userService` - User management
- `projectService` - Project management
- `collaboratorService` - Collaboration management
- `upvoteService` - Upvote management
- `ideaService` - Idea management
- `notificationService` - Notification management
- `searchService` - Search functionality
- `uploadService` - File upload management
- `auditService` - Audit logging
- `privacyService` - GDPR compliance
- `karmaService` - Karma calculation

## Application Setup

**File:** `src/app.ts`

The app.ts file configures the Hono application with middleware in this order:

1. **Container injection** - Makes DI container available to all routes
2. **Security headers** - Adds security headers to all responses
3. **CORS** - Configures cross-origin resource sharing
4. **Request ID** - Generates unique ID for each request
5. **Logging** - Logs all requests with context
6. **Error handling** - Global error handler
7. **Rate limiting** - General rate limiting for all API routes
8. **Audit middleware** - Captures IP and user agent

### Special Endpoints
- `GET /health` - Health check with database connectivity
- `GET /` - API welcome message
- `/api/v1/*` - All versioned API routes

## Route Registration

**File:** `src/routes/index.ts`

All API routes are registered under `/api/v1`:

| Path | Module | Authentication | Rate Limit |
|------|--------|----------------|------------|
| `/api/v1/auth` | Auth | Public (login rate limited) | Login-specific |
| `/api/v1/users` | Users | Varies by endpoint | General |
| `/api/v1/projects` | Projects | Required | General |
| `/api/v1/projects/:id/upvote` | Upvotes | Required | Upvote-specific |
| `/api/v1/ideas` | Ideas | Required | General |
| `/api/v1/collaborators` | Collaborators | Required | General |
| `/api/v1/invitations` | Invitations | Required | General |
| `/api/v1/notifications` | Notifications | Required | General |
| `/api/v1/search` | Search | Optional | Search-specific |
| `/api/v1/uploads` | Uploads | Required | Upload-specific |
| `/api/v1/me/privacy` | Privacy/GDPR | Required | General |

### Rate Limiters Applied

- **Login** - 5 requests per 15 minutes per email
- **Search** - 30 requests per minute per user/IP
- **General** - 100 requests per minute per IP

Note: Item creation, upvote, and upload rate limiters are defined but applied within individual route modules.

## Application Startup

**File:** `src/main.ts`

The main entry point handles:

1. **Container setup** - Initialize DI container with all dependencies
2. **Database connection** - Connect to PostgreSQL via Prisma
3. **App configuration** - Create and configure Hono app
4. **Server start** - Start HTTP server on configured port
5. **Graceful shutdown** - Handle SIGTERM/SIGINT to close connections

### Shutdown Process

When a shutdown signal is received:
1. Stop accepting new HTTP connections
2. Close database connections
3. Exit process with appropriate code

### Error Handling

- Uncaught exceptions trigger graceful shutdown
- Unhandled promise rejections trigger graceful shutdown
- Startup failures clean up resources and exit

## Security Middleware

The application applies a comprehensive security stack:

- **Security Headers** - HSTS, CSP, X-Frame-Options, etc.
- **CORS** - Configurable origin validation
- **Rate Limiting** - Multiple rate limit strategies
- **Audit Logging** - Request context capture
- **Authentication** - JWT-based auth middleware

## Module Structure

Each module follows this structure:

```
modules/
  <module>/
    ├── types.ts       - TypeScript types
    ├── schemas.ts     - Zod validation schemas
    ├── repository.ts  - Data access layer
    ├── service.ts     - Business logic
    ├── routes.ts      - HTTP endpoints
    ├── middleware.ts  - Module-specific middleware (optional)
    └── index.ts       - Public API exports
```

## Environment Configuration

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing (min 32 chars, 64+ in production)
- `NODE_ENV` - Environment: development, production, or test
- `PORT` - HTTP server port (default: 3000)
- `CORS_ORIGINS` - Comma-separated allowed origins
- `UPLOAD_DIR` - Directory for file uploads
- `MAX_FILE_SIZE` - Max upload size in bytes

## Testing the Wiring

To verify all services are properly wired:

```bash
# Type check
npm run type-check

# Start the server
npm run dev

# Check health endpoint
curl http://localhost:3000/health
```

## Future Considerations

### Job Scheduler
A job scheduler module exists but is not yet wired into the application startup. When ready, add to `main.ts`:

```typescript
import { JobScheduler } from './modules/jobs/scheduler.js';

// In main():
const scheduler = container.resolve<JobScheduler>('scheduler');
scheduler.start();

// In shutdown():
scheduler.stop();
```

### Additional Middleware
Consider adding:
- Request body size limits
- Request timeout handling
- API versioning middleware
- Response compression
- Request logging to external service
