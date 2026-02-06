# Jobs Module

Scheduled jobs for data retention, cleanup, and maintenance tasks in the Multiverse Bazaar API.

## Overview

The Jobs module provides a robust job scheduling system using `node-cron` for cron-based scheduling. It handles various automated tasks including data cleanup, audit log management, user deletion processing, and karma recalculation.

## Features

- **Cron-based scheduling** - Uses standard cron expressions for flexible scheduling
- **Graceful error handling** - Jobs don't crash the scheduler if they fail
- **Detailed logging** - All job executions are logged with start/end/error details
- **Manual triggering** - Jobs can be run manually outside their schedule
- **Status monitoring** - Check status and history of all jobs
- **Isolated execution** - Each job runs in isolation and can be tested independently

## Architecture

```
jobs/
├── types.ts                    # Type definitions
├── scheduler.ts                # JobScheduler class
├── index.ts                    # Module exports and setup factory
├── jobs/                       # Individual job implementations
│   ├── cleanup-invitations.ts
│   ├── cleanup-push-tokens.ts
│   ├── anonymize-audit-logs.ts
│   ├── delete-audit-logs.ts
│   ├── cleanup-orphaned-files.ts
│   ├── finalize-deletions.ts
│   └── recalculate-karma.ts
└── README.md                   # This file
```

## Quick Start

### Basic Setup

```typescript
import { setupJobs } from './modules/jobs/index.js';
import { getPrismaClient } from './infra/database.js';
import { getLogger } from './infra/logger.js';

// Create and start the job scheduler
const scheduler = setupJobs({
  prisma: getPrismaClient(),
  logger: getLogger(),
  uploadsPath: '/var/uploads', // Optional, defaults to /tmp/uploads
  autoStart: true, // Optional, defaults to true
});

// Later, stop the scheduler on shutdown
scheduler.stop();
```

### Manual Control

```typescript
import { createJobScheduler } from './modules/jobs/index.js';

// Create scheduler without auto-starting
const scheduler = createJobScheduler({
  prisma: getPrismaClient(),
  logger: getLogger(),
});

// Start when ready
scheduler.start();

// Manually trigger a specific job
const result = await scheduler.runNow('cleanup-invitations');
console.log(result);

// Get status of all jobs
const status = scheduler.getStatus();
console.log(status);

// Stop all jobs
scheduler.stop();
```

## Available Jobs

### 1. Cleanup Invitations
**Name:** `cleanup-invitations`
**Schedule:** Daily at 2:00 AM UTC
**Purpose:** Deletes pending invitations older than 30 days

```typescript
// Removes invitations that:
// - Were created more than 30 days ago
// - Are still pending (not accepted or declined)
```

### 2. Cleanup Push Tokens
**Name:** `cleanup-push-tokens`
**Schedule:** Daily at 2:30 AM UTC
**Purpose:** Deletes push tokens not used in 90 days

```typescript
// Removes push tokens that:
// - Haven't been used in 90 days
// - Helps maintain a clean push notification system
```

### 3. Anonymize Audit Logs
**Name:** `anonymize-audit-logs`
**Schedule:** Daily at 3:00 AM UTC
**Purpose:** Anonymizes audit logs older than 1 year

```typescript
// For audit logs older than 1 year:
// - Removes user ID
// - Removes IP address
// - Removes user agent
// - Sanitizes PII from metadata (email, name, phone, address)
```

### 4. Delete Audit Logs
**Name:** `delete-audit-logs`
**Schedule:** Weekly on Sunday at 3:30 AM UTC
**Purpose:** Permanently deletes audit logs older than 3 years

```typescript
// Complete deletion of audit logs older than 3 years
// Runs weekly to manage database size
```

### 5. Cleanup Orphaned Files
**Name:** `cleanup-orphaned-files`
**Schedule:** Daily at 4:00 AM UTC
**Purpose:** Deletes uploaded files not referenced by any entity older than 30 days

```typescript
// For files older than 30 days:
// - Checks if file is referenced by users (avatars) or projects (images)
// - Deletes both the database record and physical file if orphaned
// - Logs files that couldn't be deleted but continues processing
```

### 6. Finalize Deletions
**Name:** `finalize-deletions`
**Schedule:** Daily at 4:30 AM UTC
**Purpose:** Executes scheduled user deletions past the 30-day grace period

```typescript
// For deletion requests older than 30 days:
// - Anonymizes user data (if anonymizeContributions = true)
//   - Keeps contributions but removes PII
//   - User shows as "[Deleted User]"
// - Full deletion (if anonymizeContributions = false)
//   - Deletes user and all their data
//   - Cascade deletion handles most relations
```

### 7. Recalculate Karma
**Name:** `recalculate-karma`
**Schedule:** Weekly on Sunday at 5:00 AM UTC
**Purpose:** Full karma recalculation for all users to fix any karma drift

```typescript
// Recalculates karma for all users:
// - Processes users in batches of 50
// - Implements the same formula as KarmaService
// - Useful for fixing any karma inconsistencies
// - Logs karma changes for debugging
```

## Job Scheduler API

### `JobScheduler` Class

#### Methods

**`register(job: Job): void`**
```typescript
// Register a new job with the scheduler
scheduler.register({
  name: 'my-job',
  schedule: '0 0 * * *', // Daily at midnight
  enabled: true,
  handler: async () => {
    // Job logic here
    return { success: true, message: 'Done' };
  },
});
```

**`start(): void`**
```typescript
// Start all enabled jobs
scheduler.start();
```

**`stop(): void`**
```typescript
// Stop all running jobs
scheduler.stop();
```

**`runNow(jobName: string): Promise<JobResult>`**
```typescript
// Manually trigger a job immediately
const result = await scheduler.runNow('cleanup-invitations');
console.log(result.success, result.message);
```

**`getStatus(): JobStatistics`**
```typescript
// Get status of all jobs
const status = scheduler.getStatus();
console.log(`Total: ${status.totalJobs}, Running: ${status.runningJobs}`);
status.jobs.forEach(job => {
  console.log(`${job.name}: ${job.enabled ? 'enabled' : 'disabled'}`);
});
```

**`getJobStatus(jobName: string): JobStatus | undefined`**
```typescript
// Get status of a specific job
const status = scheduler.getJobStatus('cleanup-invitations');
if (status) {
  console.log(`Last run: ${status.lastRun}`);
  console.log(`Next run: ${status.nextRun}`);
}
```

## Creating Custom Jobs

### Job Structure

```typescript
import { PrismaClient } from '@prisma/client';
import { Logger } from '../../infra/logger.js';
import { Job, JobResult } from '../types.js';

export function createMyCustomJob(prisma: PrismaClient, logger: Logger): Job {
  return {
    name: 'my-custom-job',
    description: 'What this job does',
    schedule: '0 0 * * *', // Cron expression
    enabled: true,
    handler: async (): Promise<JobResult> => {
      const jobLogger = logger.child({ job: 'my-custom-job' });

      try {
        jobLogger.info('Starting my custom job');

        // Do work here
        const result = await prisma.someTable.deleteMany({
          where: { /* conditions */ },
        });

        jobLogger.info('Job completed', { deletedCount: result.count });

        return {
          success: true,
          message: `Deleted ${result.count} records`,
          details: {
            deletedCount: result.count,
          },
        };
      } catch (error) {
        jobLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          'Job failed'
        );

        return {
          success: false,
          message: 'Job failed',
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    },
  };
}
```

### Registering Custom Jobs

Update `index.ts` to include your custom job:

```typescript
import { createMyCustomJob } from './jobs/my-custom-job.js';

export function setupJobs(options: SetupJobsOptions): JobScheduler {
  // ... existing code ...

  const jobs = [
    // ... existing jobs ...
    createMyCustomJob(prisma, logger),
  ];

  // ... rest of setup ...
}
```

## Cron Expression Reference

```
┌────────────── second (0-59)
│ ┌──────────── minute (0-59)
│ │ ┌────────── hour (0-23)
│ │ │ ┌──────── day of month (1-31)
│ │ │ │ ┌────── month (1-12)
│ │ │ │ │ ┌──── day of week (0-6, Sunday to Saturday)
│ │ │ │ │ │
* * * * * *
```

Common patterns:
- `0 0 * * *` - Daily at midnight
- `0 2 * * *` - Daily at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 0 1 * *` - Monthly on the 1st at midnight
- `*/5 * * * *` - Every 5 minutes

## Best Practices

### 1. Error Handling
Always wrap job logic in try-catch and return proper JobResult:

```typescript
try {
  // Job logic
  return { success: true, message: 'Done' };
} catch (error) {
  logger.error(error, 'Job failed');
  return {
    success: false,
    message: 'Job failed',
    details: { error: error.message },
  };
}
```

### 2. Logging
Use structured logging with context:

```typescript
const jobLogger = logger.child({ job: 'my-job' });
jobLogger.info('Starting', { someContext: 'value' });
```

### 3. Batch Processing
For large datasets, process in batches:

```typescript
const BATCH_SIZE = 100;
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  // Process batch
  await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
}
```

### 4. Idempotency
Make jobs idempotent - running multiple times should be safe:

```typescript
// Good: Uses date-based conditions
await prisma.table.deleteMany({
  where: { createdAt: { lt: cutoffDate } }
});

// Avoid: Could delete different records each time
await prisma.table.deleteMany({ take: 100 });
```

### 5. Testing
Test jobs in isolation:

```typescript
import { createCleanupInvitationsJob } from './jobs/cleanup-invitations.js';

const job = createCleanupInvitationsJob(mockPrisma, mockLogger);
const result = await job.handler();
expect(result.success).toBe(true);
```

## Monitoring and Observability

### Check Job Status

```typescript
// Get all job statuses
const stats = scheduler.getStatus();
console.log(`Total jobs: ${stats.totalJobs}`);
console.log(`Enabled: ${stats.enabledJobs}`);
console.log(`Running: ${stats.runningJobs}`);

// Check individual jobs
stats.jobs.forEach(job => {
  console.log(`${job.name}:`);
  console.log(`  Last run: ${job.lastRun || 'never'}`);
  console.log(`  Last result: ${job.lastResult?.message || 'n/a'}`);
});
```

### Logs

All jobs log to the application logger with structured context:

```json
{
  "level": "info",
  "time": "2024-01-01T02:00:00.000Z",
  "scope": "JobScheduler",
  "job": "cleanup-invitations",
  "msg": "Starting job execution",
  "jobName": "cleanup-invitations"
}
```

## Integration with Application

### In main.ts or app.ts

```typescript
import { setupJobs } from './modules/jobs/index.js';
import { getPrismaClient } from './infra/database.js';
import { getLogger } from './infra/logger.js';

// Initialize jobs on startup
const jobScheduler = setupJobs({
  prisma: getPrismaClient(),
  logger: getLogger(),
  uploadsPath: process.env.UPLOADS_PATH || '/var/uploads',
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Stopping job scheduler...');
  jobScheduler.stop();
  // ... other cleanup ...
  process.exit(0);
});
```

## Performance Considerations

1. **Schedule jobs during off-peak hours** - Most jobs run between 2-5 AM UTC
2. **Batch processing** - Large operations are batched to avoid overwhelming DB
3. **Prevents concurrent runs** - Scheduler won't start a job if it's already running
4. **Small delays between batches** - Gives database time to breathe
5. **Indexes** - Ensure proper indexes on date columns used for cleanup

## Security

1. **No user input** - Jobs run autonomously, no user-controlled parameters
2. **Audit logging** - All deletions and anonymizations are logged
3. **Grace periods** - Critical operations (user deletion) have 30-day grace periods
4. **Anonymization option** - Users can choose to anonymize vs. delete contributions

## Troubleshooting

### Job not running
- Check if job is enabled: `scheduler.getJobStatus('job-name')`
- Verify cron expression: `cron.validate('expression')`
- Check logs for scheduler errors

### Job failing
- Check job logs for specific errors
- Manually run job: `scheduler.runNow('job-name')`
- Verify database connectivity and permissions

### Performance issues
- Review batch sizes (default: 50-100)
- Add indexes on columns used in WHERE clauses
- Consider running less frequently or during off-peak hours

## License

Part of the Multiverse Bazaar API - See main project license.
