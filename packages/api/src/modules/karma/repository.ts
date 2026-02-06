/**
 * Data access layer for Karma module.
 * Handles all database operations related to karma calculations.
 */

import { PrismaClient } from '@prisma/client';
import { Result, Ok, Err, NotFoundError, InternalError } from '@multiverse-bazaar/shared';
import { UserCollaboration, ProjectUpvoteCount } from './types.js';

/**
 * Repository for karma-related database operations
 */
export class KarmaRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Get all collaborations for a user with project details
   * Used to calculate karma from all projects a user is involved with
   *
   * @param userId - User ID to get collaborations for
   * @returns Result with array of collaborations or InternalError
   */
  async getUserCollaborations(userId: string): Promise<Result<UserCollaboration[], InternalError>> {
    try {
      const collaborations = await this.db.collaborator.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          userId: true,
          projectId: true,
          role: true,
          project: {
            select: {
              id: true,
              title: true,
              isFeatured: true,
            },
          },
        },
      });

      return Ok(collaborations as UserCollaboration[]);
    } catch (error) {
      return Err(
        new InternalError('Failed to get user collaborations', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get upvote counts for multiple projects
   * Efficiently batch fetches upvote counts for karma calculation
   *
   * @param projectIds - Array of project IDs to get upvote counts for
   * @returns Result with array of project upvote counts or InternalError
   */
  async getProjectUpvoteCounts(projectIds: string[]): Promise<Result<ProjectUpvoteCount[], InternalError>> {
    try {
      // If no project IDs provided, return empty array
      if (projectIds.length === 0) {
        return Ok([]);
      }

      // Use Prisma's groupBy to efficiently count upvotes per project
      const upvoteCounts = await this.db.upvote.groupBy({
        by: ['projectId'],
        where: {
          projectId: {
            in: projectIds,
          },
        },
        _count: {
          projectId: true,
        },
      });

      // Map the results to our ProjectUpvoteCount type
      const counts: ProjectUpvoteCount[] = upvoteCounts.map((result) => ({
        projectId: result.projectId,
        count: result._count.projectId,
      }));

      return Ok(counts);
    } catch (error) {
      return Err(
        new InternalError('Failed to get project upvote counts', {
          projectIds,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Update a user's karma value in the database
   * Persists the calculated karma to the user record
   *
   * @param userId - User ID to update karma for
   * @param karma - New karma value
   * @returns Result with void or error
   */
  async updateUserKarma(
    userId: string,
    karma: number
  ): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      await this.db.user.update({
        where: {
          id: userId,
          deletedAt: null,
        },
        data: {
          karma,
        },
      });

      return Ok(undefined);
    } catch (error: any) {
      // Check if it's a "record not found" error
      if (error.code === 'P2025' || (error instanceof Error && error.message.includes('Record to update not found'))) {
        return Err(new NotFoundError('User'));
      }

      return Err(
        new InternalError('Failed to update user karma', {
          userId,
          karma,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get all collaborators for a project
   * Used to recalculate karma for all project collaborators when project changes
   *
   * @param projectId - Project ID to get collaborators for
   * @returns Result with array of user IDs or InternalError
   */
  async getProjectCollaborators(projectId: string): Promise<Result<string[], InternalError>> {
    try {
      const collaborators = await this.db.collaborator.findMany({
        where: {
          projectId,
        },
        select: {
          userId: true,
        },
      });

      const userIds = collaborators.map((c) => c.userId);
      return Ok(userIds);
    } catch (error) {
      return Err(
        new InternalError('Failed to get project collaborators', {
          projectId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get current karma value for a user
   * Used to check if karma needs updating
   *
   * @param userId - User ID to get karma for
   * @returns Result with karma value or error
   */
  async getUserKarma(userId: string): Promise<Result<number, NotFoundError | InternalError>> {
    try {
      const user = await this.db.user.findUnique({
        where: {
          id: userId,
          deletedAt: null,
        },
        select: {
          karma: true,
        },
      });

      if (!user) {
        return Err(new NotFoundError('User'));
      }

      return Ok(user.karma);
    } catch (error) {
      return Err(
        new InternalError('Failed to get user karma', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
