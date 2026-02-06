/**
 * Job: Delete very old audit logs
 * Permanently deletes audit logs older than 3 years
 * Schedule: Weekly on Sunday at 3:30 AM UTC
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../../../infra/logger.js';
import { Job, JobResult } from '../types.js';

/**
 * Create the delete audit logs job
 * @param prisma Prisma client instance
 * @param logger Logger instance
 * @returns Job definition
 */
export function createDeleteAuditLogsJob(prisma: PrismaClient, logger: Logger): Job {
  return {
    name: 'delete-audit-logs',
    description: 'Delete audit logs older than 3 years',
    schedule: '30 3 * * 0', // Weekly on Sunday at 3:30 AM UTC
    enabled: true,
    handler: async (): Promise<JobResult> => {
      const jobLogger = logger.child({ job: 'delete-audit-logs' });

      try {
        jobLogger.info('Starting deletion of very old audit logs');

        // Calculate cutoff date (3 years ago)
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 3);

        // Delete audit logs older than 3 years
        const result = await prisma.auditLog.deleteMany({
          where: {
            createdAt: {
              lt: cutoffDate,
            },
          },
        });

        jobLogger.info('Deletion completed', {
          deletedCount: result.count,
          cutoffDate: cutoffDate.toISOString(),
        });

        return {
          success: true,
          message: `Deleted ${result.count} audit logs older than 3 years`,
          details: {
            deletedCount: result.count,
            cutoffDate: cutoffDate.toISOString(),
            retentionYears: 3,
          },
        };
      } catch (error) {
        jobLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to delete old audit logs'
        );

        return {
          success: false,
          message: 'Failed to delete old audit logs',
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    },
  };
}
