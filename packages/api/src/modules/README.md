# API Modules

Feature modules following a consistent layered architecture.

## Module Structure

Each module contains:

```
modulename/
├── routes.ts      # HTTP endpoints, request validation, response formatting
├── service.ts     # Business logic, authorization, orchestration
├── repository.ts  # Database operations via Prisma
├── types.ts       # TypeScript interfaces for domain objects
├── schemas.ts     # Zod schemas for request validation
└── index.ts       # Public exports
```

## Available Modules

| Module | Purpose | Key Endpoints |
|--------|---------|---------------|
| `auth` | Authentication | POST /login, /register, /logout, /refresh |
| `users` | User profiles | GET/PATCH /users/:id, /users/me |
| `projects` | Project CRUD | GET/POST/PATCH/DELETE /projects |
| `ideas` | Idea board | GET/POST/PATCH/DELETE /ideas, POST /ideas/:id/graduate |
| `collaborators` | Team management | POST /invite, DELETE /collaborators/:id |
| `upvotes` | Voting system | POST/DELETE /projects/:id/upvote |
| `notifications` | In-app notifications | GET /notifications, PATCH /notifications/:id/read |
| `search` | Full-text search | GET /search?q=query |
| `uploads` | File uploads | POST /uploads/image, /uploads/avatar |
| `karma` | Reputation system | Background karma calculation |
| `privacy` | Privacy settings | GET/PATCH /me/privacy, POST /me/data-request |
| `audit` | Audit logging | Middleware for action logging |
| `jobs` | Scheduled tasks | Background job scheduler |

## Common Patterns

### Route Handler
```typescript
router.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const validation = schema.safeParse(body);
  if (!validation.success) return c.json({ error: ... }, 400);

  const result = await service.create(user.id, validation.data);
  if (!isOk(result)) return c.json({ error: result.error }, result.error.statusCode);

  return c.json(result.value, 201);
});
```

### Service Method
```typescript
async create(userId: string, data: CreateRequest): Promise<Result<Entity, BaseError>> {
  try {
    this.logger.info({ userId }, 'Creating entity');
    const result = await this.repository.create(data);
    if (!isOk(result)) return Err(result.error);
    return Ok(result.value);
  } catch (error) {
    return Err(new InternalError('Unexpected error'));
  }
}
```

### Repository Method
```typescript
async create(data: CreateData): Promise<Result<Entity, BaseError>> {
  try {
    const entity = await this.db.entity.create({ data });
    return Ok(entity);
  } catch (error) {
    return Err(handlePrismaError(error));
  }
}
```

## Module Dependencies

Services can depend on other services (injected via container):
- `collaboratorService` → notificationService, projectRepository, userRepository
- `upvoteService` → notificationService, karmaService
- `privacyService` → userRepository

## Adding a New Module

1. Create folder in `src/modules/newmodule/`
2. Create files: routes.ts, service.ts, repository.ts, types.ts, schemas.ts, index.ts
3. Register repository and service in `infra/container.ts`
4. Mount routes in `routes/index.ts`
