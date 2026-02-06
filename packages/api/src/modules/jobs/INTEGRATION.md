# Jobs Module Integration Guide

Quick guide to integrate the jobs module into your Multiverse Bazaar API.

## Installation

First, install the required dependencies:

```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

## Integration Steps

### 1. Add to main application startup

In your `src/main.ts` or `src/app.ts`:

```typescript
import { setupJobs } from './modules/jobs/index.js';
import { getPrismaClient } from './infra/database.js';
import { getLogger } from './infra/logger.js';

// ... existing imports and setup ...

async function startServer() {
  const logger = getLogger();
  const prisma = getPrismaClient();

  // ... existing server setup ...

  // Initialize job scheduler
  logger.info('Setting up job scheduler...');
  const jobScheduler = setupJobs({
    prisma,
    logger,
    uploadsPath: process.env.UPLOADS_PATH || '/tmp/uploads',
    autoStart: true,
  });

  logger.info('Job scheduler started');

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');

    // Stop job scheduler
    jobScheduler.stop();

    // Close database connection
    await prisma.$disconnect();

    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // ... start HTTP server ...
}

startServer().catch(console.error);
```

### 2. Add environment variable (optional)

In your `.env` file:

```env
# Path to uploaded files directory
UPLOADS_PATH=/var/uploads
```

### 3. Add health check endpoint (optional)

Create a route to check job status:

```typescript
import { Hono } from 'hono';

const app = new Hono();

// Assuming jobScheduler is accessible
app.get('/health/jobs', (c) => {
  const status = jobScheduler.getStatus();

  return c.json({
    status: 'ok',
    jobs: {
      total: status.totalJobs,
      enabled: status.enabledJobs,
      running: status.runningJobs,
    },
    details: status.jobs.map(job => ({
      name: job.name,
      enabled: job.enabled,
      isRunning: job.isRunning,
      lastRun: job.lastRun,
      lastSuccess: job.lastResult?.success,
    })),
  });
});
```

### 4. Add admin endpoint to trigger jobs manually (optional)

```typescript
import { Hono } from 'hono';

const adminApp = new Hono();

// Require admin authentication for this route
adminApp.post('/admin/jobs/:jobName/run', async (c) => {
  const jobName = c.req.param('jobName');

  try {
    const result = await jobScheduler.runNow(jobName);

    return c.json({
      success: result.success,
      message: result.message,
      details: result.details,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      404
    );
  }
});
```

## Minimal Example

Here's a complete minimal example:

```typescript
// src/main.ts
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { setupJobs } from './modules/jobs/index.js';
import { getPrismaClient } from './infra/database.js';
import { getLogger } from './infra/logger.js';

const logger = getLogger();
const prisma = getPrismaClient();
const app = new Hono();

// Setup jobs
const jobScheduler = setupJobs({
  prisma,
  logger,
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Jobs status
app.get('/health/jobs', (c) => {
  const status = jobScheduler.getStatus();
  return c.json(status);
});

// Start server
const port = 3000;
logger.info(`Server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  jobScheduler.stop();
  await prisma.$disconnect();
  process.exit(0);
});
```

## Testing

### Run the application

```bash
npm run dev
```

### Check job status

```bash
curl http://localhost:3000/health/jobs
```

### Manually trigger a job (if admin endpoint is set up)

```bash
curl -X POST http://localhost:3000/admin/jobs/cleanup-invitations/run
```

## Scheduled Jobs Overview

| Job Name | Schedule | Description |
|----------|----------|-------------|
| `cleanup-invitations` | Daily 2:00 AM | Delete pending invitations >30 days |
| `cleanup-push-tokens` | Daily 2:30 AM | Delete unused push tokens >90 days |
| `anonymize-audit-logs` | Daily 3:00 AM | Anonymize audit logs >1 year |
| `delete-audit-logs` | Sunday 3:30 AM | Delete audit logs >3 years |
| `cleanup-orphaned-files` | Daily 4:00 AM | Delete orphaned files >30 days |
| `finalize-deletions` | Daily 4:30 AM | Execute user deletions after 30-day grace |
| `recalculate-karma` | Sunday 5:00 AM | Recalculate all user karma |

## Monitoring

### Check logs

Jobs log all activity with structured logging:

```bash
# Filter job logs
grep "JobScheduler" logs/app.log

# Check specific job
grep "cleanup-invitations" logs/app.log
```

### Database queries for monitoring

```sql
-- Check pending invitations to be cleaned
SELECT COUNT(*) FROM "PendingInvitation"
WHERE "createdAt" < NOW() - INTERVAL '30 days'
  AND "acceptedAt" IS NULL
  AND "declinedAt" IS NULL;

-- Check inactive push tokens
SELECT COUNT(*) FROM "PushToken"
WHERE "lastUsedAt" < NOW() - INTERVAL '90 days';

-- Check audit logs to be anonymized
SELECT COUNT(*) FROM "AuditLog"
WHERE "createdAt" < NOW() - INTERVAL '1 year'
  AND "userId" IS NOT NULL;

-- Check user deletions due
SELECT COUNT(*) FROM "DataRequest"
WHERE "requestType" = 'DELETION'
  AND "status" = 'PENDING'
  AND "requestedAt" < NOW() - INTERVAL '30 days';
```

## Troubleshooting

### Jobs not running

1. Check if scheduler started:
   ```typescript
   console.log(jobScheduler.getStatus());
   ```

2. Verify cron expressions:
   ```typescript
   import cron from 'node-cron';
   console.log(cron.validate('0 2 * * *')); // Should be true
   ```

3. Check logs for errors

### High database load

If jobs are causing high database load:

1. Adjust batch sizes in jobs (default: 50-100)
2. Add delays between batches
3. Run less frequently (update cron schedule)
4. Add database indexes on date columns

### Testing jobs manually

```typescript
// Get the job status
const status = jobScheduler.getJobStatus('cleanup-invitations');
console.log('Last run:', status?.lastRun);
console.log('Last result:', status?.lastResult);

// Run manually
const result = await jobScheduler.runNow('cleanup-invitations');
console.log('Result:', result);
```

## Next Steps

1. Monitor job execution in production
2. Adjust schedules based on load patterns
3. Add custom jobs as needed
4. Set up alerts for failed jobs
5. Review and tune retention policies

## Support

For issues or questions:
- Check logs for detailed error messages
- Review job implementation in `src/modules/jobs/jobs/`
- See main README.md for architecture details
