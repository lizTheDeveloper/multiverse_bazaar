/**
 * Data access layer for Upvotes module.
 * Handles all database operations related to upvotes.
 */

import { PrismaClient } from '@prisma/client';
import { Result, Ok, Err, InternalError } from '@multiverse-bazaar/shared';
import { Upvote } from './types.js';

/**
 * Repository for upvote-related database operations
 */
export class UpvoteRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Create an upvote for a project
   * @param userId - User ID creating the upvote
   * @param projectId - Project ID being upvoted
   * @returns Result with created upvote or InternalError
   */
  async create(userId: string, projectId: string): Promise<Result<Upvote, InternalError>> {
    try {
      const upvote = await this.db.upvote.create({
        data: {
          userId,
          projectId,
        },
        select: {
          id: true,
          userId: true,
          projectId: true,
          createdAt: true,
        },
      });

      return Ok(upvote);
    } catch (error) {
      return Err(new InternalError('Failed to create upvote', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Delete an upvote
   * @param userId - User ID who created the upvote
   * @param projectId - Project ID that was upvoted
   * @returns Result with void or InternalError
   */
  async delete(userId: string, projectId: string): Promise<Result<void, InternalError>> {
    try {
      await this.db.upvote.delete({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });

      return Ok(undefined);
    } catch (error) {
      return Err(new InternalError('Failed to delete upvote', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Check if an upvote exists
   * @param userId - User ID to check
   * @param projectId - Project ID to check
   * @returns Result with boolean indicating existence
   */
  async exists(userId: string, projectId: string): Promise<Result<boolean, InternalError>> {
    try {
      const upvote = await this.db.upvote.findUnique({
        where: {
          userId_projectId: {
            userId,
            projectId,
          },
        },
      });

      return Ok(upvote !== null);
    } catch (error) {
      return Err(new InternalError('Failed to check upvote existence', {
        userId,
        projectId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Get total upvote count for a project
   * @param projectId - Project ID to count upvotes for
   * @returns Result with upvote count or InternalError
   */
  async getCountForProject(projectId: string): Promise<Result<number, InternalError>> {
    try {
      const count = await this.db.upvote.count({
        where: { projectId },
      });

      return Ok(count);
    } catch (error) {
      return Err(new InternalError('Failed to get upvote count for project', {
        projectId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Get all upvotes created by a user
   * @param userId - User ID to get upvotes for
   * @returns Result with array of upvotes or InternalError
   */
  async getUpvotesForUser(userId: string): Promise<Result<Upvote[], InternalError>> {
    try {
      const upvotes = await this.db.upvote.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          projectId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return Ok(upvotes);
    } catch (error) {
      return Err(new InternalError('Failed to get upvotes for user', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  /**
   * Get all users who upvoted a project
   * @param projectId - Project ID to get upvoters for
   * @returns Result with array of user IDs or InternalError
   */
  async getUpvotersForProject(projectId: string): Promise<Result<string[], InternalError>> {
    try {
      const upvotes = await this.db.upvote.findMany({
        where: { projectId },
        select: {
          userId: true,
        },
      });

      const userIds = upvotes.map(u => u.userId);
      return Ok(userIds);
    } catch (error) {
      return Err(new InternalError('Failed to get upvoters for project', {
        projectId,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }
}
