# Routes

Centralized route registration that mounts all module routes.

## Files

| File | Purpose |
|------|---------|
| `index.ts` | Main route registration function, 404 handler |

## Route Registration

`registerRoutes(container)` in `index.ts`:
1. Resolves all services from DI container
2. Creates module route instances with their services
3. Applies route-specific middleware (rate limiters)
4. Mounts routes on the Hono router

## API Endpoints

All routes are prefixed with `/api/v1/`:

| Path | Module | Auth Required |
|------|--------|---------------|
| `/auth` | auth | No (except logout) |
| `/users` | users | Mostly yes |
| `/projects` | projects | Yes |
| `/ideas` | ideas | Yes |
| `/collaborators` | collaborators | Yes |
| `/invitations` | collaborators | Yes |
| `/notifications` | notifications | Yes |
| `/search` | search | Optional |
| `/uploads` | uploads | Yes |
| `/me/privacy` | privacy | Yes |

## Route-Specific Rate Limiting

- `/auth/login` - `loginRateLimiter()` (5/15min)
- `/search/*` - `searchRateLimiter()` (30/min)
- General API - `generalRateLimiter()` (100/min)

## Adding New Routes

1. Create module in `src/modules/newmodule/`
2. Export `createNewModuleRoutes(service, authService)` from routes.ts
3. Register service in `infra/container.ts`
4. Mount in `routes/index.ts`
