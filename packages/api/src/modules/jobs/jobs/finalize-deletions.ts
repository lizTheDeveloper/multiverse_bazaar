/**
 * Job: Finalize scheduled user deletions
 * Executes scheduled user deletions past the 30-day grace period
 * Schedule: Daily at 4:30 AM UTC
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../../../infra/logger.js';
import { Job, JobResult } from '../types.js';

/**
 * Create the finalize deletions job
 * @param prisma Prisma client instance
 * @param logger Logger instance
 * @returns Job definition
 */
export function createFinalizeDeletionsJob(prisma: PrismaClient, logger: Logger): Job {
  return {
    name: 'finalize-deletions',
    description: 'Execute scheduled user deletions past 30-day grace period',
    schedule: '30 4 * * *', // Daily at 4:30 AM UTC
    enabled: true,
    handler: async (): Promise<JobResult> => {
      const jobLogger = logger.child({ job: 'finalize-deletions' });

      try {
        jobLogger.info('Starting finalization of scheduled deletions');

        const now = new Date();

        // Find deletion requests that are due for processing
        const deletionRequests = await prisma.dataRequest.findMany({
          where: {
            requestType: 'DELETION',
            status: 'PENDING',
            requestedAt: {
              // Deletion requested more than 30 days ago
              lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          include: {
            user: true,
          },
        });

        jobLogger.debug(`Found ${deletionRequests.length} deletion requests to process`);

        let processedCount = 0;
        let anonymizedCount = 0;
        let deletedCount = 0;
        const errors: string[] = [];

        for (const request of deletionRequests) {
          if (!request.user) {
            // User already deleted
            await prisma.dataRequest.update({
              where: { id: request.id },
              data: {
                status: 'COMPLETED',
                completedAt: now,
              },
            });
            processedCount++;
            continue;
          }

          try {
            const options = request.options as { anonymizeContributions?: boolean } | null;
            const shouldAnonymize = options?.anonymizeContributions ?? true;

            if (shouldAnonymize) {
              // Anonymize user contributions instead of deleting everything
              jobLogger.info(`Anonymizing user: ${request.userId}`);

              // Update user to anonymized state
              await prisma.user.update({
                where: { id: request.userId },
                data: {
                  email: `deleted-${request.userId}@deleted.local`,
                  name: '[Deleted User]',
                  bio: null,
                  avatarUrl: null,
                  anonymizedAt: now,
                  deletedAt: now,
                  showEmailOnProfile: false,
                  includeInSearch: false,
                  showActivityPublicly: false,
                },
              });

              // Keep projects, ideas, and other content but they'll show "[Deleted User]"
              // Clear PII from related records
              await Promise.all([
                // Clear audit logs
                prisma.auditLog.updateMany({
                  where: { userId: request.userId },
                  data: { userId: null },
                }),
                // Delete personal data
                prisma.pushToken.deleteMany({
                  where: { userId: request.userId },
                }),
                prisma.refreshToken.deleteMany({
                  where: { userId: request.userId },
                }),
                prisma.consentRecord.deleteMany({
                  where: { userId: request.userId },
                }),
              ]);

              anonymizedCount++;
            } else {
              // Full deletion - delete user and all their data
              jobLogger.info(`Deleting user: ${request.userId}`);

              // Cascade deletion will handle most relations
              // but we explicitly delete some to ensure cleanup
              await Promise.all([
                prisma.notification.deleteMany({ where: { userId: request.userId } }),
                prisma.pushToken.deleteMany({ where: { userId: request.userId } }),
                prisma.refreshToken.deleteMany({ where: { userId: request.userId } }),
                prisma.consentRecord.deleteMany({ where: { userId: request.userId } }),
                prisma.auditLog.updateMany({
                  where: { userId: request.userId },
                  data: { userId: null },
                }),
              ]);

              // Delete the user (cascade will handle collaborations, ideas, upvotes, etc.)
              await prisma.user.delete({
                where: { id: request.userId },
              });

              deletedCount++;
            }

            // Mark deletion request as completed
            await prisma.dataRequest.update({
              where: { id: request.id },
              data: {
                status: 'COMPLETED',
                completedAt: now,
              },
            });

            processedCount++;
          } catch (error) {
            const errorMsg = `Failed to process deletion for user ${request.userId}: ${error instanceof Error ? error.message : String(error)}`;
            errors.push(errorMsg);
            jobLogger.error(
              error instanceof Error ? error : new Error(String(error)),
              errorMsg
            );
          }
        }

        jobLogger.info('Deletion finalization completed', {
          totalRequests: deletionRequests.length,
          processedCount,
          anonymizedCount,
          deletedCount,
          errors: errors.length,
        });

        return {
          success: errors.length === 0,
          message: `Processed ${processedCount} deletion requests (${anonymizedCount} anonymized, ${deletedCount} deleted)`,
          details: {
            totalRequests: deletionRequests.length,
            processedCount,
            anonymizedCount,
            deletedCount,
            gracePeriodDays: 30,
            errors: errors.length > 0 ? errors : undefined,
          },
        };
      } catch (error) {
        jobLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to finalize deletions'
        );

        return {
          success: false,
          message: 'Failed to finalize deletions',
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    },
  };
}
