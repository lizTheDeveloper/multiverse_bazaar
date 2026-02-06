/**
 * Business logic layer for Karma module.
 * Handles karma calculation, recalculation, and persistence.
 */

import {
  Result,
  Ok,
  Err,
  isOk,
  BaseError,
  InternalError,
} from '@multiverse-bazaar/shared';
import { KarmaRepository } from './repository.js';
import {
  KarmaBreakdown,
  ProjectContribution,
  ROLE_MULTIPLIERS,
  FEATURED_BONUS,
  KarmaRecalculationResult,
} from './types.js';
import { Logger } from '../../infra/logger.js';
import { CollaboratorRole } from '@prisma/client';

/**
 * Service for karma operations
 * Handles karma calculation, recalculation, and persistence
 */
export class KarmaService {
  constructor(
    private readonly repository: KarmaRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Calculate a user's karma and return detailed breakdown
   * Does not persist to database - use recalculateAndSave for that
   *
   * Formula:
   * karma = SUM(upvotes × role_multiplier) + (featured_bonus × created_featured_count)
   *
   * @param userId - User ID to calculate karma for
   * @returns Result with karma breakdown or error
   */
  async calculateUserKarma(userId: string): Promise<Result<KarmaBreakdown, BaseError>> {
    try {
      // Get all projects user collaborates on
      const collaborationsResult = await this.repository.getUserCollaborations(userId);
      if (!isOk(collaborationsResult)) {
        this.logger.warn({ userId }, 'Failed to get user collaborations for karma calculation');
        return Err(collaborationsResult.error);
      }

      const collaborations = collaborationsResult.value;

      // If user has no collaborations, karma is 0
      if (collaborations.length === 0) {
        this.logger.debug({ userId }, 'User has no collaborations, karma is 0');
        return Ok({
          total: 0,
          fromUpvotes: 0,
          fromFeatured: 0,
          byProject: [],
        });
      }

      // Get upvote counts for all projects
      const projectIds = collaborations.map((c) => c.projectId);
      const upvoteCountsResult = await this.repository.getProjectUpvoteCounts(projectIds);
      if (!isOk(upvoteCountsResult)) {
        this.logger.warn({ userId, projectIds }, 'Failed to get project upvote counts');
        return Err(upvoteCountsResult.error);
      }

      // Create a map of project ID to upvote count for easy lookup
      const upvoteCountMap = new Map<string, number>();
      for (const upvoteCount of upvoteCountsResult.value) {
        upvoteCountMap.set(upvoteCount.projectId, upvoteCount.count);
      }

      // Calculate karma for each project
      const projectContributions: ProjectContribution[] = [];
      let totalFromUpvotes = 0;
      let featuredProjectCount = 0;

      for (const collaboration of collaborations) {
        const upvotes = upvoteCountMap.get(collaboration.projectId) || 0;
        const roleMultiplier = ROLE_MULTIPLIERS[collaboration.role];
        const contribution = Math.floor(upvotes * roleMultiplier);

        projectContributions.push({
          projectId: collaboration.projectId,
          projectTitle: collaboration.project.title,
          upvotes,
          role: collaboration.role,
          contribution,
        });

        totalFromUpvotes += contribution;

        // Count featured projects created by this user
        if (collaboration.role === CollaboratorRole.CREATOR && collaboration.project.isFeatured) {
          featuredProjectCount++;
        }
      }

      // Calculate featured bonus
      const fromFeatured = featuredProjectCount * FEATURED_BONUS;

      // Calculate total karma
      const total = totalFromUpvotes + fromFeatured;

      const breakdown: KarmaBreakdown = {
        total,
        fromUpvotes: totalFromUpvotes,
        fromFeatured,
        byProject: projectContributions,
      };

      this.logger.debug(
        {
          userId,
          total,
          fromUpvotes: totalFromUpvotes,
          fromFeatured,
          projectCount: projectContributions.length,
          featuredProjectCount,
        },
        'Calculated karma for user'
      );

      return Ok(breakdown);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error calculating karma');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Recalculate karma for a user and save to database
   * This is the primary method to update a user's karma
   *
   * @param userId - User ID to recalculate karma for
   * @returns Result with new karma value or error
   */
  async recalculateAndSave(userId: string): Promise<Result<number, BaseError>> {
    try {
      // Calculate new karma
      const karmaResult = await this.calculateUserKarma(userId);
      if (!isOk(karmaResult)) {
        return Err(karmaResult.error);
      }

      const newKarma = karmaResult.value.total;

      // Save to database
      const updateResult = await this.repository.updateUserKarma(userId, newKarma);
      if (!isOk(updateResult)) {
        this.logger.warn({ userId, newKarma }, 'Failed to update user karma in database');
        return Err(updateResult.error);
      }

      this.logger.info(
        {
          userId,
          newKarma,
          fromUpvotes: karmaResult.value.fromUpvotes,
          fromFeatured: karmaResult.value.fromFeatured,
        },
        'Recalculated and saved user karma'
      );

      return Ok(newKarma);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error recalculating karma');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Recalculate karma for all collaborators on a project
   * Called when project upvotes or featured status changes
   *
   * @param projectId - Project ID to recalculate karma for
   * @returns Result with map of userId to new karma value, or error
   */
  async recalculateForProject(projectId: string): Promise<Result<KarmaRecalculationResult, BaseError>> {
    try {
      // Get all collaborators for the project
      const collaboratorsResult = await this.repository.getProjectCollaborators(projectId);
      if (!isOk(collaboratorsResult)) {
        this.logger.warn({ projectId }, 'Failed to get project collaborators for karma recalculation');
        return Err(collaboratorsResult.error);
      }

      const collaboratorIds = collaboratorsResult.value;

      if (collaboratorIds.length === 0) {
        this.logger.debug({ projectId }, 'Project has no collaborators, nothing to recalculate');
        return Ok({});
      }

      // Recalculate karma for each collaborator
      const result: KarmaRecalculationResult = {};
      const errors: Array<{ userId: string; error: BaseError }> = [];

      for (const userId of collaboratorIds) {
        const karmaResult = await this.recalculateAndSave(userId);
        if (isOk(karmaResult)) {
          result[userId] = karmaResult.value;
        } else {
          errors.push({ userId, error: karmaResult.error });
        }
      }

      // Log errors but continue processing
      if (errors.length > 0) {
        this.logger.warn(
          {
            projectId,
            errorCount: errors.length,
            errors: errors.map((e) => ({ userId: e.userId, error: e.error.message })),
          },
          'Some karma recalculations failed'
        );
      }

      this.logger.info(
        {
          projectId,
          collaboratorCount: collaboratorIds.length,
          successCount: Object.keys(result).length,
          errorCount: errors.length,
        },
        'Recalculated karma for project collaborators'
      );

      return Ok(result);
    } catch (error) {
      this.logger.error({ error, projectId }, 'Unexpected error recalculating karma for project');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Batch recalculate karma for multiple users
   * More efficient than calling recalculateAndSave multiple times
   *
   * @param userIds - Array of user IDs to recalculate karma for
   * @returns Result with map of userId to new karma value, or error
   */
  async batchRecalculate(userIds: string[]): Promise<Result<KarmaRecalculationResult, BaseError>> {
    try {
      if (userIds.length === 0) {
        this.logger.debug('No users provided for batch recalculation');
        return Ok({});
      }

      const result: KarmaRecalculationResult = {};
      const errors: Array<{ userId: string; error: BaseError }> = [];

      // Recalculate karma for each user
      for (const userId of userIds) {
        const karmaResult = await this.recalculateAndSave(userId);
        if (isOk(karmaResult)) {
          result[userId] = karmaResult.value;
        } else {
          errors.push({ userId, error: karmaResult.error });
        }
      }

      // Log errors but continue processing
      if (errors.length > 0) {
        this.logger.warn(
          {
            errorCount: errors.length,
            errors: errors.map((e) => ({ userId: e.userId, error: e.error.message })),
          },
          'Some batch karma recalculations failed'
        );
      }

      this.logger.info(
        {
          userCount: userIds.length,
          successCount: Object.keys(result).length,
          errorCount: errors.length,
        },
        'Completed batch karma recalculation'
      );

      return Ok(result);
    } catch (error) {
      this.logger.error({ error, userIds }, 'Unexpected error in batch karma recalculation');
      return Err(
        new InternalError('An unexpected error occurred', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
