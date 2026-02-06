/**
 * Job: Recalculate karma for all users
 * Performs a full karma recalculation for all users to fix any karma drift
 * Schedule: Weekly on Sunday at 5:00 AM UTC
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../../../infra/logger.js';
import { Job, JobResult } from '../types.js';

/**
 * Create the recalculate karma job
 * @param prisma Prisma client instance
 * @param logger Logger instance
 * @returns Job definition
 */
export function createRecalculateKarmaJob(prisma: PrismaClient, logger: Logger): Job {
  return {
    name: 'recalculate-karma',
    description: 'Full karma recalculation for all users to fix any karma drift',
    schedule: '0 5 * * 0', // Weekly on Sunday at 5:00 AM UTC
    enabled: true,
    handler: async (): Promise<JobResult> => {
      const jobLogger = logger.child({ job: 'recalculate-karma' });

      try {
        jobLogger.info('Starting full karma recalculation for all users');

        // Get all users (excluding deleted/anonymized users)
        const users = await prisma.user.findMany({
          where: {
            deletedAt: null,
            anonymizedAt: null,
          },
          select: {
            id: true,
            email: true,
            karma: true,
          },
        });

        jobLogger.debug(`Found ${users.length} users to recalculate karma for`);

        let successCount = 0;
        let failureCount = 0;
        let totalKarmaChange = 0;
        const errors: string[] = [];

        // Process users in batches for better performance
        const BATCH_SIZE = 50;
        for (let i = 0; i < users.length; i += BATCH_SIZE) {
          const batch = users.slice(i, i + BATCH_SIZE);

          jobLogger.debug(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(users.length / BATCH_SIZE)}`);

          for (const user of batch) {
            try {
              // Recalculate karma for this user
              const newKarma = await recalculateUserKarma(prisma, user.id);

              // Update user's karma
              await prisma.user.update({
                where: { id: user.id },
                data: { karma: newKarma },
              });

              const karmaChange = newKarma - user.karma;
              totalKarmaChange += Math.abs(karmaChange);

              if (karmaChange !== 0) {
                jobLogger.debug(`Updated karma for user ${user.id}: ${user.karma} -> ${newKarma} (${karmaChange > 0 ? '+' : ''}${karmaChange})`);
              }

              successCount++;
            } catch (error) {
              failureCount++;
              const errorMsg = `Failed to recalculate karma for user ${user.id}: ${error instanceof Error ? error.message : String(error)}`;
              errors.push(errorMsg);
              jobLogger.error(
                error instanceof Error ? error : new Error(String(error)),
                errorMsg
              );
            }
          }

          // Small delay between batches to avoid overwhelming the database
          if (i + BATCH_SIZE < users.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        jobLogger.info('Karma recalculation completed', {
          totalUsers: users.length,
          successCount,
          failureCount,
          totalKarmaChange,
        });

        return {
          success: failureCount === 0,
          message: `Recalculated karma for ${successCount}/${users.length} users (${failureCount} failures)`,
          details: {
            totalUsers: users.length,
            successCount,
            failureCount,
            totalKarmaChange,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit to first 10 errors
          },
        };
      } catch (error) {
        jobLogger.error(
          error instanceof Error ? error : new Error(String(error)),
          'Failed to recalculate karma'
        );

        return {
          success: false,
          message: 'Failed to recalculate karma',
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }
    },
  };
}

/**
 * Recalculate karma for a single user
 * Implements the same logic as KarmaService.calculateUserKarma
 *
 * @param prisma Prisma client
 * @param userId User ID to calculate karma for
 * @returns Calculated karma value
 */
async function recalculateUserKarma(prisma: PrismaClient, userId: string): Promise<number> {
  // Role multipliers (from karma/types.ts)
  const ROLE_MULTIPLIERS: Record<string, number> = {
    CREATOR: 1.0,
    CONTRIBUTOR: 0.5,
    ADVISOR: 0.25,
  };
  const FEATURED_BONUS = 100;

  // Get all collaborations for the user
  const collaborations = await prisma.collaborator.findMany({
    where: { userId },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          isFeatured: true,
          _count: {
            select: { upvotes: true },
          },
        },
      },
    },
  });

  if (collaborations.length === 0) {
    return 0;
  }

  let totalFromUpvotes = 0;
  let featuredProjectCount = 0;

  for (const collaboration of collaborations) {
    const upvotes = collaboration.project._count.upvotes;
    const roleMultiplier = ROLE_MULTIPLIERS[collaboration.role] || 0;
    const contribution = Math.floor(upvotes * roleMultiplier);

    totalFromUpvotes += contribution;

    // Count featured projects created by this user
    if (collaboration.role === 'CREATOR' && collaboration.project.isFeatured) {
      featuredProjectCount++;
    }
  }

  // Calculate featured bonus
  const fromFeatured = featuredProjectCount * FEATURED_BONUS;

  // Calculate total karma
  return totalFromUpvotes + fromFeatured;
}
