/**
 * Job: Cleanup inactive push tokens
 * Deletes push tokens that haven't been used in 90 days
 * Schedule: Daily at 2:30 AM UTC
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../../../infra/logger.js';
import { Job, JobResult } from '../types.js';

/**
 * Create the cleanup push tokens job
 * @param prisma Prisma client instance
 * @param logger Logger instance
 * @returns Job definition
 */
export function createCleanupPushTokensJob(prisma: PrismaClient, logger: Logger): Job {
  return {
    name: 'cleanup-push-tokens',
    description: 'Delete push tokens not used in 90 days',
    schedule: '30 2 * * *', // Daily at 2:30 AM UTC
    enabled: true,
    handler: async (): Promise<JobResult> => {
      const jobLogger = logger.child({ job: 'cleanup-push-tokens' });

      try {
        jobLogger.info('Starting cleanup of inactive push tokens');

        // Calculate cutoff date (90 days ago)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);

        // Delete push tokens that haven't been used in 90 days
        const result = await prisma.pushToken.deleteMany({
          where: {
            lastUsedAt: {
              lt: cutoffDate,
            },
          },
        });

        jobLogger.info('Cleanup completed', {
          deletedCount: result.count,
          cutoffDate: cutoffDate.toISOString(),
        });

        return {
          success: true,
          message: `Deleted ${result.count} inactive push tokens`,
          details: {
            deletedCount: result.count,
            cutoffDate: cutoffDate.toISOString(),
            inactiveDays: 90,
          },
        };
      } catch (error) {
        jobLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to cleanup push tokens'
        );

        return {
          success: false,
          message: 'Failed to cleanup push tokens',
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    },
  };
}
