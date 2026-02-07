# Infrastructure Layer

Core application infrastructure providing configuration, logging, DI, and database access.

## Files

| File | Purpose |
|------|---------|
| `config.ts` | Environment variable loading with Zod validation. Exports `getConfig()` singleton. |
| `logger.ts` | Pino-based structured logging. Exports `getLogger()` singleton. |
| `container.ts` | Dependency injection container. Registers all repos and services. |
| `database.ts` | Prisma client initialization. Exports `getPrismaClient()`. |
| `index.ts` | Re-exports all infrastructure components. |

## Dependency Injection

The container uses a simple DI pattern with singleton/transient lifetimes:

```typescript
// Registration (in setupContainer)
container.register('projectService', (c) => {
  const projectRepository = c.resolve('projectRepository');
  const logger = c.resolve<Logger>('logger');
  return new ProjectService(projectRepository, logger);
}, 'singleton');

// Resolution (in routes or middleware)
const service = container.resolve<ProjectService>('projectService');
```

## Registered Dependencies

**Core**: config, logger, db (PrismaClient)

**Repositories**: authRepository, userRepository, projectRepository, collaboratorRepository, upvoteRepository, ideaRepository, notificationRepository, pushTokenRepository, searchRepository, uploadRepository, auditRepository, privacyRepository, karmaRepository

**Services**: authService, userService, projectService, collaboratorService, upvoteService, ideaService, notificationService, searchService, uploadService, auditService, privacyService, karmaService

## Configuration

Environment variables validated at startup:
- `DATABASE_URL` (required)
- `JWT_SECRET` (required, 32+ chars)
- `PORT`, `NODE_ENV`, `CORS_ORIGINS`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, `UPLOAD_DIR`, `MAX_FILE_SIZE`

Production mode enforces stricter validation (64-char JWT secret, no localhost CORS).
