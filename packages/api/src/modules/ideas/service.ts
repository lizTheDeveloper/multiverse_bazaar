/**
 * Business logic layer for Ideas module.
 * Handles idea operations with authorization checks.
 */

import {
  Result,
  Ok,
  Err,
  isOk,
  BaseError,
  ForbiddenError,
  InternalError,
  ConflictError,
} from '@multiverse-bazaar/shared';
import { IdeaStatus, ProjectStatus, CollaboratorRole } from '@prisma/client';
import { IdeaRepository } from './repository.js';
import {
  IdeaWithCreator,
  IdeaWithInterests,
  CreateIdeaRequest,
  UpdateIdeaRequest,
  IdeaListQuery,
  IdeaListResponse,
  GraduateIdeaRequest,
} from './types.js';
import { Logger } from '../../infra/logger.js';

/**
 * Service for idea operations
 * Handles business logic and authorization for ideas
 */
export class IdeaService {
  constructor(
    private readonly repository: IdeaRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Create a new idea
   * The creating user automatically becomes the idea creator
   *
   * @param userId - ID of user creating the idea
   * @param data - Idea creation data
   * @returns Result with created idea or BaseError
   */
  async create(
    userId: string,
    data: CreateIdeaRequest
  ): Promise<Result<IdeaWithCreator, BaseError>> {
    try {
      this.logger.info({ userId, title: data.title }, 'Creating new idea');

      const result = await this.repository.create(data, userId);

      if (!isOk(result)) {
        this.logger.error({ userId, error: result.error.message }, 'Failed to create idea');
        return Err(result.error);
      }

      const idea = result.value;

      // Fetch the idea with creator profile
      const ideaWithCreatorResult = await this.repository.findByIdWithCreator(idea.id);

      if (!isOk(ideaWithCreatorResult)) {
        this.logger.error(
          { userId, ideaId: idea.id, error: ideaWithCreatorResult.error.message },
          'Failed to fetch created idea with creator'
        );
        return Err(ideaWithCreatorResult.error);
      }

      this.logger.info({ userId, ideaId: idea.id }, 'Idea created successfully');

      return Ok(ideaWithCreatorResult.value);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error during idea creation');
      return Err(
        new InternalError('An unexpected error occurred while creating idea', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get an idea by ID with creator profile
   *
   * @param id - Idea ID
   * @returns Result with idea details or BaseError
   */
  async getById(id: string): Promise<Result<IdeaWithCreator, BaseError>> {
    try {
      this.logger.info({ ideaId: id }, 'Fetching idea by ID');

      const ideaResult = await this.repository.findByIdWithCreator(id);

      if (!isOk(ideaResult)) {
        this.logger.warn({ ideaId: id }, 'Idea not found');
        return Err(ideaResult.error);
      }

      this.logger.info({ ideaId: id }, 'Idea fetched successfully');

      return Ok(ideaResult.value);
    } catch (error) {
      this.logger.error({ error, ideaId: id }, 'Unexpected error fetching idea');
      return Err(
        new InternalError('An unexpected error occurred while fetching idea', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get an idea by ID with interests
   * If requesterId is the creator, returns all interests
   * Otherwise, returns idea without interests for privacy
   *
   * @param id - Idea ID
   * @param requesterId - ID of user requesting the data
   * @returns Result with idea details including interests or BaseError
   */
  async getByIdWithInterests(
    id: string,
    requesterId: string
  ): Promise<Result<IdeaWithInterests, BaseError>> {
    try {
      this.logger.info({ ideaId: id, requesterId }, 'Fetching idea with interests');

      // Check if requester is the creator
      const isCreatorResult = await this.repository.isUserCreator(id, requesterId);

      if (!isOk(isCreatorResult)) {
        this.logger.error(
          { ideaId: id, requesterId, error: isCreatorResult.error.message },
          'Failed to check creator status'
        );
        return Err(isCreatorResult.error);
      }

      if (!isCreatorResult.value) {
        this.logger.warn({ ideaId: id, requesterId }, 'User is not the creator');
        return Err(
          new ForbiddenError('Only the idea creator can view expressed interests')
        );
      }

      // Get idea with interests
      const ideaResult = await this.repository.findByIdWithInterests(id);

      if (!isOk(ideaResult)) {
        this.logger.warn({ ideaId: id }, 'Idea not found');
        return Err(ideaResult.error);
      }

      this.logger.info(
        { ideaId: id, interestCount: ideaResult.value.interests.length },
        'Idea with interests fetched successfully'
      );

      return Ok(ideaResult.value);
    } catch (error) {
      this.logger.error({ error, ideaId: id }, 'Unexpected error fetching idea with interests');
      return Err(
        new InternalError('An unexpected error occurred while fetching idea with interests', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Update an idea
   * Only the idea creator can update the idea
   *
   * @param userId - ID of user attempting to update
   * @param ideaId - Idea ID to update
   * @param data - Update data
   * @returns Result with updated idea or BaseError
   */
  async update(
    userId: string,
    ideaId: string,
    data: UpdateIdeaRequest
  ): Promise<Result<IdeaWithCreator, BaseError>> {
    try {
      this.logger.info({ userId, ideaId }, 'Attempting to update idea');

      // Check if user is the creator
      const isCreatorResult = await this.repository.isUserCreator(ideaId, userId);

      if (!isOk(isCreatorResult)) {
        this.logger.error(
          { userId, ideaId, error: isCreatorResult.error.message },
          'Failed to check creator status'
        );
        return Err(isCreatorResult.error);
      }

      if (!isCreatorResult.value) {
        this.logger.warn({ userId, ideaId }, 'User is not the idea creator');
        return Err(new ForbiddenError('Only the idea creator can update the idea'));
      }

      // Update the idea
      const updateResult = await this.repository.update(ideaId, data);

      if (!isOk(updateResult)) {
        this.logger.error(
          { userId, ideaId, error: updateResult.error.message },
          'Failed to update idea'
        );
        return Err(updateResult.error);
      }

      // Fetch the updated idea with creator
      const ideaWithCreatorResult = await this.repository.findByIdWithCreator(ideaId);

      if (!isOk(ideaWithCreatorResult)) {
        this.logger.error(
          { userId, ideaId, error: ideaWithCreatorResult.error.message },
          'Failed to fetch updated idea with creator'
        );
        return Err(ideaWithCreatorResult.error);
      }

      this.logger.info({ userId, ideaId }, 'Idea updated successfully');

      return Ok(ideaWithCreatorResult.value);
    } catch (error) {
      this.logger.error({ error, userId, ideaId }, 'Unexpected error updating idea');
      return Err(
        new InternalError('An unexpected error occurred while updating idea', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Delete an idea
   * Only the idea creator can delete the idea
   *
   * @param userId - ID of user attempting to delete
   * @param ideaId - Idea ID to delete
   * @returns Result with void or BaseError
   */
  async delete(userId: string, ideaId: string): Promise<Result<void, BaseError>> {
    try {
      this.logger.info({ userId, ideaId }, 'Attempting to delete idea');

      // Check if user is the creator
      const isCreatorResult = await this.repository.isUserCreator(ideaId, userId);

      if (!isOk(isCreatorResult)) {
        this.logger.error(
          { userId, ideaId, error: isCreatorResult.error.message },
          'Failed to check creator status'
        );
        return Err(isCreatorResult.error);
      }

      if (!isCreatorResult.value) {
        this.logger.warn({ userId, ideaId }, 'User is not the idea creator');
        return Err(new ForbiddenError('Only the idea creator can delete the idea'));
      }

      // Delete the idea
      const deleteResult = await this.repository.delete(ideaId);

      if (!isOk(deleteResult)) {
        this.logger.error(
          { userId, ideaId, error: deleteResult.error.message },
          'Failed to delete idea'
        );
        return Err(deleteResult.error);
      }

      this.logger.info({ userId, ideaId }, 'Idea deleted successfully');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, userId, ideaId }, 'Unexpected error deleting idea');
      return Err(
        new InternalError('An unexpected error occurred while deleting idea', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * List ideas with pagination and filters
   *
   * @param query - Query parameters for filtering and pagination
   * @returns Result with paginated idea list or BaseError
   */
  async list(query: IdeaListQuery): Promise<Result<IdeaListResponse, BaseError>> {
    try {
      this.logger.info({ query }, 'Listing ideas');

      const page = query.page || 1;
      const limit = query.limit || 20;

      // Get ideas from repository
      const listResult = await this.repository.list(query);

      if (!isOk(listResult)) {
        this.logger.error({ query, error: listResult.error.message }, 'Failed to list ideas');
        return Err(listResult.error);
      }

      const { ideas, total } = listResult.value;

      const totalPages = Math.ceil(total / limit);

      this.logger.info({ total, page, limit, totalPages }, 'Ideas listed successfully');

      return Ok({
        ideas,
        total,
        page,
        limit,
        totalPages,
      });
    } catch (error) {
      this.logger.error({ error, query }, 'Unexpected error listing ideas');
      return Err(
        new InternalError('An unexpected error occurred while listing ideas', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Express interest in an idea
   * Users cannot express interest in their own ideas
   * Triggers a notification to the idea creator (placeholder)
   *
   * @param userId - ID of user expressing interest
   * @param ideaId - Idea ID to express interest in
   * @param message - Optional message
   * @returns Result with void or BaseError
   */
  async expressInterest(
    userId: string,
    ideaId: string,
    message?: string
  ): Promise<Result<void, BaseError>> {
    try {
      this.logger.info({ userId, ideaId }, 'Expressing interest in idea');

      // Check if user is the creator
      const isCreatorResult = await this.repository.isUserCreator(ideaId, userId);

      if (!isOk(isCreatorResult)) {
        this.logger.error(
          { userId, ideaId, error: isCreatorResult.error.message },
          'Failed to check creator status'
        );
        return Err(isCreatorResult.error);
      }

      if (isCreatorResult.value) {
        this.logger.warn({ userId, ideaId }, 'User cannot express interest in own idea');
        return Err(new ConflictError('You cannot express interest in your own idea'));
      }

      // Check if user has already expressed interest
      const hasInterestResult = await this.repository.hasExpressedInterest(ideaId, userId);

      if (!isOk(hasInterestResult)) {
        this.logger.error(
          { userId, ideaId, error: hasInterestResult.error.message },
          'Failed to check interest status'
        );
        return Err(hasInterestResult.error);
      }

      if (hasInterestResult.value) {
        this.logger.warn({ userId, ideaId }, 'User has already expressed interest');
        return Err(new ConflictError('You have already expressed interest in this idea'));
      }

      // Add interest
      const addInterestResult = await this.repository.addInterest(ideaId, userId, message);

      if (!isOk(addInterestResult)) {
        this.logger.error(
          { userId, ideaId, error: addInterestResult.error.message },
          'Failed to add interest'
        );
        return Err(addInterestResult.error);
      }

      // TODO: Trigger notification to idea creator
      // await notificationService.notifyIdeaInterest(ideaId, userId, message);
      this.logger.info({ userId, ideaId }, 'Interest expressed successfully (notification pending)');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, userId, ideaId }, 'Unexpected error expressing interest');
      return Err(
        new InternalError('An unexpected error occurred while expressing interest', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Remove interest from an idea
   *
   * @param userId - ID of user removing interest
   * @param ideaId - Idea ID to remove interest from
   * @returns Result with void or BaseError
   */
  async removeInterest(userId: string, ideaId: string): Promise<Result<void, BaseError>> {
    try {
      this.logger.info({ userId, ideaId }, 'Removing interest from idea');

      // Remove interest
      const removeInterestResult = await this.repository.removeInterest(ideaId, userId);

      if (!isOk(removeInterestResult)) {
        this.logger.error(
          { userId, ideaId, error: removeInterestResult.error.message },
          'Failed to remove interest'
        );
        return Err(removeInterestResult.error);
      }

      this.logger.info({ userId, ideaId }, 'Interest removed successfully');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, userId, ideaId }, 'Unexpected error removing interest');
      return Err(
        new InternalError('An unexpected error occurred while removing interest', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Graduate an idea to a project
   * Only the idea creator can graduate the idea
   * Links to existing project OR auto-creates a new project
   *
   * @param userId - ID of user attempting to graduate
   * @param ideaId - Idea ID to graduate
   * @param data - Graduate request data with optional projectId
   * @returns Result with graduated idea or BaseError
   */
  async graduate(
    userId: string,
    ideaId: string,
    data: GraduateIdeaRequest
  ): Promise<Result<IdeaWithCreator, BaseError>> {
    try {
      this.logger.info({ userId, ideaId, projectId: data.projectId }, 'Graduating idea to project');

      // Check if user is the creator
      const isCreatorResult = await this.repository.isUserCreator(ideaId, userId);

      if (!isOk(isCreatorResult)) {
        this.logger.error(
          { userId, ideaId, error: isCreatorResult.error.message },
          'Failed to check creator status'
        );
        return Err(isCreatorResult.error);
      }

      if (!isCreatorResult.value) {
        this.logger.warn({ userId, ideaId }, 'User is not the idea creator');
        return Err(new ForbiddenError('Only the idea creator can graduate the idea'));
      }

      // Get the idea to access its details
      const ideaResult = await this.repository.findById(ideaId);

      if (!isOk(ideaResult)) {
        this.logger.error(
          { userId, ideaId, error: ideaResult.error.message },
          'Failed to fetch idea'
        );
        return Err(ideaResult.error);
      }

      const idea = ideaResult.value;

      // Check if already graduated
      if (idea.status === IdeaStatus.GRADUATED) {
        this.logger.warn({ userId, ideaId }, 'Idea is already graduated');
        return Err(new ConflictError('Idea has already been graduated'));
      }

      let projectId: string;

      if (data.projectId) {
        // Link to existing project
        projectId = data.projectId;

        // TODO: Verify that the project exists and user has permission
        // For now, we'll trust the projectId
        this.logger.info({ userId, ideaId, projectId }, 'Linking to existing project');
      } else {
        // Auto-create a new project
        // TODO: Implement project creation
        // For now, this is a placeholder - the actual implementation would require
        // access to ProjectRepository or ProjectService
        this.logger.warn(
          { userId, ideaId },
          'Auto-create project not yet implemented - requires projectId'
        );
        return Err(
          new InternalError('Auto-create project feature not yet implemented', {
            message: 'Please provide a projectId to graduate the idea',
          })
        );
      }

      // Graduate the idea
      const graduateResult = await this.repository.graduate(ideaId, projectId);

      if (!isOk(graduateResult)) {
        this.logger.error(
          { userId, ideaId, error: graduateResult.error.message },
          'Failed to graduate idea'
        );
        return Err(graduateResult.error);
      }

      // Fetch the updated idea with creator
      const ideaWithCreatorResult = await this.repository.findByIdWithCreator(ideaId);

      if (!isOk(ideaWithCreatorResult)) {
        this.logger.error(
          { userId, ideaId, error: ideaWithCreatorResult.error.message },
          'Failed to fetch graduated idea with creator'
        );
        return Err(ideaWithCreatorResult.error);
      }

      this.logger.info({ userId, ideaId, projectId }, 'Idea graduated successfully');

      return Ok(ideaWithCreatorResult.value);
    } catch (error) {
      this.logger.error({ error, userId, ideaId }, 'Unexpected error graduating idea');
      return Err(
        new InternalError('An unexpected error occurred while graduating idea', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
