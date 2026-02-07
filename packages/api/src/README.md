# API Source Directory

## File Overview

| File | Purpose |
|------|---------|
| `index.ts` | Entry point, imports main.js |
| `main.ts` | Server startup, graceful shutdown handling |
| `app.ts` | Hono app configuration, middleware chain setup |

## Directory Structure

| Directory | Contents |
|-----------|----------|
| `infra/` | Infrastructure: config, logger, DI container, database connection |
| `routes/` | Centralized route registration for all modules |
| `middleware/` | Global middleware (CORS, rate-limit, security headers) |
| `modules/` | Feature modules - each with routes/service/repository/types/schemas |
| `shared/` | Cross-cutting utilities (pagination, error handling) |
| `utils/` | General utilities (legacy logger) |
| `__tests__/` | Integration tests with test utilities |

## Request Flow

1. Request enters via `main.ts` server
2. `app.ts` applies middleware chain in order
3. Routes in `routes/index.ts` delegate to module routes
4. Module routes → service → repository → database
5. Response flows back with Result type handling
