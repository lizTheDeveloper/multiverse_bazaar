/**
 * Jobs module - Scheduled tasks for data retention and cleanup
 * Export all job-related types, scheduler, and factory functions
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../../infra/logger.js';
import { JobScheduler } from './scheduler.js';
import { createCleanupInvitationsJob } from './jobs/cleanup-invitations.js';
import { createCleanupPushTokensJob } from './jobs/cleanup-push-tokens.js';
import { createAnonymizeAuditLogsJob } from './jobs/anonymize-audit-logs.js';
import { createDeleteAuditLogsJob } from './jobs/delete-audit-logs.js';
import { createCleanupOrphanedFilesJob } from './jobs/cleanup-orphaned-files.js';
import { createFinalizeDeletionsJob } from './jobs/finalize-deletions.js';
import { createRecalculateKarmaJob } from './jobs/recalculate-karma.js';

// Re-export types
export * from './types.js';
export { JobScheduler } from './scheduler.js';

/**
 * Options for setting up the job scheduler
 */
export interface SetupJobsOptions {
  /** Prisma client instance */
  prisma: PrismaClient;

  /** Logger instance */
  logger: Logger;

  /** Path to uploads directory (optional, defaults to /tmp/uploads) */
  uploadsPath?: string;

  /** Whether to auto-start the scheduler (default: true) */
  autoStart?: boolean;
}

/**
 * Setup and configure the job scheduler with all jobs
 * This is the main factory function to create a configured job scheduler
 *
 * @param options Configuration options
 * @returns Configured JobScheduler instance
 *
 * @example
 * ```typescript
 * const scheduler = setupJobs({
 *   prisma: db.client(),
 *   logger: getLogger(),
 *   uploadsPath: '/var/uploads',
 *   autoStart: true,
 * });
 *
 * // Later, to stop the scheduler
 * scheduler.stop();
 * ```
 */
export function setupJobs(options: SetupJobsOptions): JobScheduler {
  const { prisma, logger, uploadsPath = '/tmp/uploads', autoStart = true } = options;

  // Create scheduler instance
  const scheduler = new JobScheduler(logger);

  // Register all jobs
  const jobs = [
    createCleanupInvitationsJob(prisma, logger),
    createCleanupPushTokensJob(prisma, logger),
    createAnonymizeAuditLogsJob(prisma, logger),
    createDeleteAuditLogsJob(prisma, logger),
    createCleanupOrphanedFilesJob(prisma, logger, uploadsPath),
    createFinalizeDeletionsJob(prisma, logger),
    createRecalculateKarmaJob(prisma, logger),
  ];

  for (const job of jobs) {
    scheduler.register(job);
  }

  logger.info(`Registered ${jobs.length} jobs with scheduler`, {
    jobs: jobs.map((j) => ({ name: j.name, schedule: j.schedule, enabled: j.enabled })),
  });

  // Start scheduler if auto-start is enabled
  if (autoStart) {
    scheduler.start();
  }

  return scheduler;
}

/**
 * Create a job scheduler without auto-starting
 * Useful for testing or manual control
 *
 * @param options Configuration options
 * @returns Configured JobScheduler instance (not started)
 *
 * @example
 * ```typescript
 * const scheduler = createJobScheduler({
 *   prisma: db.client(),
 *   logger: getLogger(),
 * });
 *
 * // Manually start when ready
 * scheduler.start();
 * ```
 */
export function createJobScheduler(options: Omit<SetupJobsOptions, 'autoStart'>): JobScheduler {
  return setupJobs({ ...options, autoStart: false });
}
