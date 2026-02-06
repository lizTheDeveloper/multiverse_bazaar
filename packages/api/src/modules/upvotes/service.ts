/**
 * Business logic layer for Upvotes module.
 * Handles upvote creation, removal, and statistics.
 */

import {
  Result,
  Ok,
  Err,
  isOk,
  BaseError,
  NotFoundError,
  ConflictError,
  InternalError,
} from '@multiverse-bazaar/shared';
import { UpvoteRepository } from './repository.js';
import { ProjectRepository } from '../projects/repository.js';
import { UpvoteResponse, ProjectUpvoteStats } from './types.js';
import { Logger } from '../../infra/logger.js';

/**
 * Service for upvote operations
 * Handles upvoting, removing upvotes, and retrieving upvote statistics
 */
export class UpvoteService {
  constructor(
    private readonly repository: UpvoteRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Add an upvote to a project
   * - Checks if project exists
   * - Checks if user has already upvoted (returns conflict if exists)
   * - Creates upvote
   * - TODO: Trigger karma recalculation for project collaborators (Phase 5)
   * - TODO: Create notification for project collaborators (Phase 5)
   * - Returns new upvote count
   *
   * @param userId - User ID adding the upvote
   * @param projectId - Project ID being upvoted
   * @returns Result with UpvoteResponse or BaseError
   */
  async upvote(userId: string, projectId: string): Promise<Result<UpvoteResponse, BaseError>> {
    try {
      // Check if project exists
      const projectResult = await this.projectRepository.findById(projectId);
      if (!isOk(projectResult)) {
        this.logger.warn({ userId, projectId }, 'Attempted to upvote non-existent project');
        return Err(new NotFoundError('Project'));
      }

      // Check if user has already upvoted
      const existsResult = await this.repository.exists(userId, projectId);
      if (!isOk(existsResult)) {
        return Err(existsResult.error);
      }

      if (existsResult.value) {
        this.logger.info({ userId, projectId }, 'User attempted to upvote already upvoted project');
        return Err(new ConflictError('You have already upvoted this project'));
      }

      // Create upvote
      const createResult = await this.repository.create(userId, projectId);
      if (!isOk(createResult)) {
        return Err(createResult.error);
      }

      // Get updated count
      const countResult = await this.repository.getCountForProject(projectId);
      if (!isOk(countResult)) {
        return Err(countResult.error);
      }

      this.logger.info({ userId, projectId, count: countResult.value }, 'Upvote created successfully');

      // TODO: Phase 5 - Trigger karma recalculation for project collaborators
      // Example: await this.karmaService.recalculateForProject(projectId);

      // TODO: Phase 5 - Create notification for project collaborators
      // Example: await this.notificationService.notifyUpvote(userId, projectId);

      return Ok({
        upvoted: true,
        count: countResult.value,
      });
    } catch (error) {
      this.logger.error({ error, userId, projectId }, 'Unexpected error during upvote');
      return Err(
        new InternalError('An unexpected error occurred while upvoting', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Remove an upvote from a project
   * - Checks if upvote exists
   * - Deletes upvote
   * - TODO: Trigger karma recalculation for project collaborators (Phase 5)
   * - Returns new upvote count
   *
   * @param userId - User ID removing the upvote
   * @param projectId - Project ID being un-upvoted
   * @returns Result with UpvoteResponse or BaseError
   */
  async removeUpvote(userId: string, projectId: string): Promise<Result<UpvoteResponse, BaseError>> {
    try {
      // Check if upvote exists
      const existsResult = await this.repository.exists(userId, projectId);
      if (!isOk(existsResult)) {
        return Err(existsResult.error);
      }

      if (!existsResult.value) {
        this.logger.warn({ userId, projectId }, 'User attempted to remove non-existent upvote');
        return Err(new NotFoundError('Upvote'));
      }

      // Delete upvote
      const deleteResult = await this.repository.delete(userId, projectId);
      if (!isOk(deleteResult)) {
        return Err(deleteResult.error);
      }

      // Get updated count
      const countResult = await this.repository.getCountForProject(projectId);
      if (!isOk(countResult)) {
        return Err(countResult.error);
      }

      this.logger.info({ userId, projectId, count: countResult.value }, 'Upvote removed successfully');

      // TODO: Phase 5 - Trigger karma recalculation for project collaborators
      // Example: await this.karmaService.recalculateForProject(projectId);

      return Ok({
        upvoted: false,
        count: countResult.value,
      });
    } catch (error) {
      this.logger.error({ error, userId, projectId }, 'Unexpected error during upvote removal');
      return Err(
        new InternalError('An unexpected error occurred while removing upvote', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get upvote status for a user and project
   *
   * @param userId - User ID to check
   * @param projectId - Project ID to check
   * @returns Result with UpvoteResponse or BaseError
   */
  async getStatus(userId: string, projectId: string): Promise<Result<UpvoteResponse, BaseError>> {
    try {
      // Check if user has upvoted
      const existsResult = await this.repository.exists(userId, projectId);
      if (!isOk(existsResult)) {
        return Err(existsResult.error);
      }

      // Get upvote count
      const countResult = await this.repository.getCountForProject(projectId);
      if (!isOk(countResult)) {
        return Err(countResult.error);
      }

      return Ok({
        upvoted: existsResult.value,
        count: countResult.value,
      });
    } catch (error) {
      this.logger.error({ error, userId, projectId }, 'Unexpected error getting upvote status');
      return Err(
        new InternalError('An unexpected error occurred while getting upvote status', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get project upvote statistics
   *
   * @param projectId - Project ID to get stats for
   * @param userId - Optional user ID to check if they upvoted
   * @returns Result with ProjectUpvoteStats or BaseError
   */
  async getProjectStats(
    projectId: string,
    userId?: string
  ): Promise<Result<ProjectUpvoteStats, BaseError>> {
    try {
      // Get upvote count
      const countResult = await this.repository.getCountForProject(projectId);
      if (!isOk(countResult)) {
        return Err(countResult.error);
      }

      // Check if user has upvoted (if userId provided)
      let hasUpvoted = false;
      if (userId) {
        const existsResult = await this.repository.exists(userId, projectId);
        if (!isOk(existsResult)) {
          return Err(existsResult.error);
        }
        hasUpvoted = existsResult.value;
      }

      return Ok({
        projectId,
        count: countResult.value,
        hasUpvoted,
      });
    } catch (error) {
      this.logger.error({ error, projectId, userId }, 'Unexpected error getting project stats');
      return Err(
        new InternalError('An unexpected error occurred while getting project stats', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
