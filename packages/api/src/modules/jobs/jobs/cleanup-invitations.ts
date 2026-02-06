/**
 * Job: Cleanup old pending invitations
 * Deletes pending invitations older than 30 days
 * Schedule: Daily at 2:00 AM UTC
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../../../infra/logger.js';
import { Job, JobResult } from '../types.js';

/**
 * Create the cleanup invitations job
 * @param prisma Prisma client instance
 * @param logger Logger instance
 * @returns Job definition
 */
export function createCleanupInvitationsJob(prisma: PrismaClient, logger: Logger): Job {
  return {
    name: 'cleanup-invitations',
    description: 'Delete pending invitations older than 30 days',
    schedule: '0 2 * * *', // Daily at 2:00 AM UTC
    enabled: true,
    handler: async (): Promise<JobResult> => {
      const jobLogger = logger.child({ job: 'cleanup-invitations' });

      try {
        jobLogger.info('Starting cleanup of old pending invitations');

        // Calculate cutoff date (30 days ago)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);

        // Delete invitations that:
        // 1. Were created more than 30 days ago
        // 2. Are still pending (not accepted or declined)
        const result = await prisma.pendingInvitation.deleteMany({
          where: {
            createdAt: {
              lt: cutoffDate,
            },
            acceptedAt: null,
            declinedAt: null,
          },
        });

        jobLogger.info('Cleanup completed', {
          deletedCount: result.count,
          cutoffDate: cutoffDate.toISOString(),
        });

        return {
          success: true,
          message: `Deleted ${result.count} old pending invitations`,
          details: {
            deletedCount: result.count,
            cutoffDate: cutoffDate.toISOString(),
          },
        };
      } catch (error) {
        jobLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to cleanup old invitations'
        );

        return {
          success: false,
          message: 'Failed to cleanup old invitations',
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    },
  };
}
