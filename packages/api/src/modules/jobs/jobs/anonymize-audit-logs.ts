/**
 * Job: Anonymize old audit logs
 * Anonymizes audit logs older than 1 year by removing user IDs and PII
 * Schedule: Daily at 3:00 AM UTC
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../../../infra/logger.js';
import { Job, JobResult } from '../types.js';

/**
 * Create the anonymize audit logs job
 * @param prisma Prisma client instance
 * @param logger Logger instance
 * @returns Job definition
 */
export function createAnonymizeAuditLogsJob(prisma: PrismaClient, logger: Logger): Job {
  return {
    name: 'anonymize-audit-logs',
    description: 'Anonymize audit logs older than 1 year',
    schedule: '0 3 * * *', // Daily at 3:00 AM UTC
    enabled: true,
    handler: async (): Promise<JobResult> => {
      const jobLogger = logger.child({ job: 'anonymize-audit-logs' });

      try {
        jobLogger.info('Starting anonymization of old audit logs');

        // Calculate cutoff date (1 year ago)
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

        // Anonymize audit logs older than 1 year
        // Remove user ID, IP address, user agent, and PII from metadata
        const result = await prisma.auditLog.updateMany({
          where: {
            createdAt: {
              lt: cutoffDate,
            },
            userId: {
              not: null,
            },
          },
          data: {
            userId: null,
            ipAddress: null,
            userAgent: null,
            // Note: We can't modify JSON fields with updateMany in Prisma
            // So we keep metadata as-is for now
            // In a real implementation, you might want to use a raw query
            // or process records individually to sanitize metadata
          },
        });

        // For complete anonymization of metadata, we'd need to process individually
        // This is a simplified version for demonstration
        const logsToAnonymize = await prisma.auditLog.findMany({
          where: {
            createdAt: {
              lt: cutoffDate,
            },
            metadata: {
              not: null,
            },
          },
          select: {
            id: true,
            metadata: true,
          },
        });

        let metadataAnonymized = 0;
        for (const log of logsToAnonymize) {
          if (log.metadata && typeof log.metadata === 'object') {
            // Remove PII fields from metadata
            const sanitizedMetadata = { ...log.metadata } as Record<string, unknown>;
            delete sanitizedMetadata.email;
            delete sanitizedMetadata.name;
            delete sanitizedMetadata.phoneNumber;
            delete sanitizedMetadata.address;

            await prisma.auditLog.update({
              where: { id: log.id },
              data: { metadata: sanitizedMetadata },
            });

            metadataAnonymized++;
          }
        }

        jobLogger.info('Anonymization completed', {
          anonymizedCount: result.count,
          metadataAnonymized,
          cutoffDate: cutoffDate.toISOString(),
        });

        return {
          success: true,
          message: `Anonymized ${result.count} audit logs, sanitized metadata in ${metadataAnonymized} logs`,
          details: {
            anonymizedCount: result.count,
            metadataAnonymized,
            cutoffDate: cutoffDate.toISOString(),
            retentionYears: 1,
          },
        };
      } catch (error) {
        jobLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to anonymize audit logs'
        );

        return {
          success: false,
          message: 'Failed to anonymize audit logs',
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    },
  };
}
