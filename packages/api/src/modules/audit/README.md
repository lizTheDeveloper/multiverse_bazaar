# Audit Module

The Audit module provides comprehensive audit logging capabilities for the Multiverse Bazaar API. It tracks all significant actions, resource changes, and authentication events with a fire-and-forget pattern that ensures logging failures never affect business operations.

## Features

- **Comprehensive Action Tracking**: Logs authentication, user, project, idea, collaborator, and data privacy events
- **Fire-and-Forget Pattern**: Logging failures are logged but never throw errors to business logic
- **Request Context Capture**: Automatically captures IP address and user agent
- **Data Retention Compliance**: Implements GDPR-compliant retention policies
- **Efficient Querying**: Provides flexible query APIs with pagination
- **Login History**: Tracks login attempts for security monitoring

## Files

- `types.ts` - Type definitions and enums for audit actions and log structures
- `repository.ts` - Data access layer for audit logs
- `service.ts` - Business logic layer with fire-and-forget logging
- `middleware.ts` - Hono middleware for capturing request context
- `schemas.ts` - Zod validation schemas for audit queries
- `index.ts` - Public API exports

## Usage

### 1. Setup Middleware

Add the audit middleware to your Hono app to capture request context:

```typescript
import { Hono } from 'hono';
import { auditMiddleware } from './modules/audit/index.js';

const app = new Hono();

// Add audit middleware globally
app.use('*', auditMiddleware());

// Or with request logging enabled (for debugging)
app.use('*', auditMiddleware({ logAllRequests: true }));
```

### 2. Basic Logging

Use the audit service to log actions throughout your application:

```typescript
import { AuditService, AuditAction, getAuditContext } from './modules/audit/index.js';

// In your route handler
async function createUser(c: Context) {
  // Get audit context from middleware
  const auditContext = getAuditContext(c);
  const user = c.get('user');

  // Perform business logic
  const newUser = await userService.create(data);

  // Log the action (fire-and-forget)
  await auditService.log(
    AuditAction.USER_CREATED,
    {
      userId: user.id,
      resourceType: 'user',
      resourceId: newUser.id,
    },
    auditContext
  );

  return c.json(newUser);
}
```

### 3. Authentication Logging

Use specialized methods for authentication events:

```typescript
// Log successful login
await auditService.logAuth(
  AuditAction.AUTH_LOGIN_SUCCESS,
  user.id,
  true,
  auditContext
);

// Log failed login (userId is null)
await auditService.logAuth(
  AuditAction.AUTH_LOGIN_FAILURE,
  null,
  false,
  auditContext
);

// Log logout
await auditService.logAuth(
  AuditAction.AUTH_LOGOUT,
  user.id,
  true,
  auditContext
);
```

### 4. Resource Change Logging

Track changes to resources with optional change metadata:

```typescript
// Log resource creation
await auditService.logResourceChange(
  AuditAction.PROJECT_CREATED,
  'project',
  project.id,
  user.id,
  undefined, // no changes for create
  auditContext
);

// Log resource update with changes
await auditService.logResourceChange(
  AuditAction.PROJECT_UPDATED,
  'project',
  project.id,
  user.id,
  {
    changes: {
      title: { from: 'Old Title', to: 'New Title' },
      status: { from: 'BUILDING', to: 'LAUNCHED' }
    }
  },
  auditContext
);

// Log resource deletion
await auditService.logResourceChange(
  AuditAction.PROJECT_DELETED,
  'project',
  project.id,
  user.id,
  undefined,
  auditContext
);
```

### 5. Sensitive Data Access Logging

Track access to sensitive data:

```typescript
// Log data export request
await auditService.logSensitiveAccess(
  AuditAction.DATA_EXPORT_REQUESTED,
  user.id,
  auditContext
);

// Log data deletion request
await auditService.logSensitiveAccess(
  AuditAction.DATA_DELETION_REQUESTED,
  user.id,
  auditContext
);
```

### 6. Querying Audit Logs

Retrieve audit logs with flexible filtering:

```typescript
// Get full audit trail for a user
const result = await auditService.getAuditTrail(userId, {
  page: 1,
  limit: 50
});

if (isOk(result)) {
  const { logs, total, page, totalPages } = result.value;
  // Use logs...
}

// Query logs with filters
const queryResult = await auditService.queryLogs({
  userId: 'user-123',
  action: AuditAction.USER_UPDATED,
  resourceType: 'user',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  page: 1,
  limit: 25
});

// Get logs for a specific resource
const resourceLogs = await auditService.getResourceLogs('project', projectId);
```

### 7. Login History

Track and retrieve login attempts:

```typescript
// Get login history for a user
const historyResult = await auditService.getLoginHistory(userId, 50);

if (isOk(historyResult)) {
  const loginHistory = historyResult.value;
  loginHistory.forEach(attempt => {
    console.log(`${attempt.success ? 'Success' : 'Failed'} from ${attempt.ip}`);
  });
}
```

## Data Retention

The audit module implements a three-tier retention policy:

1. **Full Logs (0-1 year)**: All data is retained with PII
2. **Anonymized Logs (1-3 years)**: User IDs removed, IP addresses hashed
3. **Deleted (3+ years)**: Logs are permanently deleted

### Running Retention Cleanup

Run the retention cleanup as a scheduled job (e.g., daily):

```typescript
// Run automatic retention cleanup
// - Anonymizes logs older than 1 year
// - Deletes logs older than 3 years
await auditService.runRetentionCleanup();

// Or run manually with custom dates
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
await auditService.anonymizeOldLogs(oneYearAgo);

const threeYearsAgo = new Date();
threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
await auditService.deleteOldLogs(threeYearsAgo);
```

## Audit Actions

The following audit actions are available:

### Authentication
- `AUTH_LOGIN_SUCCESS` - Successful login
- `AUTH_LOGIN_FAILURE` - Failed login attempt
- `AUTH_LOGOUT` - User logout

### Users
- `USER_CREATED` - New user created
- `USER_UPDATED` - User profile updated
- `USER_DELETED` - User deleted/anonymized

### Projects
- `PROJECT_CREATED` - New project created
- `PROJECT_UPDATED` - Project updated
- `PROJECT_DELETED` - Project deleted

### Ideas
- `IDEA_CREATED` - New idea created
- `IDEA_UPDATED` - Idea updated
- `IDEA_DELETED` - Idea deleted

### Collaborators
- `COLLABORATOR_ADDED` - Collaborator added to project
- `COLLABORATOR_REMOVED` - Collaborator removed from project

### Privacy & Data
- `DATA_EXPORT_REQUESTED` - User requested data export
- `DATA_DELETION_REQUESTED` - User requested data deletion

### External Users
- `EXTERNAL_USER_INVITED` - External user invited to platform
- `INVITATION_ACCEPTED` - External user accepted invitation

## Best Practices

1. **Always use fire-and-forget**: The audit service never throws - log errors are logged internally
2. **Capture context**: Use the audit middleware and `getAuditContext()` to capture IP and user agent
3. **Log meaningful actions**: Focus on security-relevant and audit-worthy actions
4. **Include metadata**: Add relevant metadata for updates and complex actions
5. **Run retention cleanup**: Schedule daily retention cleanup to stay GDPR compliant
6. **Monitor login history**: Use login history for security monitoring and anomaly detection

## Integration with Other Modules

The audit module is designed to be easily integrated into existing modules:

```typescript
// In your service methods
class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditService: AuditService,
    private readonly logger: Logger
  ) {}

  async updateUser(
    id: string,
    data: UpdateUserRequest,
    context?: AuditContext
  ): Promise<Result<UserProfile, Error>> {
    // Perform update
    const result = await this.userRepository.update(id, data);

    if (isOk(result)) {
      // Log successful update
      await this.auditService.logResourceChange(
        AuditAction.USER_UPDATED,
        'user',
        id,
        id, // assuming user is updating their own profile
        { changes: data },
        context
      );
    }

    return result;
  }
}
```

## Database Schema

The module uses two tables from the Prisma schema:

- `AuditLog` - Main audit log table with action, resource, context, and metadata
- `LoginAttempt` - Dedicated login attempt tracking for security monitoring

See `packages/api/prisma/schema.prisma` for the full schema definition.

## Error Handling

The audit service implements fire-and-forget error handling:

- All logging methods catch exceptions and log them internally
- Business logic is never affected by audit logging failures
- Errors are logged to the application logger for monitoring
- Methods that return data (queries) return `Result` types for proper error handling
