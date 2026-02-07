# API Package

Hono-based REST API server for Multiverse Bazaar with PostgreSQL/Prisma.

## Quick Commands

```bash
npm run dev          # Start dev server with hot reload (tsx watch)
npm run test         # Run vitest tests
npm run test:coverage
npm run build        # TypeScript compile to dist/
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Generate Prisma client after schema changes
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed database with test data
```

## Architecture

```
src/
├── index.ts          # Entry point - bootstraps app
├── main.ts           # Server startup with graceful shutdown
├── app.ts            # Hono app configuration, middleware chain
├── routes/           # Centralized route registration
├── infra/            # Infrastructure: config, logger, DI container, database
├── middleware/       # Global middleware: CORS, rate limiting, security
├── modules/          # Feature modules (see below)
└── shared/           # Cross-cutting utilities: pagination, error handling
```

## Module Pattern

Each module in `src/modules/` follows a consistent structure:
- `routes.ts` - HTTP endpoints with validation
- `service.ts` - Business logic with authorization
- `repository.ts` - Prisma database queries
- `types.ts` - TypeScript interfaces
- `schemas.ts` - Zod validation schemas
- `index.ts` - Public exports

## Key Patterns

**Dependency Injection**: Container in `infra/container.ts` registers all services/repos. Resolve via `container.resolve<Type>('name')`.

**Result Type**: Services return `Result<T, BaseError>` from shared package. Use `isOk(result)` to check success.

**Middleware Chain** (order matters in app.ts):
1. Container → 2. Security headers → 3. CORS → 4. Request ID → 5. Logging → 6. Error handler → 7. Rate limiting → 8. Audit → 9. Routes

**Authentication**: JWT tokens. Routes use `authMiddleware(authService)`. User available via `c.get('user')`.

## API Endpoints

All routes mounted at `/api/v1/`:
- `/auth` - Login, register, logout, refresh
- `/users` - User profiles
- `/projects` - CRUD with collaborators
- `/ideas` - Idea board with graduation to projects
- `/collaborators` - Project team management
- `/notifications` - In-app notifications
- `/search` - Full-text search
- `/uploads` - File uploads
- `/me/privacy` - Privacy settings

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Min 32 chars (64 in production)

Optional:
- `PORT` (default: 3000)
- `NODE_ENV` (development/production/test)
- `CORS_ORIGINS` - Comma-separated origins
- `JWT_EXPIRES_IN` (default: 15m)
- `UPLOAD_DIR` (default: ./uploads)
