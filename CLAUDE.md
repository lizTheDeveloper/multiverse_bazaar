# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multiverse Bazaar is a creative collaboration marketplace platform with a monorepo structure containing:
- **packages/api** - Hono-based REST API with Prisma ORM and PostgreSQL
- **packages/web** - React + Vite web application with Tailwind CSS
- **packages/mobile** - Expo React Native mobile app
- **packages/shared** - Shared TypeScript types and utilities

## Common Commands

```bash
# Development
npm run dev              # Start API (port 3000) and web (port 5173) concurrently
npm run api              # Start API only
npm run web              # Start web only

# Testing
npm run test             # Run API unit/integration tests (vitest)
npm run test:e2e         # Run Playwright e2e tests (starts both servers)
npm run test:e2e:headed  # Run e2e tests with browser visible

# Single test file
npx vitest packages/api/src/__tests__/auth.test.ts

# Type checking and linting
npm run typecheck        # Check API and shared packages
npm run lint             # ESLint across all packages
npm run lint:fix         # Auto-fix lint issues

# Database (from packages/api)
npm run db:migrate -w @multiverse-bazaar/api    # Run migrations
npm run db:generate -w @multiverse-bazaar/api   # Generate Prisma client
npm run db:studio -w @multiverse-bazaar/api     # Open Prisma Studio
npm run db:seed -w @multiverse-bazaar/api       # Seed database
```

## Architecture

### API Module Structure (packages/api/src/modules/)
Each feature module follows a consistent pattern:
- `routes.ts` - Hono route definitions with validation
- `service.ts` - Business logic layer
- `repository.ts` - Database operations (Prisma queries)
- `types.ts` - TypeScript type definitions
- `schemas.ts` - Zod validation schemas
- `index.ts` - Module exports

Modules: auth, users, projects, ideas, collaborators, upvotes, notifications, search, karma, privacy, audit, uploads, jobs

### API Middleware Chain (app.ts)
Order matters: container ’ security headers ’ CORS ’ request ID ’ logging ’ error handler ’ rate limiting ’ audit ’ routes

### Web Frontend Structure (packages/web/src/)
- `components/` - Organized by feature (auth/, ideas/, projects/, profiles/, collaborators/, search/, ui/, layout/)
- `hooks/` - Custom React hooks (useAuth, useProjects, useIdeas, useCollaborators, useSearch, useUpvotes, useToast, useUser)
- `pages/` - Route page components
- `lib/api.ts` - API client with fetch wrapper
- Uses React Query for server state, react-hook-form with Zod for forms

### Key Domain Models (Prisma schema)
- **User** - Core user with karma system, privacy settings, soft delete support
- **Project** - Collaborative projects with status (BUILDING/LAUNCHED)
- **Idea** - Pre-project concepts that can graduate to projects
- **Collaborator** - Links users to projects with roles (CREATOR/CONTRIBUTOR/ADVISOR)
- **Upvote/IdeaUpvote** - Voting on projects and ideas
- **Notification** - In-app notifications with push token support

### Dependency Injection
API uses a container pattern (`packages/api/src/infra/container.ts`) - resolve dependencies via `container.resolve<Type>('name')`.

### Testing
- API tests use `packages/api/src/__tests__/setup.ts` which provides `getTestApp()`, `getTestDb()`, `createTestUser()`, `getTestToken()`, `createTestProject()`, `createTestIdea()`
- Tests clean the database before each test via `cleanDatabase()`
- E2E tests in `/e2e/` directory use Playwright
