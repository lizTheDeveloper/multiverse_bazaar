/**
 * Job: Cleanup orphaned uploaded files
 * Deletes uploaded files not referenced by any entity and older than 30 days
 * Schedule: Daily at 4:00 AM UTC
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../../../infra/logger.js';
import { Job, JobResult } from '../types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Create the cleanup orphaned files job
 * @param prisma Prisma client instance
 * @param logger Logger instance
 * @param uploadsPath Path to the uploads directory
 * @returns Job definition
 */
export function createCleanupOrphanedFilesJob(
  prisma: PrismaClient,
  logger: Logger,
  uploadsPath: string = '/tmp/uploads'
): Job {
  return {
    name: 'cleanup-orphaned-files',
    description: 'Delete uploaded files not referenced by any entity older than 30 days',
    schedule: '0 4 * * *', // Daily at 4:00 AM UTC
    enabled: true,
    handler: async (): Promise<JobResult> => {
      const jobLogger = logger.child({ job: 'cleanup-orphaned-files' });

      try {
        jobLogger.info('Starting cleanup of orphaned uploaded files');

        // Calculate cutoff date (30 days ago)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);

        // Find files uploaded more than 30 days ago
        const oldUploads = await prisma.upload.findMany({
          where: {
            createdAt: {
              lt: cutoffDate,
            },
          },
          select: {
            id: true,
            filename: true,
            path: true,
          },
        });

        jobLogger.debug(`Found ${oldUploads.length} old uploads to check`);

        // Check if files are referenced by users (avatars), projects (images), etc.
        const orphanedFiles: typeof oldUploads = [];

        for (const upload of oldUploads) {
          const fileUrl = `/uploads/${upload.filename}`;

          // Check if file is referenced in any entity
          const [userCount, projectCount] = await Promise.all([
            // Check if file is used as user avatar
            prisma.user.count({
              where: {
                avatarUrl: fileUrl,
              },
            }),
            // Check if file is used as project image
            prisma.project.count({
              where: {
                imageUrl: fileUrl,
              },
            }),
          ]);

          // If not referenced anywhere, mark as orphaned
          if (userCount === 0 && projectCount === 0) {
            orphanedFiles.push(upload);
          }
        }

        jobLogger.debug(`Found ${orphanedFiles.length} orphaned files to delete`);

        let deletedCount = 0;
        let fileDeletedCount = 0;
        const errors: string[] = [];

        // Delete orphaned files
        for (const file of orphanedFiles) {
          try {
            // Delete the physical file
            const filePath = path.join(uploadsPath, file.filename);
            try {
              await fs.unlink(filePath);
              fileDeletedCount++;
              jobLogger.debug(`Deleted file: ${filePath}`);
            } catch (fileError) {
              // File might already be deleted, log but continue
              jobLogger.warn(`Could not delete file: ${filePath}`, {
                error: fileError instanceof Error ? fileError.message : String(fileError),
              });
            }

            // Delete the database record
            await prisma.upload.delete({
              where: { id: file.id },
            });
            deletedCount++;
          } catch (error) {
            const errorMsg = `Failed to delete upload ${file.id}: ${error instanceof Error ? error.message : String(error)}`;
            errors.push(errorMsg);
            jobLogger.error(
              error instanceof Error ? error : new Error(String(error)),
              errorMsg
            );
          }
        }

        jobLogger.info('Cleanup completed', {
          checkedCount: oldUploads.length,
          orphanedCount: orphanedFiles.length,
          deletedRecords: deletedCount,
          deletedFiles: fileDeletedCount,
          errors: errors.length,
        });

        return {
          success: errors.length === 0,
          message: `Deleted ${deletedCount} orphaned file records and ${fileDeletedCount} physical files`,
          details: {
            checkedCount: oldUploads.length,
            orphanedCount: orphanedFiles.length,
            deletedRecords: deletedCount,
            deletedFiles: fileDeletedCount,
            cutoffDate: cutoffDate.toISOString(),
            errors: errors.length > 0 ? errors : undefined,
          },
        };
      } catch (error) {
        jobLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to cleanup orphaned files'
        );

        return {
          success: false,
          message: 'Failed to cleanup orphaned files',
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    },
  };
}
